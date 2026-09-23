import { createHash } from "node:crypto";

import type { SourceArtifact } from "@evidencelens/evidence-schema";

import { hashCanonicalJson } from "./canonical-json.js";
import { SourceAdapterError, type ResolvedSource, type SourceAdapter } from "./types.js";

export const CROSSREF_ADAPTER_VERSION = "0.1.0";

export interface CrossrefWork {
  DOI: string;
  title?: string[];
  type?: string;
  URL?: string;
  license?: Array<{ URL?: string }>;
  indexed?: { "date-time"?: string };
  deposited?: { "date-time"?: string };
  [key: string]: unknown;
}

interface CrossrefEnvelope {
  status: string;
  "message-type": string;
  message: CrossrefWork;
}

export interface CrossrefAdapterOptions {
  fetch?: typeof globalThis.fetch;
  now?: () => Date;
  mailto?: string;
  userAgent?: string;
}

export function normalizeDoi(input: string): string {
  const normalized = input
    .trim()
    .replace(/^doi:\s*/i, "")
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .toLowerCase();

  if (!/^10\.\d{4,9}\/[\S]+$/i.test(normalized)) {
    throw new SourceAdapterError("INVALID_IDENTIFIER", `Invalid DOI: ${input}`);
  }
  return normalized;
}

function sourceIdForDoi(doi: string): string {
  const digest = createHash("sha256").update(doi, "utf8").digest("hex").slice(0, 24);
  return `src_doi_${digest}`;
}

function isCrossrefEnvelope(value: unknown): value is CrossrefEnvelope {
  if (!value || typeof value !== "object") return false;
  const envelope = value as Record<string, unknown>;
  if (envelope.status !== "ok" || !envelope.message || typeof envelope.message !== "object") return false;
  return typeof (envelope.message as Record<string, unknown>).DOI === "string";
}

export class CrossrefAdapter implements SourceAdapter<string, CrossrefEnvelope> {
  readonly name = "crossref";
  readonly version = CROSSREF_ADAPTER_VERSION;

  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly now: () => Date;
  private readonly mailto: string | undefined;
  private readonly userAgent: string;

  constructor(options: CrossrefAdapterOptions = {}) {
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.now = options.now ?? (() => new Date());
    this.mailto = options.mailto;
    this.userAgent = options.userAgent ?? "EvidenceLens/0.1 (https://github.com/seanebones-lang/evidencelens)";
  }

  async resolve(input: string): Promise<ResolvedSource<CrossrefEnvelope>> {
    const doi = normalizeDoi(input);
    const url = new URL(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
    if (this.mailto) url.searchParams.set("mailto", this.mailto);

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        headers: {
          accept: "application/json",
          "user-agent": this.userAgent,
        },
      });
    } catch (cause) {
      throw new SourceAdapterError("SOURCE_UNAVAILABLE", `Crossref request failed for ${doi}`, cause);
    }

    if (!response.ok) {
      throw new SourceAdapterError("SOURCE_UNAVAILABLE", `Crossref returned HTTP ${response.status} for ${doi}`);
    }

    let snapshot: unknown;
    try {
      snapshot = await response.json();
    } catch (cause) {
      throw new SourceAdapterError("SOURCE_RESPONSE_INVALID", `Crossref returned invalid JSON for ${doi}`, cause);
    }

    if (!isCrossrefEnvelope(snapshot)) {
      throw new SourceAdapterError("SOURCE_RESPONSE_INVALID", `Crossref response shape was invalid for ${doi}`);
    }

    const returnedDoi = normalizeDoi(snapshot.message.DOI);
    if (returnedDoi !== doi) {
      throw new SourceAdapterError(
        "IDENTIFIER_MISMATCH",
        `Crossref returned DOI ${returnedDoi} for requested DOI ${doi}`,
      );
    }

    const checkedAt = this.now().toISOString();
    const license = snapshot.message.license?.find((entry) => typeof entry.URL === "string")?.URL;
    const artifact: SourceArtifact = {
      sourceId: sourceIdForDoi(doi),
      sourceType: snapshot.message.type ?? "SCHOLARLY_WORK",
      identifiers: {
        doi,
        ...(snapshot.message.URL ? { url: snapshot.message.URL } : {}),
      },
      version: "CROSSREF_METADATA_SNAPSHOT",
      retrievedAt: checkedAt,
      // Absence of an update signal is not proof that a work is current.
      status: "UNKNOWN",
      statusCheckedAt: checkedAt,
      metadataHash: hashCanonicalJson(snapshot),
      ...(license ? { license } : {}),
      retentionAuthority: "PUBLIC_METADATA",
    };

    return {
      artifact,
      snapshot,
      adapter: this.name,
      adapterVersion: this.version,
    };
  }
}
