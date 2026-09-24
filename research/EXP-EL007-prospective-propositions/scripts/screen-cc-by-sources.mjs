import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

import { extractPmcAddressableParagraphs } from "@evidencelens/deterministic-checks";
import { PmcFullTextAdapter } from "@evidencelens/source-adapters";

const root = new URL("../", import.meta.url);
const poolBytes = await readFile(new URL("SOURCE-POOL-AUDIT-001.json", root));
const poolHash = createHash("sha256").update(poolBytes).digest("hex");
if (poolHash !== "36ec2483022cb7ad61f86a55cf0e67590c3d48d1477e2e7d5ebfeb54684d9922") {
  throw new Error("Frozen source-pool audit hash differs");
}
const pool = JSON.parse(poolBytes.toString("utf8"));
const candidates = pool.candidates.filter((source) =>
  /^https:\/\/creativecommons\.org\/licenses\/by\/(?:2|4)\.0\/$/.test(source.license));
if (candidates.length !== 41 || new Set(candidates.map((source) => source.pmcid)).size !== 41) {
  throw new Error("Expected exactly 41 distinct CC BY candidates");
}
const adapter = new PmcFullTextAdapter({ tool: "evidencelens-exp-el007-screening" });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const records = [];
for (const [index, expected] of candidates.entries()) {
  const attemptAt = new Date().toISOString();
  try {
    const resolved = await adapter.resolve(expected.pmcid);
    const observed = {
      pmcid: resolved.artifact.identifiers.pmcid,
      pmid: resolved.artifact.identifiers.pmid,
      doi: resolved.artifact.identifiers.doi,
      version: resolved.artifact.version,
      license: resolved.artifact.license,
      contentHash: resolved.artifact.contentHash,
    };
    const mismatch = Object.keys(observed).find((field) => observed[field] !== expected[field]);
    if (mismatch) {
      records.push({ pmcid: expected.pmcid, status: "SOURCE_DRIFT", attemptAt,
        mismatchField: mismatch, expected: expected[mismatch], observed: observed[mismatch] ?? null });
    } else {
      const abstractParagraphs = extractPmcAddressableParagraphs(resolved.snapshot)
        .filter((paragraph) => paragraph.fieldPath.includes("/abstract") && paragraph.text.trim());
      records.push({ pmcid: expected.pmcid, status: abstractParagraphs.length ? "ABSTRACT_AVAILABLE" : "NO_ABSTRACT_TEXT",
        attemptAt, version: observed.version, contentHash: observed.contentHash,
        license: observed.license, doi: observed.doi, pmid: observed.pmid,
        abstractParagraphs });
    }
  } catch (error) {
    records.push({ pmcid: expected.pmcid, status: "SOURCE_ERROR", attemptAt,
      errorCode: typeof error?.code === "string" ? error.code : "UNKNOWN_ERROR",
      errorMessage: error instanceof Error ? error.message : String(error) });
  }
  if (index < candidates.length - 1) await wait(400);
}
const counts = Object.fromEntries([...new Set(records.map((record) => record.status))]
  .sort().map((status) => [status, records.filter((record) => record.status === status).length]));
const report = { screeningVersion: "1.0.0", experiment: "EXP-EL007", poolFileHash: poolHash,
  attempted: candidates.length, counts, records,
  interpretation: "Source and abstract availability only; no semantic case or label admitted" };
const output = new URL("CC-BY-SCREEN-001.json", root);
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
console.log(JSON.stringify({ output: output.pathname, attempted: candidates.length, counts }));
