import type { SourceArtifact } from "@evidencelens/evidence-schema";

export type SourceAdapterErrorCode =
  | "INVALID_IDENTIFIER"
  | "SOURCE_UNAVAILABLE"
  | "SOURCE_RESPONSE_INVALID"
  | "IDENTIFIER_MISMATCH";

export class SourceAdapterError extends Error {
  constructor(
    public readonly code: SourceAdapterErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SourceAdapterError";
  }
}

export interface ResolvedSource<TSnapshot = unknown> {
  artifact: SourceArtifact;
  snapshot: TSnapshot;
  adapter: string;
  adapterVersion: string;
}

export interface SourceAdapter<TInput, TSnapshot = unknown> {
  readonly name: string;
  readonly version: string;
  resolve(input: TInput): Promise<ResolvedSource<TSnapshot>>;
}

