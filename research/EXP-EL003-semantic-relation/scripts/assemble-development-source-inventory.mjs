import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { extractPmcAddressableParagraphs } from "@evidencelens/deterministic-checks";
import { PmcFullTextAdapter } from "@evidencelens/source-adapters";

const root = new URL("../../../", import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const manifests = await Promise.all([
  readJson("research/EXP-EL002-source-coverage/batch-01.manifest.json"),
  readJson("research/EXP-EL002-source-coverage/batch-02.manifest.json"),
]);
const supported = await readJson(
  "research/EXP-EL003-semantic-relation/development-supported-candidates.json",
);

const sourceByPmcid = new Map(
  manifests.flatMap((manifest) => manifest.sources).map((source) => [source.pmcid, source]),
);
const caseByPmcid = new Map(
  manifests.flatMap((manifest) => manifest.cases)
    .filter((testCase) => testCase.operation === "VALID_PACKET")
    .map((testCase) => [testCase.pmcid, testCase]),
);
const usedPmcids = new Set(
  supported.cases.map((testCase) => testCase.sourceGroupId.replace(/^pmcid_/, "")),
);
const digest = (pmcid) => createHash("sha256")
  .update(`DEVELOPMENT|${pmcid}`, "utf8")
  .digest("hex");
const remaining = [...caseByPmcid.values()]
  .filter((testCase) => !usedPmcids.has(testCase.pmcid))
  .sort((left, right) => digest(left.pmcid).localeCompare(digest(right.pmcid)));

if (sourceByPmcid.size !== 52 || usedPmcids.size !== 20 || remaining.length !== 32) {
  throw new Error("Development source allocation differs from the frozen 52/20/32 plan");
}

const adapter = new PmcFullTextAdapter({
  tool: "evidencelens-exp-el003-authoring",
  now: () => new Date("2026-09-23T00:00:00.000Z"),
});
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const inventory = [];

for (const [index, testCase] of remaining.entries()) {
  const expected = sourceByPmcid.get(testCase.pmcid);
  const resolved = await adapter.resolve(testCase.pmcid);
  const observed = {
    pmcid: resolved.artifact.identifiers.pmcid,
    pmid: resolved.artifact.identifiers.pmid,
    doi: resolved.artifact.identifiers.doi,
    version: resolved.artifact.version,
    license: resolved.artifact.license,
    contentHash: resolved.artifact.contentHash,
  };
  for (const field of Object.keys(observed)) {
    if (observed[field] !== expected[field]) {
      throw new Error(
        `${testCase.pmcid} ${field} drifted: observed ${observed[field]}, expected ${expected[field]}`,
      );
    }
  }
  const abstractParagraphs = extractPmcAddressableParagraphs(resolved.snapshot)
    .filter((paragraph) => paragraph.fieldPath.includes("/abstract"));
  if (abstractParagraphs.length === 0) {
    throw new Error(`${testCase.pmcid} exposes no addressable abstract paragraphs`);
  }
  inventory.push({
    allocationRank: index + 21,
    plannedCaseCount: index < 8 ? 2 : 1,
    sourceCaseId: testCase.caseId,
    pmcid: testCase.pmcid,
    pmid: expected.pmid,
    doi: expected.doi,
    license: expected.license,
    contentHash: expected.contentHash,
    selectionDigest: digest(testCase.pmcid),
    abstractParagraphs,
  });
  if (index < remaining.length - 1) await wait(400);
}

if (inventory.reduce((sum, source) => sum + source.plannedCaseCount, 0) !== 40) {
  throw new Error("Remaining source allocation must produce exactly 40 cases");
}

console.log(JSON.stringify({
  inventoryVersion: "1.0.0",
  partition: "DEVELOPMENT",
  selectionRule: "Unused sources in SHA-256 order over DEVELOPMENT|PMCID; first eight receive two cases",
  sourceCount: inventory.length,
  plannedCaseCount: 40,
  sources: inventory,
}, null, 2));
