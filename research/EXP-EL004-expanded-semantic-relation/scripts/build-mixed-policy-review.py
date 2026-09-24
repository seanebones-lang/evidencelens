#!/usr/bin/env python3
"""Review original MIXED constructions under MIXED-POLICY-1.0.0."""

from __future__ import annotations

import hashlib
import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
EXP3 = ROOT.parent / "EXP-EL003-semantic-relation"
CANDIDATES = EXP3 / "development-mixed-candidates.json"
LEDGER = EXP3 / "development-mixed-ledger.json"
V1_RESULT = EXP3 / "JEV-PILOT-RESULT-001.json"
V2_RESULT = ROOT / "JEV-DEVELOPMENT-RESULT-001.json"
OUTPUT_JSON = ROOT / "MIXED-POLICY-REVIEW-001.json"
OUTPUT_MD = ROOT / "MIXED-POLICY-REVIEW-001.md"

EXPECTED = {
    CANDIDATES.name: "72f6f4778d758f9b12ddafcbc438f8db2a5e6442123a988a274e0be8b5022b90",
    LEDGER.name: "3439da73ee9d0b9badf9194339038e3c44cbae8c81208d05c430451b611c629e",
    V1_RESULT.name: "672543e9a5c9c0f5836fd0f7c17e1d990c41eb381b6f8dbbd03d156f7bd8a595",
    V2_RESULT.name: "e9571f60e796c14764dec52267be51f9a5643947a4c57a235577751f0e77b66a",
}

