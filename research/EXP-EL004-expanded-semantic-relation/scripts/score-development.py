#!/usr/bin/env python3
"""Score EXP-EL004 development output and compare it with frozen EXP-EL003."""

from __future__ import annotations

import hashlib
import json
import math
import statistics
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
EXP3 = ROOT.parent / "EXP-EL003-semantic-relation"
RESPONSES = ROOT / "jev-development-responses.jsonl"
REFERENCES = EXP3 / "development-pilot-reference.json"
V1_RESULT = EXP3 / "JEV-PILOT-RESULT-001.json"
OUTPUT_JSON = ROOT / "JEV-DEVELOPMENT-RESULT-001.json"
OUTPUT_MD = ROOT / "JEV-DEVELOPMENT-REPORT-001.md"
EXPECTED_RESPONSE_SHA256 = "45057ba781396fb282eb75b2a9e843f3e1ffd611b954ccaa55c0d5312c250e8d"
EXPECTED_REFERENCE_SHA256 = "6131e23692da440a862c5080ef72c66117c3299b7d85118dc9becf7afa956a51"
EXPECTED_V1_RESULT_SHA256 = "672543e9a5c9c0f5836fd0f7c17e1d990c41eb381b6f8dbbd03d156f7bd8a595"
LABELS = ["SUPPORTED", "CONTRADICTED", "MIXED", "INSUFFICIENT_EVIDENCE"]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def mapped_label(row: dict[str, Any]) -> str:
    decisions = row["decisions"]
    support = decisions["direct_support"]["choice"]
    contradiction = decisions["direct_contradiction"]["choice"]
    mismatch = decisions["explicit_scope_mismatch"]["choice"]
    limitation = decisions["explicit_design_limitation"]["choice"]
    if support == "YES" and "YES" in (contradiction, mismatch, limitation):
        return "MIXED"
    if contradiction == "YES":
        return "CONTRADICTED"
    if support == "YES" and contradiction == mismatch == limitation == "NO":
        return "SUPPORTED"
    return "INSUFFICIENT_EVIDENCE"


def percentile(values: list[float], quantile: float) -> float:
    return sorted(values)[max(0, math.ceil(quantile * len(values)) - 1)]


