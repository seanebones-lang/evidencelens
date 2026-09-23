import assert from "node:assert/strict";
import test from "node:test";

import { canonicalJson } from "@evidencelens/source-adapters";
import { createHash } from "node:crypto";

import { PacketAssemblyError, assembleEvidencePacket, resolveScientificSource } from "../dist/index.js";

const NOW = "2026-09-23T15:00:00.000Z";
const identitySnapshot = { result: { uids: ["12345678"], "12345678": { uid: "12345678" } } };
const statusSnapshot = "<PubmedArticleSet><PubmedArticle /></PubmedArticleSet>";
const hash = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;

function sourceInput(overrides = {}) {
  return {
    resolved: {
      artifact: {
        sourceId: "src_pmid_example",
        sourceType: "Journal Article",
        identifiers: { pmid: "12345678", doi: "10.1234/example" },
        version: "PUBMED_ESUMMARY_V2_SNAPSHOT",
        retrievedAt: NOW,
        status: "UNKNOWN",
        statusCheckedAt: NOW,
        metadataHash: hash(canonicalJson(identitySnapshot)),
        retentionAuthority: "PUBLIC_METADATA"
      },
      snapshot: identitySnapshot,
      adapter: "pubmed",
      adapterVersion: "0.1.0"
    },
    status: {
      identifier: { pmid: "12345678" },
      status: "RETRACTED",
      checkedAt: NOW,
      signals: [{ signalType: "CORRECTION_RELATION", value: "RetractionIn", mappedStatus: "RETRACTED" }],
      snapshot: statusSnapshot,
      snapshotHash: hash(statusSnapshot),
      resolver: "pubmed-status",
      resolverVersion: "0.1.0"
    },
    ...overrides
  };
}

function validInput() {
  return {
    claim: {
      claimId: "claim_001",
      verbatim: "Treatment X caused improvement.",
      contextType: "ABSTRACT",
      claimType: "CAUSAL",
      epistemicClass: "GENERATED"
    },
    sources: [sourceInput()],
    evidenceSpans: [{
      spanId: "span_001",
      sourceId: "src_pmid_example",
      locator: { section: "Abstract", startOffset: 0, endOffset: 24 },
      verbatim: "Treatment X was associated",
      contentHash: hash("Treatment X was associated"),
      extractionMethod: "PARSER_EXTRACTED",
      extractorVersion: "test-1",
      verifiedAgainstSource: true,
      epistemicClass: "OBSERVED"
    }],
    reviewContext: {
      domain: "biomedicine",
      intendedUse: "RESEARCH_TRIAGE",
      requestedChecks: []
    },
    provenance: {
      createdBy: "test-suite",
      createdAt: NOW,
      creationActivityId: "activity_001",
      softwareVersion: "test"
    }
  };
}

test("assembles a valid packet and preserves identity and status snapshots", () => {
  const result = assembleEvidencePacket(validInput());
  assert.match(result.packet.packetId, /^pkt_[a-f0-9]{24}$/);
  assert.equal(result.packet.sources[0].status, "RETRACTED");
  assert.equal(result.packet.deterministicAssertions[0].assertionType, "SOURCE_STATUS");
  assert.equal(result.packet.deterministicAssertions[0].value, "RETRACTED");
  assert.equal(result.snapshots.length, 2);
  assert.deepEqual(result.snapshots.map((snapshot) => snapshot.purpose), ["IDENTITY_METADATA", "SOURCE_STATUS"]);
});

test("is replay-stable for identical input", () => {
  const first = assembleEvidencePacket(validInput());
  const second = assembleEvidencePacket(validInput());
  assert.equal(first.packetHash, second.packetHash);
  assert.equal(first.packet.packetId, second.packet.packetId);
  assert.deepEqual(first, second);
});

