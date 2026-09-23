export const SEMANTIC_LABELS = [
  "SUPPORTED",
  "CONTRADICTED",
  "MIXED",
  "INSUFFICIENT_EVIDENCE",
] as const;

export type SemanticLabel = typeof SEMANTIC_LABELS[number];

export const ATOMIC_ANSWERS = ["YES", "NO", "INSUFFICIENT_EVIDENCE"] as const;
export type AtomicAnswer = typeof ATOMIC_ANSWERS[number];

export type SemanticPartition = "DEVELOPMENT" | "BLIND_HOLDOUT" | "TRANSFER";

export interface BlindedEvidence {
  spanId: string;
  verbatim: string;
  section?: string;
}

export interface SemanticCase {
  caseId: string;
  packetId: string;
  packetHash: string;
  claim: string;
  evidence: BlindedEvidence[];
  domain: string;
  partition: SemanticPartition;
  sourceGroupId: string;
  nearDuplicateGroupId: string;
  origin: "NATURAL" | "SYNTHETIC";
  excludedContextConfirmed: boolean;
}

export interface AnnotationRecord {
  annotationId: string;
  caseId: string;
  annotatorId: string;
  label: SemanticLabel;
  rubricVersion: string;
  createdAt: string;
}

export interface BlindedAnnotationCase {
  caseId: string;
  claim: string;
  evidence: BlindedEvidence[];
  domain: string;
}

export interface BlindedAssignment {
  assignmentId: string;
  slot: "A" | "B";
  rubricVersion: string;
  cases: BlindedAnnotationCase[];
}

export interface AdjudicatedLabel {
  caseId: string;
  label: SemanticLabel;
  adjudicatorId: string;
  rubricVersion: string;
  sourceAnnotationIds: string[];
  createdAt: string;
}

export interface SemanticPrediction {
  caseId: string;
  supportAnswer: AtomicAnswer;
  contradictionAnswer: AtomicAnswer;
}

export interface ExpandedSemanticPrediction {
  caseId: string;
  supportAnswer: AtomicAnswer;
  contradictionAnswer: AtomicAnswer;
  scopeMismatchAnswer: AtomicAnswer;
  designLimitationAnswer: AtomicAnswer;
}

export interface SemanticMetrics {
  total: number;
  accuracy: number;
  macroF1: number;
  abstentionRate: number;
  nonAbstentionCoverage: number;
  criticalFalseReassuranceCount: number;
  criticalFalseReassuranceRate: number;
  confusionMatrix: Record<SemanticLabel, Record<SemanticLabel, number>>;
  perClass: Record<SemanticLabel, { precision: number; recall: number; f1: number; support: number }>;
}

export class SemanticEvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SemanticEvaluationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function requireNonEmptyString(record: Record<string, unknown>, field: string, path: string): void {
  if (typeof record[field] !== "string" || !record[field]) {
    throw new SemanticEvaluationError(`${path}.${field} is required`);
  }
}

export function validateSemanticCases(input: unknown): asserts input is SemanticCase[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new SemanticEvaluationError("Semantic cases must be a non-empty array");
  }
  const ids = new Set<string>();
  for (const [index, value] of input.entries()) {
    if (!isRecord(value)) throw new SemanticEvaluationError(`cases[${index}] must be an object`);
    for (const field of ["caseId", "packetId", "packetHash", "claim", "domain", "sourceGroupId", "nearDuplicateGroupId"] as const) {
      requireNonEmptyString(value, field, `cases[${index}]`);
    }
    if (!/^sha256:[a-f0-9]{64}$/.test(String(value.packetHash))) {
      throw new SemanticEvaluationError(`cases[${index}].packetHash must be a SHA-256 digest`);
    }
    if (!Array.isArray(value.evidence) || value.evidence.length === 0) {
      throw new SemanticEvaluationError(`cases[${index}].evidence must be non-empty`);
    }
    for (const [evidenceIndex, evidence] of value.evidence.entries()) {
      if (!isRecord(evidence)) throw new SemanticEvaluationError(`cases[${index}].evidence[${evidenceIndex}] must be an object`);
      requireNonEmptyString(evidence, "spanId", `cases[${index}].evidence[${evidenceIndex}]`);
      requireNonEmptyString(evidence, "verbatim", `cases[${index}].evidence[${evidenceIndex}]`);
    }
    if (!["DEVELOPMENT", "BLIND_HOLDOUT", "TRANSFER"].includes(String(value.partition))) {
      throw new SemanticEvaluationError(`cases[${index}].partition is unsupported`);
    }
    if (value.origin !== "NATURAL" && value.origin !== "SYNTHETIC") {
      throw new SemanticEvaluationError(`cases[${index}].origin is unsupported`);
    }
    if (value.excludedContextConfirmed !== true) {
      throw new SemanticEvaluationError(`cases[${index}] must confirm excluded-context screening`);
    }
    const caseId = String(value.caseId);
    if (ids.has(caseId)) throw new SemanticEvaluationError(`Duplicate caseId ${caseId}`);
    ids.add(caseId);
  }
}

