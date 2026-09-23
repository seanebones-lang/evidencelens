# EXP-EL003 JEV pilot disagreement audit 001

**Status:** GPT-authored post-hoc audit; human review required

## Integrity boundary

This audit does not relabel EXP-EL003, change its frozen 75.0% result, or constitute independent adjudication. GPT performed both the original provisional construction and this post-hoc review. The classifications below are hypotheses for human review and v2 design, not corrected ground truth.

## Audit result

| Classification | Cases | Meaning |
|---|---:|---|
| Probable JEV decision error | 8 | The supplied evidence appears to warrant a different atomic decision under the frozen rubric. |
| Weak provisional reference | 7 | The construction target appears to count absence, an already-bounded limitation, or a non-conflicting caveat as contradiction. |
| Rubric-boundary ambiguity | 4 | The result depends on whether study-design limitations materially qualify the precise claim. |
| Mapping sensitivity | 1 | JEV detected one side of a mixed relation, but the frozen pair-to-label mapping discarded it. |

## Main finding

The errors are not attributable to JEV alone. Eight cases look like probable atomic-decision errors, but seven provisional references are themselves weak and four more sit on an unresolved rubric boundary. The apparent `MIXED` sensitivity problem is therefore partly a corpus-definition problem: the construction process often treated methodological limitations as direct contradiction even when the claim was already bounded or the limitation was merely absent evidence.

A threshold change would not solve this cleanly. Several errors are low-margin, but others are confident and arise from semantic definitions. The next experiment should separate direct contradiction, scope mismatch, study-design limitation, and missing support into distinct typed decisions before mapping them to the four public labels.

## Case audit

### 1. `EL003-DEV-CON-003`

- Frozen comparison: `CONTRADICTED` → `INSUFFICIENT_EVIDENCE`
- Audit classification: **Probable JEV decision error**
- Support: `NO` (confidence 1.00; YES 0.00, NO 1.00, insufficient 0.00)
- Contradiction/qualification: `NO` (confidence 0.34; YES 0.44, NO 0.56, insufficient 0.00)
- Claim: This study does not investigate patient factors affecting the plasma volume target attained during double filtration plasmapheresis for hypertriglyceridemic pancreatitis.
- Audit rationale: The evidence explicitly says the study aims to investigate the factor that the negated claim says it does not investigate. The contradiction decision was a narrow 0.56 NO versus 0.44 YES.

### 2. `EL003-DEV-CON-007`

- Frozen comparison: `CONTRADICTED` → `INSUFFICIENT_EVIDENCE`
- Audit classification: **Weak provisional reference**
- Support: `INSUFFICIENT_EVIDENCE` (confidence 0.87; YES 0.00, NO 0.08, insufficient 0.92)
- Contradiction/qualification: `INSUFFICIENT_EVIDENCE` (confidence 0.28; YES 0.43, NO 0.05, insufficient 0.52)
- Claim: The COVID-19 pandemic increased the availability of routine care such as cancer screening.
- Audit rationale: The evidence says availability was impacted but does not state the direction of impact. It therefore does not directly contradict an increase; insufficient evidence is defensible under the frozen rubric.

### 3. `EL003-DEV-CON-014`

- Frozen comparison: `CONTRADICTED` → `INSUFFICIENT_EVIDENCE`
- Audit classification: **Probable JEV decision error**
- Support: `NO` (confidence 1.00; YES 0.00, NO 1.00, insufficient 0.00)
- Contradiction/qualification: `NO` (confidence 0.47; YES 0.35, NO 0.65, insufficient 0.00)
- Claim: This study did not assess how residential location affects access to kidney transplantation in Aotearoa New Zealand.
- Audit rationale: The evidence explicitly says the study assessed the impact that the negated claim says it did not assess. The contradiction decision was low-margin: 0.65 NO versus 0.35 YES.

### 4. `EL003-DEV-CON-020`

- Frozen comparison: `CONTRADICTED` → `INSUFFICIENT_EVIDENCE`
- Audit classification: **Probable JEV decision error**
- Support: `NO` (confidence 0.99; YES 0.01, NO 0.99, insufficient 0.00)
- Contradiction/qualification: `NO` (confidence 0.37; YES 0.42, NO 0.58, insufficient 0.00)
- Claim: The 76-year-old patient with hormone-receptor-positive, HER2-negative breast cancer did not present with severe exertional dyspnea.
- Audit rationale: The evidence explicitly reports severe exertional dyspnea in the described patient, directly contradicting the negated claim. The contradiction decision was low-margin: 0.58 NO versus 0.42 YES.

### 5. `EL003-DEV-IE-016`

