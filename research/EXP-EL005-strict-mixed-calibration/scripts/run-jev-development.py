#!/usr/bin/env python3
"""Run the frozen EXP-EL005 strict direct-relation contract."""

from __future__ import annotations

import importlib.util
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
EXPERIMENT = ROOT / "EXP-EL005-strict-mixed-calibration"
BASE_RUNNER_PATH = ROOT / "EXP-EL003-semantic-relation" / "scripts" / "run-jev-pilot.py"
SPEC = importlib.util.spec_from_file_location("exp_el003_frozen_runner", BASE_RUNNER_PATH)
BASE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(BASE)

ANSWER_CRITERIA = {
    "YES": "The supplied evidence directly establishes the condition in the question.",
    "NO": "The supplied evidence directly establishes that the condition in the question is false.",
    "INSUFFICIENT_EVIDENCE": (
        "The supplied evidence does not directly establish either YES or NO. "
        "Use this for absent, merely related, ambiguous, or non-resolving evidence."
    ),
}

QUESTIONS = {
    "direct_support": {
        "type": "choice",
        "instructions": (
            "Does the supplied evidence directly support at least one material proposition in the claim? "
            "Judge only the supplied claim and evidence."
        ),
        "criteria": ANSWER_CRITERIA,
    },
    "direct_contradiction": {
        "type": "choice",
        "instructions": (
            "Does the supplied evidence directly establish the opposite of at least one material proposition "
            "in the claim? Exclude missing evidence, generic uncertainty, study-design limitations, and scope "
            "mismatch. Judge only the supplied claim and evidence."
        ),
        "criteria": ANSWER_CRITERIA,
    },
}

BASE.RUNNER_VERSION = "3.0.0-development"
BASE.QUESTIONS = QUESTIONS
BASE.ANSWER_CRITERIA = ANSWER_CRITERIA
BASE.DEFAULT_INPUT = EXPERIMENT / "development-input.json"
BASE.DEFAULT_OUTPUT = EXPERIMENT / "jev-development-responses.jsonl"
BASE.EXPECTED_INPUT_SHA256 = "1c34f36b3a3bbae01bb6236f8563762125045eeefc50639a51ea5fdf30bad536"


if __name__ == "__main__":
    try:
        raise SystemExit(BASE.main())
    except Exception as error:
        print(f"{type(error).__name__}: {error}", file=BASE.sys.stderr)
        raise SystemExit(1)