test("fails closed when a preserved snapshot does not match its recorded hash", () => {
  const input = validInput();
  input.sources[0].resolved.artifact.metadataHash = hash("different");
  assert.throws(() => assembleEvidencePacket(input), (error) => {
    assert.ok(error instanceof PacketAssemblyError);
    assert.equal(error.code, "SNAPSHOT_HASH_MISMATCH");
    return true;
  });
});

test("rejects status metadata for a different PMID", () => {
  const input = validInput();
  input.sources[0].status.identifier.pmid = "99999999";
  assert.throws(() => assembleEvidencePacket(input), (error) => {
    assert.ok(error instanceof PacketAssemblyError);
    assert.equal(error.code, "STATUS_IDENTIFIER_MISMATCH");
    return true;
  });
});

test("rejects spans that reference an unresolved source", () => {
  const input = validInput();
  input.evidenceSpans[0].sourceId = "src_missing";
  assert.throws(() => assembleEvidencePacket(input), (error) => {
    assert.ok(error instanceof PacketAssemblyError);
    assert.equal(error.code, "SPAN_SOURCE_NOT_RESOLVED");
    return true;
  });
});

test("rejects evidence that has not been deterministically verified", () => {
  const input = validInput();
  input.evidenceSpans[0].verifiedAgainstSource = false;
  assert.throws(() => assembleEvidencePacket(input), (error) => {
    assert.ok(error instanceof PacketAssemblyError);
    assert.equal(error.code, "SPAN_NOT_VERIFIED");
    return true;
  });
});

test("rejects an otherwise well-formed packet without evidence spans", () => {
  const input = validInput();
  input.evidenceSpans = [];
  assert.throws(() => assembleEvidencePacket(input), (error) => {
    assert.ok(error instanceof PacketAssemblyError);
    assert.equal(error.code, "PACKET_INVALID");
    return true;
  });
});

test("coordinates PMID and DOI resolution and records their verified link", async () => {
  const pubmed = sourceInput();
  const crossrefResolved = {
    artifact: {
      ...pubmed.resolved.artifact,
      sourceId: "src_doi_example",
      identifiers: { doi: "10.1234/example" },
      version: "CROSSREF_METADATA_SNAPSHOT"
    },
    snapshot: identitySnapshot,
    adapter: "crossref",
    adapterVersion: "0.1.0"
  };
  const result = await resolveScientificSource(
    { pmid: "12345678", doi: "10.1234/example" },
    {
      pubmed: { resolve: async () => pubmed.resolved },
      pubmedStatus: { resolve: async () => pubmed.status },
      crossref: { resolve: async () => crossrefResolved }
    }
  );
  assert.equal(result.sources.length, 2);
  assert.equal(result.deterministicAssertions[0].assertionType, "IDENTIFIER_LINK_MATCH");
  assert.equal(result.deterministicAssertions[0].value, true);
});

test("fails closed when PubMed and Crossref disagree on DOI", async () => {
  const pubmed = sourceInput();
  const crossrefResolved = {
    ...pubmed.resolved,
    artifact: {
      ...pubmed.resolved.artifact,
      sourceId: "src_doi_wrong",
      identifiers: { doi: "10.9999/wrong" }
    }
  };
  await assert.rejects(resolveScientificSource(
    { pmid: "12345678", doi: "10.1234/example" },
    {
      pubmed: { resolve: async () => pubmed.resolved },
      pubmedStatus: { resolve: async () => pubmed.status },
      crossref: { resolve: async () => crossrefResolved }
    }
  ), (error) => {
    assert.ok(error instanceof PacketAssemblyError);
    assert.equal(error.code, "LINKED_IDENTIFIER_MISMATCH");
    return true;
  });
});

test("requires both identity and status resolution for PMID input", async () => {
  await assert.rejects(resolveScientificSource(
    { pmid: "12345678" },
    { pubmed: { resolve: async () => sourceInput().resolved } }
  ), (error) => {
    assert.ok(error instanceof PacketAssemblyError);
    assert.equal(error.code, "INVALID_SOURCE_REQUEST");
    return true;
  });
});