export function validatePartitionIsolation(cases: SemanticCase[]): void {
  const sourcePartitions = new Map<string, SemanticPartition>();
  const duplicatePartitions = new Map<string, SemanticPartition>();
  for (const testCase of cases) {
    for (const [group, partition, label] of [
      [testCase.sourceGroupId, sourcePartitions, "source"],
      [testCase.nearDuplicateGroupId, duplicatePartitions, "near-duplicate"],
    ] as const) {
      const existing = partition.get(group);
      if (existing && existing !== testCase.partition) {
        throw new SemanticEvaluationError(`${label} group ${group} crosses ${existing} and ${testCase.partition}`);
      }
      partition.set(group, testCase.partition);
    }
  }
}

function deterministicOrder(caseId: string, seed: string, slot: string): string {
  return createHash("sha256").update(`${seed}|${slot}|${caseId}`, "utf8").digest("hex");
}

export function createBlindedAssignments(
  cases: SemanticCase[],
  seed: string,
  rubricVersion: string,
): BlindedAssignment[] {
  validateSemanticCases(cases);
  validatePartitionIsolation(cases);
  if (!seed) throw new SemanticEvaluationError("Assignment seed is required");
  if (!rubricVersion) throw new SemanticEvaluationError("Rubric version is required");
  return (["A", "B"] as const).map((slot) => {
    const blinded = cases.map(({ caseId, claim, evidence, domain }) => ({ caseId, claim, evidence, domain }))
      .sort((left, right) => deterministicOrder(left.caseId, seed, slot).localeCompare(deterministicOrder(right.caseId, seed, slot)));
    const identity = JSON.stringify({ seed, slot, rubricVersion, caseIds: blinded.map((item) => item.caseId) });
    return {
      assignmentId: `assignment_${createHash("sha256").update(identity, "utf8").digest("hex").slice(0, 24)}`,
      slot,
      rubricVersion,
      cases: blinded,
    };
  });
}

export function validateIndependentAnnotations(
  cases: SemanticCase[],
  annotations: AnnotationRecord[],
  minimumAnnotators = 2,
): void {
  const caseIds = new Set(cases.map((item) => item.caseId));
  const seen = new Set<string>();
  const annotatorsByCase = new Map<string, Set<string>>();
  for (const [index, annotation] of annotations.entries()) {
    if (!caseIds.has(annotation.caseId)) {
      throw new SemanticEvaluationError(`annotations[${index}] references unknown case ${annotation.caseId}`);
    }
    if (!SEMANTIC_LABELS.includes(annotation.label)) {
      throw new SemanticEvaluationError(`annotations[${index}].label is unsupported`);
    }
    for (const field of ["annotationId", "annotatorId", "rubricVersion", "createdAt"] as const) {
      if (!annotation[field]) throw new SemanticEvaluationError(`annotations[${index}].${field} is required`);
    }
    const identity = `${annotation.caseId}|${annotation.annotatorId}`;
    if (seen.has(identity)) throw new SemanticEvaluationError(`Duplicate annotation ${identity}`);
    seen.add(identity);
    const annotators = annotatorsByCase.get(annotation.caseId) ?? new Set<string>();
    annotators.add(annotation.annotatorId);
    annotatorsByCase.set(annotation.caseId, annotators);
  }
  for (const testCase of cases) {
    if ((annotatorsByCase.get(testCase.caseId)?.size ?? 0) < minimumAnnotators) {
      throw new SemanticEvaluationError(`${testCase.caseId} lacks ${minimumAnnotators} independent annotations`);
    }
  }
}

export function mapAtomicAnswers(prediction: SemanticPrediction): SemanticLabel {
  const { supportAnswer: support, contradictionAnswer: contradiction } = prediction;
  if (!ATOMIC_ANSWERS.includes(support) || !ATOMIC_ANSWERS.includes(contradiction)) {
    throw new SemanticEvaluationError("Prediction contains an unsupported atomic answer");
  }
  if (support === "YES" && contradiction === "YES") return "MIXED";
  if (support === "YES" && contradiction === "NO") return "SUPPORTED";
  if (support === "NO" && contradiction === "YES") return "CONTRADICTED";
  return "INSUFFICIENT_EVIDENCE";
}

