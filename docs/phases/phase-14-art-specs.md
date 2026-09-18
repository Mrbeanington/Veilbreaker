# Phase 14 — Art spec completion and audit
**Read first:** spec/04

## Deliverables
Confirm that every character and every transformed state has a complete CharacterArtSpec plus visual bible, and that Secrets have silhouette prompts and Legends have reveal prompts. Build an audit script that fails if any of these hold:
- a field is empty
- a prompt is missing bible identity anchors
- a prompt contains forbidden references (a franchise name, "in the style of", a living-artist pattern list)
- text or logos are requested in the art

All specs stay `status: draft` pending human cultural review (OQ-12). Export to a single `art-specs.json` for image-generation pipelines.

Finish with the end-of-phase report.
