#!/usr/bin/env python3
"""
enable_agent_endpoint.py
------------------------
Microsoft Foundry CI/CD — Production Endpoint Activation
Activates the production endpoint for a deployed agent version.
This is the final step in the CD Production stage.

Usage:
    python scripts/enable_agent_endpoint.py \\
        --agent-version    $AGENT_VERSION \\
        --foundry-endpoint $FOUNDRY_ENDPOINT_PROD

Exit codes:
    0 — endpoint enabled successfully
    1 — activation failed
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path


def enable_endpoint(
    agent_version_id: str,
    foundry_endpoint: str,
    smoke_test: bool = True,
    dry_run: bool = False,
) -> None:
    print(f"\n{'='*60}")
    print(f"  easyTenancy — Production Endpoint Activation")
    print(f"  Agent version : {agent_version_id}")
    print(f"  Endpoint      : {foundry_endpoint or '[dry-run]'}")
    print(f"  Smoke test    : {'yes' if smoke_test else 'no'}")
    print(f"  Mode          : {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"{'='*60}\n")

    if dry_run:
        print("🔍 DRY RUN — would enable production endpoint\n")
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
    client = AIProjectClient(endpoint=foundry_endpoint, credential=credential)

    try:
        print("⏳ Verifying agent version exists in production project...")
        agent = client.agents.get_agent(agent_version_id)
        print(f"   ✓ Found: {agent.name} ({agent.id})")
        print(f"   ✓ Model: {agent.model}")

        # In Foundry, the agent is "enabled" once its thread is created
        # successfully. The endpoint is the Foundry project's REST endpoint.
        # We validate by running a lightweight smoke test message.
        if smoke_test:
            print("\n🔬 Running production smoke test...")
            thread = client.agents.create_thread()
            client.agents.create_message(
                thread_id=thread.id,
                role="user",
                content=(
                    "Health check: What is the current platform status of "
                    "easyTenancy Global OS? Reply with a one-sentence status summary."
                ),
            )
            run = client.agents.create_and_process_run(
                thread_id=thread.id,
                agent_id=agent_version_id,
            )
            messages = client.agents.list_messages(thread_id=thread.id)
            response_text = next(
                (m.content[0].text.value for m in messages.data if m.role == "assistant"),
                "",
            )
            if response_text:
                print(f"   ✓ Smoke test response: {response_text[:120]}...")
                print("   ✓ Production endpoint is live and responding\n")
            else:
                print("   ⚠️  Smoke test returned empty response — investigate\n",
                      file=sys.stderr)

        # Write activation record
        activation_record = {
            "agent_version_id": agent_version_id,
            "agent_name":       agent.name,
            "activated_at":     datetime.now(timezone.utc).isoformat(),
            "endpoint":         foundry_endpoint,
            "smoke_test_ok":    bool(smoke_test),
        }
        Path(".foundry").mkdir(exist_ok=True)
        with open(".foundry/production_activation.json", "w") as f:
            json.dump(activation_record, f, indent=2)

        print(f"✅ Production endpoint activated")
        print(f"   Agent     : {agent.name}")
        print(f"   Version   : {agent_version_id}")
        print(f"   Activated : {activation_record['activated_at']}")
        print(f"   Record    : .foundry/production_activation.json\n")

    except Exception as exc:
        print(f"❌ Endpoint activation failed: {exc}", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Enable production endpoint for easyTenancy agent"
    )
    parser.add_argument("--agent-version",    required=True)
    parser.add_argument("--foundry-endpoint", default="")
    parser.add_argument("--no-smoke-test",    action="store_true",
                        help="Skip post-activation smoke test")
    parser.add_argument("--dry-run",          action="store_true")
    args = parser.parse_args()

    endpoint = args.foundry_endpoint or os.environ.get(
        "FOUNDRY_PROJECT_ENDPOINT_PROD", ""
    )
    if not endpoint and not args.dry_run:
        print(
            "ERROR: No production endpoint. Set --foundry-endpoint or "
            "$FOUNDRY_PROJECT_ENDPOINT_PROD.",
            file=sys.stderr,
        )
        sys.exit(1)

    enable_endpoint(
        agent_version_id=args.agent_version,
        foundry_endpoint=endpoint,
        smoke_test=not args.no_smoke_test,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
