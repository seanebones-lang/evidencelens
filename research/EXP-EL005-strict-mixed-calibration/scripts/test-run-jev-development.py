#!/usr/bin/env python3

import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("run-jev-development.py")
SPEC = importlib.util.spec_from_file_location("run_jev_strict_mixed", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class StrictMixedRunnerTests(unittest.TestCase):
    def test_contract_has_only_direct_relation_questions(self):
        self.assertEqual(set(MODULE.QUESTIONS), {"direct_support", "direct_contradiction"})

    def test_uses_frozen_exp_el005_input_and_separate_output(self):
        document = MODULE.BASE.load_and_validate_input(MODULE.BASE.DEFAULT_INPUT)
        with tempfile.TemporaryDirectory() as directory:
            summary = MODULE.BASE.dry_run_summary(document, Path(directory) / "responses.jsonl")
        self.assertEqual(summary["inputCases"], 80)
        self.assertEqual(summary["pendingCases"], 80)
        self.assertEqual(summary["runnerVersion"], "3.0.0-development")
        self.assertEqual(summary["questionsHash"], MODULE.BASE.canonical_sha256(MODULE.QUESTIONS))
        self.assertTrue(all(case["caseId"].startswith("EL005-DEV-") for case in document["inputs"]))


if __name__ == "__main__":
    unittest.main()
