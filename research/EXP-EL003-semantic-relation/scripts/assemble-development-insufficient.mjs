import { readFile } from "node:fs/promises";

import { verifyPmcExactSpan } from "@evidencelens/deterministic-checks";
import { assembleEvidencePacket } from "@evidencelens/packet-builder";
import { validatePartitionIsolation, validateSemanticCases } from "@evidencelens/semantic-evaluation";
import { PmcFullTextAdapter, PubmedStatusResolver } from "@evidencelens/source-adapters";

const inventory = JSON.parse(await readFile(new URL("../development-source-inventory.json", import.meta.url), "utf8"));
const byRank = new Map(inventory.sources.map((source) => [source.allocationRank, source]));
const specs = [
  [21, "Notably, after 12 h, the oxygen concentration dropped to a hypoxic level of PO2 2.7 ± 0.1%.", "These sensors incorporate oxygen-sensitive probes (Ru­(dpp) or PtOEP) and reference dyes (RBITC or A647 NHS-Ester).", 0, 0],
  [22, "Females harbored EGFR mutations (54.32%) with higher frequency than men (45.68%) (P < 0.001), while nonsmokers had EGFR mutations (70.37%) more frequently than current smokers (29.63%) (P < 0.001).", "The study comprised 333 NSCLC tissue samples from 230 males and 103 females with an average age of 50 years.", 3, 2],
  [23, "Urinary tract infection (UTI) occurred in 17 patients.", "We analyzed 98 KTRs who used denosumab from 2018 to 2023.", 2, 1],
  [24, "Mobile CAT was more common in the chronic renal failure group.", "A cardiac calcified amorphous tumor (CAT) is a non-neoplastic cardiac mass composed of calcified nodules surrounded by amorphous fibrous tissue in a context of degeneration and chronic inflammation.", 0, 0],
  [25, "No TV stenosis or occlusion was detected up to 48 months of follow-up.", "A retrospective analysis of consecutive patients, managed between September 1, 2011, and June 30, 2022, with custom-made aortic arch endografts (Cook Medical, Bloomington, IN, USA), presenting at least one branch configuration, were eligible.", 2, 1],
  [26, "In 2023 alone, this ancient disease was responsible for the death of 1.4 million individuals and has infected 10.6 million people.", "This mini review will focus on glutamine metabolism and its emergence as a potential target for treating tuberculosis (TB).", 0, 0],
  [27, "At 8 years after uRDN, the change in 24 h ambulatory SBP was −19.5 [95%CI −26.7,−12.4] mmHg (p<0.001).", "The primary efficacy outcome was 24 h ambulatory SBP, adjusted for the number of defined daily dosages (DDD) of antihypertensive drugs.", 2, 1],
  [28, "Interestingly, expression studies indicated that, in the presence of RHE‐334, VEGFR‐2 was equal to 0.52±0.03, thus comparable to imatinib equal to 0.63±0.03.", "A pool of 18 promising candidates was shortlisted and screened against VEGFR‐2 by using molecular docking.", 0, 0],
  [29, "患者未出现凝血相关并发症，均顺利出院。", "收集2023年9月至11月在泰达国际心血管病医院进行左心室辅助装置植入手术的终末期心力衰竭的4例患者临床资料，包括手术情况、凝血指标、血制品与凝血药物的应用等，并作文献复习。", 2, 1],
  [30, "Importantly, our findings demonstrate that C80EZ® not only ensures the survival of T cells, with a particular emphasis on preserving the CD8+ subsets, but also maintains their critical function in targeting and eliminating cancer cells.", "While conventional techniques such as freezing with liquid nitrogen remain prevalent, they pose significant challenges including high equipment costs, safety considerations, and logistical hurdles in transportation.", 0, 0],
  [31, "At 18-month follow-up, the patient does not endorse any cardiovascular symptoms and echocardiography findings are consistent with a well-seated and normally functioning prosthetic valve.", "While these prostheses are indicated for aortic valve replacement, there are case studies that have reported their use in the pulmonic position in high surgical risk patients.", 1, 0],
  [32, "患者最终好转出院。", "报告重症颅脑创伤后出凝血障碍1例并进行文献复习。", 2, 1],
  [33, "Twelve-year freedom from reintervention was 69% in the stented group and 97% in the grafted group (P log-rank = .003).", "Freedom from reintervention and survival were assessed by the Kaplan–Meier method.", 2, 1],
  [34, "最终因感染死亡。", "体外膜肺氧合（Extracorporeal membrane oxygenation, ECMO）是一种基于体外循环原理，为严重心肺功能衰竭患者提供短期生命支持的先进技术", 0, 0],
  [35, "The stage 1 model improved performance with area under the curve values of 0.849 for mortality, 0.786 for ICU admission, and 0.783 for persistent organ failure.", "We developed ML models to predict SAP, in-hospital mortality, and intensive care unit (ICU) admission.", 3, 2],
  [36, "受者出院后生活质量好，移植心功能基本正常。", "因冠心病、二尖瓣返流、三尖瓣返流行“冠状动脉旁路移植、二尖瓣机械瓣置换、三尖瓣成形术”2个月余的患者，再次出现心功能衰竭、心源性休克", 0, 0],
  [37, "Functional genomics in drug discovery, particularly for cancer, is still not thoroughly investigated, despite the existence of a significant amount of literature on the subject.", "Drug repurposing is an economically efficient approach that entails discovering novel therapeutic applications for already-available medications.", 0, 0],
  [38, "A biobehavioral framework can enhance our understanding of the complex association between medications, physical symptoms, and psychosocial distress in patients with GVHD.", "Among the potential complications of allogeneic hematopoietic stem cell transplantation (HSCT), graft-versus-host disease (GVHD) is common and associated with significant physical and psychosocial symptom burden.", 0, 0],
  [39, "After benchmarking 3 state-of-the-art machine learning models, the random forest model emerged as the best classifier with 96.9% accuracy.", "Neural Network, Random Forest, and extreme gradient boosting machine learning models were trained to distinguish between tumor types.", 2, 1],
  [40, "However, in contrast to the prediction, a significant increase in cortisol was noted in the experimental group relative to the control group (p = .016).", "Blood samples were collected to measure the levels of cortisol, serotonin, and natural killer (NK) cells.", 2, 1],
];

