import assert from "node:assert/strict";
import test from "node:test";

import { assertEvidencePacket, validateEvidencePacket } from "../dist/index.js";

const HASH = `sha256:${"a".repeat(64)}`;

function validPacket() {
  return {
    packetId: "elp_test_001",
    schemaVersion: "0.1.0",
    claim: {
      claimId: "claim_001",
      verbatim: "Treatment X caused improvement Y.",
      contextType: "MANUSCRIPT_ABSTRACT",
      claimType: "CAUSAL",
      epistemicClass: "OBSERVED"
    },
    sources: [{
      sourceId: "source_001",
      sourceType: "JOURNAL_ARTICLE",
      identifiers: { doi: "10.0000/example" },
      version: "VERSION_OF_RECORD",
      retrievedAt: "2026-09-23T00:00:00Z",
      status: "CURRENT",
      statusCheckedAt: "2026-09-23T00:00:00Z",
      contentHash: HASH,
      metadataHash: HASH,
      retentionAuthority: "PROJECT_AUTHORED"
    }],
    evidenceSpans: [{
      spanId: "span_001",
      sourceId: "source_001",
      locator: { section: "Results", paragraph: 2 },
      verbatim: "The observed association was 0.34.",
      contentHash: HASH,
      extractionMethod: "USER_SELECTED",
      verifiedAgainstSource: true,
      epistemicClass: "OBSERVED"
    }],
    deterministicAssertions: [{
      assertionId: "assertion_001",
      assertionType: "QUOTE_PRESENT",
      value: true,
      inputRefs: ["source_001", "span_001"],
      checker: "exact-span-checker",
      checkerVersion: "0.1.0",
      checkedAt: "2026-09-23T00:00:01Z",
      epistemicClass: "OBSERVED"
    }],
    reviewContext: {
      domain: "BIOMEDICAL_RESEARCH",
      intendedUse: "RESEARCH_TRIAGE",
      requestedChecks: []
    },
    provenance: {
      createdBy: "test-suite",
      createdAt: "2026-09-23T00:00:02Z",
      creationActivityId: "activity_001",
      softwareVersion: "0.1.0"
    }
  };
}

test("accepts a complete, internally linked packet", () => {
  const result = validateEvidencePacket(validPacket());
  assert.deepEqual(result, { valid: true, issues: [] });
  assert.doesNotThrow(() => assertEvidencePacket(validPacket()));
});

test("rejects a span that references a missing source", () => {
  const packet = validPacket();
  packet.evidenceSpans[0].sourceId = "source_missing";
  const result = validateEvidencePacket(packet);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === "SOURCE_REF_NOT_FOUND"));
});

test("rejects an unverified generated span", () => {
  const packet = validPacket();
  packet.evidenceSpans[0].verifiedAgainstSource = false;
  packet.evidenceSpans[0].epistemicClass = "GENERATED";
  const result = validateEvidencePacket(packet);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === "SPAN_NOT_VERIFIED"));
  assert.ok(result.issues.some((issue) => issue.code === "SPAN_NOT_OBSERVED"));
});

test("rejects duplicate identifiers across packet entities", () => {
  const packet = validPacket();
  packet.evidenceSpans[0].spanId = "source_001";
  const result = validateEvidencePacket(packet);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === "DUPLICATE_ID"));
});

test("rejects deterministic assertions with unresolved inputs", () => {
  const packet = validPacket();
  packet.deterministicAssertions[0].inputRefs = ["unknown_input"];
  const result = validateEvidencePacket(packet);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === "INPUT_REF_NOT_FOUND"));
});

test("enforces the published schema at runtime", () => {
  const packet = validPacket();
  packet.sources[0].status = "LOOKS_FINE";
  const result = validateEvidencePacket(packet);
  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === "SCHEMA_ENUM"));
});
