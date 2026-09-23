import assert from "node:assert/strict";
import test from "node:test";

import { PmcFullTextAdapter, SourceAdapterError, normalizePmcid } from "../dist/index.js";

const NOW = new Date("2026-09-23T16:00:00Z");

function articleXml({ pmcid = "PMC7320186", license = "https://creativecommons.org/licenses/by/4.0/" } = {}) {
  return `<?xml version="1.0"?><pmc-articleset><article article-type="research-article"><front><article-meta>
    <article-id pub-id-type="pmcid">${pmcid}</article-id>
    <article-id pub-id-type="pmcid-ver">${pmcid}.1</article-id>
    <article-id pub-id-type="pmid">32591513</article-id>
    <article-id pub-id-type="doi">10.1038/S41597-020-0543-2</article-id>
    <permissions><license license-type="OpenAccess"><ali:license_ref xmlns:ali="http://www.niso.org/schemas/ali/1.0/">${license}</ali:license_ref></license></permissions>
  </article-meta></front><body><sec id="S1"><title>Results</title><p id="P1">Exact evidence text.</p></sec></body></article></pmc-articleset>`;
}

test("normalizes PMCID forms", () => {
  assert.equal(normalizePmcid(" pmcid:pmc7320186 "), "PMC7320186");
  assert.equal(normalizePmcid("https://pmc.ncbi.nlm.nih.gov/articles/PMC7320186/"), "PMC7320186");
});

test("resolves explicitly licensed PMC XML as retained full text", async () => {
  const xml = articleXml();
  const adapter = new PmcFullTextAdapter({ now: () => NOW, fetch: async () => new Response(xml) });
  const result = await adapter.resolve("PMC7320186");
  assert.equal(result.artifact.identifiers.pmcid, "PMC7320186");
  assert.equal(result.artifact.identifiers.pmid, "32591513");
  assert.equal(result.artifact.identifiers.doi, "10.1038/s41597-020-0543-2");
  assert.equal(result.artifact.version, "PMC7320186.1");
  assert.equal(result.artifact.retentionAuthority, "OPEN_LICENSE");
  assert.equal(result.artifact.license, "https://creativecommons.org/licenses/by/4.0/");
  assert.equal(result.artifact.contentHash, result.artifact.metadataHash);
  assert.match(result.artifact.contentHash, /^sha256:[a-f0-9]{64}$/);
});

test("rejects full text without an explicit recognized reusable license", async () => {
  const adapter = new PmcFullTextAdapter({ fetch: async () => new Response(articleXml({ license: "limited research use" })) });
  await assert.rejects(adapter.resolve("PMC7320186"), (error) => {
    assert.ok(error instanceof SourceAdapterError);
    assert.equal(error.code, "SOURCE_UNAUTHORIZED");
    return true;
  });
});

test("rejects XML for a different PMCID", async () => {
  const adapter = new PmcFullTextAdapter({ fetch: async () => new Response(articleXml({ pmcid: "PMC9999999" })) });
  await assert.rejects(adapter.resolve("PMC7320186"), (error) => {
    assert.ok(error instanceof SourceAdapterError);
    assert.equal(error.code, "IDENTIFIER_MISMATCH");
    return true;
  });
});
