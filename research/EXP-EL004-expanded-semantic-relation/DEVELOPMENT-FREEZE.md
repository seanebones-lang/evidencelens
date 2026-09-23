# EXP-EL004 expanded-contract development freeze

**Status:** Frozen before any EXP-EL004 JEV prediction

**Date:** 2026-09-23

This freeze covers a diagnostic development run on the already exposed
EXP-EL003 corpus. It does not cover the future confirmatory holdout and cannot
support a generalization claim.

## Runtime

- Python: 3.12.14
- `typesafe-sdk==0.7.0`
- `socksio==1.0.0` transport dependency
- model alias: `jev-latest`
- runner version: `2.0.0-development`
- cases: 80 previously exposed development cases
- typed decisions per case: 4
- probability thresholds: none
- question-definition canonical hash:
  `sha256:8a77e6ae5e4a8f8bd29482fd1556cdcf72b9c71dd84ec0a0a15b01d762bc4bc5`

## Frozen artifact hashes

- Protocol:
  `09549d98a4dadbce357ad68ead638a50ee6bbd6fdd603ae6d8d3e22f3ae2b4e8`
- Decision contract:
  `5296f8884c3935d102accd2f9f127901a98fac38f0fd93b5d37f7a1d062d3ff8`
- Holdout plan:
  `acbddc897a9ed56391eb0af36c71a6f6c5f8ad61069b5bcaf0bf627ad303848c`
- Development runner:
  `35332057f210ea9a1d928246983b652d76b5c6a2dc3546d32b68b08e02ed9844`
- Development runner test:
  `dff578ee9ce5152ba43f72d1552c60f6311a285cc64ff461effe069ac18ace3a`
- Runtime requirements:
  `8e92c2ed16134edd49bffd50988ab8dcb38dd29427c7b2e0e3ce18bdb6a087c6`
- Mapping implementation:
  `f83aee879431b5d1d29f8566600df82a77693e2c5874ecaa6db8dbc939543d32`
- Mapping tests:
  `60d7f76862982bc5b7bede6c9d62d3568424abf649f5b174e4f645426ba20e75`
- Frozen base transport runner:
  `cde46b51f30991e50ebe815d7850fb99b71e95689636c25c336c544549828a7c`
- Blinded development input:
  `f11e25ddef28c5ca965f1298faf7906dff57ff0e33b849abe2124c92bf0c9907`

## Isolation and interpretation

The runner sends only the same blinded `caseId`, `claim`, `evidence`, and
`domain` fields authorized for EXP-EL003, plus the four frozen questions. It
does not read or transmit provisional references, construction rationales,
the disagreement audit, source identities, or earlier JEV responses.

Because the contract was designed after inspecting EXP-EL003 disagreements,
any score on these 80 cases is development performance. The original
EXP-EL003 result remains unchanged. Confirmation requires the prospectively
frozen, source-isolated corpus described in `HOLDOUT-PLAN.md`.
