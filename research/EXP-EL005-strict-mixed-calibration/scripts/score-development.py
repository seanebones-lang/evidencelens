#!/usr/bin/env python3
"""Score the frozen EXP-EL005 strict-mixed development calibration."""

from __future__ import annotations

import hashlib
import json
import math
import statistics
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
RESPONSES = ROOT / "jev-development-responses.jsonl"
REFERENCES = ROOT / "development-reference.json"
OUTPUT_JSON = ROOT / "JEV-STRICT-MIXED-RESULT-001.json"
OUTPUT_MD = ROOT / "JEV-STRICT-MIXED-REPORT-001.md"
EXPECTED_RESPONSE_SHA256 = "5876aee240a7d7ff00e90762b608aa33016684b04a32fb3b316de38e88044c26"
EXPECTED_REFERENCE_SHA256 = "2c132ff394f6706a517e6ecc51e25d59adfa667d845c094027c1291bb8f506b0"
LABELS = ["SUPPORTED", "CONTRADICTED", "MIXED", "INSUFFICIENT_EVIDENCE"]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def mapped_label(row: dict[str, Any]) -> str:
    support = row["decisions"]["direct_support"]["choice"]
    contradiction = row["decisions"]["direct_contradiction"]["choice"]
    if support == "YES" and contradiction == "YES":
        return "MIXED"
    if contradiction == "YES":
        return "CONTRADICTED"
    if support == "YES" and contradiction == "NO":
        return "SUPPORTED"
    return "INSUFFICIENT_EVIDENCE"


def percentile(values: list[float], quantile: float) -> float:
    return sorted(values)[max(0, math.ceil(quantile * len(values)) - 1)]


def calculate_metrics(matrix: dict[str, dict[str, int]]) -> dict[str, Any]:
    per_class: dict[str, Any] = {}
    for label in LABELS:
        tp = matrix[label][label]
        fp = sum(matrix[other][label] for other in LABELS if other != label)
        fn = sum(matrix[label][other] for other in LABELS if other != label)
        precision = tp / (tp + fp) if tp + fp else 0
        recall = tp / (tp + fn) if tp + fn else 0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0
        per_class[label] = {"precision": precision, "recall": recall, "f1": f1, "support": sum(matrix[label].values())}
    total = sum(sum(row.values()) for row in matrix.values())
    insufficient = sum(matrix[label]["INSUFFICIENT_EVIDENCE"] for label in LABELS)
    critical_population = sum(sum(matrix[label].values()) for label in ["CONTRADICTED", "MIXED"])
    false_reassurance = sum(matrix[label]["SUPPORTED"] for label in ["CONTRADICTED", "MIXED"])
    return {
        "accuracy": sum(matrix[label][label] for label in LABELS) / total,
        "macroF1": statistics.mean(per_class[label]["f1"] for label in LABELS),
        "abstentionRate": insufficient / total,
        "nonAbstentionCoverage": 1 - insufficient / total,
        "criticalFalseReassuranceCount": false_reassurance,
        "criticalFalseReassuranceRate": false_reassurance / critical_population,
        "confusionMatrix": matrix,
        "perClass": per_class,
    }


