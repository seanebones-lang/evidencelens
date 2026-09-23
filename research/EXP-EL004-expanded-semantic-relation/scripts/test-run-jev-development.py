#!/usr/bin/env python3

import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("run-jev-development.py")
SPEC = importlib.util.spec_from_file_location("run_jev_development", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class ExpandedRunnerTests(unittest.TestCase):
    def test_contract_has_four_distinct_questions(self):
        self.assertEqual(set(MODULE.QUESTIONS), {
            "direct_support",
            "direct_contradiction",
            "explicit_scope_mismatch",
            "explicit_design_limitation",
        })

    def test_uses_frozen_development_input_and_separate_output(self):
        document = MODULE.BASE.load_and_validate_input(MODULE.BASE.DEFAULT_INPUT)
        with tempfile.TemporaryDirectory() as directory:
            summary = MODULE.BASE.dry_run_summary(document, Path(directory) / "responses.jsonl")
        self.assertEqual(summary["inputCases"], 80)
        self.assertEqual(summary["pendingCases"], 80)
        self.assertEqual(summary["runnerVersion"], "2.0.0-development")
        self.assertEqual(summary["questionsHash"], MODULE.BASE.canonical_sha256(MODULE.QUESTIONS))


if __name__ == "__main__":
    unittest.main()
