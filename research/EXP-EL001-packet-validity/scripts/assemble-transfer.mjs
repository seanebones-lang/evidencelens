import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";

import { extractPmcAddressableParagraphs } from "@evidencelens/deterministic-checks";
import { PmcFullTextAdapter } from "@evidencelens/source-adapters";

// Fixed before looking at any source content. ESearch: open access[filter] AND
// synaptic plasticity[tiab] AND 2024[dp], retmax=30, 2026-09-23.
const candidateIds = "13452708 13321751 13271256 13108743 13045196 13001755 13023382 11800364 12997613 12834022 12810228 12356413 11764858 11864087 12697572 12486910 12478676 12073661 12599878 12559990 11922792 12559981 12539541 12529104 12500796 12500787 12500284 11489560 11606516 12462668".split(" ");
const targetSources = 4;
const now = new Date();
const adapter = new PmcFullTextAdapter({ tool: "evidencelens-exp-el001-transfer", now: () => now });
const output = new URL("../transfer.manifest.json", import.meta.url);
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
      const caseId = `EL001-TRANSFER-${String(cases.length + 1).padStart(3, "0")}`;
      cases.push({
        caseId, operation: "VALID_PACKET", pmcid, claimType: "UNKNOWN",
        verbatim: chosen.verbatim, fieldPath: chosen.fieldPath, expectedOutcome: "PASS"
      });
    }
    const caseId = `EL001-TRANSFER-${String(cases.length + 1).padStart(3, "0")}`;
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
if (cases.length !== 20) {
  throw new Error(`Only ${cases.length}/20 cases assembled; exclusions: ${JSON.stringify(exclusions)}`);
}
const manifest = {
  experiment: "EXP-EL001", manifestVersion: "1.0.0",
  partition: "TRANSFER", frozen: true, sources, cases
};
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(output, serialized, { flag: "wx" });
const hash = createHash("sha256").update(serialized).digest("hex");
console.log(JSON.stringify({ manifestPath: output.pathname, sha256: hash, sources: sources.length, cases: cases.length, exclusions }, null, 2));
