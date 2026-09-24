#!/usr/bin/env python3

import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("run-jev-development.py")
SPEC = importlib.util.spec_from_file_location("run_jev_proposition_decomposition", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class PropositionDecompositionRunnerTests(unittest.TestCase):
    def test_contract_has_two_proposition_specific_questions(self):
        self.assertEqual(set(MODULE.QUESTIONS), {
            "supported_proposition_supported",
            "contradicted_proposition_contradicted",
        })

    def test_uses_frozen_twenty_case_input(self):
        document = MODULE.load_and_validate_input(MODULE.BASE.DEFAULT_INPUT)
        with tempfile.TemporaryDirectory() as directory:
            summary = MODULE.BASE.dry_run_summary(document, Path(directory) / "responses.jsonl")
        self.assertEqual(summary["inputCases"], 20)
        self.assertEqual(summary["pendingCases"], 20)
        self.assertEqual(summary["runnerVersion"], "4.0.0-development")
        self.assertTrue(all(set(case) == {
            "caseId", "claim", "supportedProposition", "contradictedProposition", "evidence", "domain"
        } for case in document["inputs"]))


if __name__ == "__main__":
    unittest.main()
