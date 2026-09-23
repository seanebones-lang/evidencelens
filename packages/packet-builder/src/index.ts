import { createHash } from "node:crypto";

import {
  SCHEMA_VERSION,
  assertEvidencePacket,
  type Claim,
  type DeterministicAssertion,
  type EvidencePacket,
  type EvidenceSpan,
  type ReviewContext,
  type SourceArtifact,
} from "@evidencelens/evidence-schema";
import {
  canonicalJson,
  type ResolvedSource,
  type ResolvedSourceStatus,
} from "@evidencelens/source-adapters";

export const PACKET_BUILDER_VERSION = "0.1.0";

export type PacketAssemblyErrorCode =
  | "SOURCE_REQUIRED"
  | "DUPLICATE_SOURCE"
  | "SNAPSHOT_HASH_MISMATCH"
  | "STATUS_IDENTIFIER_MISMATCH"
  | "INVALID_SOURCE_REQUEST"
  | "LINKED_IDENTIFIER_MISSING"
  | "LINKED_IDENTIFIER_MISMATCH"
  | "SPAN_SOURCE_NOT_RESOLVED"
  | "SPAN_NOT_VERIFIED"
  | "PACKET_INVALID";

export class PacketAssemblyError extends Error {
  constructor(
    public readonly code: PacketAssemblyErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PacketAssemblyError";
  }
}

export interface PacketSourceInput<TSnapshot = unknown, TStatusSnapshot = unknown> {
  resolved: ResolvedSource<TSnapshot>;
  status?: ResolvedSourceStatus<TStatusSnapshot>;
}

export interface PreservedSnapshot {
  snapshotId: string;
  sourceId: string;
  purpose: "IDENTITY_METADATA" | "SOURCE_STATUS";
  mediaType: "application/json" | "application/xml" | "text/plain";
  payload: string;
  hash: string;
  capturedAt: string;
  producer: string;
  producerVersion: string;
}

export interface AssemblePacketInput {
  claim: Claim;
  sources: PacketSourceInput[];
  evidenceSpans: EvidenceSpan[];
  deterministicAssertions?: DeterministicAssertion[];
  reviewContext: ReviewContext;
  provenance: {
    createdBy: string;
    createdAt: string;
    creationActivityId: string;
    softwareVersion: string;
  };
}

export interface AssembledPacket {
  packet: EvidencePacket;
  snapshots: PreservedSnapshot[];
  packetHash: string;
}

export interface ScientificSourceRequest {
  pmid?: string;
  doi?: string;
}

export interface SourceResolver<TSnapshot = unknown> {
  resolve(input: string): Promise<ResolvedSource<TSnapshot>>;
}

export interface StatusResolver<TSnapshot = unknown> {
  resolve(input: string): Promise<ResolvedSourceStatus<TSnapshot>>;
}

export interface ScientificSourceResolvers {
  pubmed?: SourceResolver;
  pubmedStatus?: StatusResolver;
  crossref?: SourceResolver;
}

