#!/usr/bin/env python3
"""Score frozen JEV responses against GPT-authored provisional references."""

from __future__ import annotations

import hashlib
import json
import math
import statistics
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
RESPONSES = ROOT / "jev-pilot-responses.jsonl"
REFERENCES = ROOT / "development-pilot-reference.json"
RESULT = ROOT / "JEV-PILOT-RESULT-001.json"
REPORT = ROOT / "JEV-PILOT-REPORT-001.md"
EXPECTED_RESPONSE_SHA256 = "611289733e13a595b0376396cadbef56ead602d22d4ea319f448dca5d76be0e1"
EXPECTED_REFERENCE_SHA256 = "6131e23692da440a862c5080ef72c66117c3299b7d85118dc9becf7afa956a51"
LABELS = ["SUPPORTED", "CONTRADICTED", "MIXED", "INSUFFICIENT_EVIDENCE"]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def mapped_label(row: dict[str, Any]) -> str:
    support = row["decisions"]["material_support"]["choice"]
    contradiction = row["decisions"]["material_contradiction_or_qualification"]["choice"]
    if support == "YES" and contradiction == "YES":
        return "MIXED"
    if support == "YES" and contradiction == "NO":
        return "SUPPORTED"
    if support == "NO" and contradiction == "YES":
        return "CONTRADICTED"
    return "INSUFFICIENT_EVIDENCE"


def percentile(values: list[float], quantile: float) -> float:
    ordered = sorted(values)
    index = math.ceil(quantile * len(ordered)) - 1
    return ordered[max(0, index)]


