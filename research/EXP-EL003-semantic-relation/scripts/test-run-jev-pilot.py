#!/usr/bin/env python3

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace


SCRIPT = Path(__file__).with_name("run-jev-pilot.py")
SPEC = importlib.util.spec_from_file_location("run_jev_pilot", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class FakeAnswer:
    def __init__(self, choice):
        self.choice = choice
        self.confidence = 0.8
        self.probabilities = {"YES": 0.8, "NO": 0.1, "INSUFFICIENT_EVIDENCE": 0.1}


class RunnerTests(unittest.TestCase):
    def test_frozen_input_and_dry_run(self):
        document = MODULE.load_and_validate_input(MODULE.DEFAULT_INPUT)
        with tempfile.TemporaryDirectory() as directory:
            summary = MODULE.dry_run_summary(document, Path(directory) / "responses.jsonl")
        self.assertEqual(summary["inputCases"], 80)
        self.assertEqual(summary["pendingCases"], 80)

    def test_normalizes_choices_and_raw_response(self):
        body = {
            "model": "jev-test",
            "usage": {"input_tokens": 2, "output_tokens": 1},
            "answers": {},
        }
        response = SimpleNamespace(
            choices={name: FakeAnswer("YES") for name in MODULE.QUESTIONS},
            model="jev-test",
            request_id="request-test",
            usage=SimpleNamespace(model_dump=lambda **_: body["usage"]),
            raw_http_response=SimpleNamespace(content=json.dumps(body).encode(), status_code=200),
        )
        normalized = MODULE.normalize_response(response)
        self.assertEqual(normalized["resolvedModel"], "jev-test")
        self.assertEqual(normalized["rawResponse"], body)

    def test_rejects_unrecognized_choice(self):
        response = SimpleNamespace(
            choices={name: FakeAnswer("MAYBE") for name in MODULE.QUESTIONS},
        )
        with self.assertRaisesRegex(ValueError, "Unrecognized answer"):
            MODULE.normalize_response(response)


if __name__ == "__main__":
    unittest.main()
