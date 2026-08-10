"""
tests/unit/test_validate_agent_config.py
-----------------------------------------
Unit tests for scripts/validate_agent_config.py
Validates the schema validation logic without external dependencies.
"""

import json
import sys
from pathlib import Path

import pytest

# Add scripts/ to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))
from validate_agent_config import validate


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def valid_config():
    """Minimal valid agent.yaml config dict."""
    return {
        "apiVersion": "foundry/v1",
        "kind": "Agent",
        "metadata": {
            "name": "easytenant-test-agent",
            "displayName": "Test Agent",
            "version": "1.0.0",
            "description": "Test agent for unit tests — validates CI/CD pipeline configuration",
        },
        "runtime": {
            "type": "prompt-based",
            "model": "gpt-4o",
            "temperature": 0.15,
            "max_tokens": 4096,
            "timeout_ms": 8000,
        },
        "instructions": "You are a test agent. " * 10,  # Enough chars to pass validation
        "tools": [
            {
                "name": "test_tool",
                "description": "A test tool for unit testing",
                "type": "function",
                "parameters": {
                    "type": "object",
                    "properties": {"query": {"type": "string"}},
                    "required": ["query"],
                },
            }
        ],
        "safety": {
            "content_filters": [{"category": "hate_speech", "severity": "low"}],
            "pii_handling": "redact",
            "groundedness": "strict",
        },
        "evaluation": {
            "golden_dataset": "eval/datasets/golden_set.jsonl",
            "ci_gates": {
                "hallucination_rate":     {"max": 0.05},
                "task_completion_rate":   {"min": 0.90},
                "grounded_response_rate": {"min": 0.95},
                "policy_violations":      {"max": 0},
                "latency_p95_ms":         {"max": 4000},
            },
            "prod_gates": {
                "hallucination_rate":     {"max": 0.03},
                "task_completion_rate":   {"min": 0.95},
                "grounded_response_rate": {"min": 0.98},
                "policy_violations":      {"max": 0},
                "latency_p95_ms":         {"max": 3000},
            },
        },
        "observability": {
            "tracing": {"enabled": True, "exporter": "azure_monitor"},
            "logging": {"level": "info", "structured": True},
        },
        "environments": {
            "dev":        {"model": "gpt-4o-mini"},
            "test":       {"model": "gpt-4o"},
            "production": {
                "model": "gpt-4o",
                "metadata": {"approval_required": True},
            },
        },
    }


# ── Happy path tests ───────────────────────────────────────────────────────────

class TestValidConfigPasses:
    def test_valid_config_returns_no_errors(self, valid_config):
        errors = validate(valid_config)
        assert errors == [], f"Expected no errors, got: {errors}"

    def test_valid_config_strict_mode(self, valid_config):
        errors = validate(valid_config, strict=True)
        assert errors == [], f"Strict mode errors: {errors}"


# ── Required keys ─────────────────────────────────────────────────────────────

class TestRequiredTopLevelKeys:
    @pytest.mark.parametrize("missing_key", [
        "apiVersion", "kind", "metadata", "runtime", "instructions",
        "tools", "safety", "evaluation", "observability", "environments"
    ])
    def test_missing_top_level_key_fails(self, valid_config, missing_key):
        del valid_config[missing_key]
        errors = validate(valid_config)
        assert any(missing_key in e for e in errors), \
            f"Expected error for missing key '{missing_key}', got: {errors}"


class TestMetadataValidation:
    def test_missing_name_fails(self, valid_config):
        del valid_config["metadata"]["name"]
        errors = validate(valid_config)
        assert any("metadata.name" in e for e in errors)

    def test_invalid_semver_fails(self, valid_config):
        valid_config["metadata"]["version"] = "v1"   # Not semver x.y.z
        errors = validate(valid_config)
        assert any("version" in e for e in errors)

    def test_valid_semver_passes(self, valid_config):
        valid_config["metadata"]["version"] = "3.0.0"
        errors = validate(valid_config)
        assert not any("version" in e for e in errors)


# ── Runtime validation ────────────────────────────────────────────────────────

class TestRuntimeValidation:
    def test_invalid_runtime_type_fails(self, valid_config):
        valid_config["runtime"]["type"] = "docker-compose"   # Not allowed
        errors = validate(valid_config)
        assert any("runtime.type" in e for e in errors)

    def test_hosted_runtime_type_passes(self, valid_config):
        valid_config["runtime"]["type"] = "hosted"
        errors = validate(valid_config)
        assert not any("runtime.type" in e for e in errors)

    def test_temperature_out_of_range_fails(self, valid_config):
        valid_config["runtime"]["temperature"] = 3.0   # > 2.0
        errors = validate(valid_config)
        assert any("temperature" in e for e in errors)

    def test_timeout_too_low_fails(self, valid_config):
        valid_config["runtime"]["timeout_ms"] = 500   # < 1000ms
        errors = validate(valid_config)
        assert any("timeout_ms" in e for e in errors)


