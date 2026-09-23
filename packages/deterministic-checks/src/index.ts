import { createHash } from "node:crypto";

import type { EvidenceSpan, SourceArtifact } from "@evidencelens/evidence-schema";
import { XMLParser } from "fast-xml-parser";

export const PMC_SPAN_VERIFIER_VERSION = "0.1.0";

export type SpanVerificationErrorCode =
  | "CONTENT_HASH_MISSING"
  | "CONTENT_HASH_MISMATCH"
  | "SOURCE_NOT_AUTHORIZED"
  | "SOURCE_RESPONSE_INVALID"
  | "SPAN_EMPTY"
  | "SPAN_NOT_FOUND"
  | "SPAN_AMBIGUOUS";

export class SpanVerificationError extends Error {
  constructor(public readonly code: SpanVerificationErrorCode, message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "SpanVerificationError";
  }
}

interface OrderedNode {
  [key: string]: unknown;
}

interface AddressableParagraph {
  section?: string;
  elementId?: string;
  fieldPath: string;
  text: string;
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function nodeChildren(node: OrderedNode, tag: string): OrderedNode[] {
  const value = node[tag];
  return Array.isArray(value) ? value.filter((child): child is OrderedNode => Boolean(child && typeof child === "object")) : [];
}

function attributes(node: OrderedNode): Record<string, unknown> {
  const value = node[":@"];
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function orderedText(nodes: OrderedNode[]): string {
  let result = "";
  for (const node of nodes) {
    if (typeof node["#text"] === "string") result += node["#text"];
    for (const [tag, value] of Object.entries(node)) {
      if (tag === "#text" || tag === ":@" || !Array.isArray(value)) continue;
      result += orderedText(value.filter((child): child is OrderedNode => Boolean(child && typeof child === "object")));
    }
  }
  return normalizeText(result);
}

function elementPath(parentPath: string, tag: string, elementId: string | undefined, index: number): string {
  return elementId
    ? `${parentPath}/${tag}[@id='${elementId.replaceAll("'", "&apos;")}']`
    : `${parentPath}/${tag}[${index}]`;
}

function collectParagraphs(
  nodes: OrderedNode[],
  parentPath: string,
  section: string | undefined,
  output: AddressableParagraph[],
): void {
  const tagCounts = new Map<string, number>();
  for (const node of nodes) {
    for (const [tag, value] of Object.entries(node)) {
      if (tag === "#text" || tag === ":@" || !Array.isArray(value)) continue;
      const index = (tagCounts.get(tag) ?? 0) + 1;
      tagCounts.set(tag, index);
      const attrs = attributes(node);
      const elementId = typeof attrs["@_id"] === "string" ? attrs["@_id"] : undefined;
      const path = elementPath(parentPath, tag, elementId, index);
      const children = value.filter((child): child is OrderedNode => Boolean(child && typeof child === "object"));

      if (tag === "sec" || tag === "abstract") {
        const titleNode = children.find((child) => Array.isArray(child.title));
        const title = titleNode ? orderedText(nodeChildren(titleNode, "title")) : undefined;
        collectParagraphs(children.filter((child) => child !== titleNode), path, title ?? section, output);
      } else if (tag === "p") {
        const paragraphText = orderedText(children);
        if (paragraphText) output.push({ ...(section ? { section } : {}), ...(elementId ? { elementId } : {}), fieldPath: path, text: paragraphText });
      } else {
        collectParagraphs(children, path, section, output);
      }
    }
  }
}

function extractAddressableParagraphs(xml: string): AddressableParagraph[] {
  let parsed: unknown;
  try {
    parsed = new XMLParser({
      preserveOrder: true,
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      parseTagValue: false,
      trimValues: false,
    }).parse(xml);
  } catch (cause) {
    throw new SpanVerificationError("SOURCE_RESPONSE_INVALID", "Preserved PMC artifact is malformed XML", cause);
  }
  if (!Array.isArray(parsed)) {
    throw new SpanVerificationError("SOURCE_RESPONSE_INVALID", "Preserved PMC artifact has no ordered XML root");
  }

  const root = parsed as OrderedNode[];
  const articleSet = root.find((node) => Array.isArray(node["pmc-articleset"]));
  const articleSetChildren = articleSet ? nodeChildren(articleSet, "pmc-articleset") : [];
  const article = articleSetChildren.find((node) => Array.isArray(node.article));
  const articleChildren = article ? nodeChildren(article, "article") : [];
  if (articleChildren.length === 0) {
    throw new SpanVerificationError("SOURCE_RESPONSE_INVALID", "Preserved PMC artifact contains no article");
  }

  const output: AddressableParagraph[] = [];
  const front = articleChildren.find((node) => Array.isArray(node.front));
  if (front) {
    const frontChildren = nodeChildren(front, "front");
    const articleMeta = frontChildren.find((node) => Array.isArray(node["article-meta"]));
    const metaChildren = articleMeta ? nodeChildren(articleMeta, "article-meta") : [];
    const abstract = metaChildren.find((node) => Array.isArray(node.abstract));
    if (abstract) collectParagraphs([abstract], "/article/front/article-meta", "Abstract", output);
  }
  const body = articleChildren.find((node) => Array.isArray(node.body));
  if (body) collectParagraphs(nodeChildren(body, "body"), "/article/body", undefined, output);
  return output;
}

export function verifyPmcExactSpan(input: {
  source: SourceArtifact;
  xml: string;
  verbatim: string;
}): EvidenceSpan {
  if (input.source.retentionAuthority !== "OPEN_LICENSE" || !input.source.license) {
    throw new SpanVerificationError("SOURCE_NOT_AUTHORIZED", "PMC full text is not marked with open-license authority");
  }
  if (!input.source.contentHash) {
    throw new SpanVerificationError("CONTENT_HASH_MISSING", "PMC source has no preserved content hash");
  }
  const actualHash = sha256(input.xml);
  if (actualHash !== input.source.contentHash) {
    throw new SpanVerificationError(
      "CONTENT_HASH_MISMATCH",
      `Preserved PMC XML hashed to ${actualHash}, expected ${input.source.contentHash}`,
    );
  }

  const verbatim = normalizeText(input.verbatim);
  if (!verbatim) throw new SpanVerificationError("SPAN_EMPTY", "Evidence span cannot be empty");

  const matches: Array<{ paragraph: AddressableParagraph; startOffset: number }> = [];
  for (const paragraph of extractAddressableParagraphs(input.xml)) {
    let fromIndex = 0;
    while (fromIndex <= paragraph.text.length - verbatim.length) {
      const startOffset = paragraph.text.indexOf(verbatim, fromIndex);
      if (startOffset < 0) break;
      matches.push({ paragraph, startOffset });
      fromIndex = startOffset + 1;
    }
  }
  if (matches.length === 0) {
    throw new SpanVerificationError("SPAN_NOT_FOUND", "Exact normalized text was not found in the preserved PMC artifact");
  }
  if (matches.length > 1) {
    throw new SpanVerificationError("SPAN_AMBIGUOUS", `Exact text matched ${matches.length} locations in the preserved PMC artifact`);
  }

  const match = matches[0]!;
  const endOffset = match.startOffset + verbatim.length;
  const identity = `${input.source.sourceId}|${match.paragraph.fieldPath}|${match.startOffset}|${endOffset}|${verbatim}`;
  return {
    spanId: `span_${createHash("sha256").update(identity, "utf8").digest("hex").slice(0, 24)}`,
    sourceId: input.source.sourceId,
    locator: {
      artifactId: input.source.sourceId,
      ...(match.paragraph.section ? { section: match.paragraph.section } : {}),
      fieldPath: match.paragraph.fieldPath,
      startOffset: match.startOffset,
      endOffset,
    },
    verbatim,
    contentHash: sha256(verbatim),
    extractionMethod: "PARSER_EXTRACTED",
    extractorVersion: PMC_SPAN_VERIFIER_VERSION,
    verifiedAgainstSource: true,
    epistemicClass: "OBSERVED",
  };
}
