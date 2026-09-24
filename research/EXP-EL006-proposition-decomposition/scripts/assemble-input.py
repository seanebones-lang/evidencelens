#!/usr/bin/env python3

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
EXP5 = ROOT.parent / "EXP-EL005-strict-mixed-calibration"


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


source = json.loads((EXP5 / "development-input.json").read_text(encoding="utf-8"))["inputs"]
mixed = {row["caseId"].replace("EL005-", "EL006-"): row for row in source if "-MIX-" in row["caseId"]}
propositions = json.loads((ROOT / "propositions.json").read_text(encoding="utf-8"))["records"]
if len(mixed) != 20 or len(propositions) != 20 or set(mixed) != {row["caseId"] for row in propositions}:
    raise ValueError("Expected matching 20-case proposition decomposition")

inputs = []
for record in propositions:
    source_case = mixed[record["caseId"]]
    inputs.append({
        "caseId": record["caseId"],
        "claim": source_case["claim"],
        "supportedProposition": record["supportedProposition"],
        "contradictedProposition": record["contradictedProposition"],
        "evidence": source_case["evidence"],
        "domain": source_case["domain"],
    })

document = {
    "inputVersion": "1.0.0",
    "experiment": "EXP-EL006-proposition-decomposition",
    "caseCount": 20,
    "canonicalHash": f"sha256:{hashlib.sha256(canonical(inputs).encode()).hexdigest()}",
    "inputs": inputs,
}
(ROOT / "development-input.json").write_text(json.dumps(document, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
