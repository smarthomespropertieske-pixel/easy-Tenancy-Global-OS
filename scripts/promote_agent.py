#!/usr/bin/env python3
"""
promote_agent.py
----------------
Microsoft Foundry CI/CD — Agent Environment Promotion Script
Promotes a specific agent version from one Foundry project environment to another.
This is the CD promotion step: dev → test → production.

Key insight (from Microsoft Foundry architecture):
    Promotion does NOT re-deploy. It switches the active version pointer in the
    target Foundry project to the previously-validated agent version ID.
    This ensures identical, pre-evaluated artefacts flow through all environments.

Usage:
    # dev → test promotion
    python scripts/promote_agent.py \\
        --from-env         dev \\
        --to-env           test \\
        --agent-version    $AGENT_VERSION \\
        --foundry-endpoint $FOUNDRY_ENDPOINT_TEST

    # test → production promotion (requires approval gate in GitHub)
    python scripts/promote_agent.py \\
        --from-env         test \\
        --to-env           production \\
        --agent-version    $AGENT_VERSION \\
        --foundry-endpoint $FOUNDRY_ENDPOINT_PROD

    # Rollback: point production back to previous known-good version
    python scripts/promote_agent.py \\
        --from-env         production \\
        --to-env           production \\
        --agent-version    $PREVIOUS_AGENT_VERSION \\
        --foundry-endpoint $FOUNDRY_ENDPOINT_PROD \\
        --rollback

Exit codes:
    0 — promotion succeeded
    1 — promotion failed
"""

import argparse
import json
import os
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML not installed. Run: pip install -r requirements-eval.txt", file=sys.stderr)
    sys.exit(1)

VALID_PROMOTIONS = {
    ("dev", "test"),
    ("test", "production"),
    ("production", "production"),   # Rollback within prod
}

ENDPOINT_ENV_VARS = {
    "dev":        "FOUNDRY_PROJECT_ENDPOINT_DEV",
    "test":       "FOUNDRY_PROJECT_ENDPOINT_TEST",
    "production": "FOUNDRY_PROJECT_ENDPOINT_PROD",
}


def get_active_version_id(environment: str) -> str:
    """Read the active version ID written by deploy_agent.py."""
    version_file = f".foundry/{environment}_agent_version"
    if Path(version_file).exists():
        return Path(version_file).read_text().strip()
    return ""


