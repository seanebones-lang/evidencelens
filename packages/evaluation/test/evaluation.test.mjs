import assert from "node:assert/strict";
import test from "node:test";

import {
  EvaluationManifestError,
  hashManifest,
  scoreEvaluationResults,
  validateEvaluationManifest,
} from "../dist/index.js";

function manifest() {
  return {
    experiment: "EXP-EL001",
    manifestVersion: "0.1.0",
    partition: "DEVELOPMENT_SEED",
    frozen: false,
    cases: [{
      caseId: "CASE-001",
      operation: "VALID_PACKET",
      pmcid: "PMC7320186",
      verbatim: "Exact text.",
      expectedOutcome: "PASS"
    }]
  };
}

test("accepts a valid development-seed manifest", () => {
  assert.doesNotThrow(() => validateEvaluationManifest(manifest()));
});

test("rejects duplicate case IDs", () => {
  const input = manifest();
  input.cases.push({ ...input.cases[0] });
  assert.throws(() => validateEvaluationManifest(input), EvaluationManifestError);
});

test("requires an error code for expected failures", () => {
  const input = manifest();
  input.cases[0] = {
    caseId: "CASE-001",
    operation: "SPAN_NOT_FOUND",
    pmcid: "PMC7320186",
    expectedOutcome: "EXPECTED_FAILURE"
  };
  assert.throws(() => validateEvaluationManifest(input), EvaluationManifestError);
});

test("manifest hashing is deterministic", () => {
  assert.equal(hashManifest(manifest()), hashManifest(manifest()));
  assert.match(hashManifest(manifest()), /^sha256:[a-f0-9]{64}$/);
});

test("manifest hashing changes when nested case content changes", () => {
  const changed = manifest();
  changed.cases[0].verbatim = "Different exact text.";
  assert.notEqual(hashManifest(manifest()), hashManifest(changed));
});

test("scores pass and failure counts", () => {
  assert.deepEqual(scoreEvaluationResults([
    { caseId: "A", operation: "VALID_PACKET", passed: true, observedOutcome: "PASS" },
    { caseId: "B", operation: "SPAN_NOT_FOUND", passed: false, observedOutcome: "UNEXPECTED_SUCCESS" }
  ]), { total: 2, passed: 1, failed: 1, passRate: 0.5 });
});
