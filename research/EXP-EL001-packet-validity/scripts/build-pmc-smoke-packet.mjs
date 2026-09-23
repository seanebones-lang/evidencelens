import { assembleEvidencePacket } from "@evidencelens/packet-builder";
import { verifyPmcExactSpan } from "@evidencelens/deterministic-checks";
import { PmcFullTextAdapter, PubmedStatusResolver } from "@evidencelens/source-adapters";

const PMCID = "PMC7320186";
const VERBATIM = "PubMed® is an essential resource for the medical domain, but useful concepts are either difficult to extract or are ambiguous, which has significantly hindered knowledge discovery.";
const runAt = new Date(process.env.EVIDENCELENS_RUN_AT ?? Date.now());
if (Number.isNaN(runAt.valueOf())) throw new Error("EVIDENCELENS_RUN_AT must be a valid timestamp");

const adapterOptions = { tool: "evidencelens-exp-el001", now: () => runAt };
const resolved = await new PmcFullTextAdapter(adapterOptions).resolve(PMCID);
const pmid = resolved.artifact.identifiers.pmid;
if (!pmid) throw new Error(`${PMCID} did not provide a linked PMID`);

const status = await new PubmedStatusResolver(adapterOptions).resolve(pmid);
const span = verifyPmcExactSpan({ source: resolved.artifact, xml: resolved.snapshot, verbatim: VERBATIM });
const result = assembleEvidencePacket({
  claim: {
    claimId: "claim_exp_el001_smoke_001",
    verbatim: VERBATIM,
    contextType: "PMC_ABSTRACT",
    claimType: "METHODOLOGICAL",
    epistemicClass: "OBSERVED",
  },
  sources: [{ resolved, status }],
  evidenceSpans: [span],
  reviewContext: {
    domain: "biomedical-informatics",
    intendedUse: "RESEARCH_TRIAGE",
    requestedChecks: [],
  },
  provenance: {
    createdBy: "EXP-EL001-SMOKE-001",
    createdAt: runAt.toISOString(),
    creationActivityId: "activity_exp_el001_smoke_001",
    softwareVersion: "evidencelens@0.1.0",
  },
});

const summaryOnly = process.argv.includes("--summary");
const output = summaryOnly
  ? {
      packetId: result.packet.packetId,
      packetHash: result.packetHash,
      source: result.packet.sources[0],
      span: result.packet.evidenceSpans[0],
      assertions: result.packet.deterministicAssertions,
      snapshots: result.snapshots.map(({ payload: _payload, ...metadata }) => metadata),
    }
  : result;
console.log(JSON.stringify(output, null, 2));
