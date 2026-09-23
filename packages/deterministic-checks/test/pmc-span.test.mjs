import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { SpanVerificationError, verifyPmcExactSpan } from "../dist/index.js";

const xml = `<?xml version="1.0"?><pmc-articleset><article><front><article-meta>
  <abstract id="Abs1"><title>Abstract</title><p id="A1">Alpha <italic>beta</italic> gamma.</p></abstract>
</article-meta></front><body>
  <sec id="S1"><title>Results</title><p id="P1">Treatment X produced a 34% improvement in the measured outcome.</p></sec>
  <sec id="S2"><title>Limitations</title><p id="P2">The sample was small.</p></sec>
</body></article></pmc-articleset>`;
const hash = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;

function source(overrides = {}) {
  return {
    sourceId: "src_pmc_example",
    sourceType: "research-article",
    identifiers: { pmcid: "PMC1234567" },
    version: "PMC1234567.1",
    retrievedAt: "2026-09-23T16:00:00.000Z",
    status: "UNKNOWN",
    statusCheckedAt: "2026-09-23T16:00:00.000Z",
    contentHash: hash(xml),
    metadataHash: hash(xml),
    license: "https://creativecommons.org/licenses/by/4.0/",
    retentionAuthority: "OPEN_LICENSE",
    ...overrides
  };
}

test("verifies a unique exact span and emits an addressable OBSERVED record", () => {
  const span = verifyPmcExactSpan({
    source: source(),
    xml,
    verbatim: "Treatment X produced a 34% improvement in the measured outcome."
  });
  assert.equal(span.epistemicClass, "OBSERVED");
  assert.equal(span.verifiedAgainstSource, true);
  assert.equal(span.locator.section, "Results");
  assert.equal(span.locator.fieldPath, "/article/body/sec[@id='S1']/p[@id='P1']");
  assert.equal(span.locator.startOffset, 0);
  assert.equal(span.locator.endOffset, span.verbatim.length);
});

test("preserves mixed inline text order when matching", () => {
  const span = verifyPmcExactSpan({ source: source(), xml, verbatim: "Alpha beta gamma." });
  assert.equal(span.locator.section, "Abstract");
  assert.equal(span.locator.fieldPath, "/article/front/article-meta/abstract[@id='Abs1']/p[@id='A1']");
});

test("rejects a modified artifact before parsing", () => {
  assert.throws(() => verifyPmcExactSpan({ source: source(), xml: `${xml} `, verbatim: "The sample was small." }), (error) => {
    assert.ok(error instanceof SpanVerificationError);
    assert.equal(error.code, "CONTENT_HASH_MISMATCH");
    return true;
  });
});

test("rejects missing text", () => {
  assert.throws(() => verifyPmcExactSpan({ source: source(), xml, verbatim: "This does not exist." }), (error) => {
    assert.ok(error instanceof SpanVerificationError);
    assert.equal(error.code, "SPAN_NOT_FOUND");
    return true;
  });
});

test("rejects ambiguous text rather than selecting a location", () => {
  const repeatedXml = xml.replace("The sample was small.", "Treatment X produced a 34% improvement in the measured outcome.");
  assert.throws(() => verifyPmcExactSpan({ source: source({ contentHash: hash(repeatedXml), metadataHash: hash(repeatedXml) }), xml: repeatedXml, verbatim: "Treatment X produced a 34% improvement in the measured outcome." }), (error) => {
    assert.ok(error instanceof SpanVerificationError);
    assert.equal(error.code, "SPAN_AMBIGUOUS");
    return true;
  });
});

test("rejects content without open-license retention authority", () => {
  assert.throws(() => verifyPmcExactSpan({ source: source({ retentionAuthority: "PUBLIC_METADATA" }), xml, verbatim: "The sample was small." }), (error) => {
    assert.ok(error instanceof SpanVerificationError);
    assert.equal(error.code, "SOURCE_NOT_AUTHORIZED");
    return true;
  });
});
