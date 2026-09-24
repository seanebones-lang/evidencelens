#!/usr/bin/env python3
"""Run the frozen EXP-EL006 proposition-decomposition diagnostic."""

from __future__ import annotations

import importlib.metadata
import importlib.util
import json
import os
import platform
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
EXPERIMENT = ROOT / "EXP-EL006-proposition-decomposition"
BASE_PATH = ROOT / "EXP-EL003-semantic-relation" / "scripts" / "run-jev-pilot.py"
SPEC = importlib.util.spec_from_file_location("exp_el003_frozen_runner", BASE_PATH)
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
    "supported_proposition_supported": {
        "type": "choice",
        "instructions": (
            "Does the supplied evidence directly support the exact proposition in the state field "
            "supportedProposition? Evaluate that proposition independently of the compound claim."
        ),
        "criteria": ANSWER_CRITERIA,
    },
    "contradicted_proposition_contradicted": {
        "type": "choice",
        "instructions": (
            "Does the supplied evidence directly establish the opposite of the exact proposition in the state "
            "field contradictedProposition? Evaluate that proposition independently of the compound claim."
        ),
        "criteria": ANSWER_CRITERIA,
    },
}

BASE.RUNNER_VERSION = "4.0.0-development"
BASE.QUESTIONS = QUESTIONS
BASE.ANSWER_CRITERIA = ANSWER_CRITERIA
BASE.DEFAULT_INPUT = EXPERIMENT / "development-input.json"
BASE.DEFAULT_OUTPUT = EXPERIMENT / "jev-development-responses.jsonl"
BASE.EXPECTED_INPUT_SHA256 = "33fe8a6653d3870b540c5161e8d917aa6faf399adf8014abf203d9881482cd86"


def load_and_validate_input(path: Path) -> dict[str, Any]:
    if BASE.file_sha256(path) != BASE.EXPECTED_INPUT_SHA256:
        raise ValueError(f"Frozen input SHA-256 mismatch: {path}")
    document = json.loads(path.read_text(encoding="utf-8"))
    inputs = document.get("inputs")
    if document.get("caseCount") != 20 or not isinstance(inputs, list) or len(inputs) != 20:
        raise ValueError("Frozen input must contain exactly 20 cases")
    if BASE.canonical_sha256(inputs) != document.get("canonicalHash"):
        raise ValueError("Frozen input canonical hash mismatch")
    fields = {"caseId", "claim", "supportedProposition", "contradictedProposition", "evidence", "domain"}
    seen = set()
    for index, case in enumerate(inputs):
        if not isinstance(case, dict) or set(case) != fields:
            raise ValueError(f"inputs[{index}] has an unexpected field set")
        for field in ["caseId", "claim", "supportedProposition", "contradictedProposition", "domain"]:
            if not isinstance(case[field], str) or not case[field]:
                raise ValueError(f"inputs[{index}].{field} must be non-empty")
        if case["caseId"] in seen:
            raise ValueError(f"Duplicate caseId {case['caseId']}")
        seen.add(case["caseId"])
        if not isinstance(case["evidence"], list) or not case["evidence"]:
            raise ValueError(f"inputs[{index}].evidence must be non-empty")
        for evidence in case["evidence"]:
            if not isinstance(evidence, dict) or not set(evidence).issubset({"verbatim", "section"}):
                raise ValueError(f"inputs[{index}] contains malformed evidence")
            if not isinstance(evidence.get("verbatim"), str) or not evidence["verbatim"]:
                raise ValueError(f"inputs[{index}] contains empty evidence")
    return document


BASE.load_and_validate_input = load_and_validate_input


def main() -> int:
    args = BASE.parse_args()
    document = load_and_validate_input(args.input)
    summary = BASE.dry_run_summary(document, args.output)
    if args.dry_run:
        print(json.dumps(summary, indent=2, sort_keys=True))
        return 0
    if args.limit is not None and args.limit < 1:
        raise ValueError("--limit must be positive")
    if not os.environ.get("TYPESAFE_API_KEY", "").strip():
        raise RuntimeError("TYPESAFE_API_KEY is not configured")
    installed_sdk = importlib.metadata.version("typesafe-sdk")
    if installed_sdk != BASE.SDK_VERSION:
        raise RuntimeError(f"typesafe-sdk {BASE.SDK_VERSION} required; found {installed_sdk}")

    from typesafe_sdk import RetryPolicy, TypeSafeClient

    completed = BASE.load_completed(args.output)
    pending = [case for case in document["inputs"] if case["caseId"] not in completed]
    if args.limit is not None:
        pending = pending[:args.limit]
    print(json.dumps({
        "event": "RUN_START", "runnerVersion": BASE.RUNNER_VERSION, "startedAt": BASE.utc_now(),
        "pythonVersion": platform.python_version(), "sdkVersion": installed_sdk,
        "modelAlias": BASE.MODEL_ALIAS, "inputSha256": BASE.EXPECTED_INPUT_SHA256,
        "questionsHash": BASE.canonical_sha256(QUESTIONS), "pendingCases": len(pending),
    }, sort_keys=True), flush=True)
    with TypeSafeClient(model=BASE.MODEL_ALIAS, retry=RetryPolicy(max_retries=0)) as client:
        for position, case in enumerate(pending, 1):
            record = BASE.execute_case(client, case)
            BASE.append_record(args.output, record)
            print(json.dumps({"position": position, "total": len(pending), "caseId": case["caseId"], "status": record["status"]}), flush=True)
    final = BASE.dry_run_summary(document, args.output)
    print(json.dumps({"event": "RUN_END", "completedAt": BASE.utc_now(), **final}, sort_keys=True), flush=True)
    return 0 if final["completedCases"] == 20 else 2


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"{type(error).__name__}: {error}", file=BASE.sys.stderr)
        raise SystemExit(1)
