"""
tests/tools/test_agent_tools.py
--------------------------------
Tool integration tests for easyTenancy agent tools.
Tests tool schema validity, parameter validation, and mock responses.
These tests run without live Azure credentials using mock HTTP responses.
"""

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))


# ── Tool schema tests ─────────────────────────────────────────────────────────

class TestToolSchemaValidity:
    """Verify all tools in agent.yaml have valid JSON Schema parameters."""

    @pytest.fixture(autouse=True)
    def load_tools(self):
        """Load tool definitions from agent.yaml."""
        try:
            import yaml
        except ImportError:
            pytest.skip("PyYAML not installed")

        agent_yaml = Path(__file__).parent.parent.parent / "agent.yaml"
        if not agent_yaml.exists():
            pytest.skip("agent.yaml not found")

        with open(agent_yaml) as f:
            config = yaml.safe_load(f)
        self.tools = config.get("tools", [])

    def test_all_tools_have_names(self):
        for tool in self.tools:
            assert "name" in tool, f"Tool missing name: {tool}"
            assert len(tool["name"]) > 0

    def test_all_tools_have_descriptions(self):
        for tool in self.tools:
            assert "description" in tool, f"Tool '{tool.get('name')}' missing description"
            assert len(tool["description"].strip()) >= 20, \
                f"Tool '{tool['name']}' description too short"

    def test_tool_parameters_are_valid_json_schema(self):
        for tool in self.tools:
            params = tool.get("parameters", {})
            if params:
                assert params.get("type") == "object", \
                    f"Tool '{tool['name']}' parameters.type must be 'object'"
                assert "properties" in params, \
                    f"Tool '{tool['name']}' parameters missing 'properties'"

    def test_required_tools_present(self):
        """All expected easyTenancy tools must be present."""
        expected_tools = [
            "get_portfolio_metrics",
            "get_compliance_status",
            "analyse_lease",
            "predict_vacancy",
            "search_proptech_knowledge",
        ]
        tool_names = [t["name"] for t in self.tools]
        for expected in expected_tools:
            assert expected in tool_names, \
                f"Expected tool '{expected}' not found. Available: {tool_names}"

    def test_no_duplicate_tool_names(self):
        tool_names = [t["name"] for t in self.tools]
        assert len(tool_names) == len(set(tool_names)), \
            f"Duplicate tool names found: {[n for n in tool_names if tool_names.count(n) > 1]}"


# ── Tool parameter validation ─────────────────────────────────────────────────

class TestPortfolioMetricsTool:
    """Tests for get_portfolio_metrics tool parameter schema."""

    @pytest.fixture(autouse=True)
    def load_tool(self):
        try:
            import yaml
        except ImportError:
            pytest.skip("PyYAML not installed")

        agent_yaml = Path(__file__).parent.parent.parent / "agent.yaml"
        if not agent_yaml.exists():
            pytest.skip("agent.yaml not found")

        with open(agent_yaml) as f:
            config = yaml.safe_load(f)

        tools = {t["name"]: t for t in config.get("tools", [])}
        self.tool = tools.get("get_portfolio_metrics")
        if not self.tool:
            pytest.skip("get_portfolio_metrics tool not found")

    def test_scope_parameter_has_enum(self):
        scope_param = self.tool["parameters"]["properties"].get("scope", {})
        assert "enum" in scope_param, "scope parameter must have enum values"
        assert "global" in scope_param["enum"]

    def test_scope_is_required(self):
        required = self.tool["parameters"].get("required", [])
        assert "scope" in required, "scope must be a required parameter"

    def test_period_has_live_option(self):
        period_param = self.tool["parameters"]["properties"].get("period", {})
        assert "enum" in period_param
        assert "live" in period_param["enum"]


class TestComplianceTool:
    """Tests for get_compliance_status tool parameter schema."""

    @pytest.fixture(autouse=True)
    def load_tool(self):
        try:
            import yaml
        except ImportError:
            pytest.skip("PyYAML not installed")

        agent_yaml = Path(__file__).parent.parent.parent / "agent.yaml"
        if not agent_yaml.exists():
            pytest.skip("agent.yaml not found")

        with open(agent_yaml) as f:
            config = yaml.safe_load(f)

        tools = {t["name"]: t for t in config.get("tools", [])}
        self.tool = tools.get("get_compliance_status")
        if not self.tool:
            pytest.skip("get_compliance_status tool not found")

    def test_jurisdiction_is_required(self):
        required = self.tool["parameters"].get("required", [])
        assert "jurisdiction" in required

    def test_include_pending_defaults_to_true(self):
        props = self.tool["parameters"]["properties"]
        include_pending = props.get("include_pending", {})
        assert include_pending.get("default") is True


# ── Dataset validation ────────────────────────────────────────────────────────

class TestEvalDatasets:
    """Validate evaluation dataset files are well-formed."""

    def _load_jsonl(self, path: str) -> list[dict]:
        p = Path(path)
        if not p.exists():
            return []
        lines = []
        with open(p) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    lines.append(json.loads(line))
        return lines

    @pytest.fixture
    def golden_set(self):
        path = Path(__file__).parent.parent.parent / "eval/datasets/golden_set.jsonl"
        return self._load_jsonl(str(path))

    @pytest.fixture
    def scenario_set(self):
        path = Path(__file__).parent.parent.parent / "eval/datasets/scenario_set.jsonl"
        return self._load_jsonl(str(path))

    def test_golden_set_has_minimum_scenarios(self, golden_set):
        assert len(golden_set) >= 15, \
            f"Golden set needs at least 15 scenarios, got {len(golden_set)}"

    def test_scenario_set_has_minimum_scenarios(self, scenario_set):
        assert len(scenario_set) >= 10, \
            f"Scenario set needs at least 10 scenarios, got {len(scenario_set)}"

    def test_all_golden_scenarios_have_required_fields(self, golden_set):
        for scenario in golden_set:
            assert "id" in scenario, f"Scenario missing id: {scenario}"
            assert "category" in scenario, f"Scenario {scenario['id']} missing category"
            assert "input" in scenario, f"Scenario {scenario['id']} missing input"
            assert "expected_output" in scenario, \
                f"Scenario {scenario['id']} missing expected_output"

    def test_no_duplicate_scenario_ids(self, golden_set, scenario_set):
        all_ids = [s["id"] for s in golden_set + scenario_set]
        duplicates = [i for i in all_ids if all_ids.count(i) > 1]
        assert not duplicates, f"Duplicate scenario IDs: {set(duplicates)}"

    def test_safety_scenarios_exist_in_golden_set(self, golden_set):
        """Critical: must have safety test scenarios in the golden set."""
        safety_scenarios = [s for s in golden_set if "safety_test" in s.get("tags", [])]
        assert len(safety_scenarios) >= 1, \
            "Golden set must include at least 1 safety test scenario"

    def test_hallucination_test_scenarios_exist(self, golden_set, scenario_set):
        """Must have hallucination test scenarios."""
        all_scenarios = golden_set + scenario_set
        hall_tests = [s for s in all_scenarios if "hallucination_test" in s.get("tags", [])]
        assert len(hall_tests) >= 1, \
            "Datasets must include at least 1 hallucination test scenario"

    def test_categories_are_diverse(self, golden_set):
        """Golden set should cover multiple categories."""
        categories = {s.get("category") for s in golden_set}
        assert len(categories) >= 5, \
            f"Golden set should have 5+ categories, got: {categories}"

    def test_all_input_has_query_field(self, golden_set):
        for scenario in golden_set:
            assert "query" in scenario.get("input", {}), \
                f"Scenario {scenario['id']} input missing 'query' field"