- Frozen comparison: `INSUFFICIENT_EVIDENCE` → `CONTRADICTED`
- Audit classification: **Probable JEV decision error**
- Support: `NO` (confidence 0.64; YES 0.01, NO 0.75, insufficient 0.24)
- Contradiction/qualification: `YES` (confidence 0.47; YES 0.65, NO 0.11, insufficient 0.24)
- Claim: 受者出院后生活质量好，移植心功能基本正常。
- Audit rationale: The evidence describes heart failure after earlier coronary and valve surgery, while the claim describes a recipient's later discharge and transplanted-heart status. Without an explicit shared timepoint and intervention, contradiction requires an unsupported temporal identity inference.

### 6. `EL003-DEV-MIX-001`

- Frozen comparison: `MIXED` → `SUPPORTED`
- Audit classification: **Weak provisional reference**
- Support: `YES` (confidence 0.92; YES 0.95, NO 0.00, insufficient 0.05)
- Contradiction/qualification: `NO` (confidence 0.02; YES 0.33, NO 0.35, insufficient 0.32)
- Claim: Fluorescence imaging allows for noninvasively visualizing and measuring key physiological parameters like pH and dissolved oxygen.
- Original construction basis: The oxygen findings support one named outcome, while the supplied study does not evaluate the separately claimed pH outcome.
- Audit rationale: The evidence directly repeats that fluorescence imaging can measure both pH and dissolved oxygen. The study's subsequent focus on oxygen does not negate or materially qualify that explicit general statement; absence of a pH experiment is not contradiction.

### 7. `EL003-DEV-MIX-002`

- Frozen comparison: `MIXED` → `SUPPORTED`
- Audit classification: **Probable JEV decision error**
- Support: `YES` (confidence 0.94; YES 0.96, NO 0.00, insufficient 0.04)
- Contradiction/qualification: `NO` (confidence 0.34; YES 0.13, NO 0.56, insufficient 0.31)
- Claim: According to the findings, somatic EGFR mutations can be employed as a diagnostic tool for non-small cell lung cancer in Egypt, and they can be implemented in conjunction with clinical criteria to identify which patients are more likely to respond favorably to TKIs.
- Original construction basis: Mutation prevalence and clinical associations support stratification, but actual TKI response was not measured, creating an outcome mismatch.
- Audit rationale: The evidence supports mutation prevalence and clinical associations but reports no observed TKI-response outcome. That outcome mismatch materially qualifies the compound claim, yet JEV selected NO for qualification.

### 8. `EL003-DEV-MIX-004`

- Frozen comparison: `MIXED` → `SUPPORTED`
- Audit classification: **Rubric-boundary ambiguity**
- Support: `YES` (confidence 0.99; YES 0.99, NO 0.00, insufficient 0.01)
- Contradiction/qualification: `NO` (confidence 0.69; YES 0.02, NO 0.79, insufficient 0.19)
- Claim: Hence, early diagnosis based on periodic examination in patients with ESRD and aggressive surgical treatment are necessary.
- Original construction basis: The review's observed mobility and embolism associations support concern, while the narrative-case evidence does not directly establish necessity or comparative treatment benefit.
- Audit rationale: The narrative case review supplies the rationale and directly states the necessity conclusion, but it does not establish comparative benefit or necessity. Whether study-design limits qualify an explicitly quoted conclusion is a genuine rubric boundary.

### 9. `EL003-DEV-MIX-006`

- Frozen comparison: `MIXED` → `SUPPORTED`
- Audit classification: **Weak provisional reference**
- Support: `YES` (confidence 1.00; YES 1.00, NO 0.00, insufficient 0.00)
- Contradiction/qualification: `NO` (confidence 0.64; YES 0.01, NO 0.76, insufficient 0.23)
- Claim: Among many host-directed targets, host immunometabolism has emerged as one of the most attractive targets for developing new host-directed therapies.
- Original construction basis: The review identifies the target and biological rationale while explicitly describing the infectious-disease association as underappreciated and containing knowledge gaps.
- Audit rationale: The claim is that immunometabolism has emerged as an attractive target, which the evidence states directly. Knowledge gaps about glutamine metabolism in infectious disease do not directly contradict that emergence or attractiveness claim.

### 10. `EL003-DEV-MIX-008`

- Frozen comparison: `MIXED` → `SUPPORTED`
- Audit classification: **Probable JEV decision error**
- Support: `YES` (confidence 0.95; YES 0.97, NO 0.00, insufficient 0.03)
- Contradiction/qualification: `NO` (confidence 0.72; YES 0.09, NO 0.82, insufficient 0.09)
- Claim: In conclusion, this workflow based on theoretical and experimental approaches demonstrates effective in identifying VEGFR‐2 inhibitors and can be easily adapted to other medicinal chemistry goals.
- Original construction basis: Two prioritized compounds and cell-line activity support identification, while the narrow library, in-vitro setting, and untested adaptability limit the broader claim.
- Audit rationale: Two in-vitro candidates support identification, while a 187-compound library, cell-line testing, and no adaptation experiment materially limit the broader effectiveness and easy-adaptability propositions.

