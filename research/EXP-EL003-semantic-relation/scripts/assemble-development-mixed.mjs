import { readFile } from "node:fs/promises";

import { verifyPmcExactSpan } from "@evidencelens/deterministic-checks";
import { assembleEvidencePacket } from "@evidencelens/packet-builder";
import { validatePartitionIsolation, validateSemanticCases } from "@evidencelens/semantic-evaluation";
import { PmcFullTextAdapter, PubmedStatusResolver } from "@evidencelens/source-adapters";

const inventory = JSON.parse(await readFile(new URL("../development-source-inventory.json", import.meta.url), "utf8"));
const byRank = new Map(inventory.sources.map((source) => [source.allocationRank, source]));
const specs = [
  { rank: 21, claim: "Fluorescence imaging allows for noninvasively visualizing and measuring key physiological parameters like pH and dissolved oxygen.", evidence: [0], basis: "The oxygen findings support one named outcome, while the supplied study does not evaluate the separately claimed pH outcome." },
  { rank: 22, claim: "According to the findings, somatic EGFR mutations can be employed as a diagnostic tool for non-small cell lung cancer in Egypt, and they can be implemented in conjunction with clinical criteria to identify which patients are more likely to respond favorably to TKIs.", evidence: [2, 3, 4], basis: "Mutation prevalence and clinical associations support stratification, but actual TKI response was not measured, creating an outcome mismatch." },
  { rank: 23, claim: "The use of denosumab in KTRs is effective and safe for the treatment of osteoporosis and prevention of fracture, but it should be carefully monitored for complications, especially UTI.", evidence: [2], basis: "BMD and FRAX improvements support effectiveness while de novo fractures, UTI, hypocalcemia, and other events materially qualify safety and fracture prevention." },
  { rank: 24, claim: "Hence, early diagnosis based on periodic examination in patients with ESRD and aggressive surgical treatment are necessary.", evidence: [0], basis: "The review's observed mobility and embolism associations support concern, while the narrative-case evidence does not directly establish necessity or comparative treatment benefit." },
  { rank: 25, claim: "TV stenosis or occlusion in BTEVAR cases is rare and TV-related reinterventions and instability events are mainly attributed to type Ic and III endoleak formation.", evidence: [2], basis: "Observed patency supports rarity, while recorded endoleaks and early reinterventions materially qualify the favorable outcome." },
  { rank: 26, claim: "Among many host-directed targets, host immunometabolism has emerged as one of the most attractive targets for developing new host-directed therapies.", evidence: [0], basis: "The review identifies the target and biological rationale while explicitly describing the infectious-disease association as underappreciated and containing knowledge gaps." },
  { rank: 27, claim: "A significant BP reduction was observed up until 8 years following uRDN in parallel to a decrease in drug burden over time, in the absence of procedure-related adverse events.", evidence: [2], basis: "Long-term BP and drug-burden changes support efficacy, while only 27 of 96 had prospective long-term follow-up and renal outcomes qualify the safety scope." },
  { rank: 28, claim: "In conclusion, this workflow based on theoretical and experimental approaches demonstrates effective in identifying VEGFR‐2 inhibitors and can be easily adapted to other medicinal chemistry goals.", evidence: [0], basis: "Two prioritized compounds and cell-line activity support identification, while the narrow library, in-vitro setting, and untested adaptability limit the broader claim." },
  { rank: 41, claim: "This consensus provides evidence-based data to guide LN diagnosis and treatment, supporting the development of public and supplementary health policies in Brazil.", evidence: [1, 2], basis: "Systematic review, GRADE, and recommendations support the claim, while some management areas relied on literature review and expert opinion rather than eligible trials." },
  { rank: 42, claim: "The healing program is an effective psychosocial nursing intervention that helps cancer survivors feel better about their illness, and it helps them healthy transition from negative emotions to increased resilience and positive cognitive emotions.", evidence: [1, 2], basis: "Significant psychological outcomes support effectiveness, while the small quasi-experimental regional sample limits population and causal scope." },
  { rank: 43, claim: "The clinical impact of transcatheter valve explantation is significant and should be strongly considered by multidisciplinary heart teams in the lifetime management strategy of cardiac valvular disease.", evidence: [1, 2], basis: "Urgency, mortality, and survival findings support clinical importance, while the evidence is a 44-patient retrospective single-institution cohort." },
  { rank: 44, claim: "Our study recommends the utilization of ultrasound shears in ALND as it is a safe and accurate method that allows faster post-operative recovery with shorter drainage time and lower incidence of seroma or infection, without affecting operative time or lymph node yield.", evidence: [2, 3], basis: "Drainage and complication results support recovery benefits, while the small trial and evidence reported for only some claimed outcomes qualify the recommendation's scope." },
  { rank: 45, claim: "The RBS provided a systematic way to narrow down the patient population to a subset that is enriched for eligible patients.", evidence: [0], basis: "The system reduced the screening pool, while 32.1% accuracy and documented false positives materially qualify the enrichment claim." },
  { rank: 46, claim: "Green synthesis techniques have drawn a lot of interest lately since they are beneficial to the environment and have potential uses in a variety of industries, including biomedicine.", evidence: [0], basis: "The review describes biomedical uses while also explicitly covering drawbacks, difficulties, and future prospects rather than established broad application." },
  { rank: 47, claim: "Measurement of symptoms burden throughout clinical trial follow-up is feasible in AF/HF and should be useful for evaluating patient-centered outcomes in AF prevention trials.", evidence: [1, 2], basis: "Efficiency and correlation results support feasibility and usefulness, while validation occurred within one 267-patient trial and some specificity applied to recent-onset AF." },
  { rank: 48, claim: "Early identification of LMNA‐related muscular dystrophies is crucial to ensure appropriate cardiac screening and prevent devastating cardiac complications.", evidence: [0, 1], basis: "Phenotypic overlap and the cardiac-failure case support diagnostic importance, while a single case does not establish prevention of complications." },
  { rank: 49, claim: "Together, these results demonstrate a new role of Rab27B in the autophagy trafficking process in CRC and identify Rab27B as a potential therapeutic target for CRC.", evidence: [0], basis: "Autophagy disruption and impaired 3D/in-vivo growth support the target, while preserved 2D growth and preclinical evidence qualify therapeutic generalization." },
  { rank: 50, claim: "The derangement of multiple glucose-independent metabolic pathways, which are often upregulated in therapy-resistant cancer, and concomitant cMyc downregulation coordinately contribute to the anti-proliferative effect of metformin in liver cancer cells. These are reversible and may influence its therapeutic utility.", evidence: [3], basis: "Metabolic changes and reduced proliferation support the mechanism, while withdrawal reversibility materially qualifies therapeutic durability." },
  { rank: 51, claim: "There is a possible correlation between c-MET and HER2 gene overexpression and poor clinical outcomes in patients with BC.", evidence: [1, 2], basis: "Expression, clinicopathological associations, and disease-free survival support correlation, while the 40-patient observational sample and possible-correlation framing limit generalization." },
  { rank: 52, claim: "As this protocol is safe and feasible, further research is warranted in this area for developing PPCS treatment options.", evidence: [0], basis: "Completion and physiological responses support feasibility, while only 11 participants, limited symptom differences, and the explicit need for further research qualify treatment implications." },
];

