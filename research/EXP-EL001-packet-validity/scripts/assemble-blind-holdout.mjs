import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";

import { extractPmcAddressableParagraphs } from "@evidencelens/deterministic-checks";
import { PmcFullTextAdapter } from "@evidencelens/source-adapters";

// Fixed before looking at any source content. ESearch: open access[filter] AND
// biomedical informatics[tiab] AND 2024[dp], retmax=50, 2026-09-23.
const candidateIds = "13404518 11700226 12414314 12285681 12081502 12020540 12000765 11962597 11932155 11928429 11884742 11882314 11864845 11812069 11810855 11811347 11800539 11203066 11766756 10898454 11732519 11714061 11702807 11703382 11693435 11688594 11682784 11671144 11669873 11667144 11664071 11660322 11657814 11639044 11637526 11635187 11637454 11627404 11620068 11617158 11618461 11616229 11612605 11446534 11606403 11573802 11575460 11566512 11559030 11552621".split(" ");
const targetSources = 10;
const now = new Date();
const adapter = new PmcFullTextAdapter({ tool: "evidencelens-exp-el001-holdout", now: () => now });
const output = new URL("../blind-holdout.manifest.json", import.meta.url);
const sources = [];
const cases = [];
const exclusions = [];

function sentenceCandidates(text) {
  return text.split(/(?<=[.!?])\s+(?=[A-Z])/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 55 && sentence.length <= 500);
}

for (const numericId of candidateIds) {
  if (sources.length === targetSources) break;
  const pmcid = `PMC${numericId}`;
  try {
    const resolved = await adapter.resolve(pmcid);
    const { artifact, snapshot } = resolved;
    if (!artifact.identifiers.pmid || !artifact.identifiers.doi || artifact.version === "PMC_VERSION_UNKNOWN") {
      exclusions.push({ pmcid, reason: "MISSING_REQUIRED_METADATA" });
      continue;
    }
    const selected = [];
    for (const paragraph of extractPmcAddressableParagraphs(snapshot)) {
      if (!paragraph.fieldPath.startsWith("/article/front/article-meta/abstract")) continue;
      for (const sentence of sentenceCandidates(paragraph.text)) {
        if (selected.length < 4 && !selected.some((item) => item.verbatim === sentence)) {
          selected.push({ verbatim: sentence, fieldPath: paragraph.fieldPath });
        }
      }
      if (selected.length === 4) break;
    }
    if (selected.length !== 4) {
      exclusions.push({ pmcid, reason: "FEWER_THAN_FOUR_ABSTRACT_SENTENCES" });
      continue;
    }
    sources.push({
      pmcid, pmid: artifact.identifiers.pmid, doi: artifact.identifiers.doi,
      version: artifact.version, license: artifact.license, contentHash: artifact.contentHash
    });
    for (const chosen of selected) {
      const caseId = `EL001-BLIND-${String(cases.length + 1).padStart(3, "0")}`;
      cases.push({
        caseId, operation: "VALID_PACKET", pmcid, claimType: "UNKNOWN",
        verbatim: chosen.verbatim, fieldPath: chosen.fieldPath, expectedOutcome: "PASS"
      });
    }
    const caseId = `EL001-BLIND-${String(cases.length + 1).padStart(3, "0")}`;
    cases.push({
      caseId, operation: "SPAN_NOT_FOUND", pmcid,
      verbatim: `This sentence is absent from the cited PMC article [${caseId}].`,
      fieldPath: selected[0].fieldPath, expectedOutcome: "EXPECTED_FAILURE",
      expectedErrorCode: "SPAN_NOT_FOUND"
    });
  } catch (error) {
    exclusions.push({ pmcid, reason: typeof error?.code === "string" ? error.code : "FETCH_OR_PARSE_FAILED" });
  }
  await new Promise((resolve) => setTimeout(resolve, 400));
}
if (cases.length !== 50) {
  throw new Error(`Only ${cases.length}/50 cases assembled; exclusions: ${JSON.stringify(exclusions)}`);
}
const manifest = {
  experiment: "EXP-EL001", manifestVersion: "1.0.0",
  partition: "BLIND_HOLDOUT", frozen: true, sources, cases
};
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(output, serialized, { flag: "wx" });
const hash = createHash("sha256").update(serialized).digest("hex");
console.log(JSON.stringify({ manifestPath: output.pathname, sha256: hash, sources: sources.length, cases: cases.length, exclusions }, null, 2));
