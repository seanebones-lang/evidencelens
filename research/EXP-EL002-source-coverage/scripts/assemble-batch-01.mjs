import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

import { extractPmcAddressableParagraphs } from "@evidencelens/deterministic-checks";
import { PmcFullTextAdapter } from "@evidencelens/source-adapters";

// Frozen PMC ESearch order for the exact query in ../PROTOCOL.md.
const candidateIds = "13575277 13546947 13540548 13531951 13523879 13523907 13523908 13523897 13488628 13488729 13440605 13359128 13418682 13417762 13431970 11580180 12598066 13313829 13346321 13344390 13277527 13277560 13244752 13244758 13162248 13238726 13225034 13178176 13172114 13172122 12135210 11826405 11494647 13083513 13076973 13055098 13059874 13001760 11975233 11975242 11972891 11975243 13013226 12999101 12999091 12990218 12931699 12912368 12912317 12912350 12912378 12912430 12912418 12912296 12912319 12917879 12904627 12894114 12894429 12893166".split(" ");
const existing = new Set();
for (const file of [
  "../../EXP-EL001-packet-validity/development.manifest.json",
  "../../EXP-EL001-packet-validity/blind-holdout.manifest.json",
  "../../EXP-EL001-packet-validity/transfer.manifest.json"
]) {
  const manifest = JSON.parse(await readFile(new URL(file, import.meta.url), "utf8"));
  for (const source of manifest.sources) existing.add(source.pmcid);
}

const output = new URL("../batch-01.manifest.json", import.meta.url);
const adapter = new PmcFullTextAdapter({ tool: "evidencelens-exp-el002" });
const sources = [];
const cases = [];
const exclusions = [];
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
        item.text.split(/(?<=[.!?])\s+(?=[A-Z])/u)
          .some((sentence) => sentence.length >= 55 && sentence.length <= 500));
    if (!paragraph) {
      exclusions.push({ pmcid, reason: "NO_QUALIFYING_ABSTRACT_SENTENCE" });
      continue;
    }
    const verbatim = paragraph.text.split(/(?<=[.!?])\s+(?=[A-Z])/u)
      .map((sentence) => sentence.trim())
      .find((sentence) => sentence.length >= 55 && sentence.length <= 500);
    const sourceNumber = sources.length + 1;
    sources.push({
      pmcid, pmid: artifact.identifiers.pmid, doi: artifact.identifiers.doi,
      version: artifact.version, license: artifact.license, contentHash: artifact.contentHash
    });
    cases.push({
      caseId: `EL002-CV-${String(sourceNumber).padStart(3, "0")}`,
      operation: "VALID_PACKET", pmcid, verbatim, fieldPath: paragraph.fieldPath,
      expectedOutcome: "PASS"
    });
    if (sourceNumber % 5 === 0) {
      const caseId = `EL002-CV-NEG-${String(sourceNumber).padStart(3, "0")}`;
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
  partition: "CARDIOVASCULAR_01", frozen: true, sources, cases,
  exclusions
};
const bytes = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(output, bytes, { flag: "wx" });
console.log(JSON.stringify({
  path: output.pathname, sha256: createHash("sha256").update(bytes).digest("hex"),
  sources: sources.length, cases: cases.length, exclusions
}, null, 2));
