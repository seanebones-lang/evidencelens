import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

import { extractPmcAddressableParagraphs } from "@evidencelens/deterministic-checks";
import { PmcFullTextAdapter } from "@evidencelens/source-adapters";

const poolBytes = await readFile(new URL("../candidate-pools-02-05.json", import.meta.url));
const poolHash = createHash("sha256").update(poolBytes).digest("hex");
if (poolHash !== "e7559e28ab62720535aa94abe2ba25d4ad41c88625909e10056d17765ff3dcce") {
  throw new Error("Frozen candidate pool file hash differs");
}
const requestedPartition = process.argv.find((argument) => argument.startsWith("--partition="))?.slice("--partition=".length);
const pool = JSON.parse(poolBytes.toString("utf8")).pools.find((item) => item.partition === requestedPartition);
if (!pool) throw new Error("A frozen --partition from candidate-pools-02-05.json is required");
const batchNumber = Number(requestedPartition.slice(-2));
const candidateIds = pool.candidateIds;
const existing = new Set();
for (const file of [
  "../../EXP-EL001-packet-validity/development.manifest.json",
  "../../EXP-EL001-packet-validity/blind-holdout.manifest.json",
  "../../EXP-EL001-packet-validity/transfer.manifest.json",
  "../batch-01.manifest.json"
]) {
  const manifest = JSON.parse(await readFile(new URL(file, import.meta.url), "utf8"));
  for (const source of manifest.sources) existing.add(source.pmcid);
}

for (let earlier = 2; earlier < batchNumber; earlier += 1) {
  const manifest = JSON.parse(await readFile(new URL(`../batch-${String(earlier).padStart(2,"0")}.manifest.json`, import.meta.url), "utf8"));
  for (const source of manifest.sources) existing.add(source.pmcid);
}
const output = new URL(`../batch-${String(batchNumber).padStart(2,"0")}.manifest.json`, import.meta.url);
const adapter = new PmcFullTextAdapter({ tool: "evidencelens-exp-el002" });
const sources = [];
const cases = [];
const exclusions = [];
const splitSentences = (text) => text.split(/(?<=[。！？])|(?<=[.!?])\s+(?=[A-Z])/u)
  .map((sentence) => sentence.trim())
  .filter((sentence) => sentence.length >= 55 && sentence.length <= 500);
for (const numericId of candidateIds) {
  if (sources.length === 26) break;
  const pmcid = `PMC${numericId}`;
  if (existing.has(pmcid)) {
    exclusions.push({ pmcid, reason: "PREVIOUSLY_USED" });
    continue;
  }
  try {
    const resolved = await adapter.resolve(pmcid);
    const { artifact, snapshot } = resolved;
    if (!artifact.identifiers.pmid || !artifact.identifiers.doi || artifact.version === "PMC_VERSION_UNKNOWN") {
      exclusions.push({ pmcid, reason: "MISSING_REQUIRED_METADATA" });
      continue;
    }
    const paragraph = extractPmcAddressableParagraphs(snapshot)
      .find((item) => item.fieldPath.startsWith("/article/front/article-meta/abstract") &&
        splitSentences(item.text).length > 0);
    if (!paragraph) {
      exclusions.push({ pmcid, reason: "NO_QUALIFYING_ABSTRACT_SENTENCE" });
      continue;
    }
    const verbatim = splitSentences(paragraph.text)[0];
    const sourceNumber = sources.length + 1;
    sources.push({
      pmcid, pmid: artifact.identifiers.pmid, doi: artifact.identifiers.doi,
      version: artifact.version, license: artifact.license, contentHash: artifact.contentHash
    });
    cases.push({
      caseId: `EL002-${String(batchNumber).padStart(2, "0")}-${String(sourceNumber).padStart(3, "0")}`,
      operation: "VALID_PACKET", pmcid, verbatim, fieldPath: paragraph.fieldPath,
      expectedOutcome: "PASS"
    });
    if (sourceNumber % 5 === 0) {
      const caseId = `EL002-${String(batchNumber).padStart(2, "0")}-NEG-${String(sourceNumber).padStart(3, "0")}`;
      cases.push({
        caseId, operation: "SPAN_NOT_FOUND", pmcid,
        verbatim: `This sentence is absent from the cited PMC article [${caseId}].`,
        fieldPath: paragraph.fieldPath, expectedOutcome: "EXPECTED_FAILURE",
        expectedErrorCode: "SPAN_NOT_FOUND"
      });
    }
  } catch (error) {
    exclusions.push({ pmcid, reason: typeof error?.code === "string" ? error.code : "FETCH_OR_PARSE_FAILED" });
  }
  await new Promise((resolve) => setTimeout(resolve, 400));
}
if (sources.length !== 26) {
  throw new Error(`Only ${sources.length}/26 sources qualified; exclusions: ${JSON.stringify(exclusions)}`);
}
const manifest = {
  experiment: "EXP-EL002", manifestVersion: "1.0.0",
  partition: requestedPartition, frozen: true, sources, cases,
  exclusions
};
const bytes = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(output, bytes, { flag: "wx" });
console.log(JSON.stringify({
  path: output.pathname, sha256: createHash("sha256").update(bytes).digest("hex"),
  sources: sources.length, cases: cases.length, exclusions
}, null, 2));
