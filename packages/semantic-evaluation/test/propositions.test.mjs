import { test } from "node:test";
import assert from "node:assert/strict";
import { claimHash, preparePropositionCases, mapPropositionAnswers } from "../dist/index.js";

const source = { caseId: "C1", claim: "A happened and B happened." };
const split = { caseId: "C1", sourceClaimHash: claimHash(source.claim),
  propositions: [{ propositionId: "P1", text: "A happened." }, { propositionId: "P2", text: "B happened." }],
  author: "GPT development", reviewed: false };

test("preparation is replayable and keeps review provenance", () => {
  const first = preparePropositionCases([source], [split]);
  assert.deepEqual(first, preparePropositionCases([source], [split]));
  assert.equal(first[0].reviewed, false);
  assert.match(first[0].splitHash, /^sha256:[a-f0-9]{64}$/);
});

test("rejects stale, missing, and duplicate splits", () => {
  assert.throws(() => preparePropositionCases([source], [{ ...split, sourceClaimHash: claimHash("old") }]));
  assert.throws(() => preparePropositionCases([source], []));
  assert.throws(() => preparePropositionCases([source], [{ ...split, propositions: [split.propositions[0], split.propositions[0]] }]));
});

test("neutral answers detect mixed evidence without directional field names", () => {
  const prepared = preparePropositionCases([source], [split])[0];
  const result = mapPropositionAnswers(prepared, [
    { propositionId: "P1", supportAnswer: "YES", contradictionAnswer: "NO" },
    { propositionId: "P2", supportAnswer: "NO", contradictionAnswer: "YES" },
  ]);
  assert.deepEqual(result, { label: "MIXED", internallyConflictingIds: [] });
  assert.throws(() => mapPropositionAnswers(prepared, [
    { propositionId: "P1", supportAnswer: "YES", contradictionAnswer: "NO" },
    { propositionId: "P1", supportAnswer: "NO", contradictionAnswer: "YES" },
  ]));
});

test("unresolved contradiction stays insufficient when there is support", () => {
  const prepared = preparePropositionCases([source], [split])[0];
  const result = mapPropositionAnswers(prepared, [
    { propositionId: "P1", supportAnswer: "YES", contradictionAnswer: "NO" },
    { propositionId: "P2", supportAnswer: "NO", contradictionAnswer: "INSUFFICIENT_EVIDENCE" },
  ]);
  assert.equal(result.label, "INSUFFICIENT_EVIDENCE");
});