def main() -> None:
    for path, expected in [(RESPONSES, EXPECTED_RESPONSE_SHA256), (REFERENCES, EXPECTED_REFERENCE_SHA256)]:
        if sha256(path) != expected:
            raise ValueError(f"Frozen artifact hash mismatch: {path.name}")
    rows = [json.loads(line) for line in RESPONSES.read_text(encoding="utf-8").splitlines() if line]
    refs = {row["caseId"]: row["provisionalReference"] for row in json.loads(REFERENCES.read_text(encoding="utf-8"))["records"]}
    if len(rows) != 80 or len({row["caseId"] for row in rows}) != 80 or any(row["status"] != "SUCCESS" for row in rows):
        raise ValueError("Expected 80 unique successful responses")
    if set(refs) != {row["caseId"] for row in rows}:
        raise ValueError("Response and provisional-reference case IDs differ")

    matrix = {reference: {prediction: 0 for prediction in LABELS} for reference in LABELS}
    predictions = []
    for row in rows:
        predicted = mapped_label(row)
        reference = refs[row["caseId"]]
        matrix[reference][predicted] += 1
        predictions.append({
            "caseId": row["caseId"],
            "provisionalReference": reference,
            "predictedLabel": predicted,
            "decisions": {name: answer["choice"] for name, answer in row["decisions"].items()},
        })

    latency = [row["latencyMs"] for row in rows]
    result = {
        "resultVersion": "1.0.0",
        "experiment": "EXP-EL005-strict-mixed-calibration",
        "phase": "DEVELOPMENT_CALIBRATION",
        "evaluationStatus": "GPT_AUTHORED_SYNTHETIC_CALIBRATION_PROVISIONAL_REFERENCE",
        "confirmationEligible": False,
        "humanReviewed": False,
        "artifacts": {
            "rawResponseSha256": EXPECTED_RESPONSE_SHA256,
            "provisionalReferenceSha256": EXPECTED_REFERENCE_SHA256,
            "questionsCanonicalHash": "sha256:23e0418cd27eb3331fdf210e218c2948daa1a1ef3b7a06b7305a2fce843d5c24",
            "preRunRemoteCommit": "7b769e208517b5f6367bf8e7393d488b698270d9",
        },
        "runtime": {
            "caseCount": 80,
            "successCount": 80,
            "errorCount": 0,
            "resolvedModels": dict(Counter(row["resolvedModel"] for row in rows)),
            "attemptCounts": {str(key): value for key, value in sorted(Counter(row["attempts"] for row in rows).items())},
            "inputTokens": sum(row["usage"]["input_tokens"] for row in rows),
            "outputTokens": sum(row["usage"]["output_tokens"] for row in rows),
            "latencyMs": {"mean": statistics.mean(latency), "median": statistics.median(latency), "p95": percentile(latency, 0.95), "minimum": min(latency), "maximum": max(latency)},
        },
        "metrics": calculate_metrics(matrix),
        "predictions": predictions,
    }
    OUTPUT_JSON.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    metrics = result["metrics"]
    lines = [
        "# EXP-EL005 strict-mixed calibration report 001", "",
        "**Status:** Complete development calibration; not confirmation", "",
        "## Disclosure", "",
        "GPT authored the 20 synthetic compound claims and all provisional references. The 60 control cases and all evidence payloads were previously exposed during development. No human independently reviewed or adjudicated this corpus. These results test JEV's behavior on deliberately explicit relations and are not a naturalistic performance estimate.", "",
        "## Outcome", "",
        f"JEV identified {matrix['MIXED']['MIXED']}/20 strict synthetic mixed cases ({metrics['perClass']['MIXED']['recall']:.1%} recall). This is materially higher than the 15–25% mixed recall observed with the earlier ambiguous development constructions, but six strict mixed cases were reduced to `CONTRADICTED` and one to `SUPPORTED`.", "",
        "| Metric | Result |", "|---|---:|",
        f"| Accuracy | {metrics['accuracy']:.1%} |",
        f"| Macro F1 | {metrics['macroF1']:.3f} |",
        f"| Mixed recall | {metrics['perClass']['MIXED']['recall']:.1%} |",
        f"| Contradicted recall | {metrics['perClass']['CONTRADICTED']['recall']:.1%} |",
        f"| Supported recall | {metrics['perClass']['SUPPORTED']['recall']:.1%} |",
        f"| Insufficient-evidence recall | {metrics['perClass']['INSUFFICIENT_EVIDENCE']['recall']:.1%} |",
        f"| Critical false reassurance | {metrics['criticalFalseReassuranceRate']:.1%} |", "",
        "## Confusion matrix", "",
        "Rows are GPT-authored provisional references; columns are JEV predictions.", "",
        "| Reference \\ Prediction | Supported | Contradicted | Mixed | Insufficient |", "|---|---:|---:|---:|---:|",
    ]
    for label in LABELS:
        row = matrix[label]
        lines.append(f"| {label.replace('_', ' ').title()} | {row['SUPPORTED']} | {row['CONTRADICTED']} | {row['MIXED']} | {row['INSUFFICIENT_EVIDENCE']} |")
    errors = [item for item in predictions if item["predictedLabel"] != item["provisionalReference"]]
    lines.extend(["", "## Disagreements", ""])
    for item in errors:
        lines.append(f"- `{item['caseId']}` — reference `{item['provisionalReference']}`; prediction `{item['predictedLabel']}`; support `{item['decisions']['direct_support']}`; contradiction `{item['decisions']['direct_contradiction']}`")
    lines.extend(["", "## Interpretation", "", "The calibration supports a narrower conclusion than contract promotion: JEV can emit `YES/YES` for clearly compound support-plus-conflict cases, but it still misses 35% of those deliberately explicit cases. Its three reused control classes remained strong at 95% recall each. The next scientifically useful step is a case-level audit of the seven strict-mixed misses, followed by a prospectively frozen, source-isolated corpus with independently reviewed natural mixed cases.", "", "## Runtime evidence", "", f"- Raw response SHA-256: `{EXPECTED_RESPONSE_SHA256}`", "- Resolved model: `jev-1.13.0` for all 80 cases", f"- Successful responses: 80/80", f"- Input/output tokens: {result['runtime']['inputTokens']:,} / {result['runtime']['outputTokens']:,}", f"- Median latency: {result['runtime']['latencyMs']['median']:.1f} ms"])
    OUTPUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
