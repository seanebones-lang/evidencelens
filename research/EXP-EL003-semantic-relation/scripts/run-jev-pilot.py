#!/usr/bin/env python3
"""Run the frozen EXP-EL003 JEV pilot without exposing reference labels."""

from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import json
import os
import platform
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


EXPERIMENT_DIR = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = EXPERIMENT_DIR / "jev-pilot-input.json"
DEFAULT_OUTPUT = EXPERIMENT_DIR / "jev-pilot-responses.jsonl"
EXPECTED_INPUT_SHA256 = "f11e25ddef28c5ca965f1298faf7906dff57ff0e33b849abe2124c92bf0c9907"
MODEL_ALIAS = "jev-latest"
SDK_VERSION = "0.7.0"
RUNNER_VERSION = "1.0.0"
MAX_ATTEMPTS = 3

ANSWER_CRITERIA = {
    "YES": "The supplied evidence directly establishes the condition in the question.",
    "NO": "The supplied evidence directly establishes that the condition in the question is false.",
    "INSUFFICIENT_EVIDENCE": (
        "The supplied evidence does not directly establish either YES or NO. "
        "Use this for absent, merely related, ambiguous, or non-resolving evidence."
    ),
}

QUESTIONS = {
    "material_support": {
        "type": "choice",
        "instructions": (
            "Does the supplied evidence directly support at least one material proposition "
            "in the claim? Judge only the supplied claim and evidence."
        ),
        "criteria": ANSWER_CRITERIA,
    },
    "material_contradiction_or_qualification": {
        "type": "choice",
        "instructions": (
            "Does the supplied evidence directly contradict, materially qualify, or materially "
            "mismatch the population, intervention, outcome, scope, or certainty of at least one "
            "proposition in the claim? Judge only the supplied claim and evidence."
        ),
        "criteria": ANSWER_CRITERIA,
    },
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical_sha256(value: Any) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    return f"sha256:{hashlib.sha256(encoded).hexdigest()}"


def load_and_validate_input(path: Path) -> dict[str, Any]:
    if file_sha256(path) != EXPECTED_INPUT_SHA256:
        raise ValueError(f"Frozen input SHA-256 mismatch: {path}")
    document = json.loads(path.read_text(encoding="utf-8"))
    inputs = document.get("inputs")
    if document.get("caseCount") != 80 or not isinstance(inputs, list) or len(inputs) != 80:
        raise ValueError("Frozen input must contain exactly 80 cases")
    if canonical_sha256(inputs) != document.get("canonicalHash"):
        raise ValueError("Frozen input canonical hash mismatch")
    seen: set[str] = set()
    for index, case in enumerate(inputs):
        if set(case) != {"caseId", "claim", "evidence", "domain"}:
            raise ValueError(f"inputs[{index}] has an unexpected field set")
        case_id = case["caseId"]
        if not isinstance(case_id, str) or not case_id or case_id in seen:
            raise ValueError(f"inputs[{index}] has an invalid or duplicate caseId")
        seen.add(case_id)
        if not isinstance(case["claim"], str) or not case["claim"]:
            raise ValueError(f"inputs[{index}].claim must be non-empty")
        if not isinstance(case["domain"], str) or not case["domain"]:
            raise ValueError(f"inputs[{index}].domain must be non-empty")
        if not isinstance(case["evidence"], list) or not case["evidence"]:
            raise ValueError(f"inputs[{index}].evidence must be non-empty")
        for evidence in case["evidence"]:
            if not isinstance(evidence, dict) or not set(evidence).issubset({"verbatim", "section"}):
                raise ValueError(f"inputs[{index}] contains malformed evidence")
            if not isinstance(evidence.get("verbatim"), str) or not evidence["verbatim"]:
                raise ValueError(f"inputs[{index}] contains empty evidence")
    return document


def load_completed(path: Path) -> dict[str, dict[str, Any]]:
    if not path.exists():
        return {}
    records: dict[str, dict[str, Any]] = {}
    with path.open(encoding="utf-8") as stream:
        for line_number, line in enumerate(stream, 1):
            if not line.strip():
                continue
            record = json.loads(line)
            case_id = record.get("caseId")
            if not isinstance(case_id, str) or case_id in records:
                raise ValueError(f"Invalid or duplicate response at line {line_number}")
            records[case_id] = record
    return records


def append_record(path: Path, record: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as stream:
        stream.write(json.dumps(record, sort_keys=True, ensure_ascii=False, separators=(",", ":")) + "\n")
        stream.flush()
        os.fsync(stream.fileno())


def normalize_response(response: Any) -> dict[str, Any]:
    expected = set(QUESTIONS)
    if set(response.choices) != expected:
        raise ValueError(f"Response choice fields differ from contract: {sorted(response.choices)}")
    decisions: dict[str, Any] = {}
    for name in QUESTIONS:
        answer = response.choices[name]
        if answer.choice not in ANSWER_CRITERIA:
            raise ValueError(f"Unrecognized answer {answer.choice!r} for {name}")
        probabilities = dict(answer.probabilities)
        if set(probabilities) != set(ANSWER_CRITERIA):
            raise ValueError(f"Probability fields differ from contract for {name}")
        decisions[name] = {
            "choice": answer.choice,
            "confidence": answer.confidence,
            "probabilities": probabilities,
        }
    raw = json.loads(response.raw_http_response.content)
    return {
        "resolvedModel": response.model,
        "requestId": response.request_id,
        "usage": response.usage.model_dump(mode="json"),
        "decisions": decisions,
        "rawResponse": raw,
        "httpStatus": response.raw_http_response.status_code,
    }


def execute_case(client: Any, case: dict[str, Any]) -> dict[str, Any]:
    from typesafe_sdk import (
        RetryPolicy,
        TypeSafeAPIConnectionError,
        TypeSafeAPIError,
        TypeSafeRateLimitError,
    )

    retryable = (TypeSafeAPIConnectionError, TypeSafeRateLimitError)
    attempt_errors: list[dict[str, str | int]] = []
    started = time.perf_counter()
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            response = client.system_one(
                state=case,
                questions=QUESTIONS,
                model=MODEL_ALIAS,
                retry=RetryPolicy(max_retries=0),
            )
            normalized = normalize_response(response)
            return {
                "recordVersion": "1.0.0",
                "runnerVersion": RUNNER_VERSION,
                "caseId": case["caseId"],
                "status": "SUCCESS",
                "attempts": attempt,
                "attemptErrors": attempt_errors,
                "latencyMs": round((time.perf_counter() - started) * 1000, 3),
                "completedAt": utc_now(),
                **normalized,
            }
        except retryable as error:
            attempt_errors.append({"attempt": attempt, "errorType": type(error).__name__, "message": str(error)})
            if attempt == MAX_ATTEMPTS:
                break
            time.sleep(2 ** (attempt - 1))
        except (TypeSafeAPIError, ValueError) as error:
            attempt_errors.append({"attempt": attempt, "errorType": type(error).__name__, "message": str(error)})
            break
    return {
        "recordVersion": "1.0.0",
        "runnerVersion": RUNNER_VERSION,
        "caseId": case["caseId"],
        "status": "ERROR",
        "attempts": len(attempt_errors),
        "attemptErrors": attempt_errors,
        "latencyMs": round((time.perf_counter() - started) * 1000, 3),
        "completedAt": utc_now(),
    }


def dry_run_summary(document: dict[str, Any], output: Path) -> dict[str, Any]:
    completed = load_completed(output)
    case_ids = {case["caseId"] for case in document["inputs"]}
    unknown = set(completed) - case_ids
    if unknown:
        raise ValueError(f"Output contains unknown case IDs: {sorted(unknown)}")
    return {
        "runnerVersion": RUNNER_VERSION,
        "sdkVersionRequired": SDK_VERSION,
        "modelAlias": MODEL_ALIAS,
        "inputCases": len(case_ids),
        "completedCases": len(completed),
        "pendingCases": len(case_ids - set(completed)),
        "questionsHash": canonical_sha256(QUESTIONS),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, help="Explicit integration-test limit; omit for the frozen 80-case run")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    document = load_and_validate_input(args.input)
    summary = dry_run_summary(document, args.output)
    if args.dry_run:
        print(json.dumps(summary, indent=2, sort_keys=True))
        return 0
    if args.limit is not None and args.limit < 1:
        raise ValueError("--limit must be positive")
    if not os.environ.get("TYPESAFE_API_KEY", "").strip():
        raise RuntimeError("TYPESAFE_API_KEY is not configured")
    installed_sdk = importlib.metadata.version("typesafe-sdk")
    if installed_sdk != SDK_VERSION:
        raise RuntimeError(f"typesafe-sdk {SDK_VERSION} required; found {installed_sdk}")

    from typesafe_sdk import RetryPolicy, TypeSafeClient

    completed = load_completed(args.output)
    pending = [case for case in document["inputs"] if case["caseId"] not in completed]
    if args.limit is not None:
        pending = pending[: args.limit]
    run_header = {
        "event": "RUN_START",
        "runnerVersion": RUNNER_VERSION,
        "startedAt": utc_now(),
        "pythonVersion": platform.python_version(),
        "sdkVersion": installed_sdk,
        "modelAlias": MODEL_ALIAS,
        "inputSha256": EXPECTED_INPUT_SHA256,
        "questionsHash": canonical_sha256(QUESTIONS),
        "pendingCases": len(pending),
    }
    print(json.dumps(run_header, sort_keys=True), flush=True)
    with TypeSafeClient(model=MODEL_ALIAS, retry=RetryPolicy(max_retries=0)) as client:
        for position, case in enumerate(pending, 1):
            record = execute_case(client, case)
            append_record(args.output, record)
            print(json.dumps({"position": position, "total": len(pending), "caseId": case["caseId"], "status": record["status"]}), flush=True)
    final = dry_run_summary(document, args.output)
    print(json.dumps({"event": "RUN_END", "completedAt": utc_now(), **final}, sort_keys=True), flush=True)
    return 0 if final["completedCases"] == 80 else 2


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"{type(error).__name__}: {error}", file=sys.stderr)
        raise SystemExit(1)
