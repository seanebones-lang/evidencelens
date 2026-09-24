#!/usr/bin/env python3
"""Score EXP-EL006 using its prospectively frozen YES/YES diagnostic rule."""

from __future__ import annotations

import argparse
import hashlib
import json
import statistics
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
EXP5 = ROOT.parent / "EXP-EL005-strict-mixed-calibration"
RESPONSES = ROOT / "jev-development-responses.jsonl"
INPUT = ROOT / "development-input.json"
EXP5_RESPONSES = EXP5 / "jev-development-responses.jsonl"
OUTPUT_JSON = ROOT / "JEV-PROPOSITION-DECOMPOSITION-RESULT-001.json"
OUTPUT_MD = ROOT / "JEV-PROPOSITION-DECOMPOSITION-REPORT-001.md"
EXPECTED_INPUT_SHA256 = "33fe8a6653d3870b540c5161e8d917aa6faf399adf8014abf203d9881482cd86"
EXPECTED_EXP5_RESPONSE_SHA256 = "5876aee240a7d7ff00e90762b608aa33016684b04a32fb3b316de38e88044c26"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--expected-response-sha256", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if sha256(RESPONSES) != args.expected_response_sha256:
        raise ValueError("Frozen response hash mismatch")
    if sha256(INPUT) != EXPECTED_INPUT_SHA256 or sha256(EXP5_RESPONSES) != EXPECTED_EXP5_RESPONSE_SHA256:
        raise ValueError("Frozen source artifact hash mismatch")
    rows = [json.loads(line) for line in RESPONSES.read_text(encoding="utf-8").splitlines() if line]
    previous = {row["caseId"].replace("EL005-", "EL006-"): row for row in [
        json.loads(line) for line in EXP5_RESPONSES.read_text(encoding="utf-8").splitlines() if "-MIX-" in line
    ]}
    if len(rows) != 20 or len({row["caseId"] for row in rows}) != 20 or any(row["status"] != "SUCCESS" for row in rows):
        raise ValueError("Expected 20 unique successful responses")
    if set(previous) != {row["caseId"] for row in rows}:
        raise ValueError("EXP-EL005 and EXP-EL006 case IDs differ")

    records = []
    for row in rows:
        support = row["decisions"]["supported_proposition_supported"]["choice"]
        contradiction = row["decisions"]["contradicted_proposition_contradicted"]["choice"]
        prior = previous[row["caseId"]]["decisions"]
        prior_support = prior["direct_support"]["choice"]
        prior_contradiction = prior["direct_contradiction"]["choice"]
        records.append({
            "caseId": row["caseId"],
            "expEL005": {"support": prior_support, "contradiction": prior_contradiction, "bothYes": prior_support == prior_contradiction == "YES"},
            "expEL006": {"support": support, "contradiction": contradiction, "bothYes": support == contradiction == "YES"},
        })
    support_yes = sum(record["expEL006"]["support"] == "YES" for record in records)
    contradiction_yes = sum(record["expEL006"]["contradiction"] == "YES" for record in records)
    both_yes = sum(record["expEL006"]["bothYes"] for record in records)
    prior_both_yes = sum(record["expEL005"]["bothYes"] for record in records)
    rescued = sum(not record["expEL005"]["bothYes"] and record["expEL006"]["bothYes"] for record in records)
    regressed = sum(record["expEL005"]["bothYes"] and not record["expEL006"]["bothYes"] for record in records)
    latency = [row["latencyMs"] for row in rows]
    result = {
        "resultVersion": "1.0.0",
        "experiment": "EXP-EL006-proposition-decomposition",
        "phase": "TUNED_DEVELOPMENT_DIAGNOSTIC",
        "confirmationEligible": False,
        "humanReviewed": False,
        "artifacts": {"rawResponseSha256": args.expected_response_sha256, "inputSha256": EXPECTED_INPUT_SHA256, "expEL005RawResponseSha256": EXPECTED_EXP5_RESPONSE_SHA256},
        "endpoints": {
            "caseCount": 20,
            "bothYesCount": both_yes,
            "bothYesRate": both_yes / 20,
            "supportYesCount": support_yes,
            "supportYesRate": support_yes / 20,
            "contradictionYesCount": contradiction_yes,
            "contradictionYesRate": contradiction_yes / 20,
            "expEL005BothYesCount": prior_both_yes,
            "expEL005BothYesRate": prior_both_yes / 20,
            "pairedRescuedCount": rescued,
            "pairedRegressedCount": regressed,
        },
        "runtime": {
            "successCount": 20,
            "resolvedModels": dict(Counter(row["resolvedModel"] for row in rows)),
            "attemptCounts": {str(k): v for k, v in sorted(Counter(row["attempts"] for row in rows).items())},
            "inputTokens": sum(row["usage"]["input_tokens"] for row in rows),
            "outputTokens": sum(row["usage"]["output_tokens"] for row in rows),
            "latencyMs": {"mean": statistics.mean(latency), "median": statistics.median(latency), "minimum": min(latency), "maximum": max(latency)},
        },
        "records": records,
    }
    OUTPUT_JSON.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    misses = [record for record in records if not record["expEL006"]["bothYes"]]
    lines = [
        "# EXP-EL006 proposition-decomposition report 001", "",
        "**Status:** Complete tuned development diagnostic; not confirmation", "",
        "## Disclosure", "",
        "This experiment was designed after inspecting EXP-EL005 failures and reused the same 20 synthetic cases. GPT authored the proposition splits and expected answers. No human reviewed them. Results cannot estimate generalization or justify promotion.", "",
        "## Outcome", "",
        f"Proposition decomposition produced `YES/YES` on **{both_yes}/20 ({both_yes/20:.1%})** cases, compared with **{prior_both_yes}/20 ({prior_both_yes/20:.1%})** on the same compound claims in EXP-EL005.", "",
        "| Endpoint | Result |", "|---|---:|",
        f"| Both propositions resolved as expected | {both_yes}/20 ({both_yes/20:.1%}) |",
        f"| Supported proposition answered YES | {support_yes}/20 ({support_yes/20:.1%}) |",
        f"| Contradicted proposition answered YES | {contradiction_yes}/20 ({contradiction_yes/20:.1%}) |",
        f"| Paired cases rescued | {rescued} |",
        f"| Paired cases regressed | {regressed} |", "",
        "## Remaining misses", "",
    ]
    if misses:
        for record in misses:
            lines.append(f"- `{record['caseId']}` — support `{record['expEL006']['support']}`; contradiction `{record['expEL006']['contradiction']}`")
    else:
        lines.append("None.")
    lines.extend(["", "## Interpretation", "", "A higher paired `YES/YES` rate would support the narrow hypothesis that explicit proposition decomposition helps JEV preserve concurrent support and contradiction. Because decomposition changes the information structure and was tuned to observed failures, it must remain an optional diagnostic path until replicated on prospectively sourced, independently reviewed natural cases.", "", "## Runtime evidence", "", f"- Raw response SHA-256: `{args.expected_response_sha256}`", "- All 20 cases completed successfully.", f"- Median latency: {result['runtime']['latencyMs']['median']:.1f} ms"])
    OUTPUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
