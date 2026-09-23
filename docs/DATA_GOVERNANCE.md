# Data Governance

**Version:** 0.1.0

## Source policy

EvidenceLens may ingest:

- public metadata from authoritative APIs;
- openly licensed full text under its applicable terms;
- user-uploaded material the user is authorized to process; and
- synthetic or internally created evaluation examples.

The system must not assume that discovery, metadata access, or a DOI grants permission to store or redistribute full text.

## Preservation

For every source snapshot record:

- canonical identifier;
- source system;
- retrieval timestamp;
- source version/status when available;
- content or response hash;
- applicable license metadata when available;
- local retention authority;
- exact evidence locators; and
- adapter and parser versions.

## Separation of data classes

Keep these separate in storage and exports:

- original source bytes;
- authoritative source metadata;
- machine-extracted candidate content;
- deterministic assertions;
- semantic findings;
- human annotations and adjudications; and
- derived routing decisions.

## Missing data

Missing, unresolved, inaccessible, or unauthorized material is stored as an explicit status. The system must not generate replacement source content.

## Retention and deletion

Before accepting private pilot data, define and test:

- retention period;
- deletion and tombstone behavior;
- backup expiration;
- model-provider data handling;
- export procedure;
- access logging; and
- incident response.

EXP-EL001 should use public/openly licensed or project-authored material only.

