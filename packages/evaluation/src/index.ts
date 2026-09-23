import { createHash } from "node:crypto";

export const EVALUATION_RUNNER_VERSION = "0.1.0";

export const CASE_OPERATIONS = [
  "VALID_PACKET",
  "SPAN_NOT_FOUND",
  "CONTENT_HASH_MISMATCH",
  "SOURCE_UNAUTHORIZED",
  "INVALID_IDENTIFIER",
] as const;

export type EvaluationOperation = typeof CASE_OPERATIONS[number];

export interface EvaluationCase {
  caseId: string;
  operation: EvaluationOperation;
  pmcid: string;
  verbatim?: string;
  expectedOutcome: "PASS" | "EXPECTED_FAILURE";
  expectedErrorCode?: string;
}

export interface EvaluationManifest {
  experiment: "EXP-EL001";
  manifestVersion: string;
  partition: "DEVELOPMENT_SEED" | "DEVELOPMENT" | "BLIND_HOLDOUT" | "TRANSFER";
  frozen: boolean;
  cases: EvaluationCase[];
}

export interface EvaluationCaseResult {
  caseId: string;
  operation: EvaluationOperation;
  passed: boolean;
  observedOutcome: "PASS" | "EXPECTED_FAILURE" | "UNEXPECTED_FAILURE" | "UNEXPECTED_SUCCESS";
  expectedErrorCode?: string;
  observedErrorCode?: string;
  details?: Record<string, unknown>;
}

export interface EvaluationScore {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
}

export class EvaluationManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvaluationManifestError";
  }
}

export function validateEvaluationManifest(input: unknown): asserts input is EvaluationManifest {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new EvaluationManifestError("Manifest must be an object");
  }
  const manifest = input as Record<string, unknown>;
  if (manifest.experiment !== "EXP-EL001") throw new EvaluationManifestError("experiment must be EXP-EL001");
  if (typeof manifest.manifestVersion !== "string" || !/^\d+\.\d+\.\d+$/.test(manifest.manifestVersion)) {
    throw new EvaluationManifestError("manifestVersion must be semantic version text");
  }
  if (!["DEVELOPMENT_SEED", "DEVELOPMENT", "BLIND_HOLDOUT", "TRANSFER"].includes(String(manifest.partition))) {
    throw new EvaluationManifestError("partition is unsupported");
  }
  if (typeof manifest.frozen !== "boolean") throw new EvaluationManifestError("frozen must be boolean");
  if (!Array.isArray(manifest.cases) || manifest.cases.length === 0) {
    throw new EvaluationManifestError("Manifest must contain at least one case");
  }
  const ids = new Set<string>();
  for (const [index, rawCase] of manifest.cases.entries()) {
    if (!rawCase || typeof rawCase !== "object" || Array.isArray(rawCase)) {
      throw new EvaluationManifestError(`cases[${index}] must be an object`);
    }
    const testCase = rawCase as Record<string, unknown>;
    if (typeof testCase.caseId !== "string" || !testCase.caseId) {
      throw new EvaluationManifestError(`cases[${index}].caseId is required`);
    }
    if (ids.has(testCase.caseId)) throw new EvaluationManifestError(`Duplicate caseId ${testCase.caseId}`);
    ids.add(testCase.caseId);
    if (!CASE_OPERATIONS.includes(testCase.operation as EvaluationOperation)) {
      throw new EvaluationManifestError(`cases[${index}].operation is unsupported`);
    }
    if (typeof testCase.pmcid !== "string" || !testCase.pmcid) {
      throw new EvaluationManifestError(`cases[${index}].pmcid is required`);
    }
    if (testCase.expectedOutcome !== "PASS" && testCase.expectedOutcome !== "EXPECTED_FAILURE") {
      throw new EvaluationManifestError(`cases[${index}].expectedOutcome is unsupported`);
    }
    if (testCase.expectedOutcome === "EXPECTED_FAILURE" && typeof testCase.expectedErrorCode !== "string") {
      throw new EvaluationManifestError(`cases[${index}] expected failures require expectedErrorCode`);
    }
    if (["VALID_PACKET", "SPAN_NOT_FOUND", "CONTENT_HASH_MISMATCH"].includes(String(testCase.operation))
      && typeof testCase.verbatim !== "string") {
      throw new EvaluationManifestError(`cases[${index}] operation requires verbatim text`);
    }
  }
}

export function hashManifest(manifest: EvaluationManifest): string {
  const canonicalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, child]) => [key, canonicalize(child)]),
      );
    }
    return value;
  };
  const canonical = JSON.stringify(canonicalize(manifest));
  return `sha256:${createHash("sha256").update(canonical, "utf8").digest("hex")}`;
}

export function scoreEvaluationResults(results: EvaluationCaseResult[]): EvaluationScore {
  const passed = results.filter((result) => result.passed).length;
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    passRate: results.length === 0 ? 0 : passed / results.length,
  };
}