REVIEWS = {
    "EL003-DEV-MIX-001": ("SUPPORTED", "The evidence directly states both pH and dissolved-oxygen capability; subsequent oxygen-only experimentation is silence about validation breadth, not conflicting evidence."),
    "EL003-DEV-MIX-002": ("MIXED", "Mutation prevalence and clinical associations support diagnostic stratification, while the evidence measures no TKI-response outcome asserted by the compound claim; this is a material outcome mismatch."),
    "EL003-DEV-MIX-003": ("MIXED", "BMD and FRAX changes support effectiveness, while de novo fractures, hypocalcemia, UTI, rejection, and cardiovascular events directly qualify safety and fracture-prevention propositions."),
    "EL003-DEV-MIX-004": ("SUPPORTED", "The review states the necessity conclusion and supplies its embolism rationale. Lack of comparative evidence is an evidentiary-quality concern, not direct conflicting text."),
    "EL003-DEV-MIX-005": ("SUPPORTED", "The claim already includes endoleak-related instability and reintervention; high patency and the reported event pattern support rather than conflict with the bounded claim."),
    "EL003-DEV-MIX-006": ("SUPPORTED", "The evidence directly states that immunometabolism emerged as an attractive target. Knowledge gaps about one metabolic pathway do not conflict with that proposition."),
    "EL003-DEV-MIX-007": ("SUPPORTED", "The observed long-term BP and drug-burden changes are directly supported. Attrition and renal outcomes warrant caution but do not directly refute the cohort-bounded observation or establish procedure attribution."),
    "EL003-DEV-MIX-008": ("SUPPORTED", "The workflow identified candidates as claimed. Its narrow library and untested adaptation are limitations and missing validation, not direct conflicting evidence under this policy."),
    "EL003-DEV-MIX-009": ("MIXED", "Systematic review and GRADE support an evidence-based consensus, while explicit reliance on expert opinion for other management areas materially narrows the evidence-based proposition."),
    "EL003-DEV-MIX-010": ("SUPPORTED", "The reported group differences support the intervention outcome. The small regional sample limits generalization but does not directly conflict with the supplied claim."),
    "EL003-DEV-MIX-011": ("MIXED", "Urgent surgery, mortality, and survival support clinical importance, while the explicit single-institution retrospective cohort materially narrows the unbounded lifetime-management recommendation."),
    "EL003-DEV-MIX-012": ("SUPPORTED", "Drainage, seroma, infection, and operative-time results support several material propositions. Unreported lymph-node yield is missing coverage, not contradiction."),
    "EL003-DEV-MIX-013": ("SUPPORTED", "The system narrowed 161,000 candidates to a smaller pool with 32.1% eligibility. False positives qualify operational quality but remain compatible with a claim of enrichment and narrowing."),
    "EL003-DEV-MIX-014": ("SUPPORTED", "The evidence directly states interest, environmental benefit, and potential biomedical uses. Unspecified drawbacks and future prospects do not directly conflict with those bounded propositions."),
    "EL003-DEV-MIX-015": ("SUPPORTED", "The instrument's efficiency and correlation support feasibility and usefulness in AF/HF trials. The claim is already trial-scoped, so single-trial validation is not an additional conflict."),
    "EL003-DEV-MIX-016": ("INSUFFICIENT_EVIDENCE", "The case supports diagnostic concern but does not directly establish that early identification prevents cardiac complications; no opposing result establishes contradiction."),
    "EL003-DEV-MIX-017": ("SUPPORTED", "Autophagy disruption and impaired 3D and in-vivo growth support a new role and potential target. Preserved 2D growth is compatible with the explicitly tentative word 'potential'."),
    "EL003-DEV-MIX-018": ("SUPPORTED", "Metabolic effects and withdrawal reversibility are both stated in the claim and supported by the results; reversibility cannot also be counted as a conflict."),
    "EL003-DEV-MIX-019": ("SUPPORTED", "Expression, clinicopathological associations, and disease-free survival support the expressly hedged 'possible correlation'; sample size does not conflict with that bounded claim."),
    "EL003-DEV-MIX-020": ("SUPPORTED", "The evidence supports safety and feasibility in the studied protocol and explicitly calls for further research, exactly matching the claim's bounded conclusion."),
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    for path, expected in [(CANDIDATES, EXPECTED[CANDIDATES.name]), (LEDGER, EXPECTED[LEDGER.name]), (V1_RESULT, EXPECTED[V1_RESULT.name]), (V2_RESULT, EXPECTED[V2_RESULT.name])]:
        if sha256(path) != expected:
            raise ValueError(f"Frozen artifact hash mismatch: {path.name}")
    candidates = {row["caseId"]: row for row in json.loads(CANDIDATES.read_text(encoding="utf-8"))["cases"]}
    ledger = {row["caseId"]: row for row in json.loads(LEDGER.read_text(encoding="utf-8"))["authoringLedger"]}
    v1 = {row["caseId"]: row["predictedLabel"] for row in json.loads(V1_RESULT.read_text(encoding="utf-8"))["predictions"]}
    v2 = {row["caseId"]: row["v2Prediction"] for row in json.loads(V2_RESULT.read_text(encoding="utf-8"))["predictions"]}
    if set(candidates) != set(REVIEWS) or len(REVIEWS) != 20:
        raise ValueError("Policy review must cover all 20 original MIXED constructions")
    records = []
    for case_id in sorted(candidates):
        policy_label, rationale = REVIEWS[case_id]
        records.append({
            "caseId": case_id,
            "originalProvisionalReference": "MIXED",
            "policyReviewLabel": policy_label,
            "claim": candidates[case_id]["claim"],
            "originalConstructionBasis": ledger[case_id]["mixedBasis"],
            "policyRationale": rationale,
            "v1Prediction": v1[case_id],
            "v2Prediction": v2[case_id],
            "changesFrozenReference": False,
            "humanReviewRequired": True,
        })
    counts = Counter(row["policyReviewLabel"] for row in records)
    review = {
        "reviewVersion": "1.0.0",
        "status": "GPT_AUTHORED_POST_HOC_POLICY_REVIEW",
        "policy": "MIXED-POLICY-1.0.0.md",
        "humanReviewed": False,
        "changesFrozenReferences": False,
        "changesReportedMetrics": False,
        "sourceHashes": EXPECTED,
        "caseCount": 20,
        "policyLabelCounts": dict(sorted(counts.items())),
        "v1AgreementWithPolicyReview": sum(row["v1Prediction"] == row["policyReviewLabel"] for row in records) / 20,
        "v2AgreementWithPolicyReview": sum(row["v2Prediction"] == row["policyReviewLabel"] for row in records) / 20,
        "records": records,
    }
    OUTPUT_JSON.write_text(json.dumps(review, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = [
        "# EXP-EL004 mixed-policy review 001", "",
        "**Status:** GPT-authored post-hoc development review; human adjudication required", "",
        "## Boundary", "",
        "This review applies `MIXED-POLICY-1.0.0` to the 20 cases originally constructed as `MIXED`. It does not change their frozen provisional references, the EXP-EL003 score, or the EXP-EL004 score. Because GPT authored both the original constructions and this review, these labels are hypotheses—not corrected ground truth.", "",
        "## Result", "",
        f"- Retained as `MIXED`: {counts['MIXED']}/20",
        f"- Better characterized as `SUPPORTED`: {counts['SUPPORTED']}/20",
        f"- Better characterized as `INSUFFICIENT_EVIDENCE`: {counts['INSUFFICIENT_EVIDENCE']}/20",
        f"- v1 agreement with policy review: {review['v1AgreementWithPolicyReview']:.1%}",
        f"- v2 agreement with policy review: {review['v2AgreementWithPolicyReview']:.1%}", "",
        "The review suggests that the original development corpus severely overconstructed `MIXED`: only four cases clearly retain both direct support and a material conflicting or narrowing signal under the stricter policy. This explains why adding more qualification questions did not improve agreement with the old references.", "",
        "## Cases", "",
        "| Case | Original | Policy review | v1 | v2 |", "|---|---|---|---|---|",
    ]
    for row in records:
        lines.append(f"| `{row['caseId']}` | MIXED | **{row['policyReviewLabel']}** | {row['v1Prediction']} | {row['v2Prediction']} |")
    lines.extend(["", "## Rationale", ""])
    for row in records:
        lines.extend([f"### `{row['caseId']}` → `{row['policyReviewLabel']}`", "", f"- Original basis: {row['originalConstructionBasis']}", f"- Policy review: {row['policyRationale']}", ""])
    lines.extend(["## Consequence", "", "Do not tune another JEV prompt against the original 20 `MIXED` references. First construct new development cases that satisfy the strict two-condition policy by exact text, with missing-coverage flags represented separately. Only then freeze a simpler contract and a source-isolated holdout."])
    OUTPUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
