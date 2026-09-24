# EXP-EL004 mixed-policy review 001

**Status:** GPT-authored post-hoc development review; human adjudication required

## Boundary

This review applies `MIXED-POLICY-1.0.0` to the 20 cases originally constructed as `MIXED`. It does not change their frozen provisional references, the EXP-EL003 score, or the EXP-EL004 score. Because GPT authored both the original constructions and this review, these labels are hypotheses—not corrected ground truth.

## Result

- Retained as `MIXED`: 4/20
- Better characterized as `SUPPORTED`: 15/20
- Better characterized as `INSUFFICIENT_EVIDENCE`: 1/20
- v1 agreement with policy review: 65.0%
- v2 agreement with policy review: 65.0%

The review suggests that the original development corpus severely overconstructed `MIXED`: only four cases clearly retain both direct support and a material conflicting or narrowing signal under the stricter policy. This explains why adding more qualification questions did not improve agreement with the old references.

## Cases

| Case | Original | Policy review | v1 | v2 |
|---|---|---|---|---|
| `EL003-DEV-MIX-001` | MIXED | **SUPPORTED** | SUPPORTED | SUPPORTED |
| `EL003-DEV-MIX-002` | MIXED | **MIXED** | SUPPORTED | SUPPORTED |
| `EL003-DEV-MIX-003` | MIXED | **MIXED** | MIXED | SUPPORTED |
| `EL003-DEV-MIX-004` | MIXED | **SUPPORTED** | SUPPORTED | SUPPORTED |
| `EL003-DEV-MIX-005` | MIXED | **SUPPORTED** | MIXED | SUPPORTED |
| `EL003-DEV-MIX-006` | MIXED | **SUPPORTED** | SUPPORTED | SUPPORTED |
| `EL003-DEV-MIX-007` | MIXED | **SUPPORTED** | MIXED | MIXED |
| `EL003-DEV-MIX-008` | MIXED | **SUPPORTED** | SUPPORTED | SUPPORTED |
| `EL003-DEV-MIX-009` | MIXED | **MIXED** | INSUFFICIENT_EVIDENCE | INSUFFICIENT_EVIDENCE |
| `EL003-DEV-MIX-010` | MIXED | **SUPPORTED** | SUPPORTED | SUPPORTED |
| `EL003-DEV-MIX-011` | MIXED | **MIXED** | INSUFFICIENT_EVIDENCE | INSUFFICIENT_EVIDENCE |
| `EL003-DEV-MIX-012` | MIXED | **SUPPORTED** | MIXED | SUPPORTED |
| `EL003-DEV-MIX-013` | MIXED | **SUPPORTED** | SUPPORTED | MIXED |
| `EL003-DEV-MIX-014` | MIXED | **SUPPORTED** | SUPPORTED | SUPPORTED |
| `EL003-DEV-MIX-015` | MIXED | **SUPPORTED** | SUPPORTED | SUPPORTED |
| `EL003-DEV-MIX-016` | MIXED | **INSUFFICIENT_EVIDENCE** | INSUFFICIENT_EVIDENCE | INSUFFICIENT_EVIDENCE |
| `EL003-DEV-MIX-017` | MIXED | **SUPPORTED** | SUPPORTED | SUPPORTED |
| `EL003-DEV-MIX-018` | MIXED | **SUPPORTED** | SUPPORTED | SUPPORTED |
| `EL003-DEV-MIX-019` | MIXED | **SUPPORTED** | MIXED | MIXED |
| `EL003-DEV-MIX-020` | MIXED | **SUPPORTED** | SUPPORTED | SUPPORTED |

## Rationale

### `EL003-DEV-MIX-001` → `SUPPORTED`

- Original basis: The oxygen findings support one named outcome, while the supplied study does not evaluate the separately claimed pH outcome.
- Policy review: The evidence directly states both pH and dissolved-oxygen capability; subsequent oxygen-only experimentation is silence about validation breadth, not conflicting evidence.

### `EL003-DEV-MIX-002` → `MIXED`

- Original basis: Mutation prevalence and clinical associations support stratification, but actual TKI response was not measured, creating an outcome mismatch.
- Policy review: Mutation prevalence and clinical associations support diagnostic stratification, while the evidence measures no TKI-response outcome asserted by the compound claim; this is a material outcome mismatch.

### `EL003-DEV-MIX-003` → `MIXED`

- Original basis: BMD and FRAX improvements support effectiveness while de novo fractures, UTI, hypocalcemia, and other events materially qualify safety and fracture prevention.
- Policy review: BMD and FRAX changes support effectiveness, while de novo fractures, hypocalcemia, UTI, rejection, and cardiovascular events directly qualify safety and fracture-prevention propositions.

### `EL003-DEV-MIX-004` → `SUPPORTED`

- Original basis: The review's observed mobility and embolism associations support concern, while the narrative-case evidence does not directly establish necessity or comparative treatment benefit.
- Policy review: The review states the necessity conclusion and supplies its embolism rationale. Lack of comparative evidence is an evidentiary-quality concern, not direct conflicting text.

### `EL003-DEV-MIX-005` → `SUPPORTED`

- Original basis: Observed patency supports rarity, while recorded endoleaks and early reinterventions materially qualify the favorable outcome.
- Policy review: The claim already includes endoleak-related instability and reintervention; high patency and the reported event pattern support rather than conflict with the bounded claim.

### `EL003-DEV-MIX-006` → `SUPPORTED`

