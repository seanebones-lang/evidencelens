import { createHash } from "node:crypto";

import { XMLParser } from "fast-xml-parser";

import { normalizePmid } from "./pubmed.js";
import {
  SourceAdapterError,
  type ResolvedSourceStatus,
  type SourceStatusSignal,
} from "./types.js";

export const PUBMED_STATUS_RESOLVER_VERSION = "0.1.0";

export interface PubmedStatusResolverOptions {
  fetch?: typeof globalThis.fetch;
  now?: () => Date;
  tool?: string;
  email?: string;
  apiKey?: string;
}

type XmlNode = Record<string, unknown>;

const STATUS_PRECEDENCE = {
  CORRECTED: 1,
  EXPRESSION_OF_CONCERN: 2,
  WITHDRAWN: 3,
  RETRACTED: 4,
} as const;

const PUBLICATION_TYPE_STATUS = new Map<string, SourceStatusSignal["mappedStatus"]>([
  ["Retracted Publication", "RETRACTED"],
  ["Corrected and Republished Article", "CORRECTED"],
]);

const RELATION_STATUS = new Map<string, SourceStatusSignal["mappedStatus"]>([
  ["RetractionIn", "RETRACTED"],
  ["RetractedandRepublishedIn", "RETRACTED"],
  ["ExpressionOfConcernIn", "EXPRESSION_OF_CONCERN"],
  ["ErratumIn", "CORRECTED"],
  ["CorrectedandRepublishedIn", "CORRECTED"],
  ["UpdateIn", "CORRECTED"],
]);

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function asNode(value: unknown): XmlNode | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as XmlNode : undefined;
}

function text(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  const node = asNode(value);
  return typeof node?.["#text"] === "string" ? node["#text"] : undefined;
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function parseStatusSignals(xml: string, requestedPmid: string): SourceStatusSignal[] {
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
    throw new SourceAdapterError("SOURCE_RESPONSE_INVALID", "PubMed returned malformed XML", cause);
  }

  const root = asNode(parsed);
  const articleSet = asNode(root?.PubmedArticleSet);
  const articles = asArray(articleSet?.PubmedArticle).map(asNode).filter((value): value is XmlNode => Boolean(value));
  const matching = articles.find((article) => {
    const citation = asNode(article.MedlineCitation);
    return text(citation?.PMID) === requestedPmid;
  });

  if (!matching) {
    throw new SourceAdapterError(
      "IDENTIFIER_MISMATCH",
      `PubMed XML did not contain the requested PMID ${requestedPmid}`,
    );
  }

  const citation = asNode(matching.MedlineCitation);
  const article = asNode(citation?.Article);
  const publicationTypeList = asNode(article?.PublicationTypeList);
  const publicationTypes = asArray(publicationTypeList?.PublicationType);
  const signals: SourceStatusSignal[] = [];

  for (const rawType of publicationTypes) {
    const value = text(rawType);
    const mappedStatus = value ? PUBLICATION_TYPE_STATUS.get(value) : undefined;
    if (value && mappedStatus) {
      signals.push({ signalType: "PUBLICATION_TYPE", value, mappedStatus });
    }
  }

  const correctionList = asNode(citation?.CommentsCorrectionsList);
  for (const rawCorrection of asArray(correctionList?.CommentsCorrections)) {
    const correction = asNode(rawCorrection);
    const relation = typeof correction?.["@_RefType"] === "string" ? correction["@_RefType"] : undefined;
    const mappedStatus = relation ? RELATION_STATUS.get(relation) : undefined;
    if (!relation || !mappedStatus || !correction) continue;

    const relatedPmid = text(correction.PMID);
    const refSource = text(correction.RefSource);
    signals.push({
      signalType: "CORRECTION_RELATION",
      value: relation,
      mappedStatus,
      ...(relatedPmid ? { relatedPmid } : {}),
      ...(refSource ? { citation: refSource } : {}),
    });
  }

  return signals;
}

function strongestStatus(signals: SourceStatusSignal[]): ResolvedSourceStatus["status"] {
  if (signals.length === 0) return "UNKNOWN";
  return signals.reduce((strongest, signal) =>
    STATUS_PRECEDENCE[signal.mappedStatus] > STATUS_PRECEDENCE[strongest]
      ? signal.mappedStatus
      : strongest,
  signals[0]!.mappedStatus);
}

export class PubmedStatusResolver {
  readonly name = "pubmed-status";
  readonly version = PUBMED_STATUS_RESOLVER_VERSION;

  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly now: () => Date;
  private readonly tool: string;
  private readonly email: string | undefined;
  private readonly apiKey: string | undefined;

  constructor(options: PubmedStatusResolverOptions = {}) {
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.now = options.now ?? (() => new Date());
    this.tool = options.tool ?? "evidencelens";
    this.email = options.email;
    this.apiKey = options.apiKey;
  }

  async resolve(input: string): Promise<ResolvedSourceStatus<string>> {
    const pmid = normalizePmid(input);
    const url = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi");
    url.searchParams.set("db", "pubmed");
    url.searchParams.set("id", pmid);
    url.searchParams.set("retmode", "xml");
    url.searchParams.set("tool", this.tool);
    if (this.email) url.searchParams.set("email", this.email);
    if (this.apiKey) url.searchParams.set("api_key", this.apiKey);

    let response: Response;
    try {
      response = await this.fetchImpl(url, { headers: { accept: "application/xml, text/xml" } });
    } catch (cause) {
      throw new SourceAdapterError("SOURCE_UNAVAILABLE", `PubMed status request failed for PMID ${pmid}`, cause);
    }

    if (!response.ok) {
      throw new SourceAdapterError(
        "SOURCE_UNAVAILABLE",
        `PubMed returned HTTP ${response.status} while checking PMID ${pmid}`,
      );
    }

    const snapshot = await response.text();
    const signals = parseStatusSignals(snapshot, pmid);
    return {
      identifier: { pmid },
      status: strongestStatus(signals),
      checkedAt: this.now().toISOString(),
      signals,
      snapshot,
      snapshotHash: sha256(snapshot),
      resolver: this.name,
      resolverVersion: this.version,
    };
  }
}