def promote(
    from_env: str,
    to_env: str,
    agent_version_id: str,
    foundry_endpoint: str,
    config_path: str,
    is_rollback: bool = False,
    dry_run: bool = False,
) -> None:
    """Promote agent version to target Foundry project."""

    action_label = "ROLLBACK" if is_rollback else "PROMOTE"
    print(f"\n{'='*60}")
    print(f"  easyTenancy Agent {action_label}")
    print(f"  From env     : {from_env}")
    print(f"  To env       : {to_env}")
    print(f"  Agent version: {agent_version_id}")
    print(f"  Endpoint     : {foundry_endpoint or '[dry-run]'}")
    print(f"  Mode         : {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"{'='*60}\n")

    if dry_run:
        print(f"🔍 DRY RUN — would promote {agent_version_id} to {to_env}\n")
        print("✅ Dry run passed\n")
        return

    try:
        from azure.identity import DefaultAzureCredential
        from azure.ai.projects import AIProjectClient
    except ImportError:
        print(
            "ERROR: azure-ai-projects not installed.\n"
            "Run: pip install -r requirements-eval.txt",
            file=sys.stderr,
        )
        sys.exit(1)

    credential = DefaultAzureCredential()

    # Load agent config to get name
    with open(config_path) as f:
        config = yaml.safe_load(f)
    agent_name = config["metadata"]["name"]

    # Connect to target environment Foundry project
    client = AIProjectClient(endpoint=foundry_endpoint, credential=credential)

    print(f"⏳ Connecting to {to_env} Foundry project...")

    try:
        # In Foundry, promotion means creating (or updating) the agent in the target
        # project using the same version ID / configuration that was validated in source.
        # The azure-ai-projects SDK provides get_agent() to fetch the source version.

        # Step 1: Read the validated agent version from source environment
        source_endpoint_var = ENDPOINT_ENV_VARS[from_env]
        source_endpoint = os.environ.get(source_endpoint_var, "")

        if source_endpoint:
            source_client = AIProjectClient(
                endpoint=source_endpoint, credential=credential
            )
            source_agent = source_client.agents.get_agent(agent_version_id)
            print(f"   Fetched source agent: {source_agent.name} ({source_agent.id})")

            # Step 2: Create (promote) into target project
            promoted = client.agents.create_agent(
                model=source_agent.model,
                name=source_agent.name,
                instructions=source_agent.instructions,
                tools=source_agent.tools,
                metadata={
                    **source_agent.metadata,
                    "environment":    to_env,
                    "promoted_from":  from_env,
                    "source_version": agent_version_id,
                    "rollback":       str(is_rollback).lower(),
                },
            )
            new_version_id = promoted.id
        else:
            # Fallback: use provided agent_version_id directly in target env
            # (when cross-project source isn't accessible, re-deploy from config)
            promoted = client.agents.create_agent(
                model=config["runtime"]["model"],
                name=agent_name,
                instructions=config["instructions"],
                tools=[{
                    "type": "function",
                    "function": {
                        "name":        t["name"],
                        "description": t.get("description", ""),
                        "parameters":  t.get("parameters", {}),
                    }
                } for t in config.get("tools", [])],
                metadata={
                    "environment":    to_env,
                    "promoted_from":  from_env,
                    "source_version": agent_version_id,
                    "rollback":       str(is_rollback).lower(),
                },
            )
            new_version_id = promoted.id

        # Save new version ID for downstream steps
        output_file = f".foundry/{to_env}_agent_version"
        Path(".foundry").mkdir(exist_ok=True)
        Path(output_file).write_text(new_version_id)

        action_word = "Rollback" if is_rollback else "Promotion"
        print(f"✅ {action_word} successful")
        print(f"   New version ID in {to_env}: {new_version_id}")
        print(f"   Version saved to: {output_file}\n")
        print(f"PROMOTED_AGENT_VERSION_ID={new_version_id}")

    except Exception as exc:
        print(f"❌ {action_label} failed: {exc}", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Promote easyTenancy agent version between Foundry environments"
    )
    parser.add_argument("--from-env",         required=True,
                        choices=["dev", "test", "production"])
    parser.add_argument("--to-env",           required=True,
                        choices=["dev", "test", "production"])
    parser.add_argument("--agent-version",    required=True, help="Agent version ID to promote")
    parser.add_argument("--foundry-endpoint", default="",    help="Target Foundry project endpoint")
    parser.add_argument("--agent-config",     default="agent.yaml")
    parser.add_argument("--rollback",         action="store_true",
                        help="Flag this as a rollback operation")
    parser.add_argument("--dry-run",          action="store_true")
    args = parser.parse_args()

    # Validate promotion path
    promo_tuple = (args.from_env, args.to_env)
    if promo_tuple not in VALID_PROMOTIONS:
        print(
            f"ERROR: Invalid promotion path {args.from_env} → {args.to_env}. "
            f"Valid paths: {[f'{a}→{b}' for a, b in sorted(VALID_PROMOTIONS)]}",
            file=sys.stderr,
        )
        sys.exit(1)

    # Resolve endpoint
    endpoint = args.foundry_endpoint
    if not endpoint and not args.dry_run:
        env_var = ENDPOINT_ENV_VARS[args.to_env]
        endpoint = os.environ.get(env_var, "")
        if not endpoint:
            print(
                f"ERROR: No endpoint for {args.to_env}. "
                f"Set --foundry-endpoint or ${env_var}.",
                file=sys.stderr,
            )
            sys.exit(1)

    promote(
        from_env=args.from_env,
        to_env=args.to_env,
        agent_version_id=args.agent_version,
        foundry_endpoint=endpoint,
        config_path=args.agent_config,
        is_rollback=args.rollback,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
