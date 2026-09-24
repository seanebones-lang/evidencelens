import assert from "node:assert/strict";
import test from "node:test";

import {
  SemanticEvaluationError,
  cohenKappa,
  createBlindedAssignments,
  mapAtomicAnswers,
  mapDirectAtomicAnswers,
  mapExpandedAtomicAnswers,
  scoreSemanticPredictions,
  validateIndependentAnnotations,
  validatePartitionIsolation,
  validateSemanticCases,
} from "../dist/index.js";

const cases = [{
  caseId: "SEM-001",
  packetId: "pkt_1",
  packetHash: `sha256:${"a".repeat(64)}`,
  claim: "Intervention A reduced outcome B.",
  evidence: [{ spanId: "span_1", verbatim: "Intervention A reduced outcome B." }],
  domain: "biomedical-literature",
  partition: "DEVELOPMENT",
  sourceGroupId: "source_1",
  nearDuplicateGroupId: "group_1",
  origin: "NATURAL",
  excludedContextConfirmed: true,
}];

test("validates addressable semantic cases", () => {
  assert.doesNotThrow(() => validateSemanticCases(cases));
  assert.throws(() => validateSemanticCases([{ ...cases[0], excludedContextConfirmed: false }]), SemanticEvaluationError);
});

test("requires independent annotation coverage", () => {
  const base = { annotationId: "ann_1", caseId: "SEM-001", label: "SUPPORTED", rubricVersion: "1.0.0", createdAt: "2026-09-23T15:00:00.000Z" };
  assert.throws(() => validateIndependentAnnotations(cases, [{ ...base, annotatorId: "A" }]), /lacks 2/);
  assert.doesNotThrow(() => validateIndependentAnnotations(cases, [
    { ...base, annotatorId: "A" },
    { ...base, annotationId: "ann_2", annotatorId: "B" },
  ]));
});

test("creates deterministic isolated annotation assignments without packet metadata", () => {
  const second = { ...cases[0], caseId: "SEM-002", packetId: "pkt_2", packetHash: `sha256:${"b".repeat(64)}`, sourceGroupId: "source_2", nearDuplicateGroupId: "group_2" };
  const assignments = createBlindedAssignments([cases[0], second], "seed-001", "1.0.0");
  assert.equal(assignments.length, 2);
  assert.notEqual(assignments[0].assignmentId, assignments[1].assignmentId);
  assert.deepEqual(assignments, createBlindedAssignments([cases[0], second], "seed-001", "1.0.0"));
  assert.equal("packetId" in assignments[0].cases[0], false);
  assert.equal("partition" in assignments[0].cases[0], false);
});

test("rejects source and near-duplicate leakage across partitions", () => {
  assert.throws(() => validatePartitionIsolation([
    cases[0],
    { ...cases[0], caseId: "SEM-002", partition: "BLIND_HOLDOUT" },
  ]), /crosses DEVELOPMENT and BLIND_HOLDOUT/);
});

test("maps paired atomic answers without inventing certainty", () => {
  assert.equal(mapAtomicAnswers({ caseId: "A", supportAnswer: "YES", contradictionAnswer: "NO" }), "SUPPORTED");
  assert.equal(mapAtomicAnswers({ caseId: "B", supportAnswer: "NO", contradictionAnswer: "YES" }), "CONTRADICTED");
  assert.equal(mapAtomicAnswers({ caseId: "C", supportAnswer: "YES", contradictionAnswer: "YES" }), "MIXED");
  assert.equal(mapAtomicAnswers({ caseId: "D", supportAnswer: "NO", contradictionAnswer: "NO" }), "INSUFFICIENT_EVIDENCE");
  assert.equal(mapAtomicAnswers({ caseId: "E", supportAnswer: "INSUFFICIENT_EVIDENCE", contradictionAnswer: "YES" }), "INSUFFICIENT_EVIDENCE");
});

test("maps strict direct answers with explicit contradiction taking precedence", () => {
  assert.equal(mapDirectAtomicAnswers({ caseId: "A", supportAnswer: "YES", contradictionAnswer: "NO" }), "SUPPORTED");
  assert.equal(mapDirectAtomicAnswers({ caseId: "B", supportAnswer: "NO", contradictionAnswer: "YES" }), "CONTRADICTED");
  assert.equal(mapDirectAtomicAnswers({ caseId: "C", supportAnswer: "YES", contradictionAnswer: "YES" }), "MIXED");
  assert.equal(mapDirectAtomicAnswers({ caseId: "D", supportAnswer: "INSUFFICIENT_EVIDENCE", contradictionAnswer: "YES" }), "CONTRADICTED");
  assert.equal(mapDirectAtomicAnswers({ caseId: "E", supportAnswer: "NO", contradictionAnswer: "NO" }), "INSUFFICIENT_EVIDENCE");
  assert.throws(() => mapDirectAtomicAnswers({ caseId: "F", supportAnswer: "MAYBE", contradictionAnswer: "NO" }), SemanticEvaluationError);
});

