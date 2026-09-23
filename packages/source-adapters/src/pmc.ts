import { createHash } from "node:crypto";

import type { SourceArtifact } from "@evidencelens/evidence-schema";
import { XMLParser } from "fast-xml-parser";

import { SourceAdapterError, type ResolvedSource, type SourceAdapter } from "./types.js";

export const PMC_FULL_TEXT_ADAPTER_VERSION = "0.1.0";

export interface PmcFullTextAdapterOptions {
  fetch?: typeof globalThis.fetch;
  now?: () => Date;
  tool?: string;
  email?: string;
  apiKey?: string;
}

type XmlNode = Record<string, unknown>;

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function asNode(value: unknown): XmlNode | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as XmlNode : undefined;
}

function text(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  const node = asNode(value);
  return typeof node?.["#text"] === "string" ? node["#text"] : undefined;
}

export function normalizePmcid(input: string): string {
  const normalized = input
    .trim()
    .replace(/^pmcid:\s*/i, "")
    .replace(/^https?:\/\/(?:www\.)?pmc\.ncbi\.nlm\.nih\.gov\/articles\//i, "")
    .replace(/\/$/, "")
    .toUpperCase();
  if (!/^PMC[1-9]\d*$/.test(normalized)) {
    throw new SourceAdapterError("INVALID_IDENTIFIER", `Invalid PMCID: ${input}`);
  }
  return normalized;
}

function sourceIdForPmcid(pmcid: string): string {
  return `src_pmc_${createHash("sha256").update(pmcid, "utf8").digest("hex").slice(0, 24)}`;
}

function isReusableLicense(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase().replace(/\/$/, "");
    if (host !== "creativecommons.org" && host !== "www.creativecommons.org") return false;
    return /^\/licenses\/(?:by|by-sa|by-nd|by-nc|by-nc-sa|by-nc-nd)\/\d\.\d$/.test(path)
      || /^\/publicdomain\/(?:zero|mark)\/\d\.\d$/.test(path);
  } catch {
    return false;
  }
}

function extractMetadata(xml: string, requestedPmcid: string): {
  pmcid: string;
  pmcidVersion?: string;
  pmid?: string;
  doi?: string;
  articleType?: string;
  license: string;
} {
  let parsed: unknown;
  try {
    parsed = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      parseTagValue: false,
      trimValues: true,
    }).parse(xml);
  } catch (cause) {
    throw new SourceAdapterError("SOURCE_RESPONSE_INVALID", "PMC returned malformed XML", cause);
  }
  const root = asNode(parsed);
  const articleSet = asNode(root?.["pmc-articleset"]);
  const article = asNode(articleSet?.article);
  const front = asNode(article?.front);
  const articleMeta = asNode(front?.["article-meta"]);
  if (!article || !articleMeta) {
    throw new SourceAdapterError("SOURCE_RESPONSE_INVALID", "PMC XML did not contain an article record");
  }

  const ids = Array.isArray(articleMeta["article-id"])
    ? articleMeta["article-id"] as unknown[]
    : [articleMeta["article-id"]];
  const id = (type: string): string | undefined => {
    const match = ids.map(asNode).find((entry) => entry?.["@_pub-id-type"] === type);
    return text(match);
  };
  const pmcid = id("pmcid")?.toUpperCase();
  if (pmcid !== requestedPmcid) {
    throw new SourceAdapterError(
      "IDENTIFIER_MISMATCH",
      `PMC returned ${pmcid ?? "no PMCID"} for requested ${requestedPmcid}`,
    );
  }

  const permissions = asNode(articleMeta.permissions);
  const licenseNode = asNode(permissions?.license);
  const licenseRef = text(licenseNode?.["ali:license_ref"])
    ?? text(licenseNode?.["license_ref"]);
  if (!licenseRef || !isReusableLicense(licenseRef)) {
    throw new SourceAdapterError(
      "SOURCE_UNAUTHORIZED",
      `PMC article ${pmcid} lacks a recognized reusable Creative Commons or public-domain license URL`,
    );
  }

  const pmcidVersion = id("pmcid-ver");
  const pmid = id("pmid");
  const doi = id("doi");
  return {
    pmcid,
    ...(pmcidVersion ? { pmcidVersion } : {}),
    ...(pmid ? { pmid } : {}),
    ...(doi ? { doi: doi.toLowerCase() } : {}),
    ...(typeof article["@_article-type"] === "string" ? { articleType: article["@_article-type"] } : {}),
    license: licenseRef,
  };
}

export class PmcFullTextAdapter implements SourceAdapter<string, string> {
  readonly name = "pmc-full-text";
  readonly version = PMC_FULL_TEXT_ADAPTER_VERSION;

  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly now: () => Date;
  private readonly tool: string;
  private readonly email: string | undefined;
  private readonly apiKey: string | undefined;

  constructor(options: PmcFullTextAdapterOptions = {}) {
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.now = options.now ?? (() => new Date());
    this.tool = options.tool ?? "evidencelens";
    this.email = options.email;
    this.apiKey = options.apiKey;
  }

  async resolve(input: string): Promise<ResolvedSource<string>> {
    const pmcid = normalizePmcid(input);
    const url = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi");
    url.searchParams.set("db", "pmc");
    url.searchParams.set("id", pmcid);
    url.searchParams.set("retmode", "xml");
    url.searchParams.set("tool", this.tool);
    if (this.email) url.searchParams.set("email", this.email);
    if (this.apiKey) url.searchParams.set("api_key", this.apiKey);

    let response: Response;
    try {
      response = await this.fetchImpl(url, { headers: { accept: "application/xml, text/xml" } });
    } catch (cause) {
      throw new SourceAdapterError("SOURCE_UNAVAILABLE", `PMC request failed for ${pmcid}`, cause);
    }
    if (!response.ok) {
      throw new SourceAdapterError("SOURCE_UNAVAILABLE", `PMC returned HTTP ${response.status} for ${pmcid}`);
    }

    const snapshot = await response.text();
    const metadata = extractMetadata(snapshot, pmcid);
    const retrievedAt = this.now().toISOString();
    const snapshotHash = sha256(snapshot);
    const artifact: SourceArtifact = {
      sourceId: sourceIdForPmcid(pmcid),
      sourceType: metadata.articleType ?? "PMC_FULL_TEXT",
      identifiers: {
        pmcid,
        ...(metadata.pmid ? { pmid: metadata.pmid } : {}),
        ...(metadata.doi ? { doi: metadata.doi } : {}),
        url: `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/`,
      },
      version: metadata.pmcidVersion ?? "PMC_VERSION_UNKNOWN",
      retrievedAt,
      status: "UNKNOWN",
      statusCheckedAt: retrievedAt,
      contentHash: snapshotHash,
      metadataHash: snapshotHash,
      license: metadata.license,
      retentionAuthority: "OPEN_LICENSE",
    };
    return { artifact, snapshot, adapter: this.name, adapterVersion: this.version };
  }
}
