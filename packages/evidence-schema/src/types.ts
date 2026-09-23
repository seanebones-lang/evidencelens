export const SCHEMA_VERSION = "0.1.0" as const;

export type EpistemicClass = "OBSERVED" | "INFERRED" | "GENERATED";

export type SourceStatus =
  | "CURRENT"
  | "CORRECTED"
  | "RETRACTED"
  | "WITHDRAWN"
  | "EXPRESSION_OF_CONCERN"
  | "UNKNOWN";

export type ClaimType =
  | "CAUSAL"
  | "ASSOCIATIONAL"
  | "COMPARATIVE"
  | "QUANTITATIVE_EFFECT"
  | "PREVALENCE"
  | "SAFETY"
  | "MECHANISM"
  | "GENERALIZATION"
  | "REPLICATION"
  | "NO_EFFECT"
  | "METHODOLOGICAL"
  | "UNKNOWN";

export interface ArtifactLocation {
  artifactId?: string;
  section?: string;
  page?: number;
  paragraph?: number;
  table?: string;
  cell?: string;
  figure?: string;
  fieldPath?: string;
  startOffset?: number;
  endOffset?: number;
}

export interface Claim {
  claimId: string;
  verbatim: string;
  contextType: string;
  location?: ArtifactLocation;
  claimType?: ClaimType;
  normalizedText?: string;
  normalizationConfirmed?: boolean;
  epistemicClass: EpistemicClass;
}

export interface SourceIdentifiers {
  doi?: string;
  pmid?: string;
  pmcid?: string;
  nct?: string;
  dataciteDoi?: string;
  url?: string;
}

export interface SourceArtifact {
  sourceId: string;
  sourceType: string;
  identifiers: SourceIdentifiers;
  version: string;
  retrievedAt: string;
  status: SourceStatus;
  statusCheckedAt: string;
  contentHash?: string;
  metadataHash: string;
  license?: string;
  retentionAuthority: "PUBLIC_METADATA" | "OPEN_LICENSE" | "USER_AUTHORIZED" | "PROJECT_AUTHORED";
}

export interface EvidenceSpan {
  spanId: string;
  sourceId: string;
  locator: ArtifactLocation;
  verbatim: string;
  contentHash: string;
  extractionMethod: "USER_SELECTED" | "STRUCTURED_FIELD" | "MODEL_PROPOSED" | "PARSER_EXTRACTED";
  extractorVersion?: string;
  verifiedAgainstSource: boolean;
  epistemicClass: EpistemicClass;
}

export interface DeterministicAssertion {
  assertionId: string;
  assertionType: string;
  value: string | number | boolean | null;
  inputRefs: string[];
  checker: string;
  checkerVersion: string;
  checkedAt: string;
  epistemicClass: "OBSERVED";
}

export interface ReviewContext {
  domain: string;
  intendedUse: "RESEARCH_TRIAGE";
  requestedChecks: string[];
}

export interface ProvenanceRecord {
  createdBy: string;
  createdAt: string;
  creationActivityId: string;
  softwareVersion: string;
}

export interface EvidencePacket {
  packetId: string;
  schemaVersion: typeof SCHEMA_VERSION;
  claim: Claim;
  sources: SourceArtifact[];
  evidenceSpans: EvidenceSpan[];
  deterministicAssertions: DeterministicAssertion[];
  reviewContext: ReviewContext;
  provenance: ProvenanceRecord;
}

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
}

export type ValidationResult =
  | { valid: true; issues: [] }
  | { valid: false; issues: ValidationIssue[] };

