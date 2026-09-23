import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  EVALUATION_RUNNER_VERSION,
  hashManifest,
  scoreEvaluationResults,
} from "@evidencelens/evaluation";
import { assembleEvidencePacket } from "@evidencelens/packet-builder";
import { verifyPmcExactSpan } from "@evidencelens/deterministic-checks";
import { PmcFullTextAdapter, PubmedStatusResolver } from "@evidencelens/source-adapters";

const manifestArgument = process.argv.find((argument) => argument.startsWith("--manifest="));
if (!manifestArgument) throw new Error("--manifest is required");
const manifestLocation = resolve(process.cwd(), manifestArgument.slice("--manifest=".length));
const manifestBytes = await readFile(manifestLocation);
const expectedFileHash = process.argv.find((argument) => argument.startsWith("--expected-sha256="))
  ?.slice("--expected-sha256=".length);
if (!expectedFileHash || createHash("sha256").update(manifestBytes).digest("hex") !== expectedFileHash) {
  throw new Error("Frozen batch manifest file hash must match --expected-sha256");
}
const manifest = JSON.parse(manifestBytes.toString("utf8"));
if (manifest.experiment !== "EXP-EL002" || !(["CANCER_02", "INFECTIOUS_03", "NEUROSCIENCE_04", "IMMUNOLOGY_05"].includes(manifest.partition)) ||
  manifest.frozen !== true || manifest.sources?.length !== 26 || manifest.cases?.length !== 31) {
  throw new Error("Unsupported or incomplete frozen EXP-EL002 batch");
}
const identifiers = new Set(manifest.sources.map((source) => source.pmcid));
if (identifiers.size !== 26 || new Set(manifest.cases.map((item) => item.caseId)).size !== 31 ||
  manifest.cases.some((item) => !identifiers.has(item.pmcid) || !item.fieldPath ||
    !((item.operation === "VALID_PACKET" && item.expectedOutcome === "PASS") ||
      (item.operation === "SPAN_NOT_FOUND" && item.expectedOutcome === "EXPECTED_FAILURE" &&
       item.expectedErrorCode === "SPAN_NOT_FOUND")))) {
  throw new Error("Frozen batch has duplicate, orphan, or unsupported cases");
}
if (manifest.cases.filter((item) => item.operation === "VALID_PACKET").length !== 26 ||
  manifest.cases.filter((item) => item.operation === "SPAN_NOT_FOUND").length !== 5) {
  throw new Error("Frozen batch operation counts differ");
}

const runAt = new Date(process.env.EVIDENCELENS_RUN_AT ?? Date.now());
if (Number.isNaN(runAt.valueOf())) throw new Error("EVIDENCELENS_RUN_AT must be a valid timestamp");
const options = { tool: "evidencelens-exp-el002", now: () => runAt };
const pmc = new PmcFullTextAdapter(options);
const pubmedStatus = new PubmedStatusResolver(options);
const sourceCache = new Map();
const statusCache = new Map();
const providerMetrics = { requests: 0, retries: 0 };
const expectedSources = new Map((manifest.sources ?? []).map((source) => [source.pmcid, source]));
let nextRequestAt = 0;

const wait = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));

async function pacedRequest(operation) {
  const delay = Math.max(0, nextRequestAt - Date.now());
  if (delay > 0) await wait(delay);
  nextRequestAt = Date.now() + 400;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    providerMetrics.requests += 1;
    try {
      return await operation();
    } catch (error) {
      const throttled = error && typeof error === "object" && error.code === "SOURCE_UNAVAILABLE"
        && error.message.includes("HTTP 429");
      if (!throttled || attempt === 3) throw error;
      providerMetrics.retries += 1;
      await wait(attempt * 1000);
      nextRequestAt = Date.now() + 400;
    }
  }
  throw new Error("Unreachable provider retry state");
}

async function resolveCached(pmcid) {
  if (!sourceCache.has(pmcid)) {
    sourceCache.set(pmcid, pacedRequest(() => pmc.resolve(pmcid)).then((resolved) => {
      const expected = expectedSources.get(pmcid);
      if (expected) {
        const observed = {
          pmcid: resolved.artifact.identifiers.pmcid,
          pmid: resolved.artifact.identifiers.pmid,
          doi: resolved.artifact.identifiers.doi,
          version: resolved.artifact.version,
          license: resolved.artifact.license,
          contentHash: resolved.artifact.contentHash
        };
        for (const field of ["pmcid", "pmid", "doi", "version", "license", "contentHash"]) {
          if (observed[field] !== expected[field]) {
            const error = new Error(`${pmcid} ${field} drifted: observed ${observed[field]}, expected ${expected[field]}`);
            error.code = "CORPUS_SOURCE_DRIFT";
            throw error;
          }
        }
      }
      return resolved;
    }));
  }
  return sourceCache.get(pmcid);
}

