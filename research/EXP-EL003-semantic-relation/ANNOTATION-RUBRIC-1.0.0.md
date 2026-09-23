# EXP-EL003 annotation rubric 1.0.0

Read only the claim, supplied verbatim evidence, and allowed local context.
Do not search externally and do not infer missing results.

1. Identify the claim's material propositions.
2. Mark whether the packet directly supports any material proposition.
3. Mark whether the packet directly contradicts, qualifies, or materially
   mismatches any proposition.
4. Assign exactly one label:
   - `SUPPORTED`: direct material support and no material contradiction;
   - `CONTRADICTED`: direct material contradiction without countervailing
     support for that proposition;
   - `MIXED`: both material support and material contradiction, qualification,
     population mismatch, or outcome mismatch;
   - `INSUFFICIENT_EVIDENCE`: none of the first three is established by the
     supplied packet.
5. Do not treat absence of contradiction as support.
6. Do not treat source prestige, publication status, confidence language, or
   personal knowledge as evidence for the relation label.
7. If required context is missing, choose `INSUFFICIENT_EVIDENCE`.

Annotations are independent and immutable. Disagreements are not errors; they
are sent to a third adjudicator without deleting either original label.
