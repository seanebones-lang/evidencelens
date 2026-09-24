# EXP-EL005 development freeze

**Frozen:** 2026-09-24, before any EXP-EL005 JEV request

This checkpoint fixes the 80-case calibration corpus, provisional references,
two-question contract, deterministic mapping, and execution path. The 20
synthetic strict-mixed claims were authored before observing any EXP-EL005 JEV
output. The other 60 controls and all 80 evidence payloads were reused from the
previously exposed EXP-EL003 development corpus.

| Artifact | SHA-256 |
|---|---|
| `STRICT-MIXED-PROTOCOL.md` | `83e5032431ba4ca4a1a807a540d0f32eba8a99887a7b3585544be34e096d8f9b` |
| `strict-mixed-authoring.json` | `1e069bccfe278be9e390c8197058f5dee7c77a826ca7c3db98ac516bdb5d915e` |
| `development-input.json` | `1c34f36b3a3bbae01bb6236f8563762125045eeefc50639a51ea5fdf30bad536` |
| `development-reference.json` | `2c132ff394f6706a517e6ecc51e25d59adfa667d845c094027c1291bb8f506b0` |
| `scripts/assemble-corpus.py` | `1611fa59bb367ea2ac5deb254de54064bcec294e0197abded3f4300689247946` |
| `scripts/run-jev-development.py` | `9646b41421b2dcb1fb9d14756cf92966e1772c7b3c257864a0a0a07c8040c420` |
| `scripts/test-run-jev-development.py` | `9dcb907cf8a80e8e1b4a2673b4c53c85a361fad9b4625a6c006612517126776c` |
| Frozen base transport runner | `cde46b51f30991e50ebe815d7850fb99b71e95689636c25c336c544549828a7c` |
| Semantic mapping source | `6f9ba8cf127e0b63f075ac1ccecc9d39c7081686efc3248d6b5bb823efdad02b` |
| Semantic mapping tests | `78cfbbddc7c343c0f94a07e1d1ad9d98f729b24dd418c1150524b25a9b7fdab7` |
| Root `package.json` | `5935e63696682af1f99b2821da9efbd59e5ba1514770401ba8fd29893d6e093c` |

- Input canonical hash: `sha256:b8133e6ceca73a9e2d1de82ed06c5428a86497a6121d6e80e936297f77d4cd7d`
- Questions canonical hash: `sha256:23e0418cd27eb3331fdf210e218c2948daa1a1ef3b7a06b7305a2fce843d5c24`
- Cases: 80, balanced at 20 per provisional class
- Runner: `3.0.0-development`
- Model alias: `jev-latest`
- SDK: `typesafe-sdk==0.7.0`
- Reference authority: GPT-authored provisional; not human reviewed; not gold

Validation confirmed that exactly the 20 `MIXED` claims changed, every evidence
payload and domain remained byte-for-byte equivalent at the parsed-data level,
and no reference or authoring field appears in the blinded model input.
