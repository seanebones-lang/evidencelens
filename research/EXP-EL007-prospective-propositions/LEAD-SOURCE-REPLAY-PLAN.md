# EXP-EL007 lead source replay and publication-status check

**Status:** Pre-run screening rule; no case or label decision.

Take all 14 pairing leads from `AUTHORING-LEADS-001.json` in recorded order.
Resolve each PMC article again. Compare PMCID, PMID, DOI, version, license,
and full XML SHA-256 against the previously recorded screen. Verify the exact
Conclusion and Results passages at their recorded field paths with the
deterministic span verifier. Record each resulting span ID and the number of
addressable body paragraphs, without claiming that body context has been
reviewed.

For a source that passes replay, resolve its PMID through the existing PubMed
status resolver and retain the result, signal list, timestamp, and response
hash. `UNKNOWN` means no explicit status signal was found by this resolver;
it must not be described as confirmed current. A correction, retraction,
withdrawal, expression of concern, source drift, or provider error stays
visible in the report for human triage. Do not replace failed articles or
alter the 14-source denominator.

Pace all provider requests by at least 400 ms. This pass does not judge claim
truth, article quality, full-context sufficiency, or semantic labels.
