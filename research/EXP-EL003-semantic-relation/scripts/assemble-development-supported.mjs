import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { validatePartitionIsolation, validateSemanticCases } from "@evidencelens/semantic-evaluation";

const root = new URL("../../../", import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const inputs = [
  {
    manifest: await readJson("research/EXP-EL002-source-coverage/batch-01.manifest.json"),
    report: await readJson("research/EXP-EL002-source-coverage/BATCH-01-REPORT.json"),
  },
  {
    manifest: await readJson("research/EXP-EL002-source-coverage/batch-02.manifest.json"),
    report: await readJson("research/EXP-EL002-source-coverage/BATCH-02-REPORT.json"),
  },
];

const candidates = inputs.flatMap(({ manifest, report }) => {
  const results = new Map(report.results.map((result) => [result.caseId, result]));
  return manifest.cases.filter((testCase) => testCase.operation === "VALID_PACKET").map((testCase) => {
    const result = results.get(testCase.caseId);
    if (!result?.passed || result.observedOutcome !== "PASS") {
      throw new Error(`${testCase.caseId} lacks a passing frozen packet result`);
    }
    return {
      sourceCaseId: testCase.caseId,
      pmcid: testCase.pmcid,
      verbatim: testCase.verbatim,
      fieldPath: testCase.fieldPath,
      packetId: result.details.packetId,
      packetHash: result.details.packetHash,
      spanId: result.details.spanId,
    };
  });
});

const selected = candidates.sort((left, right) => {
  const digest = (pmcid) => createHash("sha256").update(`DEVELOPMENT|${pmcid}`, "utf8").digest("hex");
  return digest(left.pmcid).localeCompare(digest(right.pmcid));
}).slice(0, 20);

const cases = selected.map((candidate, index) => ({
  caseId: `EL003-DEV-SUP-${String(index + 1).padStart(3, "0")}`,
  packetId: candidate.packetId,
  packetHash: candidate.packetHash,
  claim: candidate.verbatim,
  evidence: [{ spanId: candidate.spanId, verbatim: candidate.verbatim }],
  domain: "biomedical-literature",
  partition: "DEVELOPMENT",
  sourceGroupId: `pmcid_${candidate.pmcid}`,
  nearDuplicateGroupId: `natural_${candidate.sourceCaseId}`,
  origin: "NATURAL",
  excludedContextConfirmed: true,
}));

validateSemanticCases(cases);
validatePartitionIsolation(cases);

const ledger = selected.map((candidate, index) => ({
  caseId: cases[index].caseId,
  intendedConstructionLabel: "SUPPORTED",
  sourceCaseId: candidate.sourceCaseId,
  pmcid: candidate.pmcid,
  fieldPath: candidate.fieldPath,
  transformation: null,
  requiresHumanAuthorReview: true,
}));

console.log(JSON.stringify({
  selectionVersion: "1.0.0",
  selectionRule: "First 20 SHA-256 ordered DEVELOPMENT|PMCID records from EXP-EL002 batches 01 and 02",
  cases,
  authoringLedger: ledger,
}, null, 2));
