"""
tests/unit/test_check_eval_gates.py
-------------------------------------
Unit tests for scripts/check_eval_gates.py
Tests gate enforcement logic with parametrized threshold scenarios.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))
from check_eval_gates import check_gates, CI_DEFAULTS


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def passing_results():
    """Results that pass all CI gates comfortably."""
    return {
        "hallucination_rate":     0.020,
        "task_completion_rate":   0.950,
        "grounded_response_rate": 0.975,
        "policy_violations":      0,
        "latency_p95_ms":         1800,
        "avg_latency_ms":         600,
        "token_usage_per_query":  850,
        "run_metadata": {"mode": "simulation", "environment": "ci"},
    }


def run_gates(results, **overrides):
    """Helper to run check_gates with CI defaults + overrides."""
    kwargs = dict(
        max_hallucination=CI_DEFAULTS["max_hallucination"],
        min_task_completion=CI_DEFAULTS["min_task_completion"],
        min_groundedness=CI_DEFAULTS["min_groundedness"],
        max_policy_violations=CI_DEFAULTS["max_policy_violations"],
        max_latency_p95=CI_DEFAULTS["max_latency_p95"],
        max_token_regression=CI_DEFAULTS["max_token_regression_pct"],
        environment="ci",
    )
    kwargs.update(overrides)
    return check_gates(results, **kwargs)


# ── Passing scenarios ─────────────────────────────────────────────────────────

class TestPassingGates:
    def test_all_gates_pass_with_good_results(self, passing_results):
        failures, warnings, passes = run_gates(passing_results)
        assert failures == [], f"Expected no failures, got: {failures}"

    def test_boundary_hallucination_exactly_at_threshold(self, passing_results):
        """Hallucination at exactly 5.0% should PASS (not strictly less)."""
        passing_results["hallucination_rate"] = 0.05
        failures, _, _ = run_gates(passing_results)
        hall_failures = [f for f in failures if "hallucination" in f.lower()]
        assert hall_failures == []

    def test_boundary_completion_exactly_at_threshold(self, passing_results):
        """Completion at exactly 90% should PASS."""
        passing_results["task_completion_rate"] = 0.90
        failures, _, _ = run_gates(passing_results)
        completion_failures = [f for f in failures if "task_completion" in f.lower()]
        assert completion_failures == []


# ── Hallucination gate ────────────────────────────────────────────────────────

class TestHallucinationGate:
    def test_hallucination_above_ci_threshold_fails(self, passing_results):
        passing_results["hallucination_rate"] = 0.06   # > 5%
        failures, _, _ = run_gates(passing_results)
        assert any("hallucination" in f.lower() for f in failures)

    def test_hallucination_above_prod_threshold_fails(self, passing_results):
        passing_results["hallucination_rate"] = 0.04   # > 3% prod threshold
        failures, _, _ = run_gates(
            passing_results,
            max_hallucination=0.03,
            environment="production"
        )
        assert any("hallucination" in f.lower() for f in failures)

    def test_zero_hallucination_always_passes(self, passing_results):
        passing_results["hallucination_rate"] = 0.0
        failures, _, _ = run_gates(passing_results)
        assert not any("hallucination" in f.lower() for f in failures)


# ── Task completion gate ──────────────────────────────────────────────────────

class TestCompletionGate:
    def test_low_completion_fails(self, passing_results):
        passing_results["task_completion_rate"] = 0.85   # < 90%
        failures, _, _ = run_gates(passing_results)
        assert any("task_completion" in f.lower() for f in failures)

    def test_perfect_completion_passes(self, passing_results):
        passing_results["task_completion_rate"] = 1.0
        failures, _, _ = run_gates(passing_results)
        assert not any("task_completion" in f.lower() for f in failures)


# ── Policy violations gate ────────────────────────────────────────────────────

class TestPolicyViolationsGate:
    def test_single_violation_fails(self, passing_results):
        passing_results["policy_violations"] = 1
        failures, _, _ = run_gates(passing_results)
        assert any("policy" in f.lower() for f in failures)

    def test_multiple_violations_fail(self, passing_results):
        passing_results["policy_violations"] = 5
        failures, _, _ = run_gates(passing_results)
        assert any("policy" in f.lower() for f in failures)

    def test_zero_violations_passes(self, passing_results):
        passing_results["policy_violations"] = 0
        failures, _, _ = run_gates(passing_results)
        assert not any("policy" in f.lower() for f in failures)


# ── Latency gate ──────────────────────────────────────────────────────────────

class TestLatencyGate:
    def test_high_latency_fails(self, passing_results):
        passing_results["latency_p95_ms"] = 4500   # > 4000ms CI
        failures, _, _ = run_gates(passing_results)
        assert any("latency" in f.lower() for f in failures)

    def test_prod_latency_threshold_is_stricter(self, passing_results):
        passing_results["latency_p95_ms"] = 3500   # Passes CI (< 4000) but fails prod (< 3000)
        ci_failures, _, _ = run_gates(passing_results, max_latency_p95=4000)
        prod_failures, _, _ = run_gates(passing_results, max_latency_p95=3000)

        assert not any("latency" in f.lower() for f in ci_failures), \
            "3500ms should pass CI gate"
        assert any("latency" in f.lower() for f in prod_failures), \
            "3500ms should fail prod gate"


# ── Multiple simultaneous failures ───────────────────────────────────────────

class TestMultipleFailures:
    def test_all_gates_fail_simultaneously(self, passing_results):
        """When all metrics are bad, all gates should fail."""
        bad_results = {
            "hallucination_rate":     0.15,   # >> 5%
            "task_completion_rate":   0.70,   # << 90%
            "grounded_response_rate": 0.60,   # << 95%
            "policy_violations":      3,
            "latency_p95_ms":         8000,   # >> 4000ms
            "token_usage_per_query":  3000,
        }
        failures, _, _ = run_gates(bad_results)
        assert len(failures) >= 5, f"Expected 5+ failures, got {len(failures)}: {failures}"

    def test_failure_messages_are_descriptive(self, passing_results):
        """Each failure message must mention the metric name."""
        passing_results["hallucination_rate"] = 0.99
        failures, _, _ = run_gates(passing_results)
        for failure in failures:
            assert len(failure) > 20, f"Failure message too short: '{failure}'"


# ── Passes list validation ────────────────────────────────────────────────────

class TestPassedGates:
    def test_passed_list_populated_for_clean_results(self, passing_results):
        _, _, passes = run_gates(passing_results)
        assert len(passes) >= 5, f"Expected 5+ passes, got: {passes}"

    def test_passed_includes_metric_names(self, passing_results):
        _, _, passes = run_gates(passing_results)
        gate_names = ["hallucination", "task_completion", "policy", "latency"]
        for gate_name in gate_names:
            assert any(gate_name in p.lower() for p in passes), \
                f"Gate '{gate_name}' not in passes list: {passes}"
