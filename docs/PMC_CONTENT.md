# Licensed PMC content and exact spans

EvidenceLens currently accepts full-text PMC XML only when the article supplies an explicit, recognized Creative Commons or public-domain license URL.

## Acquisition

`PmcFullTextAdapter` retrieves JATS XML through NCBI EFetch, verifies the returned PMCID, extracts linked PMID/DOI identifiers and the PMC version, and preserves the XML byte-for-byte. The same SHA-256 digest is recorded as the initial metadata and content hash.

Merely being readable on PMC is not sufficient. Articles without a recognized reusable license URL fail with `SOURCE_UNAUTHORIZED`. Article-specific license terms remain authoritative.

## Span verification

`verifyPmcExactSpan`:

1. requires `OPEN_LICENSE` retention authority and a recorded license;
2. hashes the supplied XML and compares it with the source artifact;
3. parses ordered JATS content from the abstract and body;
4. normalizes whitespace while preserving inline text order;
5. searches for the exact supplied text;
6. rejects zero or multiple matches; and
7. emits an `OBSERVED` span with a JATS field path, offsets, text hash, and verifier version.

The verifier does not perform fuzzy matching, paraphrase detection, OCR, or model-assisted selection.

## First live smoke run

Run the reproducible PMC smoke path with:

```bash
EVIDENCELENS_RUN_AT=2026-09-23T17:00:00.000Z \
  node research/EXP-EL001-packet-validity/scripts/build-pmc-smoke-packet.mjs --summary
```

Remove `--summary` to emit the complete bundle, including preserved XML payloads.

## Official references

- [PMC Open Access Subset](https://pmc.ncbi.nlm.nih.gov/tools/openftlist/)
- [PMC developer APIs](https://pmc.ncbi.nlm.nih.gov/tools/developers/)
- [NCBI EFetch documentation](https://www.ncbi.nlm.nih.gov/books/NBK25499/#chapter4.EFetch)
