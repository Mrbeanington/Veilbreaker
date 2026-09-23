# Art pipeline guide

`art-specs.json` is the single hand-off file for image generation: 120 character entries (119 playable) and 873 assets, each with a prompt, the shared negative prompt and a canvas size. It is generated from the game data. Never edit it by hand:

```bash
pnpm art:audit    # checks every spec; exits non-zero on any error
pnpm art:export   # audits, then rewrites docs/art/art-specs.json
```

A test fails if the file is out of date, so the file, the game and the prompts stay in step.

## What the audit enforces
No empty field. Every prompt contains the character's identity anchors (species, face, body type, silhouette) and the global art language. No style imitation, franchise name, living-artist name or artist credit. No request for text, logos or lettering. Every Secret has a silhouette prompt, every Legend a reveal prompt, every transformed state its own prompt. Every palette is listed. Every spec is still `draft` until a human reviews it.

## Getting one look across 120 characters
1. Read `pipelineGuidance` in the JSON. The short version: make a reference set first (four characters from four regions), freeze model, seed strategy and settings, then run the rest with those settings unchanged.
2. Generate the portrait first per character and reuse it as that character's reference image.
3. Do not add styles, artists or franchises to any prompt. The shared language line already sets the look.
4. Reject any image with lettering, a logo or a watermark.
5. Keep the sizes in `assetSizes`; ability icons must read at 64 pixels.

The audit checks the prompts. It cannot check that finished images match, so a person should approve the reference set before the batch run.

## Cultural review (OQ-12)
`culturalGroups` lists the reviewers' work, high priority first. The high-priority groups are Japanese, Slavic, Egyptian and desert, and World Folklore (which covers several cultures under one label, so each needs its own reviewer). Nothing may be promoted from `draft` to `reviewed` or `final` without that review.

## Portraits
All 119 fighters have a portrait, generated from `portrait-prompts.md` and imported with `pnpm art:import`. Re-run `pnpm art:status` any time to confirm coverage. The Japanese, Slavic, Egyptian and world-folklore designs still need review by someone from or expert in those traditions before they count as final (OQ-12).

## Splashes
`splash-prompts.md` (from `pnpm art:splashes`) has a tall 2:3 full-body prompt per fighter, Legends first, to be made after the portraits so the face matches. Save as `<id>.splash.png` (768 pixels or more on the short side); `pnpm art:import` shrinks them to 400 by 600 into `apps/web/src/art/splashes`. A splash shows at the top of the fighter's sheet. Portraits and splashes together are capped at 10 MB by `pnpm verify-bundle-budget`.
