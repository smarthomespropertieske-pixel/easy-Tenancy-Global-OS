#!/usr/bin/env python3
"""
check_eval_gates.py
-------------------
Microsoft Foundry CI/CD — Evaluation Quality Gate Enforcer
Reads evaluation results JSON and enforces configurable quality thresholds.
Fails the pipeline (exit 1) if any gate is breached.

Usage:
    # CI pre-merge gate (default thresholds)
    python scripts/check_eval_gates.py --results eval/results/results.json

    # Production gate (stricter thresholds)
    python scripts/check_eval_gates.py \\
        --results              eval/results/test-results.json \\
        --max-hallucination    0.03 \\
        --min-task-completion  0.95 \\
        --min-groundedness     0.98 \\
        --max-latency-p95      3000 \\
        --environment          production

    # JSON output for CI annotations
    python scripts/check_eval_gates.py \\
        --results eval/results/results.json \\
        --json-output

Exit codes:
    0 — all gates passed
    1 — one or more gates failed
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


# ── Default thresholds (CI / dev-to-test gate) ─────────────────────────────────
CI_DEFAULTS = {
    "max_hallucination":    0.05,
    "min_task_completion":  0.90,
    "min_groundedness":     0.95,
    "max_policy_violations": 0,
    "max_latency_p95":      4000,
    "max_token_regression_pct": 20.0,   # Alert threshold (non-blocking by default)
}

# ── Tighter production defaults (test-to-prod gate) ────────────────────────────
PROD_DEFAULTS = {
    "max_hallucination":    0.03,
    "min_task_completion":  0.95,
    "min_groundedness":     0.98,
    "max_policy_violations": 0,
    "max_latency_p95":      3000,
}

GATE_DESCRIPTIONS = {
    "hallucination_rate":     "Hallucination rate (lower is better)",
    "task_completion_rate":   "Task completion rate (higher is better)",
    "grounded_response_rate": "Grounded response rate (higher is better)",
    "policy_violations":      "Policy violations (must be 0)",
    "latency_p95_ms":         "p95 response latency ms (lower is better)",
    "token_usage_per_query":  "Avg token usage per query (track only)",
}


def load_results(path: str) -> dict:
    p = Path(path)
    if not p.exists():
        print(f"ERROR: Results file not found: {path}", file=sys.stderr)
        sys.exit(1)
    with open(p) as f:
        return json.load(f)


def check_gates(
    results: dict,
    max_hallucination:    float,
    min_task_completion:  float,
    min_groundedness:     float,
    max_policy_violations: int,
    max_latency_p95:      int,
    max_token_regression: float,
    environment:          str,
) -> tuple[list[str], list[str], list[str]]:
    """
    Returns (failures, warnings, passes) lists.
    """
    failures: list[str] = []
    warnings: list[str] = []
    passes:   list[str] = []

    def check(metric: str, value, threshold, direction: str, label: str) -> None:
        if direction == "max":
            if value > threshold:
                failures.append(
                    f"GATE FAILED [{metric}]: {value:.4f} exceeds max threshold {threshold}"
                    f" — {label}"
                )
            else:
                passes.append(
                    f"GATE PASSED [{metric}]: {value:.4f} ≤ {threshold} — {label}"
                )
        elif direction == "max_int":
            if int(value) > threshold:
                failures.append(
                    f"GATE FAILED [{metric}]: {int(value)} exceeds max threshold {threshold}"
                    f" — {label}"
                )
            else:
                passes.append(
                    f"GATE PASSED [{metric}]: {int(value)} ≤ {threshold} — {label}"
                )
        elif direction == "min":
            if value < threshold:
                failures.append(
                    f"GATE FAILED [{metric}]: {value:.4f} below min threshold {threshold}"
                    f" — {label}"
                )
            else:
                passes.append(
                    f"GATE PASSED [{metric}]: {value:.4f} ≥ {threshold} — {label}"
                )

    # ── Gate 1: Hallucination rate ─────────────────────────────────────────
    check(
        "hallucination_rate",
        results["hallucination_rate"],
        max_hallucination,
        "max",
        f"Must be < {max_hallucination:.0%} for {environment}"
    )

    # ── Gate 2: Task completion rate ───────────────────────────────────────
    check(
        "task_completion_rate",
        results["task_completion_rate"],
        min_task_completion,
        "min",
        f"Must be > {min_task_completion:.0%} for {environment}"
    )

    # ── Gate 3: Grounded response rate ─────────────────────────────────────
    check(
        "grounded_response_rate",
        results["grounded_response_rate"],
        min_groundedness,
        "min",
        f"Must be > {min_groundedness:.0%} for {environment}"
    )

    # ── Gate 4: Policy violations (hard block — zero tolerance) ────────────
    violations = results.get("policy_violations", 0)
    if violations > max_policy_violations:
        failures.append(
            f"GATE FAILED [policy_violations]: {violations} violation(s) detected — "
            f"zero-tolerance policy. Review content safety configuration."
        )
    else:
        passes.append(f"GATE PASSED [policy_violations]: {violations} = 0 (zero tolerance)")

    # ── Gate 5: p95 latency ────────────────────────────────────────────────
    check(
        "latency_p95_ms",
        results["latency_p95_ms"],
        max_latency_p95,
        "max_int",
        f"Must be < {max_latency_p95}ms for {environment}"
    )

    # ── Gate 6: Token usage regression (warning only) ─────────────────────
    avg_tokens = results.get("token_usage_per_query")
    if avg_tokens is not None:
        # Warn if token usage is unusually high (>1500/query for easyTenancy)
        token_baseline = 1000
        regression_pct = ((avg_tokens - token_baseline) / token_baseline) * 100
        if regression_pct > max_token_regression:
            warnings.append(
                f"GATE WARN [token_usage]: avg {avg_tokens:.0f} tokens/query is "
                f"{regression_pct:.1f}% above baseline {token_baseline} "
                f"(alert threshold: +{max_token_regression:.0f}%) — "
                f"review tool call patterns and context window usage"
            )

    return failures, warnings, passes


def print_report(
    results: dict,
    failures: list[str],
    warnings: list[str],
    passes: list[str],
    environment: str,
    output_path: str = "",
) -> None:
    meta = results.get("run_metadata", {})
    print(f"\n{'='*65}")
    print(f"  easyTenancy Agent — Evaluation Gate Report")
    print(f"  Environment  : {environment}")
    print(f"  Agent version: {meta.get('agent_version', 'unknown')}")
    print(f"  Mode         : {meta.get('mode', 'unknown')}")
    print(f"  Dataset      : {meta.get('dataset', 'unknown')}")
    print(f"  Scenarios    : {meta.get('scenario_count', '?')}")
    print(f"  Run time     : {meta.get('timestamp', 'unknown')}")
    print(f"{'='*65}\n")

    print("📊 Raw Metrics:")
    print(f"   Hallucination rate    : {results['hallucination_rate']:.1%}")
    print(f"   Task completion       : {results['task_completion_rate']:.1%}")
    print(f"   Grounded responses    : {results['grounded_response_rate']:.1%}")
    print(f"   Policy violations     : {results['policy_violations']}")
    print(f"   p95 latency           : {results['latency_p95_ms']}ms")
    print(f"   Avg latency           : {results.get('avg_latency_ms', 'n/a')}ms")
    print(f"   Avg tokens/query      : {results.get('token_usage_per_query', 'n/a')}")
    print()

    print("✅ Passed Gates:")
    for p in passes:
        print(f"   ✓ {p}")

    if warnings:
        print("\n⚠️  Warnings:")
        for w in warnings:
            print(f"   ! {w}", file=sys.stderr)
            print(f"   ! {w}")

    if failures:
        print("\n❌ Failed Gates:")
        for fail in failures:
            print(f"   ✗ {fail}", file=sys.stderr)
            print(f"   ✗ {fail}")
        print(f"\n🚫 DEPLOYMENT BLOCKED — {len(failures)} gate(s) failed\n")
    else:
        print(f"\n🚀 ALL GATES PASSED — proceeding to {environment} deployment\n")

    if output_path:
        print(f"   Gate report: {output_path}\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Enforce evaluation quality gates for easyTenancy on Microsoft Foundry"
    )
    parser.add_argument("--results",              required=True, help="Path to results JSON")
    parser.add_argument("--max-hallucination",    type=float, default=CI_DEFAULTS["max_hallucination"])
    parser.add_argument("--min-task-completion",  type=float, default=CI_DEFAULTS["min_task_completion"])
    parser.add_argument("--min-groundedness",     type=float, default=CI_DEFAULTS["min_groundedness"])
    parser.add_argument("--max-policy-violations",type=int,   default=CI_DEFAULTS["max_policy_violations"])
    parser.add_argument("--max-latency-p95",      type=int,   default=CI_DEFAULTS["max_latency_p95"])
    parser.add_argument("--max-token-regression", type=float, default=CI_DEFAULTS["max_token_regression_pct"])
    parser.add_argument("--environment",          default="ci",
                        help="Environment label (ci/dev/test/production)")
    parser.add_argument("--json-output",          action="store_true",
                        help="Output structured JSON report")
    parser.add_argument("--report-path",          default="",
                        help="Write gate report JSON to this path")
    args = parser.parse_args()

    results = load_results(args.results)

    failures, warnings, passes = check_gates(
        results,
        max_hallucination=args.max_hallucination,
        min_task_completion=args.min_task_completion,
        min_groundedness=args.min_groundedness,
        max_policy_violations=args.max_policy_violations,
        max_latency_p95=args.max_latency_p95,
        max_token_regression=args.max_token_regression,
        environment=args.environment,
    )

    gate_report = {
        "timestamp":   datetime.now(timezone.utc).isoformat(),
        "environment": args.environment,
        "passed":      len(failures) == 0,
        "gate_count":  len(passes) + len(failures),
        "pass_count":  len(passes),
        "fail_count":  len(failures),
        "warn_count":  len(warnings),
        "failures":    failures,
        "warnings":    warnings,
        "passes":      passes,
        "raw_metrics": {
            "hallucination_rate":     results["hallucination_rate"],
            "task_completion_rate":   results["task_completion_rate"],
            "grounded_response_rate": results["grounded_response_rate"],
            "policy_violations":      results["policy_violations"],
            "latency_p95_ms":         results["latency_p95_ms"],
            "token_usage_per_query":  results.get("token_usage_per_query"),
        },
        "thresholds_applied": {
            "max_hallucination":     args.max_hallucination,
            "min_task_completion":   args.min_task_completion,
            "min_groundedness":      args.min_groundedness,
            "max_policy_violations": args.max_policy_violations,
            "max_latency_p95_ms":    args.max_latency_p95,
        }
    }

    if args.report_path:
        Path(args.report_path).parent.mkdir(parents=True, exist_ok=True)
        with open(args.report_path, "w") as f:
            json.dump(gate_report, f, indent=2)

    if args.json_output:
        print(json.dumps(gate_report, indent=2))
    else:
        print_report(results, failures, warnings, passes, args.environment, args.report_path)

    sys.exit(0 if not failures else 1)


if __name__ == "__main__":
    main()