export interface ResolvedScientificSource {
  sources: PacketSourceInput[];
  deterministicAssertions: DeterministicAssertion[];
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function snapshotPayload(snapshot: unknown): { mediaType: PreservedSnapshot["mediaType"]; payload: string } {
  if (typeof snapshot === "string") {
    const mediaType = snapshot.trimStart().startsWith("<") ? "application/xml" : "text/plain";
    return { mediaType, payload: snapshot };
  }
  return { mediaType: "application/json", payload: canonicalJson(snapshot) };
}

function preserveSnapshot(input: {
  sourceId: string;
  purpose: PreservedSnapshot["purpose"];
  snapshot: unknown;
  expectedHash: string;
  capturedAt: string;
  producer: string;
  producerVersion: string;
}): PreservedSnapshot {
  const encoded = snapshotPayload(input.snapshot);
  const actualHash = sha256(encoded.payload);
  if (actualHash !== input.expectedHash) {
    throw new PacketAssemblyError(
      "SNAPSHOT_HASH_MISMATCH",
      `${input.purpose} snapshot for ${input.sourceId} hashed to ${actualHash}, expected ${input.expectedHash}`,
    );
  }
  const snapshotId = `snap_${actualHash.slice("sha256:".length, "sha256:".length + 24)}`;
  return {
    snapshotId,
    sourceId: input.sourceId,
    purpose: input.purpose,
    mediaType: encoded.mediaType,
    payload: encoded.payload,
    hash: actualHash,
    capturedAt: input.capturedAt,
    producer: input.producer,
    producerVersion: input.producerVersion,
  };
}

function applyStatus(artifact: SourceArtifact, status: ResolvedSourceStatus): SourceArtifact {
  if (artifact.identifiers.pmid !== status.identifier.pmid) {
    throw new PacketAssemblyError(
      "STATUS_IDENTIFIER_MISMATCH",
      `Status result for PMID ${status.identifier.pmid} cannot be applied to source ${artifact.sourceId}`,
    );
  }
  return { ...artifact, status: status.status, statusCheckedAt: status.checkedAt };
}

function statusAssertion(source: SourceArtifact, status: ResolvedSourceStatus): DeterministicAssertion {
  return {
    assertionId: `assert_status_${source.sourceId.replace(/^src_/, "")}`,
    assertionType: "SOURCE_STATUS",
    value: status.status,
    inputRefs: [source.sourceId],
    checker: status.resolver,
    checkerVersion: status.resolverVersion,
    checkedAt: status.checkedAt,
    epistemicClass: "OBSERVED",
  };
}

export async function resolveScientificSource(
  request: ScientificSourceRequest,
  resolvers: ScientificSourceResolvers,
): Promise<ResolvedScientificSource> {
  if (!request.pmid && !request.doi) {
    throw new PacketAssemblyError("INVALID_SOURCE_REQUEST", "A PMID, DOI, or both are required");
  }
  if (request.pmid && (!resolvers.pubmed || !resolvers.pubmedStatus)) {
    throw new PacketAssemblyError(
      "INVALID_SOURCE_REQUEST",
      "PubMed identity and status resolvers are required for a PMID request",
    );
  }
  if (request.doi && !resolvers.crossref) {
    throw new PacketAssemblyError("INVALID_SOURCE_REQUEST", "A Crossref resolver is required for a DOI request");
  }

  const [pubmed, status, crossref] = await Promise.all([
    request.pmid ? resolvers.pubmed!.resolve(request.pmid) : undefined,
    request.pmid ? resolvers.pubmedStatus!.resolve(request.pmid) : undefined,
    request.doi ? resolvers.crossref!.resolve(request.doi) : undefined,
  ]);

  const sources: PacketSourceInput[] = [];
  if (pubmed && status) sources.push({ resolved: pubmed, status });
  if (crossref) sources.push({ resolved: crossref });

  const deterministicAssertions: DeterministicAssertion[] = [];
  if (pubmed && crossref) {
    const pubmedDoi = pubmed.artifact.identifiers.doi;
    const crossrefDoi = crossref.artifact.identifiers.doi;
    if (!pubmedDoi || !crossrefDoi) {
      throw new PacketAssemblyError(
        "LINKED_IDENTIFIER_MISSING",
        "Both PubMed and Crossref records must expose a DOI for deterministic linkage",
      );
    }
    if (pubmedDoi !== crossrefDoi) {
      throw new PacketAssemblyError(
        "LINKED_IDENTIFIER_MISMATCH",
        `PubMed DOI ${pubmedDoi} does not match Crossref DOI ${crossrefDoi}`,
      );
    }
    deterministicAssertions.push({
      assertionId: `assert_doi_link_${sha256(pubmedDoi).slice("sha256:".length, "sha256:".length + 24)}`,
      assertionType: "IDENTIFIER_LINK_MATCH",
      value: true,
      inputRefs: [pubmed.artifact.sourceId, crossref.artifact.sourceId],
      checker: "packet-builder",
      checkerVersion: PACKET_BUILDER_VERSION,
      checkedAt: [pubmed.artifact.retrievedAt, crossref.artifact.retrievedAt].sort().at(-1)!,
      epistemicClass: "OBSERVED",
    });
  }

  return { sources, deterministicAssertions };
}

export function assembleEvidencePacket(input: AssemblePacketInput): AssembledPacket {
  if (input.sources.length === 0) {
    throw new PacketAssemblyError("SOURCE_REQUIRED", "At least one resolved source is required");
  }

  const sourceIds = input.sources.map(({ resolved }) => resolved.artifact.sourceId);
  if (new Set(sourceIds).size !== sourceIds.length) {
    throw new PacketAssemblyError("DUPLICATE_SOURCE", "Resolved source IDs must be unique");
  }

  const sources: SourceArtifact[] = [];
  const snapshots: PreservedSnapshot[] = [];
  const generatedAssertions: DeterministicAssertion[] = [];

  for (const sourceInput of input.sources) {
    const { resolved, status } = sourceInput;
    const source = status ? applyStatus(resolved.artifact, status) : resolved.artifact;
    sources.push(source);
    snapshots.push(preserveSnapshot({
      sourceId: source.sourceId,
      purpose: "IDENTITY_METADATA",
      snapshot: resolved.snapshot,
      expectedHash: source.metadataHash,
      capturedAt: source.retrievedAt,
      producer: resolved.adapter,
      producerVersion: resolved.adapterVersion,
    }));

    if (status) {
      snapshots.push(preserveSnapshot({
        sourceId: source.sourceId,
        purpose: "SOURCE_STATUS",
        snapshot: status.snapshot,
        expectedHash: status.snapshotHash,
        capturedAt: status.checkedAt,
        producer: status.resolver,
        producerVersion: status.resolverVersion,
      }));
      generatedAssertions.push(statusAssertion(source, status));
    }
  }

  const resolvedIds = new Set(sourceIds);
  for (const span of input.evidenceSpans) {
    if (!resolvedIds.has(span.sourceId)) {
      throw new PacketAssemblyError(
        "SPAN_SOURCE_NOT_RESOLVED",
        `Evidence span ${span.spanId} references unresolved source ${span.sourceId}`,
      );
    }
    if (!span.verifiedAgainstSource || span.epistemicClass !== "OBSERVED") {
      throw new PacketAssemblyError(
        "SPAN_NOT_VERIFIED",
        `Evidence span ${span.spanId} is not deterministically verified against its source`,
      );
    }
  }

  const packetBody = {
    schemaVersion: SCHEMA_VERSION,
    claim: input.claim,
    sources,
    evidenceSpans: input.evidenceSpans,
    deterministicAssertions: [...(input.deterministicAssertions ?? []), ...generatedAssertions],
    reviewContext: input.reviewContext,
    provenance: input.provenance,
  };
  const packetHash = sha256(canonicalJson(packetBody));
  const packet: EvidencePacket = {
    packetId: `pkt_${packetHash.slice("sha256:".length, "sha256:".length + 24)}`,
    ...packetBody,
  };

  try {
    assertEvidencePacket(packet);
  } catch (cause) {
    throw new PacketAssemblyError("PACKET_INVALID", "Assembled packet failed canonical validation", cause);
  }

  return { packet, snapshots, packetHash };
}
