import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { validatePartitionIsolation, validateSemanticCases } from "@evidencelens/semantic-evaluation";
import { canonicalJson } from "@evidencelens/source-adapters";

const directory = new URL("../", import.meta.url);
const readJson = async (name) => JSON.parse(await readFile(new URL(name, directory), "utf8"));
const inputs = [
  {
    candidates: await readJson("development-supported-candidates.json"),
    ledger: (await readJson("development-authoring-ledger.json")).records,
  },
  {
    candidates: await readJson("development-contradicted-candidates.json"),
    ledger: (await readJson("development-contradicted-ledger.json")).authoringLedger,
  },
  {
    candidates: await readJson("development-mixed-candidates.json"),
    ledger: (await readJson("development-mixed-ledger.json")).authoringLedger,
  },
  {
    candidates: await readJson("development-insufficient-candidates.json"),
    ledger: (await readJson("development-insufficient-ledger.json")).authoringLedger,
  },
];

const cases = inputs.flatMap((input) => input.candidates.cases);
validateSemanticCases(cases);
validatePartitionIsolation(cases);

const referenceByCase = new Map();
for (const input of inputs) {
  const candidateIds = new Set(input.candidates.cases.map((testCase) => testCase.caseId));
  for (const record of input.ledger) {
    if (!candidateIds.has(record.caseId)) {
      throw new Error(`Authoring record ${record.caseId} has no candidate in its artifact`);
    }
    if (referenceByCase.has(record.caseId)) {
      throw new Error(`Duplicate provisional reference for ${record.caseId}`);
    }
    referenceByCase.set(record.caseId, record.intendedConstructionLabel);
  }
}

const records = cases.map((testCase) => {
  const provisionalReference = referenceByCase.get(testCase.caseId);
  if (!provisionalReference) throw new Error(`Missing provisional reference for ${testCase.caseId}`);
  return { caseId: testCase.caseId, provisionalReference };
}).sort((left, right) => left.caseId.localeCompare(right.caseId));

const labelCounts = records.reduce((counts, record) => {
  counts[record.provisionalReference] = (counts[record.provisionalReference] ?? 0) + 1;
  return counts;
}, {});
if (records.length !== 80 || Object.values(labelCounts).some((count) => count !== 20)) {
  throw new Error("Pilot reference must contain 80 records balanced 20 per construction target");
}

const candidateHash = `sha256:${createHash("sha256").update(canonicalJson(cases), "utf8").digest("hex")}`;
console.log(JSON.stringify({
  referenceVersion: "1.0.0",
  referenceAuthority: "GPT_AUTHORED_PROVISIONAL_REFERENCE",
  humanReviewed: false,
  independentlyAnnotated: false,
  adjudicated: false,
  suitableAsGoldLabels: false,
  frozenBeforeJevPrediction: true,
  candidateCanonicalHash: candidateHash,
  caseCount: records.length,
  labelCounts,
  records,
}, null, 2));