async function resolveStatusCached(pmid) {
  if (!statusCache.has(pmid)) statusCache.set(pmid, pacedRequest(() => pubmedStatus.resolve(pmid)));
  return statusCache.get(pmid);
}

function errorCode(error) {
  return error && typeof error === "object" && typeof error.code === "string"
    ? error.code
    : error instanceof Error ? error.name : "UNKNOWN_ERROR";
}

async function executeCase(testCase) {
  const resolved = await resolveCached(testCase.pmcid);
  if (testCase.operation === "SOURCE_UNAUTHORIZED" || testCase.operation === "INVALID_IDENTIFIER") return {};

  const xml = testCase.operation === "CONTENT_HASH_MISMATCH"
    ? `${resolved.snapshot} `
    : resolved.snapshot;
  const span = verifyPmcExactSpan({
    source: resolved.artifact,
    xml,
    verbatim: testCase.verbatim,
    ...(testCase.fieldPath || expectedSources.get(testCase.pmcid)?.fieldPaths?.[testCase.caseId]
      || expectedSources.get(testCase.pmcid)?.defaultFieldPath
      ? { fieldPath: testCase.fieldPath ?? expectedSources.get(testCase.pmcid)?.fieldPaths?.[testCase.caseId]
        ?? expectedSources.get(testCase.pmcid).defaultFieldPath }
      : {})
  });
  if (testCase.operation !== "VALID_PACKET") return { spanId: span.spanId };

  const pmid = resolved.artifact.identifiers.pmid;
  if (!pmid) throw new Error(`${testCase.pmcid} did not expose a PMID`);
  const status = await resolveStatusCached(pmid);
  const input = {
    claim: {
      claimId: `claim_${testCase.caseId.toLowerCase().replaceAll("-", "_")}`,
      verbatim: testCase.verbatim,
      contextType: "PMC_ABSTRACT",
      claimType: testCase.claimType ?? "UNKNOWN",
      epistemicClass: "OBSERVED"
    },
    sources: [{ resolved, status }],
    evidenceSpans: [span],
    reviewContext: {
      domain: "biomedical-source-coverage",
      intendedUse: "RESEARCH_TRIAGE",
      requestedChecks: []
    },
    provenance: {
      createdBy: testCase.caseId,
      createdAt: runAt.toISOString(),
      creationActivityId: `activity_${testCase.caseId.toLowerCase().replaceAll("-", "_")}`,
      softwareVersion: "evidencelens@0.1.0"
    }
  };
  const first = assembleEvidencePacket(input);
  const replay = assembleEvidencePacket(input);
  if (first.packetHash !== replay.packetHash || first.packet.packetId !== replay.packet.packetId) {
    const error = new Error("Packet replay changed identity");
    error.code = "REPLAY_MISMATCH";
    throw error;
  }
  return {
    packetId: first.packet.packetId,
    packetHash: first.packetHash,
    sourceHash: resolved.artifact.contentHash,
    status: status.status,
    spanId: span.spanId,
    spanHash: span.contentHash,
    replayEquivalent: true
  };
}

const results = [];
for (const testCase of manifest.cases) {
  try {
    const details = await executeCase(testCase);
    const expectedPass = testCase.expectedOutcome === "PASS";
    results.push({
      caseId: testCase.caseId,
      operation: testCase.operation,
      passed: expectedPass,
      observedOutcome: expectedPass ? "PASS" : "UNEXPECTED_SUCCESS",
      ...(testCase.expectedErrorCode ? { expectedErrorCode: testCase.expectedErrorCode } : {}),
      details
    });
  } catch (error) {
    const observedErrorCode = errorCode(error);
    const matched = testCase.expectedOutcome === "EXPECTED_FAILURE"
      && observedErrorCode === testCase.expectedErrorCode;
    results.push({
      caseId: testCase.caseId,
      operation: testCase.operation,
      passed: matched,
      observedOutcome: matched ? "EXPECTED_FAILURE" : "UNEXPECTED_FAILURE",
      ...(testCase.expectedErrorCode ? { expectedErrorCode: testCase.expectedErrorCode } : {}),
      observedErrorCode,
      details: { message: error instanceof Error ? error.message : String(error) }
    });
  }
}

const score = scoreEvaluationResults(results);
const report = {
  experiment: manifest.experiment,
  partition: manifest.partition,
  manifestVersion: manifest.manifestVersion,
  manifestFileHash: `sha256:${expectedFileHash}`,
  manifestHash: hashManifest(manifest),
  manifestFrozen: manifest.frozen,
  runnerVersion: EVALUATION_RUNNER_VERSION,
  runAt: runAt.toISOString(),
  providerMetrics,
  score,
  decision: score.failed === 0 ? "PASS" : "FAIL",
  results
};
console.log(JSON.stringify(report, null, 2));
if (score.failed > 0) process.exitCode = 1;
