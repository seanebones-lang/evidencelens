import assert from "node:assert/strict";
import test from "node:test";

import {
  CrossrefAdapter,
  SourceAdapterError,
  canonicalJson,
  normalizeDoi,
} from "../dist/index.js";

const NOW = new Date("2026-09-23T12:00:00Z");

function responseFor(doi = "10.1234/example") {
  return new Response(JSON.stringify({
    status: "ok",
    "message-type": "work",
    message: {
      DOI: doi,
      type: "journal-article",
      title: ["Example study"],
      URL: `https://doi.org/${doi}`,
      license: [{ URL: "https://creativecommons.org/licenses/by/4.0/" }]
    }
  }), { status: 200, headers: { "content-type": "application/json" } });
}

test("normalizes common DOI forms", () => {
  assert.equal(normalizeDoi(" DOI:10.1234/ABC "), "10.1234/abc");
  assert.equal(normalizeDoi("https://doi.org/10.1234/ABC"), "10.1234/abc");
});

test("rejects malformed DOI input", () => {
  assert.throws(() => normalizeDoi("not-a-doi"), (error) => {
    assert.ok(error instanceof SourceAdapterError);
    assert.equal(error.code, "INVALID_IDENTIFIER");
    return true;
  });
});

test("resolves DOI metadata without claiming the source is current", async () => {
  let requestedUrl;
  const adapter = new CrossrefAdapter({
    now: () => NOW,
    mailto: "research@example.com",
    fetch: async (url) => {
      requestedUrl = url;
      return responseFor();
    }
  });

  const result = await adapter.resolve("https://doi.org/10.1234/EXAMPLE");
  assert.equal(result.artifact.identifiers.doi, "10.1234/example");
  assert.equal(result.artifact.status, "UNKNOWN");
  assert.equal(result.artifact.retrievedAt, NOW.toISOString());
  assert.match(result.artifact.metadataHash, /^sha256:[a-f0-9]{64}$/);
  assert.equal(result.artifact.retentionAuthority, "PUBLIC_METADATA");
  assert.equal(requestedUrl.searchParams.get("mailto"), "research@example.com");
});

test("rejects a mismatched DOI response", async () => {
  const adapter = new CrossrefAdapter({
    now: () => NOW,
    fetch: async () => responseFor("10.9999/wrong")
  });

  await assert.rejects(adapter.resolve("10.1234/example"), (error) => {
    assert.ok(error instanceof SourceAdapterError);
    assert.equal(error.code, "IDENTIFIER_MISMATCH");
    return true;
  });
});

test("converts HTTP failures into a typed source error", async () => {
  const adapter = new CrossrefAdapter({
    now: () => NOW,
    fetch: async () => new Response("not found", { status: 404 })
  });

  await assert.rejects(adapter.resolve("10.1234/example"), (error) => {
    assert.ok(error instanceof SourceAdapterError);
    assert.equal(error.code, "SOURCE_UNAVAILABLE");
    return true;
  });
});

test("canonical JSON is stable across object key order", () => {
  assert.equal(canonicalJson({ b: 2, a: { d: 4, c: 3 } }), canonicalJson({ a: { c: 3, d: 4 }, b: 2 }));
});

