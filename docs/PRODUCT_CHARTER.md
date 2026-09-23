# Product Charter

**Status:** Frozen for EXP-EL001  
**Version:** 0.1.0  
**Owner:** Sean McDonnell / NextEleven LLC  
**Date:** 2026-09-23

## Mission

Build an evidence-review engine that converts a claim and its sources into an auditable, provenance-preserving human-review packet and uses bounded semantic judgments to decide what deserves closer inspection.

## Initial use case

A research reviewer supplies one scientific claim and one to five authorized sources. EvidenceLens resolves the sources, preserves exact evidence spans, verifies machine-checkable facts, runs only evaluated semantic questions, and returns a review priority with explicit reasons and uncertainty.

Biomedical literature is the first bounded research vertical. This does not authorize medical or clinical use.

## Product promise

EvidenceLens helps qualified reviewers locate and inspect possible tensions between claims and supplied evidence. It shows the source material, deterministic facts, semantic findings, uncertainty, versions, and provenance behind every disposition.

## Non-goals

EvidenceLens does not:

- determine scientific truth;
- replace peer review, systematic review, meta-analysis, or expert judgment;
- provide diagnosis, treatment recommendations, or clinical decision support;
- infer that an unflagged claim is correct;
- certify a paper, person, product, or institution;
- autonomously approve or reject research, grants, safety cases, or compliance submissions;
- use model confidence as the probability that a claim is true;
- treat generated extraction as observed source content; or
- conceal missing evidence behind generated prose.

## Governing principles

1. Deterministic software establishes every fact it can establish reliably.
2. Semantic models answer only genuinely semantic, atomic questions.
3. `INSUFFICIENT_EVIDENCE` is a valid and necessary result.
4. Model disagreement creates review, never truth.
5. Original source text is immutable and remains distinct from normalized or generated content.
6. Every result is reproducible from a versioned evidence packet.
7. An unflagged claim is never displayed as verified, safe, true, or approved.
8. Every evaluated question can be disabled independently.

## Epistemic classes

- **Observed:** source content or a fact deterministically established from inspectable inputs.
- **Inferred:** a conclusion derived by a named method or human reviewer.
- **Generated:** a model-produced extraction, classification, proposal, or semantic finding.

All semantic-model outputs are Generated. Human adoption of a finding creates a distinct adjudication record; it does not rewrite the original output.

## Initial dispositions

- `PACKET_INCOMPLETE`
- `ROUTINE_REVIEW`
- `FOCUSED_REVIEW`
- `SOURCE_STATUS_REVIEW`
- `CONFLICT_REVIEW`

These are routing states, not truth labels.

## Release rule

No semantic question enters the review product until it has:

- a written construct and labeling rubric;
- human agreement evidence;
- frozen development, blind, and transfer sets;
- state-blind and shuffled-evidence controls;
- question-specific error and abstention metrics;
- an approved threshold and risk tolerance; and
- documented excluded contexts.

