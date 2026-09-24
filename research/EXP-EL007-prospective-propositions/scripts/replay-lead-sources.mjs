import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

import { extractPmcAddressableParagraphs, verifyPmcExactSpan } from "@evidencelens/deterministic-checks";
import { PmcFullTextAdapter, PubmedStatusResolver } from "@evidencelens/source-adapters";

const root = new URL("../", import.meta.url);
const readFrozen = async (name, expectedHash) => {
  const bytes = await readFile(new URL(name, root));
  if (createHash("sha256").update(bytes).digest("hex") !== expectedHash) {
    throw new Error(`${name} hash differs`);
  }
  return JSON.parse(bytes.toString("utf8"));
};
const leads = await readFrozen("AUTHORING-LEADS-001.json",
  "05d2a190d21e9c4b78146fa6a0203c9089bda424e2872db4e70c95576e966527");
const screen = await readFrozen("CC-BY-SCREEN-001.json",
  "f01ec6c70d845b50e6b1f5be4fb3875eab074ec2b3d05610fd93ddc1d64075a2");
const byPmcid = new Map(screen.records.map((item) => [item.pmcid, item]));
const selected = leads.records.filter((item) => item.pairing);
if (selected.length !== 14 || new Set(selected.map((item) => item.pmcid)).size !== 14) {
  throw new Error("Expected exactly 14 distinct authoring leads");
}
const pmc = new PmcFullTextAdapter({ tool: "evidencelens-exp-el007-replay" });
const pubmed = new PubmedStatusResolver({ tool: "evidencelens-exp-el007-replay" });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let nextRequestAt = 0;
async function paced(operation) {
  const delay = Math.max(0, nextRequestAt - Date.now());
  if (delay) await wait(delay);
  nextRequestAt = Date.now() + 400;
  return operation();
}
const records = [];
for (const lead of selected) {
  const expected = byPmcid.get(lead.pmcid);
  if (!expected) throw new Error(`Missing prior screen record for ${lead.pmcid}`);
  const attemptAt = new Date().toISOString();
  try {
    const resolved = await paced(() => pmc.resolve(lead.pmcid));
    const observed = {
      pmcid: resolved.artifact.identifiers.pmcid,
      pmid: resolved.artifact.identifiers.pmid,
      doi: resolved.artifact.identifiers.doi,
      version: resolved.artifact.version,
      license: resolved.artifact.license,
      contentHash: resolved.artifact.contentHash,
    };
    const field = Object.keys(observed).find((key) => observed[key] !== expected[key]);
    if (field) {
      records.push({ queueId: lead.queueId, pmcid: lead.pmcid, attemptAt,
        outcome: "SOURCE_DRIFT", field, expected: expected[field], observed: observed[field] ?? null });
      continue;
    }
    const spans = Object.fromEntries([
      ["possibleClaimLocation", lead.pairing.possibleClaimLocation],
      ["possibleEvidenceLocation", lead.pairing.possibleEvidenceLocation],
    ].map(([name, passage]) => [name, verifyPmcExactSpan({ source: resolved.artifact,
      xml: resolved.snapshot, verbatim: passage.text, fieldPath: passage.fieldPath }).spanId]));
    const bodyParagraphCount = extractPmcAddressableParagraphs(resolved.snapshot)
      .filter((item) => item.fieldPath.includes("/body/")).length;
    const publication = await paced(() => pubmed.resolve(expected.pmid));
    records.push({ queueId: lead.queueId, pmcid: lead.pmcid, attemptAt,
      outcome: "REPLAYED_WITH_STATUS_CHECK", version: observed.version,
      contentHash: observed.contentHash, spans, bodyParagraphCount,
      publicationStatus: publication.status, statusSignals: publication.signals,
      statusCheckedAt: publication.checkedAt, statusResponseHash: publication.snapshotHash });
  } catch (error) {
    records.push({ queueId: lead.queueId, pmcid: lead.pmcid, attemptAt,
      outcome: "SOURCE_OR_STATUS_ERROR",
      errorCode: typeof error?.code === "string" ? error.code : "UNKNOWN_ERROR",
      errorMessage: error instanceof Error ? error.message : String(error) });
  }
}
const counts = Object.fromEntries([...new Set(records.map((item) => item.outcome))].sort()
  .map((outcome) => [outcome, records.filter((item) => item.outcome === outcome).length]));
const output = { replayVersion: "1.0.0", experiment: "EXP-EL007", attempted: selected.length,
  counts, interpretation: "Source replay and status signals only; no case admission or semantic judgment", records };
const destination = new URL("LEAD-SOURCE-REPLAY-001.json", root);
await writeFile(destination, `${JSON.stringify(output, null, 2)}\n`, { flag: "wx" });
console.log(JSON.stringify({ attempted: selected.length, counts }));
