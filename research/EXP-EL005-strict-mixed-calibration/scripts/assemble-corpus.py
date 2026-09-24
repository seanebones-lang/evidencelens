#!/usr/bin/env python3

import hashlib
import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
EXP3 = ROOT.parent / "EXP-EL003-semantic-relation"


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


source = json.loads((EXP3 / "jev-pilot-input.json").read_text(encoding="utf-8"))["inputs"]
authored = json.loads((ROOT / "strict-mixed-authoring.json").read_text(encoding="utf-8"))["records"]
authored_by_parent = {row["parentCaseId"]: row for row in authored}
if len(authored) != 20 or len(authored_by_parent) != 20:
    raise ValueError("Expected 20 unique strict-mixed authoring records")

inputs = []
references = []
for case in source:
    original = case["caseId"]
    suffix = original.removeprefix("EL003-DEV-")
    case_id = f"EL005-DEV-{suffix}"
    label = "CONTRADICTED" if "-CON-" in original else "INSUFFICIENT_EVIDENCE" if "-IE-" in original else "MIXED" if "-MIX-" in original else "SUPPORTED"
    claim = authored_by_parent[original]["claim"] if label == "MIXED" else case["claim"]
    inputs.append({"caseId": case_id, "claim": claim, "evidence": case["evidence"], "domain": case["domain"]})
    references.append({"caseId": case_id, "provisionalReference": label})

counts = Counter(row["provisionalReference"] for row in references)
if len(inputs) != 80 or counts != Counter({label: 20 for label in ["SUPPORTED", "CONTRADICTED", "MIXED", "INSUFFICIENT_EVIDENCE"]}):
    raise ValueError("Calibration corpus must contain 80 cases balanced across four classes")

input_document = {
    "inputVersion": "1.0.0",
    "experiment": "EXP-EL005-strict-mixed-calibration",
    "caseCount": 80,
    "canonicalHash": f"sha256:{hashlib.sha256(canonical(inputs).encode()).hexdigest()}",
    "inputs": inputs,
}
reference_document = {
    "referenceVersion": "1.0.0",
    "referenceAuthority": "GPT_AUTHORED_PROVISIONAL_REFERENCE",
    "humanReviewed": False,
    "suitableAsGoldLabels": False,
    "caseCount": 80,
    "labelCounts": dict(sorted(counts.items())),
    "records": references,
}
(ROOT / "development-input.json").write_text(json.dumps(input_document, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
(ROOT / "development-reference.json").write_text(json.dumps(reference_document, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
