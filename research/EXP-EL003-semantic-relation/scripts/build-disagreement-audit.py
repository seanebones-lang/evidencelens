#!/usr/bin/env python3
"""Build the post-hoc GPT-authored disagreement audit without relabeling EXP-EL003."""

from __future__ import annotations

import hashlib
import json
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
INPUTS = ROOT / "jev-pilot-input.json"
RESULTS = ROOT / "JEV-PILOT-RESULT-001.json"
RESPONSES = ROOT / "jev-pilot-responses.jsonl"
LEDGER = ROOT / "development-mixed-ledger.json"
OUTPUT_JSON = ROOT / "JEV-PILOT-DISAGREEMENT-AUDIT-001.json"
OUTPUT_MD = ROOT / "JEV-PILOT-DISAGREEMENT-AUDIT-001.md"

EXPECTED_HASHES = {
    INPUTS.name: "f11e25ddef28c5ca965f1298faf7906dff57ff0e33b849abe2124c92bf0c9907",
    RESULTS.name: "672543e9a5c9c0f5836fd0f7c17e1d990c41eb381b6f8dbbd03d156f7bd8a595",
    RESPONSES.name: "611289733e13a595b0376396cadbef56ead602d22d4ea319f448dca5d76be0e1",
}

REVIEWS = {
    "EL003-DEV-CON-003": ("JEV_DECISION_ERROR", "The evidence explicitly says the study aims to investigate the factor that the negated claim says it does not investigate. The contradiction decision was a narrow 0.56 NO versus 0.44 YES."),
    "EL003-DEV-CON-007": ("PROVISIONAL_REFERENCE_WEAK", "The evidence says availability was impacted but does not state the direction of impact. It therefore does not directly contradict an increase; insufficient evidence is defensible under the frozen rubric."),
    "EL003-DEV-CON-014": ("JEV_DECISION_ERROR", "The evidence explicitly says the study assessed the impact that the negated claim says it did not assess. The contradiction decision was low-margin: 0.65 NO versus 0.35 YES."),
    "EL003-DEV-CON-020": ("JEV_DECISION_ERROR", "The evidence explicitly reports severe exertional dyspnea in the described patient, directly contradicting the negated claim. The contradiction decision was low-margin: 0.58 NO versus 0.42 YES."),
    "EL003-DEV-IE-016": ("JEV_DECISION_ERROR", "The evidence describes heart failure after earlier coronary and valve surgery, while the claim describes a recipient's later discharge and transplanted-heart status. Without an explicit shared timepoint and intervention, contradiction requires an unsupported temporal identity inference."),
    "EL003-DEV-MIX-001": ("PROVISIONAL_REFERENCE_WEAK", "The evidence directly repeats that fluorescence imaging can measure both pH and dissolved oxygen. The study's subsequent focus on oxygen does not negate or materially qualify that explicit general statement; absence of a pH experiment is not contradiction."),
    "EL003-DEV-MIX-002": ("JEV_DECISION_ERROR", "The evidence supports mutation prevalence and clinical associations but reports no observed TKI-response outcome. That outcome mismatch materially qualifies the compound claim, yet JEV selected NO for qualification."),
    "EL003-DEV-MIX-004": ("RUBRIC_BOUNDARY_AMBIGUITY", "The narrative case review supplies the rationale and directly states the necessity conclusion, but it does not establish comparative benefit or necessity. Whether study-design limits qualify an explicitly quoted conclusion is a genuine rubric boundary."),
    "EL003-DEV-MIX-006": ("PROVISIONAL_REFERENCE_WEAK", "The claim is that immunometabolism has emerged as an attractive target, which the evidence states directly. Knowledge gaps about glutamine metabolism in infectious disease do not directly contradict that emergence or attractiveness claim."),
    "EL003-DEV-MIX-008": ("JEV_DECISION_ERROR", "Two in-vitro candidates support identification, while a 187-compound library, cell-line testing, and no adaptation experiment materially limit the broader effectiveness and easy-adaptability propositions."),
    "EL003-DEV-MIX-009": ("JEV_DECISION_ERROR", "Systematic review and GRADE support the evidence-based component, while the explicit use of literature review and expert opinion for other management areas materially qualifies it. JEV recognized support but not the qualification."),
    "EL003-DEV-MIX-010": ("RUBRIC_BOUNDARY_AMBIGUITY", "The measured outcomes support effectiveness, but the broad intervention claim rests on 39 participants from four regional centers. Whether that design limitation alone constitutes a material population or causal qualification needs human adjudication."),
    "EL003-DEV-MIX-011": ("MAPPING_SENSITIVITY", "JEV detected qualification (YES) but assigned support to INSUFFICIENT_EVIDENCE by a narrow 0.56 to 0.43 margin. The frozen mapping converts that pair to insufficient evidence even though the response contains the second half of the intended mixed relation."),
    "EL003-DEV-MIX-013": ("JEV_DECISION_ERROR", "The reduced screening pool supports narrowing, while 32.1% accuracy and documented false positives materially qualify enrichment. JEV selected NO for qualification despite those explicit limitations."),
    "EL003-DEV-MIX-014": ("RUBRIC_BOUNDARY_AMBIGUITY", "The evidence directly repeats interest, environmental benefit, and potential biomedical uses, while mentioning drawbacks and difficulties without specifying that they negate those propositions. The materiality of that qualification is unresolved."),
    "EL003-DEV-MIX-015": ("RUBRIC_BOUNDARY_AMBIGUITY", "The trial supports feasibility and useful endpoint performance. Single-trial validation and recent-onset specificity may qualify generalization, but the claim is already limited to AF/HF prevention trials, making materiality judgment-dependent."),
    "EL003-DEV-MIX-016": ("PROVISIONAL_REFERENCE_WEAK", "The case supports diagnostic concern but does not directly establish that early identification prevents complications. The evidence is better characterized as incomplete for the full claim than as simultaneous support and contradiction."),
    "EL003-DEV-MIX-017": ("PROVISIONAL_REFERENCE_WEAK", "The evidence directly supports a new trafficking role and a potential therapeutic target. Preserved 2D growth does not negate impaired 3D and in-vivo growth, and 'potential' already limits the therapeutic proposition."),
    "EL003-DEV-MIX-018": ("PROVISIONAL_REFERENCE_WEAK", "Reversibility is explicitly part of the claim and is directly supported by withdrawal experiments. Treating that same stated reversibility as a contradiction double-counts a limitation already incorporated into the proposition."),
    "EL003-DEV-MIX-020": ("PROVISIONAL_REFERENCE_WEAK", "The claim is expressly limited to safety, feasibility, and the need for further research. Eleven participants and limited symptom effects constrain efficacy, but they do not contradict the bounded feasibility claim or its call for more research."),
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    for path in [INPUTS, RESULTS, RESPONSES]:
        if sha256(path) != EXPECTED_HASHES[path.name]:
            raise ValueError(f"Frozen artifact hash mismatch: {path.name}")

    inputs = {row["caseId"]: row for row in json.loads(INPUTS.read_text(encoding="utf-8"))["inputs"]}
    result = json.loads(RESULTS.read_text(encoding="utf-8"))
    responses = {row["caseId"]: row for row in (json.loads(line) for line in RESPONSES.read_text(encoding="utf-8").splitlines())}
    mixed_ledger = {row["caseId"]: row for row in json.loads(LEDGER.read_text(encoding="utf-8"))["authoringLedger"]}
    disagreements = {row["caseId"]: row for row in result["disagreements"]}
    if set(disagreements) != set(REVIEWS) or len(REVIEWS) != 20:
        raise ValueError("Review coverage must exactly match the 20 frozen disagreements")

    records: list[dict[str, Any]] = []
    for case_id in disagreements:
        disagreement = disagreements[case_id]
        response = responses[case_id]
        classification, rationale = REVIEWS[case_id]
        records.append({
            "caseId": case_id,
            "provisionalReference": disagreement["provisionalReference"],
            "predictedLabel": disagreement["predictedLabel"],
            "claim": inputs[case_id]["claim"],
            "evidence": inputs[case_id]["evidence"],
            "supportDecision": response["decisions"]["material_support"],
            "qualificationDecision": response["decisions"]["material_contradiction_or_qualification"],
            "originalConstructionBasis": mixed_ledger.get(case_id, {}).get("mixedBasis"),
            "auditClassification": classification,
            "auditRationale": rationale,
            "humanReviewRequired": True,
            "changesFrozenReference": False,
        })

    counts = Counter(row["auditClassification"] for row in records)
    audit = {
        "auditVersion": "1.0.0",
        "status": "GPT_AUTHORED_POST_HOC_DISAGREEMENT_AUDIT",
        "humanReviewed": False,
        "changesFrozenExperiment": False,
        "changesReportedMetrics": False,
        "purpose": "Generate testable hypotheses about disagreement sources before any v2 contract is designed.",
        "sourceHashes": EXPECTED_HASHES,
        "disagreementCount": len(records),
        "classificationCounts": dict(sorted(counts.items())),
        "records": records,
    }
    OUTPUT_JSON.write_text(json.dumps(audit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    labels = {
        "JEV_DECISION_ERROR": "Probable JEV decision error",
        "PROVISIONAL_REFERENCE_WEAK": "Weak provisional reference",
        "RUBRIC_BOUNDARY_AMBIGUITY": "Rubric-boundary ambiguity",
        "MAPPING_SENSITIVITY": "Mapping sensitivity",
    }
    lines = [
        "# EXP-EL003 JEV pilot disagreement audit 001",
        "",
        "**Status:** GPT-authored post-hoc audit; human review required",
        "",
        "## Integrity boundary",
        "",
        "This audit does not relabel EXP-EL003, change its frozen 75.0% result, or constitute independent adjudication. GPT performed both the original provisional construction and this post-hoc review. The classifications below are hypotheses for human review and v2 design, not corrected ground truth.",
        "",
        "## Audit result",
        "",
        "| Classification | Cases | Meaning |",
        "|---|---:|---|",
    ]
    meanings = {
        "JEV_DECISION_ERROR": "The supplied evidence appears to warrant a different atomic decision under the frozen rubric.",
        "PROVISIONAL_REFERENCE_WEAK": "The construction target appears to count absence, an already-bounded limitation, or a non-conflicting caveat as contradiction.",
        "RUBRIC_BOUNDARY_AMBIGUITY": "The result depends on whether study-design limitations materially qualify the precise claim.",
        "MAPPING_SENSITIVITY": "JEV detected one side of a mixed relation, but the frozen pair-to-label mapping discarded it.",
    }
    for key in ["JEV_DECISION_ERROR", "PROVISIONAL_REFERENCE_WEAK", "RUBRIC_BOUNDARY_AMBIGUITY", "MAPPING_SENSITIVITY"]:
        lines.append(f"| {labels[key]} | {counts[key]} | {meanings[key]} |")
    lines.extend([
        "",
        "## Main finding",
        "",
        "The errors are not attributable to JEV alone. Eight cases look like probable atomic-decision errors, but seven provisional references are themselves weak and four more sit on an unresolved rubric boundary. The apparent `MIXED` sensitivity problem is therefore partly a corpus-definition problem: the construction process often treated methodological limitations as direct contradiction even when the claim was already bounded or the limitation was merely absent evidence.",
        "",
        "A threshold change would not solve this cleanly. Several errors are low-margin, but others are confident and arise from semantic definitions. The next experiment should separate direct contradiction, scope mismatch, study-design limitation, and missing support into distinct typed decisions before mapping them to the four public labels.",
        "",
        "## Case audit",
        "",
    ])
    for index, row in enumerate(records, 1):
        support = row["supportDecision"]
        qualification = row["qualificationDecision"]
        lines.extend([
            f"### {index}. `{row['caseId']}`",
            "",
            f"- Frozen comparison: `{row['provisionalReference']}` → `{row['predictedLabel']}`",
            f"- Audit classification: **{labels[row['auditClassification']]}**",
            f"- Support: `{support['choice']}` (confidence {support['confidence']:.2f}; YES {support['probabilities']['YES']:.2f}, NO {support['probabilities']['NO']:.2f}, insufficient {support['probabilities']['INSUFFICIENT_EVIDENCE']:.2f})",
            f"- Contradiction/qualification: `{qualification['choice']}` (confidence {qualification['confidence']:.2f}; YES {qualification['probabilities']['YES']:.2f}, NO {qualification['probabilities']['NO']:.2f}, insufficient {qualification['probabilities']['INSUFFICIENT_EVIDENCE']:.2f})",
            f"- Claim: {row['claim']}",
        ])
        if row["originalConstructionBasis"]:
            lines.append(f"- Original construction basis: {row['originalConstructionBasis']}")
        lines.extend([f"- Audit rationale: {row['auditRationale']}", ""])
    lines.extend([
        "## Consequence for v2",
        "",
        "Freeze four independent atomic questions: direct support, direct contradiction, explicit scope/population/outcome mismatch, and explicit study-design limitation. Do not let absent evidence count as contradiction. Define whether methodological limitations qualify a claim based on the claim's exact scope, and preserve each atomic probability before applying a preregistered mapping. Develop on EXP-EL003 only; evaluate the resulting contract once on a new, source-isolated holdout.",
    ])
    OUTPUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
