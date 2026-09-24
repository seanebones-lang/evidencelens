# Proposition preparation boundary

`preparePropositionCases` turns supplied proposition splits into stable,
hash-addressed records for replay. It requires one split per source case, binds
each split to the exact source claim text, rejects duplicate proposition IDs,
and preserves the stated author and review status.

The function does not split claims automatically. It cannot establish that a
proposition faithfully represents the source claim, is atomic, is supported or
contradicted by the evidence, or has been independently reviewed. Its hash
identifies bytes, not semantic quality. A later experiment must record who
authored and reviewed each split, freeze all cases and scoring before model
requests, and evaluate on new source-isolated material. EXP-EL006 remains a
tuned development diagnostic; its 20/20 result is not a validation of this
preparation stage or of generalization.