def main() -> None:
    if sha256(RESPONSES) != EXPECTED_RESPONSE_SHA256:
        raise ValueError("Raw response SHA-256 differs from the frozen run")
    if sha256(REFERENCES) != EXPECTED_REFERENCE_SHA256:
        raise ValueError("Provisional-reference SHA-256 differs from the pilot freeze")

    rows = [json.loads(line) for line in RESPONSES.read_text(encoding="utf-8").splitlines() if line]
    reference_document = json.loads(REFERENCES.read_text(encoding="utf-8"))
    references = {row["caseId"]: row["provisionalReference"] for row in reference_document["records"]}
    if len(rows) != 80 or len({row["caseId"] for row in rows}) != 80:
        raise ValueError("Expected 80 unique response records")
    if set(references) != {row["caseId"] for row in rows}:
        raise ValueError("Response and provisional-reference case IDs differ")
    if any(row["status"] != "SUCCESS" for row in rows):
        raise ValueError("Cannot score a run containing integration errors")

    matrix = {reference: {prediction: 0 for prediction in LABELS} for reference in LABELS}
    disagreements: list[dict[str, Any]] = []
    predictions: list[dict[str, Any]] = []
    for row in rows:
        predicted = mapped_label(row)
        reference = references[row["caseId"]]
        matrix[reference][predicted] += 1
        prediction = {
            "caseId": row["caseId"],
            "provisionalReference": reference,
            "predictedLabel": predicted,
            "supportAnswer": row["decisions"]["material_support"]["choice"],
            "contradictionAnswer": row["decisions"]["material_contradiction_or_qualification"]["choice"],
            "supportConfidence": row["decisions"]["material_support"]["confidence"],
            "contradictionConfidence": row["decisions"]["material_contradiction_or_qualification"]["confidence"],
        }
        predictions.append(prediction)
        if predicted != reference:
            disagreements.append(prediction)

    per_class: dict[str, dict[str, float | int]] = {}
    for label in LABELS:
        true_positive = matrix[label][label]
        false_positive = sum(matrix[other][label] for other in LABELS if other != label)
        false_negative = sum(matrix[label][other] for other in LABELS if other != label)
        precision = true_positive / (true_positive + false_positive) if true_positive + false_positive else 0
        recall = true_positive / (true_positive + false_negative) if true_positive + false_negative else 0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0
        per_class[label] = {
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "support": sum(matrix[label].values()),
        }

    correct = sum(matrix[label][label] for label in LABELS)
    abstentions = sum(matrix[reference]["INSUFFICIENT_EVIDENCE"] for reference in LABELS)
    critical_population = sum(sum(matrix[label].values()) for label in ["CONTRADICTED", "MIXED"])
    false_reassurance = sum(matrix[label]["SUPPORTED"] for label in ["CONTRADICTED", "MIXED"])
    latencies = [row["latencyMs"] for row in rows]
    models = Counter(row["resolvedModel"] for row in rows)
    attempts = Counter(row["attempts"] for row in rows)

    result = {
        "resultVersion": "1.0.0",
        "experiment": "EXP-EL003-semantic-relation",
        "evaluationStatus": "EXPLORATORY_GPT_AUTHORED_PROVISIONAL_REFERENCE",
        "humanReviewed": False,
        "independentlyAnnotated": False,
        "adjudicated": False,
        "suitableAsGoldLabels": False,
        "interpretationBoundary": (
            "Measures compatibility with GPT-authored construction assumptions; does not establish "
            "human agreement, scientific correctness, or clinical validity."
        ),
        "artifacts": {
            "rawResponseFile": RESPONSES.name,
            "rawResponseSha256": EXPECTED_RESPONSE_SHA256,
            "provisionalReferenceFile": REFERENCES.name,
            "provisionalReferenceSha256": EXPECTED_REFERENCE_SHA256,
            "inputSha256": "f11e25ddef28c5ca965f1298faf7906dff57ff0e33b849abe2124c92bf0c9907",
            "runnerSha256": "cde46b51f30991e50ebe815d7850fb99b71e95689636c25c336c544549828a7c",
            "questionsCanonicalHash": "sha256:a941079865d3bf01ccbbed4c377d23061a933c4e0b9c25c9cd938ef4ae7fc5c4",
        },
        "runtime": {
            "modelAlias": "jev-latest",
            "resolvedModels": dict(models),
            "pythonVersion": "3.12.14",
            "typesafeSdkVersion": "0.7.0",
            "proxyTransportDependency": "socksio==1.0.0",
            "caseCount": len(rows),
            "successCount": len(rows),
            "errorCount": 0,
            "attemptCounts": {str(key): value for key, value in sorted(attempts.items())},
            "inputTokens": sum(row["usage"]["input_tokens"] for row in rows),
            "outputTokens": sum(row["usage"]["output_tokens"] for row in rows),
            "latencyMs": {
                "mean": statistics.mean(latencies),
                "median": statistics.median(latencies),
                "p95": percentile(latencies, 0.95),
                "minimum": min(latencies),
                "maximum": max(latencies),
            },
            "firstCompletedAt": min(row["completedAt"] for row in rows),
            "lastCompletedAt": max(row["completedAt"] for row in rows),
        },
        "metrics": {
            "accuracy": correct / len(rows),
            "macroF1": statistics.mean(per_class[label]["f1"] for label in LABELS),
            "abstentionRate": abstentions / len(rows),
            "nonAbstentionCoverage": 1 - abstentions / len(rows),
            "criticalFalseReassuranceCount": false_reassurance,
            "criticalFalseReassuranceRate": false_reassurance / critical_population,
            "confusionMatrix": matrix,
            "perClass": per_class,
        },
        "disagreementCount": len(disagreements),
        "disagreements": disagreements,
        "predictions": predictions,
    }
    RESULT.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    metrics = result["metrics"]
    runtime = result["runtime"]
    lines = [
        "# EXP-EL003 JEV pilot report 001",
        "",
        "**Status:** Complete exploratory pilot",
        "",
        "## Disclosure",
        "",
        "GPT authored the cases and the `GPT_AUTHORED_PROVISIONAL_REFERENCE` labels. No human independently annotated or adjudicated them. JEV did not author, select, or label the cases before the frozen run. These results measure compatibility with the GPT-authored construction assumptions; they are not gold-label accuracy, human agreement, scientific correctness, or clinical validity.",
        "",
        "## Result",
        "",
        f"- Cases completed: {runtime['successCount']}/80",
        f"- Resolved model: `jev-1.13.0`",
        f"- Accuracy against provisional references: {metrics['accuracy']:.1%}",
        f"- Macro F1: {metrics['macroF1']:.3f}",
        f"- Abstention rate: {metrics['abstentionRate']:.1%}",
        f"- Critical false reassurance: {metrics['criticalFalseReassuranceCount']}/40 ({metrics['criticalFalseReassuranceRate']:.1%})",
        f"- Integration errors: {runtime['errorCount']}",
        f"- Retries: {sum(count for attempt, count in attempts.items() if attempt > 1)} cases required more than one attempt",
        "",
        "## Confusion matrix",
        "",
        "Rows are GPT-authored provisional references; columns are JEV-derived labels.",
        "",
        "| Reference \\ Prediction | Supported | Contradicted | Mixed | Insufficient |",
        "|---|---:|---:|---:|---:|",
    ]
    for label in LABELS:
        display = label.replace("_", " ").title()
        row = matrix[label]
        lines.append(f"| {display} | {row['SUPPORTED']} | {row['CONTRADICTED']} | {row['MIXED']} | {row['INSUFFICIENT_EVIDENCE']} |")
    lines.extend(["", "## Per-class metrics", "", "| Class | Precision | Recall | F1 | N |", "|---|---:|---:|---:|---:|"])
    for label in LABELS:
        item = per_class[label]
        lines.append(f"| {label.replace('_', ' ').title()} | {item['precision']:.3f} | {item['recall']:.3f} | {item['f1']:.3f} | {item['support']} |")
    lines.extend([
        "",
        "## Primary finding",
        "",
        "JEV matched every provisional `SUPPORTED` case and 19/20 provisional `INSUFFICIENT_EVIDENCE` cases. The dominant weakness was `MIXED`: only 5/20 matched, while 12/20 were reduced to `SUPPORTED` and 3/20 to `INSUFFICIENT_EVIDENCE`. This produced all 12 critical false-reassurance events. The pilot therefore shows strong signal on single-direction relationships but a material sensitivity problem for simultaneous support and qualification under this two-decision contract.",
        "",
        "## Runtime evidence",
        "",
        f"- Raw response SHA-256: `{EXPECTED_RESPONSE_SHA256}`",
        f"- Mean latency: {runtime['latencyMs']['mean']:.1f} ms",
        f"- Median latency: {runtime['latencyMs']['median']:.1f} ms",
        f"- P95 latency: {runtime['latencyMs']['p95']:.1f} ms",
        f"- Input/output tokens: {runtime['inputTokens']:,} / {runtime['outputTokens']:,}",
        "- All 80 responses resolved to `jev-1.13.0`, returned HTTP 200, and succeeded on the first attempt.",
        "",
        "## Interpretation",
        "",
        "The outcome is interesting enough to justify targeted review and, if warranted, a confirmatory corpus with independent human annotation. It does not satisfy the original human-label promotion gates. Disagreements should be inspected as potential rubric, construction, mapping, or model errors rather than automatically attributed to JEV.",
    ])
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
