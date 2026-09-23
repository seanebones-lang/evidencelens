import { createHash } from "node:crypto";

import type { SourceArtifact } from "@evidencelens/evidence-schema";

import { hashCanonicalJson } from "./canonical-json.js";
import { SourceAdapterError, type ResolvedSource, type SourceAdapter } from "./types.js";

export const PUBMED_ADAPTER_VERSION = "0.1.0";

interface PubmedArticleId {
  idtype?: string;
  value?: string;
}

export interface PubmedSummary {
  uid: string;
  title?: string;
  pubtype?: string[];
  articleids?: PubmedArticleId[];
  [key: string]: unknown;
}

export interface PubmedSummaryEnvelope {
  header?: {
    type?: string;
    version?: string;
    [key: string]: unknown;
  };
  result: {
    uids: string[];
    [pmid: string]: unknown;
  };
}

export interface PubmedAdapterOptions {
  fetch?: typeof globalThis.fetch;
  now?: () => Date;
  tool?: string;
  email?: string;
  apiKey?: string;
}

export function normalizePmid(input: string): string {
  const normalized = input
    .trim()
    .replace(/^pmid:\s*/i, "")
    .replace(/^https?:\/\/(?:www\.)?pubmed\.ncbi\.nlm\.nih\.gov\//i, "")
    .replace(/\/$/, "");

  if (!/^[1-9]\d*$/.test(normalized)) {
    throw new SourceAdapterError("INVALID_IDENTIFIER", `Invalid PMID: ${input}`);
  }
  return normalized;
}

function sourceIdForPmid(pmid: string): string {
  const digest = createHash("sha256").update(pmid, "utf8").digest("hex").slice(0, 24);
  return `src_pmid_${digest}`;
}

function isPubmedEnvelope(value: unknown, pmid: string): value is PubmedSummaryEnvelope {
  if (!value || typeof value !== "object") return false;
  const result = (value as Record<string, unknown>).result;
  if (!result || typeof result !== "object") return false;
  const resultRecord = result as Record<string, unknown>;
  if (!Array.isArray(resultRecord.uids) || !resultRecord.uids.every((uid) => typeof uid === "string")) {
    return false;
  }
  const summary = resultRecord[pmid];
  return Boolean(summary && typeof summary === "object" && (summary as Record<string, unknown>).uid === pmid);
}

function identifier(summary: PubmedSummary, type: string): string | undefined {
  const match = summary.articleids?.find(
    (entry) => entry.idtype?.toLowerCase() === type && typeof entry.value === "string",
  );
  return match?.value;
}

export class PubmedAdapter implements SourceAdapter<string, PubmedSummaryEnvelope> {
  readonly name = "pubmed";
  readonly version = PUBMED_ADAPTER_VERSION;

  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly now: () => Date;
  private readonly tool: string;
  private readonly email: string | undefined;
  private readonly apiKey: string | undefined;

  constructor(options: PubmedAdapterOptions = {}) {
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.now = options.now ?? (() => new Date());
    this.tool = options.tool ?? "evidencelens";
    this.email = options.email;
    this.apiKey = options.apiKey;
  }

  async resolve(input: string): Promise<ResolvedSource<PubmedSummaryEnvelope>> {
    const pmid = normalizePmid(input);
    const url = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi");
    url.searchParams.set("db", "pubmed");
    url.searchParams.set("id", pmid);
    url.searchParams.set("retmode", "json");
    url.searchParams.set("version", "2.0");
    url.searchParams.set("tool", this.tool);
    if (this.email) url.searchParams.set("email", this.email);
    if (this.apiKey) url.searchParams.set("api_key", this.apiKey);

    let response: Response;
    try {
      response = await this.fetchImpl(url, { headers: { accept: "application/json" } });
    } catch (cause) {
      throw new SourceAdapterError("SOURCE_UNAVAILABLE", `PubMed request failed for PMID ${pmid}`, cause);
    }

    if (!response.ok) {
      throw new SourceAdapterError("SOURCE_UNAVAILABLE", `PubMed returned HTTP ${response.status} for PMID ${pmid}`);
    }

    let snapshot: unknown;
    try {
      snapshot = await response.json();
    } catch (cause) {
      throw new SourceAdapterError("SOURCE_RESPONSE_INVALID", `PubMed returned invalid JSON for PMID ${pmid}`, cause);
    }

    if (!isPubmedEnvelope(snapshot, pmid)) {
      throw new SourceAdapterError(
        "IDENTIFIER_MISMATCH",
        `PubMed response did not contain the requested PMID ${pmid}`,
      );
    }

    const summary = snapshot.result[pmid] as PubmedSummary;
    const checkedAt = this.now().toISOString();
    const doi = identifier(summary, "doi")?.toLowerCase();
    const pmcid = identifier(summary, "pmc")?.toUpperCase();
    const artifact: SourceArtifact = {
      sourceId: sourceIdForPmid(pmid),
      sourceType: summary.pubtype?.[0] ?? "PUBMED_RECORD",
      identifiers: {
        pmid,
        ...(doi ? { doi } : {}),
        ...(pmcid ? { pmcid } : {}),
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      },
      version: "PUBMED_ESUMMARY_V2_SNAPSHOT",
      retrievedAt: checkedAt,
      // Resolution alone does not establish correction or retraction status.
      status: "UNKNOWN",
      statusCheckedAt: checkedAt,
      metadataHash: hashCanonicalJson(snapshot),
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
