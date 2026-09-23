import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { hashManifest } from "@evidencelens/evaluation";

const root = new URL("../", import.meta.url);
const partitions = [
  {
    name: "DEVELOPMENT",
    manifest: "development.manifest.json",
    report: null,
    frozenFileHash: null,
    expectedCases: 30,
    expectedSources: 6
  },
  {
    name: "BLIND_HOLDOUT",
    manifest: "blind-holdout.manifest.json",
    report: "BLIND-HOLDOUT-REPORT-001.json",
    reportFileHash: "6500d683e219a24fbb3c6996714f45956a969b2b3d82d82400c7ca58ec82bad3",
    frozenFileHash: "0be5ffb3cf2cecccbdd1332d9a8c1eeb78c6924ae4fbf37089b57d65b10b5bd5",
    expectedCases: 50,
    expectedSources: 10
  },
  {
    name: "TRANSFER",
    manifest: "transfer.manifest.json",
    report: "TRANSFER-REPORT-001.json",
    reportFileHash: "a3e3792cd3665eba7870ad61429b0d2156575bdce91dd4684aa53c02e5cd1d48",
    frozenFileHash: "5950ee376b6fd549c767af0945b1688b7adb3b46f355d0853d0f84b0dd9a023a",
    expectedCases: 20,
    expectedSources: 4
  }
];

// Development recorded a canonical nested-manifest hash rather than a
// file-byte hash. It is checked against the runner's original record.

const sha256 = (content) => createHash("sha256").update(content).digest("hex");
const fail = (message) => { throw new Error(message); };
const records = new Map();
const caseIds = new Set();
const summaries = [];

for (const partition of partitions) {
  const bytes = await readFile(new URL(partition.manifest, root));
  if (partition.frozenFileHash && sha256(bytes) !== partition.frozenFileHash) {
    fail(`${partition.name} frozen manifest file hash differs`);
  }
  const manifest = JSON.parse(bytes.toString("utf8"));
  if (partition.name === "DEVELOPMENT" &&
    hashManifest(manifest) !== "sha256:5154a0ab562653f757dacc9900cd3d340a6a08d14e69dacdcaef3a40a0b1ba3a") {
    fail("DEVELOPMENT frozen canonical manifest hash differs");
  }
  if (manifest.partition !== partition.name || manifest.frozen !== true) {
    fail(`${partition.name} manifest partition or freeze flag differs`);
  }
  if (manifest.cases.length !== partition.expectedCases ||
    manifest.sources.length !== partition.expectedSources) {
    fail(`${partition.name} case or source count differs`);
  }
  const sourceIds = new Set(manifest.sources.map((source) => source.pmcid));
  if (sourceIds.size !== manifest.sources.length) fail(`${partition.name} duplicate PMCID`);
  for (const source of manifest.sources) {
    if (!/^sha256:[a-f0-9]{64}$/.test(source.contentHash) ||
      !source.version || !source.license || !source.pmid || !source.doi) {
      fail(`${partition.name} incomplete source ${source.pmcid}`);
    }
    if (records.has(source.pmcid)) {
      fail(`Source ${source.pmcid} occurs in two partitions; cross-partition independence lost`);
    }
    records.set(source.pmcid, { partition: partition.name, source });
  }
  for (const testCase of manifest.cases) {
    if (caseIds.has(testCase.caseId) || !sourceIds.has(testCase.pmcid)) {
      fail(`${partition.name} duplicate case or orphan source: ${testCase.caseId}`);
    }
    caseIds.add(testCase.caseId);
  }
  for (const sourceId of sourceIds) {
    if (!manifest.cases.some((testCase) => testCase.pmcid === sourceId)) {
      fail(`${partition.name} unused source ${sourceId} cannot count toward coverage`);
    }
  }
  if (partition.report) {
    const reportBytes = await readFile(new URL(partition.report, root));
    if (sha256(reportBytes) !== partition.reportFileHash) {
      fail(`${partition.name} preserved report file hash differs`);
    }
    const report = JSON.parse(reportBytes.toString("utf8"));
    if (report.partition !== partition.name || report.score.total !== manifest.cases.length ||
      report.results.length !== manifest.cases.length ||
      report.results.some((result, index) => result.caseId !== manifest.cases[index].caseId)) {
      fail(`${partition.name} report does not match manifest cases`);
    }
  }
  summaries.push({ partition: partition.name, claims: manifest.cases.length, uniqueSourceRecords: sourceIds.size });
}

const count = records.size;
console.log(JSON.stringify({
  auditVersion: "1.0.0",
  countingRule: "Unique preserved PMC article artifact identified by PMCID, version, and XML SHA-256; repeat uses, status responses, and discovery candidates do not add records.",
  minimum: 150,
  maximum: 300,
  uniqueSourceRecords: count,
  shortfallToMinimum: Math.max(0, 150 - count),
  coverageGate: count >= 150 && count <= 300 ? "MET" : "UNMET",
  partitions: summaries,
  records: [...records.values()].map(({ partition, source }) => ({
    partition, pmcid: source.pmcid, pmid: source.pmid, doi: source.doi,
    version: source.version, license: source.license, contentHash: source.contentHash
  }))
}, null, 2));
