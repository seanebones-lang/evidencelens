import { createHash } from "node:crypto";
import { ATOMIC_ANSWERS, SemanticEvaluationError, type AtomicAnswer, type SemanticCase, type SemanticLabel } from "./index.js";

export interface PropositionSplit {
  caseId: string;
  sourceClaimHash: string;
  propositions: { propositionId: string; text: string }[];
  author: string;
  reviewed: boolean;
}

export interface PreparedPropositionCase {
  caseId: string;
  sourceClaimHash: string;
  splitHash: string;
  author: string;
  reviewed: boolean;
  propositions: { propositionId: string; text: string }[];
}

export interface PropositionAnswer {
  propositionId: string;
  supportAnswer: AtomicAnswer;
  contradictionAnswer: AtomicAnswer;
}

export function claimHash(claim: string): string {
  return `sha256:${createHash("sha256").update(claim, "utf8").digest("hex")}`;
}

/** Prepare supplied splits without generating, validating, or labeling their meaning. */
export function preparePropositionCases(cases: SemanticCase[], splits: PropositionSplit[]): PreparedPropositionCase[] {
  if (!Array.isArray(splits) || splits.length !== cases.length) {
    throw new SemanticEvaluationError("Exactly one supplied split is required per case");
  }
  const byId = new Map(cases.map((item) => [item.caseId, item]));
  if (byId.size !== cases.length) throw new SemanticEvaluationError("Duplicate source case ID");
  const seen = new Set<string>();
  return splits.map((split) => {
    if (!split || typeof split.caseId !== "string" || seen.has(split.caseId)) {
      throw new SemanticEvaluationError("Split case IDs must be unique strings");
    }
    seen.add(split.caseId);
    const source = byId.get(split.caseId);
    if (!source) throw new SemanticEvaluationError(`Unknown split case ${split.caseId}`);
    if (split.sourceClaimHash !== claimHash(source.claim)) {
      throw new SemanticEvaluationError(`Source claim changed for ${split.caseId}`);
    }
    if (!Array.isArray(split.propositions) || split.propositions.length < 2) {
      throw new SemanticEvaluationError(`${split.caseId} requires at least two propositions`);
    }
    if (typeof split.author !== "string" || !split.author.trim() || typeof split.reviewed !== "boolean") {
      throw new SemanticEvaluationError(`${split.caseId} requires author and review status`);
    }
    const ids = new Set<string>();
    for (const proposition of split.propositions) {
      if (!proposition || typeof proposition.propositionId !== "string" || !proposition.propositionId.trim() ||
          ids.has(proposition.propositionId) || typeof proposition.text !== "string" || !proposition.text.trim()) {
        throw new SemanticEvaluationError(`${split.caseId} has an invalid or duplicate proposition`);
      }
      ids.add(proposition.propositionId);
    }
    const canonical = JSON.stringify({ caseId: split.caseId, sourceClaimHash: split.sourceClaimHash,
      propositions: split.propositions.map(({ propositionId, text }) => ({ propositionId, text })),
      author: split.author, reviewed: split.reviewed });
    return { ...JSON.parse(canonical), splitHash: claimHash(canonical) } as PreparedPropositionCase;
  });
}

/** Strictly score a complete neutral split; no answer can be silently dropped. */
export function mapPropositionAnswers(
  prepared: PreparedPropositionCase,
  answers: PropositionAnswer[],
): { label: SemanticLabel; internallyConflictingIds: string[] } {
  if (!Array.isArray(answers) || answers.length !== prepared.propositions.length) {
    throw new SemanticEvaluationError("One answer pair is required per proposition");
  }
  const expected = new Set(prepared.propositions.map((item) => item.propositionId));
  const seen = new Set<string>();
  for (const answer of answers) {
    if (!answer || !expected.has(answer.propositionId) || seen.has(answer.propositionId) ||
        !ATOMIC_ANSWERS.includes(answer.supportAnswer) || !ATOMIC_ANSWERS.includes(answer.contradictionAnswer)) {
      throw new SemanticEvaluationError("Invalid, unknown, or duplicate proposition answer");
    }
    seen.add(answer.propositionId);
  }
  const support = answers.some((item) => item.supportAnswer === "YES");
  const contradiction = answers.some((item) => item.contradictionAnswer === "YES");
  const unresolved = answers.some((item) => item.supportAnswer === "INSUFFICIENT_EVIDENCE" ||
    item.contradictionAnswer === "INSUFFICIENT_EVIDENCE");
  const label: SemanticLabel = support && contradiction ? "MIXED"
    : contradiction ? "CONTRADICTED"
    : support && !unresolved ? "SUPPORTED"
    : "INSUFFICIENT_EVIDENCE";
  return { label, internallyConflictingIds: answers.filter((item) =>
    item.supportAnswer === "YES" && item.contradictionAnswer === "YES").map((item) => item.propositionId) };
}
