# EXP-EL006 proposition-decomposition report 001

**Status:** Complete tuned development diagnostic; not confirmation

## Disclosure

This experiment was designed after inspecting EXP-EL005 failures and reused the same 20 synthetic cases. GPT authored the proposition splits and expected answers. No human reviewed them. Results cannot estimate generalization or justify promotion.

## Outcome

Proposition decomposition produced `YES/YES` on **20/20 (100.0%)** cases, compared with **13/20 (65.0%)** on the same compound claims in EXP-EL005.

| Endpoint | Result |
|---|---:|
| Both propositions resolved as expected | 20/20 (100.0%) |
| Supported proposition answered YES | 20/20 (100.0%) |
| Contradicted proposition answered YES | 20/20 (100.0%) |
| Paired cases rescued | 7 |
| Paired cases regressed | 0 |

## Remaining misses

None.

## Interpretation

A higher paired `YES/YES` rate would support the narrow hypothesis that explicit proposition decomposition helps JEV preserve concurrent support and contradiction. Because decomposition changes the information structure and was tuned to observed failures, it must remain an optional diagnostic path until replicated on prospectively sourced, independently reviewed natural cases.

## Runtime evidence

- Raw response SHA-256: `33a77d3be6bf23b0c2b8ae541532c56eced3ed6d8359421ea1f7063c9850042f`
- All 20 cases completed successfully.
- Median latency: 327.5 ms
