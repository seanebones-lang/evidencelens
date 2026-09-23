# EXP-EL003 JEV pilot runner freeze

**Status:** Frozen before any JEV prediction

**Date:** 2026-09-23

This freeze records the executable boundary for the exploratory development
pilot. At the time of this freeze, no JEV prediction had been requested and
`jev-pilot-responses.jsonl` did not exist.

## Frozen runtime

- Python: 3.12
- Official package: `typesafe-sdk==0.7.0`
- Model alias: `jev-latest`
- Runner version: `1.0.0`
- Maximum attempts per case: 3
- SDK-internal retries per attempt: 0
- Frozen cases: 80
- Questions per case: 2
- Question-definition canonical hash:
  `sha256:a941079865d3bf01ccbbed4c377d23061a933c4e0b9c25c9cd938ef4ae7fc5c4`

## Frozen artifact hashes

- Runner SHA-256:
  `cde46b51f30991e50ebe815d7850fb99b71e95689636c25c336c544549828a7c`
- Runner test SHA-256:
  `3cc4d5eb2b6552d147a9f3c4cd5098751df72a60041df91de44274505ed6b8f4`
- Requirements SHA-256:
  `fb163fe0912deeed9abb29a0ffa3fea7a1a6afa34aa7180d093cad5fec1cbfe0`
- Blinded JEV input SHA-256:
  `f11e25ddef28c5ca965f1298faf7906dff57ff0e33b849abe2124c92bf0c9907`

## Execution behavior

The runner validates the frozen input byte hash and canonical case hash before
execution. It sends only each blinded case and the two frozen typed questions.
It appends and fsyncs one JSON Lines record after each completed case, allowing
an interrupted run to resume without repeating completed case IDs.

Each successful record retains the exact decoded response body, selected
choices, probabilities, confidence, resolved model, request ID, token usage,
HTTP status, latency, completion time, attempt count, and prior retry errors.
Malformed or unrecognized output is an explicit error and is never coerced.
The API credential is read only from `TYPESAFE_API_KEY` and is never written to
the output.

The runner does not read the GPT-authored provisional-reference file and does
not calculate evaluation metrics. Scoring occurs only after the complete raw
prediction artifact has been preserved.
