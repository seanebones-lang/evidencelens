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
  claimType?: string;
  fieldPath?: string;
  expectedOutcome: "PASS" | "EXPECTED_FAILURE";
  expectedErrorCode?: string;
}

export interface EvaluationSourceExpectation {
  pmcid: string;
  pmid: string;
  doi: string;
  version: string;
  license: string;
  contentHash: string;
  defaultFieldPath?: string;
  fieldPaths?: Record<string, string>;
}

export interface EvaluationManifest {
  experiment: "EXP-EL001";
  manifestVersion: string;
  partition: "DEVELOPMENT_SEED" | "DEVELOPMENT" | "BLIND_HOLDOUT" | "TRANSFER";
  frozen: boolean;
  sources?: EvaluationSourceExpectation[];
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
  const requiresFrozenSources = manifest.frozen === true && manifest.partition !== "DEVELOPMENT_SEED";
  if (requiresFrozenSources && (!Array.isArray(manifest.sources) || manifest.sources.length === 0)) {
    throw new EvaluationManifestError("Frozen evaluation partitions require source expectations");
  }
  const sourceIds = new Set<string>();
  const sourceDefaultPaths = new Map<string, string>();
  const sourceCasePaths = new Map<string, string>();
  if (manifest.sources !== undefined) {
    if (!Array.isArray(manifest.sources)) throw new EvaluationManifestError("sources must be an array");
    for (const [index, rawSource] of manifest.sources.entries()) {
      if (!rawSource || typeof rawSource !== "object" || Array.isArray(rawSource)) {
        throw new EvaluationManifestError(`sources[${index}] must be an object`);
      }
      const source = rawSource as Record<string, unknown>;
      for (const field of ["pmcid", "pmid", "doi", "version", "license", "contentHash"] as const) {
        if (typeof source[field] !== "string" || !source[field]) {
          throw new EvaluationManifestError(`sources[${index}].${field} is required`);
        }
      }
      if (!/^sha256:[a-f0-9]{64}$/.test(String(source.contentHash))) {
        throw new EvaluationManifestError(`sources[${index}].contentHash must be a SHA-256 digest`);
      }
      if (sourceIds.has(String(source.pmcid))) throw new EvaluationManifestError(`Duplicate source ${source.pmcid}`);
      sourceIds.add(String(source.pmcid));
      if (typeof source.defaultFieldPath === "string" && source.defaultFieldPath) {
        sourceDefaultPaths.set(String(source.pmcid), source.defaultFieldPath);
      }
      if (source.fieldPaths !== undefined) {
        if (!source.fieldPaths || typeof source.fieldPaths !== "object" || Array.isArray(source.fieldPaths)) {
          throw new EvaluationManifestError(`sources[${index}].fieldPaths must be an object`);
        }
        for (const [caseId, fieldPath] of Object.entries(source.fieldPaths as Record<string, unknown>)) {
          if (typeof fieldPath !== "string" || !fieldPath) {
            throw new EvaluationManifestError(`sources[${index}].fieldPaths.${caseId} is required`);
          }
          sourceCasePaths.set(caseId, fieldPath);
        }
      }
    }
  }
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
    if (manifest.partition !== "DEVELOPMENT_SEED" && testCase.operation === "VALID_PACKET"
      && (typeof testCase.fieldPath !== "string" || !testCase.fieldPath)
      && !sourceDefaultPaths.has(String(testCase.pmcid)) && !sourceCasePaths.has(String(testCase.caseId))) {
      throw new EvaluationManifestError(`cases[${index}] valid packets require fieldPath outside the seed partition`);
    }
    if (requiresFrozenSources && !sourceIds.has(String(testCase.pmcid))) {
      throw new EvaluationManifestError(`cases[${index}].pmcid has no frozen source expectation`);
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
