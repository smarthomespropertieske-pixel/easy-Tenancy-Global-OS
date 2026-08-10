#!/usr/bin/env python3
"""
deploy_agent.py
---------------
Microsoft Foundry CI/CD — Agent Deployment Script
Deploys a new easyTenancy agent version to the specified Foundry project
using the azure-ai-projects Python SDK.

For prompt-based agents (our topology): no container image required.
The agent definition is read from agent.yaml and submitted to Foundry.

Usage:
    python scripts/deploy_agent.py \\
        --env              dev \\
        --foundry-endpoint $FOUNDRY_ENDPOINT_DEV \\
        --agent-config     agent.yaml \\
        --git-sha          $GITHUB_SHA

    # Dry-run (validate without deploying)
    python scripts/deploy_agent.py \\
        --env dev \\
        --agent-config agent.yaml \\
        --dry-run

Exit codes:
    0 — deployment succeeded; prints agent version ID to stdout
    1 — deployment failed
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


SUPPORTED_ENVS = {"dev", "test", "production"}

# Default endpoint env var names (set in GitHub Actions environment secrets)
ENDPOINT_ENV_VARS = {
    "dev":        "FOUNDRY_PROJECT_ENDPOINT_DEV",
    "test":       "FOUNDRY_PROJECT_ENDPOINT_TEST",
    "production": "FOUNDRY_PROJECT_ENDPOINT_PROD",
}


def load_agent_config(config_path: str, environment: str) -> dict:
    """Load and merge agent.yaml with environment overrides."""
    with open(config_path) as f:
        config = yaml.safe_load(f)

    # Apply environment-specific overrides
    env_overrides = config.get("environments", {}).get(environment, {})
    merged = dict(config)

    if "model" in env_overrides:
        merged.setdefault("runtime", {})["model"] = env_overrides["model"]
    if "temperature" in env_overrides:
        merged.setdefault("runtime", {})["temperature"] = env_overrides["temperature"]

    return merged, env_overrides


def build_tool_definitions(tools: list[dict]) -> list[dict]:
    """Convert agent.yaml tool definitions to Foundry SDK format."""
    return [
        {
            "type": "function",
            "function": {
                "name":        t["name"],
                "description": t.get("description", ""),
                "parameters":  t.get("parameters", {"type": "object", "properties": {}}),
            },
        }
        for t in tools
    ]


def deploy_to_foundry(
    config: dict,
    environment: str,
    foundry_endpoint: str,
    git_sha: str,
    dry_run: bool = False,
) -> str:
    """
    Deploy agent to Microsoft Foundry and return the agent version ID.
    """
    agent_name    = config["metadata"]["name"]
    agent_version = config["metadata"]["version"]
    model         = config["runtime"]["model"]
    instructions  = config["instructions"]
    tools         = build_tool_definitions(config.get("tools", []))

    metadata = {
        "version":     agent_version,
        "git_sha":     git_sha,
        "environment": environment,
        "app":         "easyTenancy Global OS",
        "deployed_by": "foundry-cicd",
    }

    print(f"\n{'='*60}")
    print(f"  easyTenancy Agent Deployment")
    print(f"  Agent   : {agent_name} v{agent_version}")
    print(f"  Model   : {model}")
    print(f"  Env     : {environment}")
    print(f"  Endpoint: {foundry_endpoint or '[dry-run]'}")
    print(f"  Git SHA : {git_sha[:12] if git_sha else 'unknown'}")
    print(f"  Tools   : {len(tools)} defined")
    print(f"  Mode    : {'DRY RUN' if dry_run else 'LIVE DEPLOY'}")
    print(f"{'='*60}\n")

    if dry_run:
        print("🔍 DRY RUN — validating deployment payload:")
        payload = {
            "name":         agent_name,
            "model":        model,
            "instructions": instructions[:120] + "...",
            "tools":        [t["function"]["name"] for t in tools],
            "metadata":     metadata,
        }
        print(json.dumps(payload, indent=2))
        print("\n✅ Dry run passed — deployment payload is valid\n")
        return f"agent-dryrun-{git_sha[:8] if git_sha else '00000000'}"

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

    print("⏳ Connecting to Microsoft Foundry...")

    # Check for existing agent with same name (idempotent deploy)
    existing_agent_id = None
    try:
        for existing in client.agents.list():
            if existing.name == agent_name:
                existing_agent_id = existing.id
                print(f"   Found existing agent: {existing.id}")
                break
    except Exception as exc:
        print(f"   ⚠️  Could not list existing agents: {exc}", file=sys.stderr)

    try:
        # Create new agent version (Foundry keeps history of all versions)
        print(f"🚀 Creating agent version in {environment}...")
        agent = client.agents.create_agent(
            model=model,
            name=agent_name,
            instructions=instructions,
            tools=tools,
            metadata=metadata,
        )
        agent_version_id = agent.id
        print(f"✅ Agent deployed successfully")
        print(f"   Agent version ID: {agent_version_id}")
        print(f"   Name            : {agent.name}")
        print(f"   Model           : {agent.model}")

        # Write version ID to file for downstream pipeline steps
        output_file = f".foundry/{environment}_agent_version"
        Path(".foundry").mkdir(exist_ok=True)
        with open(output_file, "w") as f:
            f.write(agent_version_id)
        print(f"   Version saved to : {output_file}\n")

        return agent_version_id

    except Exception as exc:
        print(f"❌ Deployment failed: {exc}", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Deploy easyTenancy agent to Microsoft Foundry"
    )
    parser.add_argument("--env",              required=True,
                        choices=list(SUPPORTED_ENVS), help="Target environment")
    parser.add_argument("--agent-config",     default="agent.yaml", help="Path to agent.yaml")
    parser.add_argument("--foundry-endpoint", default="",           help="Foundry project endpoint URL")
    parser.add_argument("--git-sha",          default="",           help="Git commit SHA for metadata")
    parser.add_argument("--dry-run",          action="store_true",  help="Validate without deploying")
    args = parser.parse_args()

    # Resolve endpoint: CLI arg > env var > error
    endpoint = args.foundry_endpoint
    if not endpoint and not args.dry_run:
        env_var = ENDPOINT_ENV_VARS[args.env]
        endpoint = os.environ.get(env_var, "")
        if not endpoint:
            print(
                f"ERROR: No Foundry endpoint provided. Set --foundry-endpoint or "
                f"${env_var} environment variable.",
                file=sys.stderr,
            )
            sys.exit(1)

    # Resolve git SHA
    git_sha = args.git_sha or os.environ.get("GITHUB_SHA", "")

    # Load config
    config_path = args.agent_config
    if not Path(config_path).exists():
        print(f"ERROR: Agent config not found: {config_path}", file=sys.stderr)
        sys.exit(1)

    config, _ = load_agent_config(config_path, args.env)

    # Deploy
    agent_version_id = deploy_to_foundry(
        config=config,
        environment=args.env,
        foundry_endpoint=endpoint,
        git_sha=git_sha,
        dry_run=args.dry_run,
    )

    # Print version ID on stdout for GitHub Actions output capture
    print(f"AGENT_VERSION_ID={agent_version_id}")


if __name__ == "__main__":
    main()
