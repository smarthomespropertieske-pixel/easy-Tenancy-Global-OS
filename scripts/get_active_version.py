#!/usr/bin/env python3
"""
get_active_version.py
---------------------
Microsoft Foundry CI/CD — Query Active Agent Version
Returns the active agent version ID for a given environment.
Used by GitHub Actions to pass AGENT_VERSION between pipeline steps.

Usage:
    AGENT_VERSION=$(python scripts/get_active_version.py --env dev)
    AGENT_VERSION=$(python scripts/get_active_version.py --env test)

    # From live Foundry (when credentials available)
    python scripts/get_active_version.py \\
        --env dev \\
        --foundry-endpoint $FOUNDRY_ENDPOINT_DEV \\
        --live

Exit codes:
    0 — version ID printed to stdout
    1 — version not found
"""

import argparse
import os
import sys
from pathlib import Path

ENDPOINT_ENV_VARS = {
    "dev":        "FOUNDRY_PROJECT_ENDPOINT_DEV",
    "test":       "FOUNDRY_PROJECT_ENDPOINT_TEST",
    "production": "FOUNDRY_PROJECT_ENDPOINT_PROD",
}


def get_from_file(environment: str) -> str:
    """Read version ID from local file written by deploy/promote scripts."""
    version_file = Path(f".foundry/{environment}_agent_version")
    if version_file.exists():
        return version_file.read_text().strip()
    return ""


def get_from_foundry(environment: str, endpoint: str, agent_name: str) -> str:
    """Query live Foundry project for active agent version."""
    try:
        from azure.identity import DefaultAzureCredential
        from azure.ai.projects import AIProjectClient
    except ImportError:
        print("ERROR: azure-ai-projects not installed.", file=sys.stderr)
        sys.exit(1)

    credential = DefaultAzureCredential()
    client = AIProjectClient(endpoint=endpoint, credential=credential)

    # Find the most recently created agent matching the name
    latest_agent = None
    latest_id = ""
    try:
        for agent in client.agents.list():
            if agent.name == agent_name:
                latest_agent = agent
                latest_id = agent.id
                # Foundry lists newest first; take first match
                break
    except Exception as exc:
        print(f"ERROR: Failed to query Foundry: {exc}", file=sys.stderr)
        sys.exit(1)

    if not latest_id:
        print(
            f"ERROR: No agent named '{agent_name}' found in {environment} project.",
            file=sys.stderr,
        )
        sys.exit(1)

    return latest_id


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Get active easyTenancy agent version ID for an environment"
    )
    parser.add_argument("--env",              required=True,
                        choices=["dev", "test", "production"])
    parser.add_argument("--foundry-endpoint", default="",
                        help="Foundry endpoint URL (for live query)")
    parser.add_argument("--agent-name",       default="easytenant-global-os-agent")
    parser.add_argument("--live",             action="store_true",
                        help="Query live Foundry instead of local file")
    args = parser.parse_args()

    if args.live:
        endpoint = args.foundry_endpoint or os.environ.get(
            ENDPOINT_ENV_VARS[args.env], ""
        )
        if not endpoint:
            print(
                f"ERROR: No endpoint for {args.env}. "
                f"Set --foundry-endpoint or ${ENDPOINT_ENV_VARS[args.env]}.",
                file=sys.stderr,
            )
            sys.exit(1)
        version_id = get_from_foundry(args.env, endpoint, args.agent_name)
    else:
        version_id = get_from_file(args.env)

    if not version_id:
        print(
            f"ERROR: No active version found for {args.env}. "
            f"Run deploy_agent.py first.",
            file=sys.stderr,
        )
        sys.exit(1)

    # Print bare version ID to stdout (captured by: AGENT_VERSION=$(...))
    print(version_id)


if __name__ == "__main__":
    main()