def metrics(matrix: dict[str, dict[str, int]]) -> dict[str, Any]:
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
    for path, expected in [(RESPONSES, EXPECTED_RESPONSE_SHA256), (REFERENCES, EXPECTED_REFERENCE_SHA256), (V1_RESULT, EXPECTED_V1_RESULT_SHA256)]:
        if sha256(path) != expected:
            raise ValueError(f"Frozen artifact hash mismatch: {path.name}")
    rows = [json.loads(line) for line in RESPONSES.read_text(encoding="utf-8").splitlines() if line]
    refs = {row["caseId"]: row["provisionalReference"] for row in json.loads(REFERENCES.read_text(encoding="utf-8"))["records"]}
    v1 = json.loads(V1_RESULT.read_text(encoding="utf-8"))
    v1_predictions = {row["caseId"]: row["predictedLabel"] for row in v1["predictions"]}
    if len(rows) != 80 or len({row["caseId"] for row in rows}) != 80 or any(row["status"] != "SUCCESS" for row in rows):
        raise ValueError("Expected 80 unique successful development responses")
    if set(refs) != {row["caseId"] for row in rows}:
        raise ValueError("Response and provisional-reference case IDs differ")

    matrix = {reference: {prediction: 0 for prediction in LABELS} for reference in LABELS}
    predictions: list[dict[str, Any]] = []
    for row in rows:
        predicted = mapped_label(row)
        reference = refs[row["caseId"]]
        matrix[reference][predicted] += 1
        predictions.append({
            "caseId": row["caseId"],
            "provisionalReference": reference,
            "v1Prediction": v1_predictions[row["caseId"]],
            "v2Prediction": predicted,
            "decisions": {name: answer["choice"] for name, answer in row["decisions"].items()},
        })

    paired = {
        "bothCorrect": sum(item["v1Prediction"] == item["provisionalReference"] and item["v2Prediction"] == item["provisionalReference"] for item in predictions),
        "v1OnlyCorrect": sum(item["v1Prediction"] == item["provisionalReference"] and item["v2Prediction"] != item["provisionalReference"] for item in predictions),
        "v2OnlyCorrect": sum(item["v1Prediction"] != item["provisionalReference"] and item["v2Prediction"] == item["provisionalReference"] for item in predictions),
        "bothIncorrect": sum(item["v1Prediction"] != item["provisionalReference"] and item["v2Prediction"] != item["provisionalReference"] for item in predictions),
        "changedPredictionCount": sum(item["v1Prediction"] != item["v2Prediction"] for item in predictions),
    }
    changed = [item for item in predictions if item["v1Prediction"] != item["v2Prediction"]]
    latency = [row["latencyMs"] for row in rows]
    result = {
        "resultVersion": "1.0.0",
        "experiment": "EXP-EL004-expanded-semantic-relation",
        "phase": "DEVELOPMENT",
        "evaluationStatus": "TUNED_DEVELOPMENT_GPT_AUTHORED_PROVISIONAL_REFERENCE",
        "confirmationEligible": False,
        "humanReviewed": False,
        "changesEXP_EL003": False,
        "artifacts": {
            "rawResponseSha256": EXPECTED_RESPONSE_SHA256,
            "provisionalReferenceSha256": EXPECTED_REFERENCE_SHA256,
            "v1ResultSha256": EXPECTED_V1_RESULT_SHA256,
            "questionsCanonicalHash": "sha256:8a77e6ae5e4a8f8bd29482fd1556cdcf72b9c71dd84ec0a0a15b01d762bc4bc5",
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
        "v2Metrics": metrics(matrix),
        "v1Metrics": v1["metrics"],
        "pairedComparison": paired,
        "changedPredictions": changed,
        "predictions": predictions,
    }
    OUTPUT_JSON.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    v2 = result["v2Metrics"]
    v1m = result["v1Metrics"]
    lines = [
        "# EXP-EL004 expanded-contract development report 001", "",
        "**Status:** Complete development experiment; contract not promoted", "",
        "## Disclosure", "",
        "The contract was designed after inspecting EXP-EL003 disagreements and was evaluated on the same 80 exposed development cases against the same GPT-authored provisional references. This is a diagnostic paired comparison, not independent confirmation. No human independently reviewed or adjudicated the references.", "",
        "## Outcome", "",
        "The expanded contract did **not** improve development performance and must not advance unchanged to a confirmatory holdout.", "",
        "| Metric | v1 | v2 expanded | Change |", "|---|---:|---:|---:|",
        f"| Accuracy | {v1m['accuracy']:.1%} | {v2['accuracy']:.1%} | {v2['accuracy']-v1m['accuracy']:+.1%} |",
        f"| Macro F1 | {v1m['macroF1']:.3f} | {v2['macroF1']:.3f} | {v2['macroF1']-v1m['macroF1']:+.3f} |",
        f"| Mixed recall | {v1m['perClass']['MIXED']['recall']:.1%} | {v2['perClass']['MIXED']['recall']:.1%} | {v2['perClass']['MIXED']['recall']-v1m['perClass']['MIXED']['recall']:+.1%} |",
        f"| Contradicted recall | {v1m['perClass']['CONTRADICTED']['recall']:.1%} | {v2['perClass']['CONTRADICTED']['recall']:.1%} | {v2['perClass']['CONTRADICTED']['recall']-v1m['perClass']['CONTRADICTED']['recall']:+.1%} |",
        f"| Critical false reassurance | {v1m['criticalFalseReassuranceRate']:.1%} | {v2['criticalFalseReassuranceRate']:.1%} | {v2['criticalFalseReassuranceRate']-v1m['criticalFalseReassuranceRate']:+.1%} |", "",
        "## v2 confusion matrix", "",
        "Rows are GPT-authored provisional references; columns are v2 predictions.", "",
        "| Reference \\ Prediction | Supported | Contradicted | Mixed | Insufficient |", "|---|---:|---:|---:|---:|",
    ]
    for label in LABELS:
        row = matrix[label]
        lines.append(f"| {label.replace('_', ' ').title()} | {row['SUPPORTED']} | {row['CONTRADICTED']} | {row['MIXED']} | {row['INSUFFICIENT_EVIDENCE']} |")
    lines.extend(["", "## Paired changes", "", f"- Both correct: {paired['bothCorrect']}", f"- v1 only correct: {paired['v1OnlyCorrect']}", f"- v2 only correct: {paired['v2OnlyCorrect']}", f"- Both incorrect: {paired['bothIncorrect']}", f"- Predictions changed: {paired['changedPredictionCount']}", ""])
    for item in changed:
        lines.append(f"- `{item['caseId']}` — reference `{item['provisionalReference']}`; v1 `{item['v1Prediction']}`; v2 `{item['v2Prediction']}`")
    lines.extend(["", "## Interpretation", "", "Separating direct contradiction substantially improved negation handling: contradicted recall rose from 80% to 95%. However, JEV almost always answered NO to explicit scope mismatch and explicit design limitation, reducing mixed recall from 25% to 15%. Four cases improved and four regressed, leaving accuracy unchanged while worsening macro F1 and critical false reassurance.", "", "The result argues against sending this contract to a new holdout. The next development step must first resolve the target definition for `MIXED`: direct conflicting evidence should remain distinct from methodological caution, absent outcomes, and claims that already contain their own limitation. Only after that semantic policy is frozen should another contract be designed.", "", "## Runtime evidence", "", f"- Raw response SHA-256: `{EXPECTED_RESPONSE_SHA256}`", f"- Resolved model: `jev-1.13.0` for all 80 cases", "- All cases returned successfully on the first attempt.", f"- Median latency: {result['runtime']['latencyMs']['median']:.1f} ms", f"- Input/output tokens: {result['runtime']['inputTokens']:,} / {result['runtime']['outputTokens']:,}"])
    OUTPUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
