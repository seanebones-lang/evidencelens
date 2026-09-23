import assert from "node:assert/strict";
import test from "node:test";

import { PubmedAdapter, SourceAdapterError, normalizePmid } from "../dist/index.js";

const NOW = new Date("2026-09-23T13:00:00Z");

function responseFor(pmid = "12345678") {
  return new Response(JSON.stringify({
    header: { type: "esummary", version: "0.3" },
    result: {
      uids: [pmid],
      [pmid]: {
        uid: pmid,
        title: "Example biomedical study",
        pubtype: ["Journal Article"],
        articleids: [
          { idtype: "pubmed", value: pmid },
          { idtype: "doi", value: "10.1234/EXAMPLE" },
          { idtype: "pmc", value: "pmc7654321" }
        ]
      }
    }
  }), { status: 200, headers: { "content-type": "application/json" } });
}

test("normalizes common PMID forms", () => {
  assert.equal(normalizePmid(" PMID:12345678 "), "12345678");
  assert.equal(normalizePmid("https://pubmed.ncbi.nlm.nih.gov/12345678/"), "12345678");
});

test("rejects malformed PMID input", () => {
  assert.throws(() => normalizePmid("PMC123456"), (error) => {
    assert.ok(error instanceof SourceAdapterError);
    assert.equal(error.code, "INVALID_IDENTIFIER");
    return true;
  });
});

test("resolves PubMed metadata and linked identifiers conservatively", async () => {
  let requestedUrl;
  const adapter = new PubmedAdapter({
    now: () => NOW,
    tool: "evidencelens-tests",
    email: "research@example.com",
    fetch: async (url) => {
      requestedUrl = url;
      return responseFor();
    }
  });

  const result = await adapter.resolve("https://pubmed.ncbi.nlm.nih.gov/12345678/");
  assert.deepEqual(result.artifact.identifiers, {
    pmid: "12345678",
    doi: "10.1234/example",
    pmcid: "PMC7654321",
    url: "https://pubmed.ncbi.nlm.nih.gov/12345678/"
  });
  assert.equal(result.artifact.status, "UNKNOWN");
  assert.equal(result.artifact.version, "PUBMED_ESUMMARY_V2_SNAPSHOT");
  assert.equal(result.artifact.retrievedAt, NOW.toISOString());
  assert.match(result.artifact.metadataHash, /^sha256:[a-f0-9]{64}$/);
  assert.equal(requestedUrl.searchParams.get("db"), "pubmed");
  assert.equal(requestedUrl.searchParams.get("tool"), "evidencelens-tests");
  assert.equal(requestedUrl.searchParams.get("email"), "research@example.com");
});

test("rejects a response that omits the requested PMID", async () => {
  const adapter = new PubmedAdapter({
    now: () => NOW,
    fetch: async () => responseFor("99999999")
  });

  await assert.rejects(adapter.resolve("12345678"), (error) => {
    assert.ok(error instanceof SourceAdapterError);
    assert.equal(error.code, "IDENTIFIER_MISMATCH");
    return true;
  });
});

test("converts invalid JSON into a typed source error", async () => {
  const adapter = new PubmedAdapter({
    fetch: async () => new Response("not json", { status: 200 })
  });

  await assert.rejects(adapter.resolve("12345678"), (error) => {
    assert.ok(error instanceof SourceAdapterError);
    assert.equal(error.code, "SOURCE_RESPONSE_INVALID");
    return true;
  });
});

test("converts HTTP failures into a typed source error", async () => {
  const adapter = new PubmedAdapter({
    fetch: async () => new Response("busy", { status: 503 })
  });

  await assert.rejects(adapter.resolve("12345678"), (error) => {
    assert.ok(error instanceof SourceAdapterError);
    assert.equal(error.code, "SOURCE_UNAVAILABLE");
    return true;
  });
});