- Original basis: The review identifies the target and biological rationale while explicitly describing the infectious-disease association as underappreciated and containing knowledge gaps.
- Policy review: The evidence directly states that immunometabolism emerged as an attractive target. Knowledge gaps about one metabolic pathway do not conflict with that proposition.

### `EL003-DEV-MIX-007` → `SUPPORTED`

- Original basis: Long-term BP and drug-burden changes support efficacy, while only 27 of 96 had prospective long-term follow-up and renal outcomes qualify the safety scope.
- Policy review: The observed long-term BP and drug-burden changes are directly supported. Attrition and renal outcomes warrant caution but do not directly refute the cohort-bounded observation or establish procedure attribution.

### `EL003-DEV-MIX-008` → `SUPPORTED`

- Original basis: Two prioritized compounds and cell-line activity support identification, while the narrow library, in-vitro setting, and untested adaptability limit the broader claim.
- Policy review: The workflow identified candidates as claimed. Its narrow library and untested adaptation are limitations and missing validation, not direct conflicting evidence under this policy.

### `EL003-DEV-MIX-009` → `MIXED`

- Original basis: Systematic review, GRADE, and recommendations support the claim, while some management areas relied on literature review and expert opinion rather than eligible trials.
- Policy review: Systematic review and GRADE support an evidence-based consensus, while explicit reliance on expert opinion for other management areas materially narrows the evidence-based proposition.

### `EL003-DEV-MIX-010` → `SUPPORTED`

- Original basis: Significant psychological outcomes support effectiveness, while the small quasi-experimental regional sample limits population and causal scope.
- Policy review: The reported group differences support the intervention outcome. The small regional sample limits generalization but does not directly conflict with the supplied claim.

### `EL003-DEV-MIX-011` → `MIXED`

- Original basis: Urgency, mortality, and survival findings support clinical importance, while the evidence is a 44-patient retrospective single-institution cohort.
- Policy review: Urgent surgery, mortality, and survival support clinical importance, while the explicit single-institution retrospective cohort materially narrows the unbounded lifetime-management recommendation.

### `EL003-DEV-MIX-012` → `SUPPORTED`

- Original basis: Drainage and complication results support recovery benefits, while the small trial and evidence reported for only some claimed outcomes qualify the recommendation's scope.
- Policy review: Drainage, seroma, infection, and operative-time results support several material propositions. Unreported lymph-node yield is missing coverage, not contradiction.

### `EL003-DEV-MIX-013` → `SUPPORTED`

- Original basis: The system reduced the screening pool, while 32.1% accuracy and documented false positives materially qualify the enrichment claim.
- Policy review: The system narrowed 161,000 candidates to a smaller pool with 32.1% eligibility. False positives qualify operational quality but remain compatible with a claim of enrichment and narrowing.

### `EL003-DEV-MIX-014` → `SUPPORTED`

- Original basis: The review describes biomedical uses while also explicitly covering drawbacks, difficulties, and future prospects rather than established broad application.
- Policy review: The evidence directly states interest, environmental benefit, and potential biomedical uses. Unspecified drawbacks and future prospects do not directly conflict with those bounded propositions.

### `EL003-DEV-MIX-015` → `SUPPORTED`

- Original basis: Efficiency and correlation results support feasibility and usefulness, while validation occurred within one 267-patient trial and some specificity applied to recent-onset AF.
- Policy review: The instrument's efficiency and correlation support feasibility and usefulness in AF/HF trials. The claim is already trial-scoped, so single-trial validation is not an additional conflict.

### `EL003-DEV-MIX-016` → `INSUFFICIENT_EVIDENCE`

- Original basis: Phenotypic overlap and the cardiac-failure case support diagnostic importance, while a single case does not establish prevention of complications.
- Policy review: The case supports diagnostic concern but does not directly establish that early identification prevents cardiac complications; no opposing result establishes contradiction.

### `EL003-DEV-MIX-017` → `SUPPORTED`

- Original basis: Autophagy disruption and impaired 3D/in-vivo growth support the target, while preserved 2D growth and preclinical evidence qualify therapeutic generalization.
- Policy review: Autophagy disruption and impaired 3D and in-vivo growth support a new role and potential target. Preserved 2D growth is compatible with the explicitly tentative word 'potential'.

### `EL003-DEV-MIX-018` → `SUPPORTED`

- Original basis: Metabolic changes and reduced proliferation support the mechanism, while withdrawal reversibility materially qualifies therapeutic durability.
- Policy review: Metabolic effects and withdrawal reversibility are both stated in the claim and supported by the results; reversibility cannot also be counted as a conflict.

### `EL003-DEV-MIX-019` → `SUPPORTED`

- Original basis: Expression, clinicopathological associations, and disease-free survival support correlation, while the 40-patient observational sample and possible-correlation framing limit generalization.
- Policy review: Expression, clinicopathological associations, and disease-free survival support the expressly hedged 'possible correlation'; sample size does not conflict with that bounded claim.

### `EL003-DEV-MIX-020` → `SUPPORTED`

- Original basis: Completion and physiological responses support feasibility, while only 11 participants, limited symptom differences, and the explicit need for further research qualify treatment implications.
- Policy review: The evidence supports safety and feasibility in the studied protocol and explicitly calls for further research, exactly matching the claim's bounded conclusion.

## Consequence

Do not tune another JEV prompt against the original 20 `MIXED` references. First construct new development cases that satisfy the strict two-condition policy by exact text, with missing-coverage flags represented separately. Only then freeze a simpler contract and a source-isolated holdout.
