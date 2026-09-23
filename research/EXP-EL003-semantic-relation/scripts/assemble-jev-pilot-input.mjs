import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { validatePartitionIsolation, validateSemanticCases } from "@evidencelens/semantic-evaluation";
import { canonicalJson } from "@evidencelens/source-adapters";

const directory = new URL("../", import.meta.url);
const readJson = async (name) => JSON.parse(await readFile(new URL(name, directory), "utf8"));
const cases = (await Promise.all([
  readJson("development-supported-candidates.json"),
  readJson("development-contradicted-candidates.json"),
  readJson("development-mixed-candidates.json"),
  readJson("development-insufficient-candidates.json"),
])).flatMap((artifact) => artifact.cases);

validateSemanticCases(cases);
validatePartitionIsolation(cases);

const inputs = cases.map((testCase) => ({
  caseId: testCase.caseId,
  claim: testCase.claim,
  evidence: testCase.evidence.map((span) => ({
    verbatim: span.verbatim,
    ...(span.section ? { section: span.section } : {}),
  })),
  domain: testCase.domain,
})).sort((left, right) => left.caseId.localeCompare(right.caseId));

if (inputs.length !== 80 || new Set(inputs.map((input) => input.caseId)).size !== 80) {
  throw new Error("JEV pilot input must contain 80 unique development cases");
}
const forbidden = [
  "packetId", "packetHash", "partition", "sourceGroupId", "nearDuplicateGroupId",
  "origin", "excludedContextConfirmed", "intendedConstructionLabel", "provisionalReference",
];
const encoded = canonicalJson(inputs);
for (const key of forbidden) {
  if (encoded.includes(`\"${key}\"`)) throw new Error(`JEV pilot input leaked ${key}`);
}

console.log(JSON.stringify({
  inputVersion: "1.0.0",
  decisionContract: "JEV-PILOT-DECISION-CONTRACT.md",
  caseCount: inputs.length,
  canonicalHash: `sha256:${createHash("sha256").update(encoded, "utf8").digest("hex")}`,
  inputs,
}, null, 2));