### 11. `EL003-DEV-MIX-009`

- Frozen comparison: `MIXED` → `INSUFFICIENT_EVIDENCE`
- Audit classification: **Probable JEV decision error**
- Support: `YES` (confidence 0.33; YES 0.55, NO 0.01, insufficient 0.44)
- Contradiction/qualification: `INSUFFICIENT_EVIDENCE` (confidence 0.49; YES 0.11, NO 0.23, insufficient 0.66)
- Claim: This consensus provides evidence-based data to guide LN diagnosis and treatment, supporting the development of public and supplementary health policies in Brazil.
- Original construction basis: Systematic review, GRADE, and recommendations support the claim, while some management areas relied on literature review and expert opinion rather than eligible trials.
- Audit rationale: Systematic review and GRADE support the evidence-based component, while the explicit use of literature review and expert opinion for other management areas materially qualifies it. JEV recognized support but not the qualification.

### 12. `EL003-DEV-MIX-010`

- Frozen comparison: `MIXED` → `SUPPORTED`
- Audit classification: **Rubric-boundary ambiguity**
- Support: `YES` (confidence 0.95; YES 0.97, NO 0.00, insufficient 0.03)
- Contradiction/qualification: `NO` (confidence 0.46; YES 0.19, NO 0.64, insufficient 0.17)
- Claim: The healing program is an effective psychosocial nursing intervention that helps cancer survivors feel better about their illness, and it helps them healthy transition from negative emotions to increased resilience and positive cognitive emotions.
- Original construction basis: Significant psychological outcomes support effectiveness, while the small quasi-experimental regional sample limits population and causal scope.
- Audit rationale: The measured outcomes support effectiveness, but the broad intervention claim rests on 39 participants from four regional centers. Whether that design limitation alone constitutes a material population or causal qualification needs human adjudication.

### 13. `EL003-DEV-MIX-011`

- Frozen comparison: `MIXED` → `INSUFFICIENT_EVIDENCE`
- Audit classification: **Mapping sensitivity**
- Support: `INSUFFICIENT_EVIDENCE` (confidence 0.34; YES 0.43, NO 0.01, insufficient 0.56)
- Contradiction/qualification: `YES` (confidence 0.21; YES 0.47, NO 0.06, insufficient 0.47)
- Claim: The clinical impact of transcatheter valve explantation is significant and should be strongly considered by multidisciplinary heart teams in the lifetime management strategy of cardiac valvular disease.
- Original construction basis: Urgency, mortality, and survival findings support clinical importance, while the evidence is a 44-patient retrospective single-institution cohort.
- Audit rationale: JEV detected qualification (YES) but assigned support to INSUFFICIENT_EVIDENCE by a narrow 0.56 to 0.43 margin. The frozen mapping converts that pair to insufficient evidence even though the response contains the second half of the intended mixed relation.

### 14. `EL003-DEV-MIX-013`

- Frozen comparison: `MIXED` → `SUPPORTED`
- Audit classification: **Probable JEV decision error**
- Support: `YES` (confidence 1.00; YES 1.00, NO 0.00, insufficient 0.00)
- Contradiction/qualification: `NO` (confidence 0.61; YES 0.11, NO 0.74, insufficient 0.15)
- Claim: The RBS provided a systematic way to narrow down the patient population to a subset that is enriched for eligible patients.
- Original construction basis: The system reduced the screening pool, while 32.1% accuracy and documented false positives materially qualify the enrichment claim.
- Audit rationale: The reduced screening pool supports narrowing, while 32.1% accuracy and documented false positives materially qualify enrichment. JEV selected NO for qualification despite those explicit limitations.

### 15. `EL003-DEV-MIX-014`

- Frozen comparison: `MIXED` → `SUPPORTED`
- Audit classification: **Rubric-boundary ambiguity**
- Support: `YES` (confidence 0.99; YES 1.00, NO 0.00, insufficient 0.00)
- Contradiction/qualification: `NO` (confidence 0.78; YES 0.04, NO 0.85, insufficient 0.11)
- Claim: Green synthesis techniques have drawn a lot of interest lately since they are beneficial to the environment and have potential uses in a variety of industries, including biomedicine.
- Original construction basis: The review describes biomedical uses while also explicitly covering drawbacks, difficulties, and future prospects rather than established broad application.
- Audit rationale: The evidence directly repeats interest, environmental benefit, and potential biomedical uses, while mentioning drawbacks and difficulties without specifying that they negate those propositions. The materiality of that qualification is unresolved.

### 16. `EL003-DEV-MIX-015`