const now = () => new Date("2026-09-23T00:00:00.000Z");
const pmc = new PmcFullTextAdapter({ tool: "evidencelens-exp-el003-authoring", now });
const statusResolver = new PubmedStatusResolver({ tool: "evidencelens-exp-el003-authoring", now });
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const cases = [];
const authoringLedger = [];

for (const [index, spec] of specs.entries()) {
  const source = byRank.get(spec.rank);
  if (!source) throw new Error(`Missing inventory rank ${spec.rank}`);
  const claimParagraph = source.abstractParagraphs.find((paragraph) => paragraph.text.includes(spec.claim));
  if (!claimParagraph) throw new Error(`${source.pmcid} claim is not exact natural source text`);
  const evidenceParagraphs = spec.evidence.map((paragraphIndex) => source.abstractParagraphs[paragraphIndex]);
  if (evidenceParagraphs.some((paragraph) => !paragraph)) {
    throw new Error(`${source.pmcid} evidence paragraph index is invalid`);
  }
  const resolved = await pmc.resolve(source.pmcid);
  if (resolved.artifact.contentHash !== source.contentHash || resolved.artifact.license !== source.license) {
    throw new Error(`${source.pmcid} drifted from the frozen source inventory`);
  }
  await wait(400);
  const status = await statusResolver.resolve(source.pmid);
  const claimSpan = verifyPmcExactSpan({
    source: resolved.artifact,
    xml: resolved.snapshot,
    verbatim: spec.claim,
    fieldPath: claimParagraph.fieldPath,
  });
  const evidenceSpans = evidenceParagraphs.map((paragraph) => verifyPmcExactSpan({
    source: resolved.artifact,
    xml: resolved.snapshot,
    verbatim: paragraph.text,
    fieldPath: paragraph.fieldPath,
  }));
  const caseId = `EL003-DEV-MIX-${String(index + 1).padStart(3, "0")}`;
  const assembled = assembleEvidencePacket({
    claim: {
      claimId: `claim_${caseId.toLowerCase().replaceAll("-", "_")}`,
      verbatim: spec.claim,
      contextType: "PMC_ABSTRACT",
      claimType: "UNKNOWN",
      epistemicClass: "OBSERVED",
    },
    sources: [{ resolved, status }],
    evidenceSpans,
    reviewContext: {
      domain: "biomedical-semantic-relation",
      intendedUse: "RESEARCH_TRIAGE",
      requestedChecks: [],
    },
    provenance: {
      createdBy: caseId,
      createdAt: now().toISOString(),
      creationActivityId: `activity_${caseId.toLowerCase().replaceAll("-", "_")}`,
      softwareVersion: "evidencelens@0.1.0",
    },
  });
  cases.push({
    caseId,
    packetId: assembled.packet.packetId,
    packetHash: assembled.packetHash,
    claim: spec.claim,
    evidence: evidenceSpans.map((span) => ({
      spanId: span.spanId,
      verbatim: span.verbatim,
      ...(span.locator.section ? { section: span.locator.section } : {}),
    })),
    domain: "biomedical-literature",
    partition: "DEVELOPMENT",
    sourceGroupId: `pmcid_${source.pmcid}`,
    nearDuplicateGroupId: `natural_${source.sourceCaseId}`,
    origin: "NATURAL",
    excludedContextConfirmed: true,
  });
  authoringLedger.push({
    caseId,
    intendedConstructionLabel: "MIXED",
    sourceCaseId: source.sourceCaseId,
    pmcid: source.pmcid,
    claimFieldPath: claimParagraph.fieldPath,
    claimSpanId: claimSpan.spanId,
    evidenceFieldPaths: evidenceParagraphs.map((paragraph) => paragraph.fieldPath),
    mixedBasis: spec.basis,
    transformation: null,
    naturalClaimConfirmed: true,
    requiresHumanAuthorReview: true,
  });
  if (index < specs.length - 1) await wait(400);
}

validateSemanticCases(cases);
validatePartitionIsolation(cases);
if (cases.length !== 20 || new Set(cases.map((testCase) => testCase.sourceGroupId)).size !== 20 ||
  cases.some((testCase) => testCase.origin !== "NATURAL")) {
  throw new Error("Mixed candidate allocation must contain 20 natural cases from 20 sources");
}

console.log(JSON.stringify({
  assemblyVersion: "1.0.0",
  selectionRule: "Dual-case allocation ranks 21-28 plus single-case ranks 41-52",
  cases,
  authoringLedger,
}, null, 2));
