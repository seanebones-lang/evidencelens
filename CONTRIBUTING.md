# Contributing

EvidenceLens is currently a research system. Correct boundaries and reproducibility matter more than feature volume.

## Before changing behavior

Read:

1. `docs/PRODUCT_CHARTER.md`
2. `docs/RISK_REGISTER.md`
3. the relevant experiment protocol

Changes to packet fields, question wording, answer types, thresholds, routing, or epistemic classes require a version change and an evaluation note.

## Local checks

```bash
npm ci
npm run check
```

Do not commit generated `dist/` output.

## Pull requests

Each pull request should state:

- what changed;
- which invariant or experiment it supports;
- what was tested;
- whether schemas, questions, or risk boundaries changed; and
- any new failure modes or missing-data behavior.

Never describe Generated content as Observed evidence.