const now = () => new Date("2026-09-23T00:00:00.000Z");
const pmc = new PmcFullTextAdapter({ tool: "evidencelens-exp-el003-authoring", now });
const statusResolver = new PubmedStatusResolver({ tool: "evidencelens-exp-el003-authoring", now });
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const cases = [];
const authoringLedger = [];

for (const [index, [rank, claim, evidence, claimParagraphIndex, evidenceParagraphIndex]] of specs.entries()) {
  const source = byRank.get(rank);
  if (!source) throw new Error(`Missing inventory rank ${rank}`);
  const claimParagraph = source.abstractParagraphs[claimParagraphIndex];
  const evidenceParagraph = source.abstractParagraphs[evidenceParagraphIndex];
  if (!claimParagraph?.text.includes(claim) || !evidenceParagraph?.text.includes(evidence)) {
    throw new Error(`${source.pmcid} authoring text is not an exact substring of its frozen inventory`);
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
    verbatim: claim,
    fieldPath: claimParagraph.fieldPath,
  });
  const evidenceSpan = verifyPmcExactSpan({
    source: resolved.artifact,
    xml: resolved.snapshot,
    verbatim: evidence,
    fieldPath: evidenceParagraph.fieldPath,
  });
  const caseId = `EL003-DEV-IE-${String(index + 1).padStart(3, "0")}`;
  const assembled = assembleEvidencePacket({
    claim: {
      claimId: `claim_${caseId.toLowerCase().replaceAll("-", "_")}`,
      verbatim: claim,
      contextType: "PMC_ABSTRACT",
      claimType: "UNKNOWN",
      epistemicClass: "OBSERVED",
    },
    sources: [{ resolved, status }],
    evidenceSpans: [evidenceSpan],
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
    claim,
    evidence: [{
      spanId: evidenceSpan.spanId,
      verbatim: evidenceSpan.verbatim,
      ...(evidenceSpan.locator.section ? { section: evidenceSpan.locator.section } : {}),
    }],
    domain: "biomedical-literature",
    partition: "DEVELOPMENT",
    sourceGroupId: `pmcid_${source.pmcid}`,
    nearDuplicateGroupId: `natural_${source.sourceCaseId}`,
    origin: "NATURAL",
    excludedContextConfirmed: true,
  });
  authoringLedger.push({
    caseId,
    intendedConstructionLabel: "INSUFFICIENT_EVIDENCE",
    sourceCaseId: source.sourceCaseId,
    pmcid: source.pmcid,
    claimFieldPath: claimParagraph.fieldPath,
    claimSpanId: claimSpan.spanId,
    evidenceFieldPaths: [evidenceParagraph.fieldPath],
    transformation: null,
    naturalClaimConfirmed: true,
    requiresHumanAuthorReview: true,
  });
  if (index < specs.length - 1) await wait(400);
}

validateSemanticCases(cases);
validatePartitionIsolation(cases);
if (cases.length !== 20 || cases.some((testCase) => testCase.origin !== "NATURAL")) {
  throw new Error("Insufficient-evidence candidate allocation must contain 20 natural cases");
}

console.log(JSON.stringify({
  assemblyVersion: "1.0.0",
  selectionRule: "Allocation ranks 21-40; exact natural claim paired with non-resolving exact evidence",
  cases,
  authoringLedger,
}, null, 2));