# ── Safety validation ─────────────────────────────────────────────────────────

class TestSafetyValidation:
    def test_invalid_pii_handling_fails(self, valid_config):
        valid_config["safety"]["pii_handling"] = "share_freely"
        errors = validate(valid_config)
        assert any("pii_handling" in e for e in errors)

    def test_invalid_groundedness_fails(self, valid_config):
        valid_config["safety"]["groundedness"] = "none"
        errors = validate(valid_config)
        assert any("groundedness" in e for e in errors)


# ── Evaluation gate validation ────────────────────────────────────────────────

class TestEvaluationGates:
    @pytest.mark.parametrize("metric", [
        "hallucination_rate", "task_completion_rate", "grounded_response_rate",
        "policy_violations", "latency_p95_ms"
    ])
    def test_missing_ci_gate_fails(self, valid_config, metric):
        del valid_config["evaluation"]["ci_gates"][metric]
        errors = validate(valid_config)
        assert any(f"ci_gates.{metric}" in e for e in errors)

    def test_prod_hallucination_threshold_must_be_stricter(self, valid_config):
        """Prod max hallucination must be <= CI max hallucination."""
        valid_config["evaluation"]["ci_gates"]["hallucination_rate"] = {"max": 0.03}
        valid_config["evaluation"]["prod_gates"]["hallucination_rate"] = {"max": 0.05}  # Looser!
        errors = validate(valid_config)
        assert any("hallucination_rate" in e and "prod threshold" in e for e in errors)

    def test_prod_completion_threshold_must_be_stricter(self, valid_config):
        """Prod min completion must be >= CI min completion."""
        valid_config["evaluation"]["ci_gates"]["task_completion_rate"] = {"min": 0.95}
        valid_config["evaluation"]["prod_gates"]["task_completion_rate"] = {"min": 0.90}  # Looser!
        errors = validate(valid_config)
        assert any("task_completion_rate" in e for e in errors)

    def test_well_configured_gates_pass(self, valid_config):
        """Standard CI<Prod threshold configuration must pass."""
        errors = validate(valid_config)
        assert errors == []


# ── Environment validation ────────────────────────────────────────────────────

class TestEnvironmentValidation:
    def test_missing_production_environment_fails(self, valid_config):
        del valid_config["environments"]["production"]
        errors = validate(valid_config)
        assert any("production" in e for e in errors)

    def test_production_without_approval_required_fails(self, valid_config):
        """Production env MUST have approval_required: true."""
        valid_config["environments"]["production"] = {"model": "gpt-4o"}  # No approval_required
        errors = validate(valid_config)
        assert any("approval_required" in e for e in errors)

    def test_production_with_approval_passes(self, valid_config):
        errors = validate(valid_config)
        approval_errors = [e for e in errors if "approval_required" in e]
        assert approval_errors == []


# ── Instructions validation ───────────────────────────────────────────────────

class TestInstructionsValidation:
    def test_empty_instructions_fails(self, valid_config):
        valid_config["instructions"] = ""
        errors = validate(valid_config)
        assert any("instructions" in e for e in errors)

    def test_very_short_instructions_fails(self, valid_config):
        valid_config["instructions"] = "Short."
        errors = validate(valid_config)
        assert any("instructions" in e for e in errors)

    def test_substantial_instructions_pass(self, valid_config):
        valid_config["instructions"] = "A" * 200   # 200 chars
        errors = validate(valid_config)
        instruction_errors = [e for e in errors if "instructions" in e]
        assert instruction_errors == []


# ── Real agent.yaml integration test ─────────────────────────────────────────

class TestRealAgentYaml:
    def test_production_agent_yaml_passes_validation(self):
        """The actual agent.yaml in the repo must pass all validation checks."""
        try:
            import yaml
        except ImportError:
            pytest.skip("PyYAML not installed")

        agent_yaml_path = Path(__file__).parent.parent.parent / "agent.yaml"
        if not agent_yaml_path.exists():
            pytest.skip("agent.yaml not found — run from repo root")

        with open(agent_yaml_path) as f:
            config = yaml.safe_load(f)

        errors = validate(config)
        assert errors == [], \
            f"Production agent.yaml has validation errors:\n" + "\n".join(f"  - {e}" for e in errors)
