import assert from "node:assert/strict";
import test from "node:test";

import { PubmedStatusResolver, SourceAdapterError } from "../dist/index.js";

const NOW = new Date("2026-09-23T14:00:00Z");

function xmlRecord({ pmid = "9500320", publicationTypes = [], corrections = [] } = {}) {
  return `<?xml version="1.0"?>
<PubmedArticleSet>
  <PubmedArticle>
    <MedlineCitation>
      <PMID Version="1">${pmid}</PMID>
      <Article>
        <PublicationTypeList>${publicationTypes.map((value) => `<PublicationType>${value}</PublicationType>`).join("")}</PublicationTypeList>
      </Article>
      <CommentsCorrectionsList>${corrections.map(({ type, pmid: relatedPmid = "20137807" }) => `
        <CommentsCorrections RefType="${type}">
          <RefSource>Example correction notice.</RefSource>
          <PMID Version="1">${relatedPmid}</PMID>
        </CommentsCorrections>`).join("")}
      </CommentsCorrectionsList>
    </MedlineCitation>
  </PubmedArticle>
</PubmedArticleSet>`;
}

function resolverFor(xml) {
  return new PubmedStatusResolver({
    now: () => NOW,
    fetch: async () => new Response(xml, { status: 200, headers: { "content-type": "application/xml" } })
  });
}

test("maps an explicit retracted-publication type to RETRACTED", async () => {
  const result = await resolverFor(xmlRecord({ publicationTypes: ["Journal Article", "Retracted Publication"] }))
    .resolve("9500320");
  assert.equal(result.status, "RETRACTED");
  assert.equal(result.signals[0].value, "Retracted Publication");
  assert.equal(result.checkedAt, NOW.toISOString());
  assert.match(result.snapshotHash, /^sha256:[a-f0-9]{64}$/);
});

test("maps RetractionIn and preserves the related notice PMID", async () => {
  const result = await resolverFor(xmlRecord({ corrections: [{ type: "RetractionIn" }] })).resolve("9500320");
  assert.equal(result.status, "RETRACTED");
  assert.equal(result.signals[0].relatedPmid, "20137807");
  assert.equal(result.signals[0].citation, "Example correction notice.");
});

test("uses the strongest explicit status when several signals exist", async () => {
  const result = await resolverFor(xmlRecord({ corrections: [
    { type: "ErratumIn" },
    { type: "ExpressionOfConcernIn" },
    { type: "RetractionIn" }
  ] })).resolve("9500320");
  assert.equal(result.status, "RETRACTED");
  assert.equal(result.signals.length, 3);
});

test("does not treat a notice relation ending in Of as the article status", async () => {
  const result = await resolverFor(xmlRecord({ corrections: [{ type: "RetractionOf" }] })).resolve("9500320");
  assert.equal(result.status, "UNKNOWN");
  assert.deepEqual(result.signals, []);
});

test("returns UNKNOWN rather than CURRENT when no explicit status signal exists", async () => {
  const result = await resolverFor(xmlRecord()).resolve("9500320");
  assert.equal(result.status, "UNKNOWN");
});

test("rejects XML for a different PMID", async () => {
  await assert.rejects(resolverFor(xmlRecord({ pmid: "99999999" })).resolve("9500320"), (error) => {
    assert.ok(error instanceof SourceAdapterError);
    assert.equal(error.code, "IDENTIFIER_MISMATCH");
    return true;
  });
});

test("converts HTTP failure into a typed source error", async () => {
  const resolver = new PubmedStatusResolver({ fetch: async () => new Response("busy", { status: 503 }) });
  await assert.rejects(resolver.resolve("9500320"), (error) => {
    assert.ok(error instanceof SourceAdapterError);
    assert.equal(error.code, "SOURCE_UNAVAILABLE");
    return true;
  });
});
