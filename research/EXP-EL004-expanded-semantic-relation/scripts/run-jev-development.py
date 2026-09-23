#!/usr/bin/env python3
"""Run the EXP-EL004 expanded contract on the exposed development corpus."""

from __future__ import annotations

import importlib.util
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
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
            "mismatch; those are evaluated separately."
        ),
        "criteria": ANSWER_CRITERIA,
    },
    "explicit_scope_mismatch": {
        "type": "choice",
        "instructions": (
            "Does the supplied evidence explicitly address a materially different population, intervention, "
            "comparator, outcome, timeframe, setting, or certainty level than a proposition asserted by the "
            "claim? Mere silence is insufficient evidence, not YES."
        ),
        "criteria": ANSWER_CRITERIA,
    },
    "explicit_design_limitation": {
        "type": "choice",
        "instructions": (
            "Does the supplied evidence explicitly describe a study-design or evidence-base limitation that "
            "materially narrows a proposition supported by the evidence beyond the scope already stated in the "
            "claim? Do not count a limitation already expressed in the claim, an unspecified generic caveat, "
            "or the mere need for future research."
        ),
        "criteria": ANSWER_CRITERIA,
    },
}

BASE.RUNNER_VERSION = "2.0.0-development"
BASE.QUESTIONS = QUESTIONS
BASE.ANSWER_CRITERIA = ANSWER_CRITERIA
BASE.DEFAULT_INPUT = ROOT / "EXP-EL003-semantic-relation" / "jev-pilot-input.json"
BASE.DEFAULT_OUTPUT = ROOT / "EXP-EL004-expanded-semantic-relation" / "jev-development-responses.jsonl"


if __name__ == "__main__":
    try:
        raise SystemExit(BASE.main())
    except Exception as error:
        print(f"{type(error).__name__}: {error}", file=BASE.sys.stderr)
        raise SystemExit(1)
