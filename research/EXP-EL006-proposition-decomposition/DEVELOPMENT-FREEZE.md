# EXP-EL006 development freeze

**Frozen:** 2026-09-24, before any EXP-EL006 JEV request

This checkpoint fixes the 20 proposition splits, unchanged source cases, two
questions, execution path, paired baseline, and scoring rule.

| Artifact | SHA-256 |
|---|---|
| `PROTOCOL.md` | `e2ab7b7d0777c269687ffadd75b045caf7bcdea8b658cf283aa72335ae31eb87` |
| `propositions.json` | `79558fdfe39c8b100c3626765dc19e85ef439154b35bf50c833d29b82c5cc5ee` |
| `development-input.json` | `33fe8a6653d3870b540c5161e8d917aa6faf399adf8014abf203d9881482cd86` |
| `scripts/assemble-input.py` | `5e7263ee283bda74017975fc666e096816f5b92232a7fd2b33e9ab6082fbe67d` |
| `scripts/run-jev-development.py` | `9940808534a4b317f096a6a73c56575b9a22e9d79cbaf2f0b05d4a15c38072d5` |
| `scripts/test-run-jev-development.py` | `c907706dfcbc9f88d0590a381b892aa88676693c17a526daf148adbc352b8bb0` |
| `scripts/score-development.py` | `9fe7377f9d2a98bbdf21ae6fde786d71e4d3410819d3bbcf1f9e4cdead962da1` |
| Frozen base transport runner | `cde46b51f30991e50ebe815d7850fb99b71e95689636c25c336c544549828a7c` |
| EXP-EL005 paired raw responses | `5876aee240a7d7ff00e90762b608aa33016684b04a32fb3b316de38e88044c26` |
| Root `package.json` | `aa1529f1867c4616e16b12de91d37bc38d8093fdfd2f9e256dca9e962486315d` |

- Input canonical hash: `sha256:349f3e2f2d6120328275fae760213ed974603b8d771e713508d9ce19025c2756`
- Questions canonical hash: `sha256:f7a1a8309746a43ebc4785b3419ef917055ed1346b6f186e732263baefbe428a`
- Expected per case: support `YES`, contradiction `YES`
- Primary endpoint: `YES/YES` count and rate
- Cases: 20 exposed synthetic strict-mixed development cases
- Runner: `4.0.0-development`
- Model alias: `jev-latest`
- SDK: `typesafe-sdk==0.7.0`
- Reference authority: GPT-authored provisional; not human reviewed; not gold

Validation confirmed that all 20 claims, evidence payloads, and domains match
EXP-EL005 at the parsed-data level. Only explicit proposition fields were added.
