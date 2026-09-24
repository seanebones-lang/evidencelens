import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = join(root, "EXP-EL007-prospective-propositions", "SOURCE-POOL-AUDIT-001.json");
const read = (relative) => {
  const bytes = readFileSync(join(root, relative));
  return { data: JSON.parse(bytes), sha256: createHash("sha256").update(bytes).digest("hex") };
};

const batchFiles = Array.from({ length: 5 }, (_, index) =>
  `EXP-EL002-source-coverage/batch-0${index + 1}.manifest.json`);
const batches = batchFiles.map(read);
const usedFile = "EXP-EL003-semantic-relation/development-source-inventory.json";
const used = read(usedFile);
const semanticDir = join(root, "EXP-EL003-semantic-relation");
const semanticFiles = readdirSync(semanticDir, { recursive: true })
  .filter((name) => /\.(json|jsonl)$/.test(name)).sort();
const exposed = new Set();
const semanticHashes = semanticFiles.map((name) => {
  const bytes = readFileSync(join(semanticDir, name));
  for (const match of bytes.toString("utf8").matchAll(/PMC\d{6,}/g)) exposed.add(match[0]);
  return { path: `EXP-EL003-semantic-relation/${name}`,
    sha256: createHash("sha256").update(bytes).digest("hex") };
});
const identifiers = ["pmcid", "pmid", "doi", "contentHash"];
const all = batches.flatMap(({ data }, index) => data.sources.map((source) => ({
  ...source, sourceBatch: `0${index + 1}`,
})));
if (all.length !== 130 || used.data.sources.length !== 32 || exposed.size !== 52) {
  throw new Error("Source population changed; review the audit inputs");
}
for (const key of identifiers) {
  const values = all.map((source) => source[key]?.toLowerCase());
  if (values.some((value) => !value) || new Set(values).size !== all.length) {
    throw new Error(`EXP-EL002 contains missing or duplicate ${key}`);
  }
}
const usedIds = new Set();
for (const source of used.data.sources) {
  const matched = all.filter((item) => identifiers.every((key) =>
    item[key].toLowerCase() === source[key]?.toLowerCase()));
  if (matched.length !== 1 || usedIds.has(source.pmcid)) {
    throw new Error(`Semantic-use identity mismatch: ${source.pmcid}`);
  }
  usedIds.add(source.pmcid);
}
const allIds = new Set(all.map((source) => source.pmcid));
if ([...exposed].some((id) => !allIds.has(id)) || [...usedIds].some((id) => !exposed.has(id))) {
  throw new Error("Exposed source set does not reconcile with the source inventory");
}
const candidates = all.filter((source) => !exposed.has(source.pmcid)).map((source) => ({
  pmcid: source.pmcid,
  pmid: source.pmid,
  doi: source.doi,
  version: source.version,
  license: source.license,
  contentHash: source.contentHash,
  sourceBatch: source.sourceBatch,
  status: "UNSCREENED_FOR_SEMANTIC_CASES",
}));
if (candidates.length !== 78) throw new Error("Unexpected candidate count");
const report = {
  auditVersion: "1.0.0",
  purpose: "Potential sources absent from EXP-EL003 structured authoring records and EXP-EL004 through EXP-EL006 reused cases",
  inputFiles: [
    ...batchFiles.map((path, index) => ({ path, sha256: batches[index].sha256 })),
    { path: usedFile, sha256: used.sha256 },
    ...semanticHashes,
  ],
  counts: { exp002Sources: all.length, semanticDevelopmentSources: usedIds.size,
    exp003ExposedSources: exposed.size,
    candidateSources: candidates.length },
  limitations: [
    "Metadata exclusion only; no article content or claim suitability screened",
    "No independent review, adjudication, or source-version refetch performed",
    "No near-duplicate claim screening performed",
    "License suitability for a specific quotation or redistribution remains to be checked",
  ],
  candidates,
};
const output = `${JSON.stringify(report, null, 2)}\n`;
if (process.argv.includes("--check")) {
  if (readFileSync(out, "utf8") !== output) throw new Error("Source-pool audit drifted; review inputs before replacing it");
} else {
  writeFileSync(out, output);
}
console.log(`Audited ${all.length} sources; ${exposed.size} excluded; ${candidates.length} candidates`);
