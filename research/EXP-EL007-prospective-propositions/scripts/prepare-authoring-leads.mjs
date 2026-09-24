import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const input = readFileSync(new URL("CC-BY-SCREEN-001.json", root));
const inputHash = createHash("sha256").update(input).digest("hex");
if (inputHash !== "f01ec6c70d845b50e6b1f5be4fb3875eab074ec2b3d05610fd93ddc1d64075a2") {
  throw new Error("Screen report hash differs");
}
const report = JSON.parse(input);
if (report.records.length !== 41 || report.records.some((item) => item.status !== "ABSTRACT_AVAILABLE")) {
  throw new Error("Expected the complete 41-source screen");
}
const hashText = (value) => `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
const records = report.records.map((source, index) => {
  const result = source.abstractParagraphs.find((item) => /^results?:?$/i.test(item.section?.trim() ?? ""));
  const conclusion = source.abstractParagraphs.find((item) => /^conclusions?:?$/i.test(item.section?.trim() ?? ""));
  const base = { queueId: `EL007-SRC-${String(index + 1).padStart(3, "0")}`,
    pmcid: source.pmcid, doi: source.doi, version: source.version,
    contentHash: source.contentHash, license: source.license,
    articleUrl: `https://pmc.ncbi.nlm.nih.gov/articles/${source.pmcid}/` };
  if (!result || !conclusion || result.fieldPath === conclusion.fieldPath) {
    return { ...base, status: "MANUAL_ARTICLE_INSPECTION_REQUIRED", pairing: null };
  }
  const passage = (item) => ({ section: item.section, fieldPath: item.fieldPath,
    text: item.text, textHash: hashText(item.text) });
  return { ...base, status: "PAIRING_LEAD_FOR_REVIEW",
    pairing: { possibleClaimLocation: passage(conclusion), possibleEvidenceLocation: passage(result) } };
});
const paired = records.filter((item) => item.pairing).length;
if (paired !== 14 || records.length - paired !== 27 ||
    new Set(records.map((item) => item.pmcid)).size !== 41) {
  throw new Error("Expected 14 paired leads and 27 manual-inspection records");
}
const output = `${JSON.stringify({ queueVersion: "1.0.0", experiment: "EXP-EL007",
  sourceScreenHash: inputHash,
  counts: { sources: records.length, pairingLeads: paired, manualInspection: records.length - paired },
  interpretation: "Exact-text locations only; no admitted cases, labels, or proposition splits",
  records }, null, 2)}\n`;
const destination = new URL("AUTHORING-LEADS-001.json", root);
if (process.argv.includes("--check")) {
  if (readFileSync(destination, "utf8") !== output) throw new Error("Authoring leads drifted");
} else {
  writeFileSync(destination, output, { flag: "wx" });
}
console.log(`Prepared ${paired} exact-text leads and ${records.length - paired} manual-inspection records`);
