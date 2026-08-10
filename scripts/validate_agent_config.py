#!/usr/bin/env python3
"""
validate_agent_config.py
------------------------
Microsoft Foundry CI/CD — Stage 1 Static Check
Validates agent.yaml against the Foundry prompt-based agent schema.

Usage:
    python scripts/validate_agent_config.py --config agent.yaml
    python scripts/validate_agent_config.py --config agent.yaml --strict

Exit codes:
    0 — validation passed
    1 — validation failed (schema errors, missing required fields, gate misconfig)
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any

# yaml is in requirements-eval.txt (PyYAML)
try:
    import yaml
except ImportError:
    print("ERROR: PyYAML not installed. Run: pip install -r requirements-eval.txt", file=sys.stderr)
    sys.exit(1)


# ── Required top-level keys ────────────────────────────────────────────────────
REQUIRED_KEYS = [
    "apiVersion", "kind", "metadata", "runtime", "instructions", "tools",
    "safety", "evaluation", "observability", "environments"
]

REQUIRED_METADATA = ["name", "displayName", "version", "description"]
REQUIRED_RUNTIME  = ["type", "model", "temperature", "max_tokens", "timeout_ms"]
REQUIRED_SAFETY   = ["content_filters", "pii_handling", "groundedness"]
REQUIRED_EVAL_CI  = [
    "hallucination_rate", "task_completion_rate", "grounded_response_rate",
    "policy_violations", "latency_p95_ms"
]
REQUIRED_ENVS     = ["dev", "test", "production"]

# ── Allowed enum values ────────────────────────────────────────────────────────
ALLOWED_RUNTIME_TYPES = {"prompt-based", "hosted"}
ALLOWED_PII_HANDLING  = {"redact", "mask", "allow"}
ALLOWED_GROUNDEDNESS  = {"strict", "standard", "relaxed"}

THRESHOLDS = {
    "hallucination_rate":     {"type": "max", "ci": 0.05,  "prod": 0.03},
    "task_completion_rate":   {"type": "min", "ci": 0.90,  "prod": 0.95},
    "grounded_response_rate": {"type": "min", "ci": 0.95,  "prod": 0.98},
    "policy_violations":      {"type": "max", "ci": 0,     "prod": 0},
    "latency_p95_ms":         {"type": "max", "ci": 4000,  "prod": 3000},
}


def validate(config: dict[str, Any], strict: bool = False) -> list[str]:
    """Return a list of validation failure messages. Empty list = pass."""
    errors: list[str] = []

    # ── Top-level structure ────────────────────────────────────────────────
    for key in REQUIRED_KEYS:
        if key not in config:
            errors.append(f"Missing required top-level key: '{key}'")

    if errors:
        return errors  # Cannot continue without structural keys

    # ── apiVersion / kind ──────────────────────────────────────────────────
    if not config["apiVersion"].startswith("foundry/"):
        errors.append(f"apiVersion must start with 'foundry/' — got: {config['apiVersion']}")
    if config["kind"] != "Agent":
        errors.append(f"kind must be 'Agent' — got: {config['kind']}")

    # ── metadata ───────────────────────────────────────────────────────────
    meta = config.get("metadata", {})
    for key in REQUIRED_METADATA:
        if key not in meta:
            errors.append(f"metadata.{key} is required")
    if "version" in meta:
        parts = str(meta["version"]).split(".")
        if len(parts) != 3 or not all(p.isdigit() for p in parts):
            errors.append(f"metadata.version must be semver (e.g. '3.0.0') — got: {meta['version']}")

    # ── runtime ────────────────────────────────────────────────────────────
    rt = config.get("runtime", {})
    for key in REQUIRED_RUNTIME:
        if key not in rt:
            errors.append(f"runtime.{key} is required")
    if rt.get("type") not in ALLOWED_RUNTIME_TYPES:
        errors.append(f"runtime.type must be one of {ALLOWED_RUNTIME_TYPES} — got: {rt.get('type')}")
    if "temperature" in rt and not (0.0 <= float(rt["temperature"]) <= 2.0):
        errors.append(f"runtime.temperature must be in [0.0, 2.0] — got: {rt['temperature']}")
    if "timeout_ms" in rt and int(rt["timeout_ms"]) < 1000:
        errors.append("runtime.timeout_ms must be >= 1000ms")

    # ── instructions ────────────────────────────────────────────────────────
    instructions = config.get("instructions", "")
    if len(instructions.strip()) < 100:
        errors.append("instructions must be at least 100 characters — agent needs substantive system prompt")

    # ── tools ───────────────────────────────────────────────────────────────
    tools = config.get("tools", [])
    if not isinstance(tools, list) or len(tools) == 0:
        errors.append("tools must be a non-empty list")
    else:
        for i, tool in enumerate(tools):
            if "name" not in tool:
                errors.append(f"tools[{i}].name is required")
            if "description" not in tool:
                errors.append(f"tools[{i}].description is required")
            if "parameters" not in tool and strict:
                errors.append(f"tools[{i}].parameters is required in strict mode")

    # ── safety ──────────────────────────────────────────────────────────────
    safety = config.get("safety", {})
    for key in REQUIRED_SAFETY:
        if key not in safety:
            errors.append(f"safety.{key} is required")
    if safety.get("pii_handling") not in ALLOWED_PII_HANDLING:
        errors.append(f"safety.pii_handling must be one of {ALLOWED_PII_HANDLING}")
    if safety.get("groundedness") not in ALLOWED_GROUNDEDNESS:
        errors.append(f"safety.groundedness must be one of {ALLOWED_GROUNDEDNESS}")

    # ── evaluation gates ────────────────────────────────────────────────────
    eval_cfg = config.get("evaluation", {})
    ci_gates   = eval_cfg.get("ci_gates", {})
    prod_gates = eval_cfg.get("prod_gates", {})

    for metric in REQUIRED_EVAL_CI:
        if metric not in ci_gates:
            errors.append(f"evaluation.ci_gates.{metric} is required")
        if metric not in prod_gates:
            errors.append(f"evaluation.prod_gates.{metric} is required")

    # Validate threshold direction and prod-is-stricter rule
    for metric, spec in THRESHOLDS.items():
        ci_gate   = ci_gates.get(metric, {})
        prod_gate = prod_gates.get(metric, {})
        ci_val   = ci_gate.get("max" if spec["type"] == "max" else "min")
        prod_val = prod_gate.get("max" if spec["type"] == "max" else "min")

        if ci_val is not None and prod_val is not None:
            if spec["type"] == "max" and float(prod_val) > float(ci_val):
                errors.append(
                    f"eval gate '{metric}': prod threshold ({prod_val}) must be "
                    f"<= CI threshold ({ci_val}) for max-type gates"
                )
            elif spec["type"] == "min" and float(prod_val) < float(ci_val):
                errors.append(
                    f"eval gate '{metric}': prod threshold ({prod_val}) must be "
                    f">= CI threshold ({ci_val}) for min-type gates"
                )

    # Check dataset paths exist
    for ds_key in ["golden_dataset", "scenario_dataset"]:
        ds_path = eval_cfg.get(ds_key)
        if ds_path and not Path(ds_path).exists():
            # Warning only — datasets may not exist yet at validation time
            print(f"⚠️  WARNING: {ds_key} path '{ds_path}' does not exist yet "
                  "(create before running evaluations)", file=sys.stderr)

    # ── environments ────────────────────────────────────────────────────────
    envs = config.get("environments", {})
    for env_name in REQUIRED_ENVS:
        if env_name not in envs:
            errors.append(f"environments.{env_name} section is required")

    # production must have approval_required: true
    prod_meta = envs.get("production", {}).get("metadata", {})
    if not prod_meta.get("approval_required", False):
        errors.append("environments.production.metadata.approval_required must be true")

    # ── observability ────────────────────────────────────────────────────────
    obs = config.get("observability", {})
    if "tracing" not in obs:
        errors.append("observability.tracing section is required")
    if "logging" not in obs:
        errors.append("observability.logging section is required")

    return errors


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate agent.yaml for Microsoft Foundry CI/CD"
    )
    parser.add_argument("--config", required=True, help="Path to agent.yaml")
    parser.add_argument(
        "--strict", action="store_true",
        help="Enable strict mode (require tool parameter schemas, etc.)"
    )
    parser.add_argument(
        "--json-output", action="store_true",
        help="Output validation results as JSON (useful for CI annotations)"
    )
    args = parser.parse_args()

    config_path = Path(args.config)
    if not config_path.exists():
        print(f"ERROR: Config file not found: {config_path}", file=sys.stderr)
        sys.exit(1)

    try:
        with open(config_path) as f:
            config = yaml.safe_load(f)
    except yaml.YAMLError as exc:
        print(f"ERROR: YAML parse error in {config_path}:\n{exc}", file=sys.stderr)
        sys.exit(1)

    if not isinstance(config, dict):
        print("ERROR: agent.yaml must be a YAML mapping (dict)", file=sys.stderr)
        sys.exit(1)

    errors = validate(config, strict=args.strict)

    if args.json_output:
        result = {
            "config": str(config_path),
            "passed": len(errors) == 0,
            "error_count": len(errors),
            "errors": errors,
            "agent_name": config.get("metadata", {}).get("name", "unknown"),
            "agent_version": config.get("metadata", {}).get("version", "unknown"),
        }
        print(json.dumps(result, indent=2))
    else:
        agent_name    = config.get("metadata", {}).get("name", "unknown")
        agent_version = config.get("metadata", {}).get("version", "unknown")
        print(f"\n{'='*60}")
        print(f"  easyTenancy Agent Config Validation")
        print(f"  Agent: {agent_name} v{agent_version}")
        print(f"  Config: {config_path}")
        print(f"{'='*60}")

        if errors:
            print(f"\n❌ VALIDATION FAILED — {len(errors)} error(s):\n")
            for i, err in enumerate(errors, 1):
                print(f"  {i:2}. {err}")
            print()
        else:
            print("\n✅ Validation passed — agent.yaml is well-formed\n")
            print(f"  Runtime type : {config['runtime']['type']}")
            print(f"  Model        : {config['runtime']['model']}")
            print(f"  Tools        : {len(config.get('tools', []))} defined")
            print(f"  Environments : {list(config.get('environments', {}).keys())}")
            print(f"  CI  hall.    : < {config['evaluation']['ci_gates']['hallucination_rate']['max']:.0%}")
            print(f"  Prod hall.   : < {config['evaluation']['prod_gates']['hallucination_rate']['max']:.0%}")
            print()

    sys.exit(0 if not errors else 1)


if __name__ == "__main__":
    main()