export function mapExpandedAtomicAnswers(prediction: ExpandedSemanticPrediction): SemanticLabel {
  const {
    supportAnswer: support,
    contradictionAnswer: contradiction,
    scopeMismatchAnswer: scopeMismatch,
    designLimitationAnswer: designLimitation,
  } = prediction;
  const answers = [support, contradiction, scopeMismatch, designLimitation];
  if (answers.some((answer) => !ATOMIC_ANSWERS.includes(answer))) {
    throw new SemanticEvaluationError("Expanded prediction contains an unsupported atomic answer");
  }

  const hasQualification = scopeMismatch === "YES" || designLimitation === "YES";
  if (support === "YES" && (contradiction === "YES" || hasQualification)) return "MIXED";
  if (contradiction === "YES") return "CONTRADICTED";
  if (support === "YES"
    && contradiction === "NO"
    && scopeMismatch === "NO"
    && designLimitation === "NO") return "SUPPORTED";
  return "INSUFFICIENT_EVIDENCE";
}

export function cohenKappa(left: AnnotationRecord[], right: AnnotationRecord[]): number {
  const leftMap = new Map(left.map((item) => [item.caseId, item.label]));
  const rightMap = new Map(right.map((item) => [item.caseId, item.label]));
  if (leftMap.size !== left.length || rightMap.size !== right.length) {
    throw new SemanticEvaluationError("Each annotator must have at most one label per case");
  }
  const caseIds = [...leftMap.keys()].filter((caseId) => rightMap.has(caseId));
  if (caseIds.length === 0) throw new SemanticEvaluationError("Annotators have no cases in common");
  let observedAgreement = 0;
  const leftCounts = new Map<SemanticLabel, number>();
  const rightCounts = new Map<SemanticLabel, number>();
  for (const caseId of caseIds) {
    const leftLabel = leftMap.get(caseId)!;
    const rightLabel = rightMap.get(caseId)!;
    if (leftLabel === rightLabel) observedAgreement += 1;
    leftCounts.set(leftLabel, (leftCounts.get(leftLabel) ?? 0) + 1);
    rightCounts.set(rightLabel, (rightCounts.get(rightLabel) ?? 0) + 1);
  }
  const observed = observedAgreement / caseIds.length;
  const expected = SEMANTIC_LABELS.reduce((sum, label) => sum
    + ((leftCounts.get(label) ?? 0) / caseIds.length) * ((rightCounts.get(label) ?? 0) / caseIds.length), 0);
  return expected === 1 ? (observed === 1 ? 1 : 0) : (observed - expected) / (1 - expected);
}

function emptyMatrix(): Record<SemanticLabel, Record<SemanticLabel, number>> {
  return Object.fromEntries(SEMANTIC_LABELS.map((gold) => [gold,
    Object.fromEntries(SEMANTIC_LABELS.map((predicted) => [predicted, 0])),
  ])) as Record<SemanticLabel, Record<SemanticLabel, number>>;
}

export function scoreSemanticPredictions(
  gold: AdjudicatedLabel[],
  predictions: SemanticPrediction[],
): SemanticMetrics {
  if (gold.length === 0) throw new SemanticEvaluationError("Gold labels cannot be empty");
  const predictionMap = new Map(predictions.map((item) => [item.caseId, item]));
  if (predictionMap.size !== predictions.length) throw new SemanticEvaluationError("Prediction case IDs must be unique");
  const matrix = emptyMatrix();
  let correct = 0;
  let abstained = 0;
  let criticalPopulation = 0;
  let criticalFalseReassuranceCount = 0;
  for (const item of gold) {
    const prediction = predictionMap.get(item.caseId);
    if (!prediction) throw new SemanticEvaluationError(`Missing prediction for ${item.caseId}`);
    const predicted = mapAtomicAnswers(prediction);
    matrix[item.label][predicted] += 1;
    if (predicted === item.label) correct += 1;
    if (predicted === "INSUFFICIENT_EVIDENCE") abstained += 1;
    if (item.label === "CONTRADICTED" || item.label === "MIXED") {
      criticalPopulation += 1;
      if (predicted === "SUPPORTED") criticalFalseReassuranceCount += 1;
    }
  }
  const perClass = Object.fromEntries(SEMANTIC_LABELS.map((label) => {
    const tp = matrix[label][label];
    const fp = SEMANTIC_LABELS.reduce((sum, goldLabel) => sum + (goldLabel === label ? 0 : matrix[goldLabel][label]), 0);
    const fn = SEMANTIC_LABELS.reduce((sum, predicted) => sum + (predicted === label ? 0 : matrix[label][predicted]), 0);
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    return [label, { precision, recall, f1, support: tp + fn }];
  })) as SemanticMetrics["perClass"];
  const macroF1 = SEMANTIC_LABELS.reduce((sum, label) => sum + perClass[label].f1, 0) / SEMANTIC_LABELS.length;
  return {
    total: gold.length,
    accuracy: correct / gold.length,
    macroF1,
    abstentionRate: abstained / gold.length,
    nonAbstentionCoverage: 1 - (abstained / gold.length),
    criticalFalseReassuranceCount,
    criticalFalseReassuranceRate: criticalPopulation === 0 ? 0 : criticalFalseReassuranceCount / criticalPopulation,
    confusionMatrix: matrix,
    perClass,
  };
}
import { createHash } from "node:crypto";
