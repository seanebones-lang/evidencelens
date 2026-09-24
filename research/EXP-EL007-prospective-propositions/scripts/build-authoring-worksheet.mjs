import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const readFrozen = (name, digest) => {
  const bytes = readFileSync(new URL(name, root));
  if (createHash("sha256").update(bytes).digest("hex") !== digest) {
    throw new Error(`${name} differs from its recorded hash`);
  }
  return JSON.parse(bytes);
};
const leads = readFrozen("AUTHORING-LEADS-001.json",
  "05d2a190d21e9c4b78146fa6a0203c9089bda424e2872db4e70c95576e966527");
const replay = readFrozen("LEAD-SOURCE-REPLAY-001.json",
  "f36ea877247a0f20058ab699e59a90c14a85cdf644aa8d976803114b35a30b24");
const replayById = new Map(replay.records.map((item) => [item.queueId, item]));
const paired = leads.records.filter((item) => item.pairing);
const manual = leads.records.filter((item) => !item.pairing);
if (paired.length !== 14 || manual.length !== 27 || replayById.size !== 14) {
  throw new Error("Unexpected authoring queue or replay count");
}
const lines = [
  "# EXP-EL007 case-authoring worksheet",
  "",
  "**Status:** Blank authoring worksheet. No cases have been admitted or labeled.",
  "",
  "Read the complete article before filling any field. The passages below are exact",
  "locations for consideration, not an endorsement of their relationship.",
  "`UNKNOWN` publication status means the resolver found no explicit recognized",
  "status signal; it does not establish that an article is current.",
  "The two passages from each lead belong to the same article and are not",
  "independent corroboration. Record exclusions as carefully as admissions.",
  "",
  "## Exact-text leads",
  "",
];
for (const lead of paired) {
  const result = replayById.get(lead.queueId);
  if (!result || result.pmcid !== lead.pmcid || result.outcome !== "REPLAYED_WITH_STATUS_CHECK") {
    throw new Error(`Missing exact replay for ${lead.queueId}`);
  }
  const claim = lead.pairing.possibleClaimLocation;
  const evidence = lead.pairing.possibleEvidenceLocation;
  const correction = result.statusSignals.find((signal) => signal.mappedStatus === "CORRECTED");
  lines.push(
    `### ${lead.queueId} · ${lead.pmcid}`,
    "",
    `- [Full article](${lead.articleUrl}) · DOI: ${lead.doi}`,
    `- Frozen version: ${lead.version} · XML hash: ${lead.contentHash}`,
    `- PubMed status signal: **${result.publicationStatus}**`,
    ...(correction ? [`- **Correction review required:** [Erratum PMID ${correction.relatedPmid}](https://pubmed.ncbi.nlm.nih.gov/${correction.relatedPmid}/). Read it with the original article before authoring.`] : []),
    "",
    `**Possible claim location — ${claim.section}** · ${claim.fieldPath} · ${result.spans.possibleClaimLocation}`,
    "",
    `> ${claim.text}`,
    "",
    `**Possible evidence location — ${evidence.section}** · ${evidence.fieldPath} · ${result.spans.possibleEvidenceLocation}`,
    "",
    `> ${evidence.text}`,
    "",
    "**Case-authoring record (leave blank until full-article review):**",
    "",
    "- Admit or exclude, with reason:",
    "- Exact natural claim selected, with field path and offsets:",
    "- Exact evidence passage selected, with field path and offsets:",
    "- Full-article context checked and relevant limitations:",
    "- Publication-status and correction review:",
    "- Excluded-context and near-duplicate screen:",
    "- Neutral proposition split, if faithful to the exact claim:",
    "- Author and date of this record:",
    "",
  );
}
lines.push("## Sources requiring manual article inspection", "",
  "These 27 sources lacked the specific Results/Conclusion paragraph pairing rule.",
  "They have not been rejected. Inspect each full article before deciding whether",
  "it can supply a natural case.", "");
for (const source of manual) {
  lines.push(`- ${source.queueId}: [${source.pmcid}](${source.articleUrl}) · DOI ${source.doi}`);
}
lines.push("", "## Review boundary", "",
  "This document has no reference answers. Once cases are authored, two",
  "domain-qualified reviewers must annotate independently and a third must",
  "adjudicate disagreements before any confirmatory JEV request.", "");
const output = lines.join("\n");
const destination = new URL("CASE-AUTHORING-WORKSHEET-001.md", root);
if (process.argv.includes("--check")) {
  if (readFileSync(destination, "utf8") !== output) throw new Error("Worksheet drifted");
} else {
  writeFileSync(destination, output, { flag: "wx" });
}
console.log(`Prepared worksheet for ${paired.length} exact-text leads and ${manual.length} manual sources`);