- Frozen comparison: `MIXED` → `SUPPORTED`
- Audit classification: **Rubric-boundary ambiguity**
- Support: `YES` (confidence 0.99; YES 1.00, NO 0.00, insufficient 0.00)
- Contradiction/qualification: `NO` (confidence 0.76; YES 0.03, NO 0.84, insufficient 0.13)
- Claim: Measurement of symptoms burden throughout clinical trial follow-up is feasible in AF/HF and should be useful for evaluating patient-centered outcomes in AF prevention trials.
- Original construction basis: Efficiency and correlation results support feasibility and usefulness, while validation occurred within one 267-patient trial and some specificity applied to recent-onset AF.
- Audit rationale: The trial supports feasibility and useful endpoint performance. Single-trial validation and recent-onset specificity may qualify generalization, but the claim is already limited to AF/HF prevention trials, making materiality judgment-dependent.

### 17. `EL003-DEV-MIX-016`

- Frozen comparison: `MIXED` → `INSUFFICIENT_EVIDENCE`
- Audit classification: **Weak provisional reference**
- Support: `INSUFFICIENT_EVIDENCE` (confidence 0.81; YES 0.12, NO 0.00, insufficient 0.88)
- Contradiction/qualification: `INSUFFICIENT_EVIDENCE` (confidence 0.83; YES 0.07, NO 0.04, insufficient 0.89)
- Claim: Early identification of LMNA‐related muscular dystrophies is crucial to ensure appropriate cardiac screening and prevent devastating cardiac complications.
- Original construction basis: Phenotypic overlap and the cardiac-failure case support diagnostic importance, while a single case does not establish prevention of complications.
- Audit rationale: The case supports diagnostic concern but does not directly establish that early identification prevents complications. The evidence is better characterized as incomplete for the full claim than as simultaneous support and contradiction.

### 18. `EL003-DEV-MIX-017`

- Frozen comparison: `MIXED` → `SUPPORTED`
- Audit classification: **Weak provisional reference**
- Support: `YES` (confidence 0.99; YES 0.99, NO 0.00, insufficient 0.01)
- Contradiction/qualification: `NO` (confidence 0.91; YES 0.02, NO 0.94, insufficient 0.04)
- Claim: Together, these results demonstrate a new role of Rab27B in the autophagy trafficking process in CRC and identify Rab27B as a potential therapeutic target for CRC.
- Original construction basis: Autophagy disruption and impaired 3D/in-vivo growth support the target, while preserved 2D growth and preclinical evidence qualify therapeutic generalization.
- Audit rationale: The evidence directly supports a new trafficking role and a potential therapeutic target. Preserved 2D growth does not negate impaired 3D and in-vivo growth, and 'potential' already limits the therapeutic proposition.

### 19. `EL003-DEV-MIX-018`

- Frozen comparison: `MIXED` → `SUPPORTED`
- Audit classification: **Weak provisional reference**
- Support: `YES` (confidence 0.99; YES 1.00, NO 0.00, insufficient 0.00)
- Contradiction/qualification: `NO` (confidence 0.62; YES 0.13, NO 0.75, insufficient 0.12)
- Claim: The derangement of multiple glucose-independent metabolic pathways, which are often upregulated in therapy-resistant cancer, and concomitant cMyc downregulation coordinately contribute to the anti-proliferative effect of metformin in liver cancer cells. These are reversible and may influence its therapeutic utility.
- Original construction basis: Metabolic changes and reduced proliferation support the mechanism, while withdrawal reversibility materially qualifies therapeutic durability.
- Audit rationale: Reversibility is explicitly part of the claim and is directly supported by withdrawal experiments. Treating that same stated reversibility as a contradiction double-counts a limitation already incorporated into the proposition.

### 20. `EL003-DEV-MIX-020`

- Frozen comparison: `MIXED` → `SUPPORTED`
- Audit classification: **Weak provisional reference**
- Support: `YES` (confidence 0.97; YES 0.98, NO 0.00, insufficient 0.02)
- Contradiction/qualification: `NO` (confidence 0.83; YES 0.04, NO 0.89, insufficient 0.07)
- Claim: As this protocol is safe and feasible, further research is warranted in this area for developing PPCS treatment options.
- Original construction basis: Completion and physiological responses support feasibility, while only 11 participants, limited symptom differences, and the explicit need for further research qualify treatment implications.
- Audit rationale: The claim is expressly limited to safety, feasibility, and the need for further research. Eleven participants and limited symptom effects constrain efficacy, but they do not contradict the bounded feasibility claim or its call for more research.

## Consequence for v2

Freeze four independent atomic questions: direct support, direct contradiction, explicit scope/population/outcome mismatch, and explicit study-design limitation. Do not let absent evidence count as contradiction. Define whether methodological limitations qualify a claim based on the claim's exact scope, and preserve each atomic probability before applying a preregistered mapping. Develop on EXP-EL003 only; evaluate the resulting contract once on a new, source-isolated holdout.
