import { readFileSync } from "node:fs";

import { Ajv2020, type ErrorObject } from "ajv/dist/2020.js";
import addFormatsImport from "ajv-formats";

import {
  SCHEMA_VERSION,
  type DeterministicAssertion,
  type EvidencePacket,
  type EvidenceSpan,
  type SourceArtifact,
  type ValidationIssue,
  type ValidationResult,
} from "./types.js";

const SHA_256 = /^sha256:[a-f0-9]{64}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;
const schema = JSON.parse(
  readFileSync(new URL("../schema/evidence-packet.schema.json", import.meta.url), "utf8"),
) as object;
const ajv = new Ajv2020({ allErrors: true, strict: true });
const addFormats = addFormatsImport as unknown as (instance: Ajv2020) => Ajv2020;
addFormats(ajv);
const validateSchema = ajv.compile(schema);

function schemaIssue(error: ErrorObject): ValidationIssue {
  const suffix = error.params && "missingProperty" in error.params
    ? `/${String(error.params.missingProperty)}`
    : "";
  return {
    path: `$${error.instancePath}${suffix}`,
    code: `SCHEMA_${error.keyword.toUpperCase()}`,
    message: error.message ?? "schema validation failed",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(
  object: Record<string, unknown>,
  key: string,
  path: string,
  issues: ValidationIssue[],
): void {
  if (typeof object[key] !== "string" || object[key].trim().length === 0) {
    issues.push({ path: `${path}.${key}`, code: "REQUIRED_STRING", message: `${key} must be a non-empty string` });
  }
}

function requireIsoDate(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (typeof value !== "string" || !ISO_DATE.test(value) || Number.isNaN(Date.parse(value))) {
    issues.push({ path, code: "INVALID_TIMESTAMP", message: "must be an RFC 3339 UTC timestamp" });
  }
}

function requireHash(value: unknown, path: string, issues: ValidationIssue[], optional = false): void {
  if (optional && value === undefined) return;
  if (typeof value !== "string" || !SHA_256.test(value)) {
    issues.push({ path, code: "INVALID_SHA256", message: "must use sha256:<64 lowercase hex characters>" });
  }
}

function validateSource(source: unknown, index: number, issues: ValidationIssue[]): source is SourceArtifact {
  const path = `sources[${index}]`;
  if (!isRecord(source)) {
    issues.push({ path, code: "INVALID_OBJECT", message: "source must be an object" });
    return false;
  }

  requireString(source, "sourceId", path, issues);
  requireString(source, "sourceType", path, issues);
  requireString(source, "version", path, issues);
  requireIsoDate(source.retrievedAt, `${path}.retrievedAt`, issues);
  requireIsoDate(source.statusCheckedAt, `${path}.statusCheckedAt`, issues);
  requireHash(source.metadataHash, `${path}.metadataHash`, issues);
  requireHash(source.contentHash, `${path}.contentHash`, issues, true);

  if (!isRecord(source.identifiers) || Object.values(source.identifiers).every((value) => !value)) {
    issues.push({ path: `${path}.identifiers`, code: "IDENTIFIER_REQUIRED", message: "at least one source identifier is required" });
  }
  return true;
}

function validateSpan(span: unknown, index: number, sourceIds: Set<string>, issues: ValidationIssue[]): span is EvidenceSpan {
  const path = `evidenceSpans[${index}]`;
  if (!isRecord(span)) {
    issues.push({ path, code: "INVALID_OBJECT", message: "evidence span must be an object" });
    return false;
  }

  requireString(span, "spanId", path, issues);
  requireString(span, "sourceId", path, issues);
  requireString(span, "verbatim", path, issues);
  requireHash(span.contentHash, `${path}.contentHash`, issues);

  if (typeof span.sourceId === "string" && !sourceIds.has(span.sourceId)) {
    issues.push({ path: `${path}.sourceId`, code: "SOURCE_REF_NOT_FOUND", message: "span sourceId must reference a packet source" });
  }
  if (!isRecord(span.locator) || Object.keys(span.locator).length === 0) {
    issues.push({ path: `${path}.locator`, code: "LOCATOR_REQUIRED", message: "an addressable source locator is required" });
  }
  if (span.verifiedAgainstSource !== true) {
    issues.push({ path: `${path}.verifiedAgainstSource`, code: "SPAN_NOT_VERIFIED", message: "displayable evidence spans must be verified against the preserved source" });
  }
  if (span.epistemicClass !== "OBSERVED") {
    issues.push({ path: `${path}.epistemicClass`, code: "SPAN_NOT_OBSERVED", message: "a verified verbatim span must be OBSERVED" });
  }
  return true;
}

function validateAssertion(
  assertion: unknown,
  index: number,
  referenceIds: Set<string>,
  issues: ValidationIssue[],
): assertion is DeterministicAssertion {
  const path = `deterministicAssertions[${index}]`;
  if (!isRecord(assertion)) {
    issues.push({ path, code: "INVALID_OBJECT", message: "assertion must be an object" });
    return false;
  }

  requireString(assertion, "assertionId", path, issues);
  requireString(assertion, "assertionType", path, issues);
  requireString(assertion, "checker", path, issues);
  requireString(assertion, "checkerVersion", path, issues);
  requireIsoDate(assertion.checkedAt, `${path}.checkedAt`, issues);

  if (!Array.isArray(assertion.inputRefs) || assertion.inputRefs.length === 0) {
    issues.push({ path: `${path}.inputRefs`, code: "INPUT_REF_REQUIRED", message: "at least one input reference is required" });
  } else {
    for (const [refIndex, ref] of assertion.inputRefs.entries()) {
      if (typeof ref !== "string" || !referenceIds.has(ref)) {
        issues.push({ path: `${path}.inputRefs[${refIndex}]`, code: "INPUT_REF_NOT_FOUND", message: "input reference must identify a packet claim, source, or span" });
      }
    }
  }
  if (assertion.epistemicClass !== "OBSERVED") {
    issues.push({ path: `${path}.epistemicClass`, code: "ASSERTION_NOT_OBSERVED", message: "deterministic assertions must be OBSERVED" });
  }
  return true;
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

export function validateEvidencePacket(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) {
    return { valid: false, issues: [{ path: "$", code: "INVALID_OBJECT", message: "packet must be an object" }] };
  }

  if (!validateSchema(input)) {
    issues.push(...(validateSchema.errors ?? []).map(schemaIssue));
  }

  requireString(input, "packetId", "$", issues);
  if (input.schemaVersion !== SCHEMA_VERSION) {
    issues.push({ path: "$.schemaVersion", code: "UNSUPPORTED_SCHEMA_VERSION", message: `schemaVersion must be ${SCHEMA_VERSION}` });
  }

  if (!isRecord(input.claim)) {
    issues.push({ path: "$.claim", code: "INVALID_CLAIM", message: "claim must be an object" });
  } else {
    requireString(input.claim, "claimId", "claim", issues);
    requireString(input.claim, "verbatim", "claim", issues);
    requireString(input.claim, "contextType", "claim", issues);
  }

  const sources = Array.isArray(input.sources) ? input.sources : [];
  if (sources.length === 0) {
    issues.push({ path: "$.sources", code: "SOURCE_REQUIRED", message: "at least one source is required" });
  }
  sources.forEach((source, index) => validateSource(source, index, issues));
  const sourceIds = new Set(
    sources.filter(isRecord).map((source) => source.sourceId).filter((id): id is string => typeof id === "string"),
  );

  const spans = Array.isArray(input.evidenceSpans) ? input.evidenceSpans : [];
  if (spans.length === 0) {
    issues.push({ path: "$.evidenceSpans", code: "SPAN_REQUIRED", message: "at least one verified evidence span is required" });
  }
  spans.forEach((span, index) => validateSpan(span, index, sourceIds, issues));
  const spanIds = new Set(
    spans.filter(isRecord).map((span) => span.spanId).filter((id): id is string => typeof id === "string"),
  );

  const claimId = isRecord(input.claim) && typeof input.claim.claimId === "string" ? input.claim.claimId : undefined;
  const referenceIds = new Set([...sourceIds, ...spanIds, ...(claimId ? [claimId] : [])]);

  const assertions = Array.isArray(input.deterministicAssertions) ? input.deterministicAssertions : [];
  assertions.forEach((assertion, index) => validateAssertion(assertion, index, referenceIds, issues));

  const allIds = [
    ...(claimId ? [claimId] : []),
    ...sourceIds,
    ...spanIds,
    ...assertions.filter(isRecord).map((assertion) => assertion.assertionId).filter((id): id is string => typeof id === "string"),
  ];
  for (const duplicate of findDuplicates(allIds)) {
    issues.push({ path: "$", code: "DUPLICATE_ID", message: `identifier ${duplicate} is used more than once` });
  }

  if (!isRecord(input.reviewContext)) {
    issues.push({ path: "$.reviewContext", code: "INVALID_REVIEW_CONTEXT", message: "reviewContext must be an object" });
  } else {
    requireString(input.reviewContext, "domain", "reviewContext", issues);
    if (input.reviewContext.intendedUse !== "RESEARCH_TRIAGE") {
      issues.push({ path: "reviewContext.intendedUse", code: "UNSUPPORTED_INTENDED_USE", message: "only RESEARCH_TRIAGE is currently supported" });
    }
    if (!Array.isArray(input.reviewContext.requestedChecks)) {
      issues.push({ path: "reviewContext.requestedChecks", code: "INVALID_CHECKS", message: "requestedChecks must be an array" });
    }
  }

  if (!isRecord(input.provenance)) {
    issues.push({ path: "$.provenance", code: "INVALID_PROVENANCE", message: "provenance must be an object" });
  } else {
    requireString(input.provenance, "createdBy", "provenance", issues);
    requireString(input.provenance, "creationActivityId", "provenance", issues);
    requireString(input.provenance, "softwareVersion", "provenance", issues);
    requireIsoDate(input.provenance.createdAt, "provenance.createdAt", issues);
  }

  return issues.length === 0 ? { valid: true, issues: [] } : { valid: false, issues };
}

export function assertEvidencePacket(input: unknown): asserts input is EvidencePacket {
  const result = validateEvidencePacket(input);
  if (!result.valid) {
    const detail = result.issues.map((issue) => `${issue.path} [${issue.code}]: ${issue.message}`).join("\n");
    throw new TypeError(`Invalid EvidencePacket:\n${detail}`);
  }
}
