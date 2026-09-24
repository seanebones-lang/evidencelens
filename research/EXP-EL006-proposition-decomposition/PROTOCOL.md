# EXP-EL006 proposition-decomposition protocol

**Status:** Tuned development diagnostic; no JEV prediction requested

EXP-EL006 tests the specific failure hypothesis observed after EXP-EL005: JEV
may collapse a compound claim toward its contradicted component instead of
independently recognizing a different supported component.

The corpus contains only the 20 synthetic strict-mixed development cases from
EXP-EL005. Claims and evidence are unchanged. Each case adds two GPT-authored
fields that reproduce the two material propositions already present in the
compound claim:

- `supportedProposition`: expected to be directly supported by the evidence;
- `contradictedProposition`: expected to have its opposite directly established
  by the evidence.

JEV receives both propositions as typed state fields and answers two questions.
The expected diagnostic outcome is `YES/YES`. No four-class label is inferred,
no threshold is tuned, and no controls are included. The primary endpoint is
the proportion of cases returning `YES/YES`; secondary endpoints are the
support and contradiction answer rates and paired rescue relative to EXP-EL005.

GPT authored the proposition split and the expected answers. No human reviewed
or adjudicated them. This experiment reuses exposed development cases, was
designed after inspecting their failures, and cannot estimate generalization or
justify contract promotion.

The proposition records, assembled input, questions, runner, scoring rule, and
hashes must be committed before the first EXP-EL006 JEV request.
