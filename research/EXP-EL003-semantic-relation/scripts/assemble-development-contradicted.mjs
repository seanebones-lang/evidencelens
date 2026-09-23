import { readFile } from "node:fs/promises";

import { validatePartitionIsolation, validateSemanticCases } from "@evidencelens/semantic-evaluation";

const source = JSON.parse(await readFile(new URL("../development-supported-candidates.json", import.meta.url), "utf8"));
const byId = new Map(source.cases.map((testCase) => [testCase.caseId, testCase]));

const transformations = [
  ["EL003-DEV-SUP-001", "When used as first-line treatment for acute hypercapnic respiratory failure secondary to COPD exacerbation, noninvasive ventilation increases mortality.", "DIRECTION_REVERSAL"],
  ["EL003-DEV-SUP-002", "Total body irradiation for hematopoietic stem cell transplant does not provide uniform dose distribution.", "PROPERTY_REVERSAL"],
  ["EL003-DEV-SUP-003", "This study does not investigate patient factors affecting the plasma volume target attained during double filtration plasmapheresis for hypertriglyceridemic pancreatitis.", "AIM_NEGATION"],
  ["EL003-DEV-SUP-004", "Triple-negative breast cancer is among the least aggressive breast-cancer subtypes.", "DIRECTION_REVERSAL"],
  ["EL003-DEV-SUP-005", "Amyloidosis is caused by protein deposition exclusively within cells rather than in extracellular tissue.", "LOCATION_SUBSTITUTION"],
  ["EL003-DEV-SUP-006", "Quantum dots are characterized by low luminescence.", "PROPERTY_REVERSAL"],
  ["EL003-DEV-SUP-007", "The COVID-19 pandemic increased the availability of routine care such as cancer screening.", "DIRECTION_REVERSAL"],
  ["EL003-DEV-SUP-008", "Citrobacter is not commonly found in water.", "PRESENCE_NEGATION"],
  ["EL003-DEV-SUP-009", "Glioblastoma multiforme is a low-grade brain tumor.", "SEVERITY_REVERSAL"],
  ["EL003-DEV-SUP-010", "Targeting protein arginine methyltransferase 1 is not considered a promising therapeutic strategy in cancer treatment.", "ASSESSMENT_REVERSAL"],
  ["EL003-DEV-SUP-011", "Established guidelines exist for obstructive sleep apnea assessment in patients with COPD.", "EXISTENCE_REVERSAL"],
  ["EL003-DEV-SUP-012", "Increasing early-diagnosis rates is unnecessary for cancer control.", "NECESSITY_REVERSAL"],
  ["EL003-DEV-SUP-013", "The clinical consequences of coexistent tricuspid regurgitation in severe ischemic mitral regurgitation are well established.", "CERTAINTY_REVERSAL"],
  ["EL003-DEV-SUP-014", "This study did not assess how residential location affects access to kidney transplantation in Aotearoa New Zealand.", "AIM_NEGATION"],
  ["EL003-DEV-SUP-015", "Francisella novicida infections in humans typically occur in immunocompetent people.", "POPULATION_SUBSTITUTION"],
  ["EL003-DEV-SUP-016", "Tumour-derived sialoglycans inhibit tumour-cell adhesion.", "MECHANISM_REVERSAL"],
  ["EL003-DEV-SUP-017", "Racial differences in lung-cancer screening eligibility and outcomes no longer persist.", "PERSISTENCE_NEGATION"],
  ["EL003-DEV-SUP-018", "N6-methyladenosine modification is not associated with non-small cell lung cancer tumorigenesis.", "ASSOCIATION_NEGATION"],
  ["EL003-DEV-SUP-019", "Social media is recognized as ineffective for cancer health promotion.", "EFFECTIVENESS_REVERSAL"],
  ["EL003-DEV-SUP-020", "The 76-year-old patient with hormone-receptor-positive, HER2-negative breast cancer did not present with severe exertional dyspnea.", "PRESENTATION_NEGATION"],
];

const cases = transformations.map(([parentCaseId, claim], index) => {
  const parent = byId.get(parentCaseId);
  if (!parent) throw new Error(`Missing parent ${parentCaseId}`);
  return {
    ...parent,
    caseId: `EL003-DEV-CON-${String(index + 1).padStart(3, "0")}`,
    claim,
    origin: "SYNTHETIC",
  };
});

validateSemanticCases(cases);
validatePartitionIsolation([...source.cases, ...cases]);

console.log(JSON.stringify({
  assemblyVersion: "1.0.0",
  cases,
  authoringLedger: transformations.map(([parentCaseId, , transformation], index) => ({
    caseId: cases[index].caseId,
    intendedConstructionLabel: "CONTRADICTED",
    parentCaseId,
    transformation,
    materialPropositionsChanged: 1,
    requiresHumanAuthorReview: true,
  })),
}, null, 2));