test("maps expanded decisions conservatively and distinguishes qualification", () => {
  const prediction = (supportAnswer, contradictionAnswer, scopeMismatchAnswer, designLimitationAnswer) => ({
    caseId: "V2", supportAnswer, contradictionAnswer, scopeMismatchAnswer, designLimitationAnswer,
  });
  assert.equal(mapExpandedAtomicAnswers(prediction("YES", "NO", "NO", "NO")), "SUPPORTED");
  assert.equal(mapExpandedAtomicAnswers(prediction("NO", "YES", "NO", "NO")), "CONTRADICTED");
  assert.equal(mapExpandedAtomicAnswers(prediction("INSUFFICIENT_EVIDENCE", "YES", "NO", "NO")), "CONTRADICTED");
  assert.equal(mapExpandedAtomicAnswers(prediction("YES", "NO", "YES", "NO")), "MIXED");
  assert.equal(mapExpandedAtomicAnswers(prediction("YES", "NO", "NO", "YES")), "MIXED");
  assert.equal(mapExpandedAtomicAnswers(prediction("YES", "YES", "NO", "NO")), "MIXED");
  assert.equal(mapExpandedAtomicAnswers(prediction("YES", "NO", "INSUFFICIENT_EVIDENCE", "NO")), "INSUFFICIENT_EVIDENCE");
  assert.equal(mapExpandedAtomicAnswers(prediction("NO", "NO", "YES", "NO")), "INSUFFICIENT_EVIDENCE");
  assert.throws(() => mapExpandedAtomicAnswers(prediction("MAYBE", "NO", "NO", "NO")), SemanticEvaluationError);
});

test("computes Cohen's kappa from paired independent labels", () => {
  const record = (caseId, annotatorId, label) => ({ annotationId: `${caseId}_${annotatorId}`, caseId, annotatorId, label, rubricVersion: "1.0.0", createdAt: "2026-09-23T15:00:00.000Z" });
  const left = [record("A", "L", "SUPPORTED"), record("B", "L", "CONTRADICTED"), record("C", "L", "MIXED"), record("D", "L", "INSUFFICIENT_EVIDENCE")];
  const right = [record("A", "R", "SUPPORTED"), record("B", "R", "CONTRADICTED"), record("C", "R", "MIXED"), record("D", "R", "INSUFFICIENT_EVIDENCE")];
  assert.equal(cohenKappa(left, right), 1);
  right[3] = record("D", "R", "SUPPORTED");
  assert.ok(cohenKappa(left, right) < 1);
});

test("scores all classes and isolates false reassurance", () => {
  const gold = [
    ["A", "SUPPORTED"], ["B", "CONTRADICTED"], ["C", "MIXED"], ["D", "INSUFFICIENT_EVIDENCE"],
  ].map(([caseId, label]) => ({ caseId, label, adjudicatorId: "Z", rubricVersion: "1.0.0", sourceAnnotationIds: ["1", "2"], createdAt: "2026-09-23T15:00:00.000Z" }));
  const metrics = scoreSemanticPredictions(gold, [
    { caseId: "A", supportAnswer: "YES", contradictionAnswer: "NO" },
    { caseId: "B", supportAnswer: "YES", contradictionAnswer: "NO" },
    { caseId: "C", supportAnswer: "YES", contradictionAnswer: "YES" },
    { caseId: "D", supportAnswer: "NO", contradictionAnswer: "NO" },
  ]);
  assert.equal(metrics.accuracy, 0.75);
  assert.equal(metrics.abstentionRate, 0.25);
  assert.equal(metrics.nonAbstentionCoverage, 0.75);
  assert.equal(metrics.criticalFalseReassuranceCount, 1);
  assert.equal(metrics.criticalFalseReassuranceRate, 0.5);
  assert.equal(metrics.confusionMatrix.CONTRADICTED.SUPPORTED, 1);
  assert.equal(metrics.perClass.MIXED.recall, 1);
});
