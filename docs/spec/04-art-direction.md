# 04 — Art Direction

## Required art per character
1. Full-body splash-art prompt
2. Square roster-portrait prompt
3. Battle-avatar prompt
4. Four ability-icon prompts
5. Transformation artwork prompt (when applicable)
6. Secret silhouette prompt (when applicable)
7. Legendary reveal artwork prompt (when applicable)

These prompts are stored as structured data attached to each character (`packages/content/art/`). Until real art exists, the game uses generated placeholder portraits (initials plus a regional color).

## Forbidden references
Never write "make it [franchise] style", "like [living artist]", or "like [copyrighted franchise]". Use original visual vocabulary instead.

## Global art language (base of every prompt)
high-detail original 2D fantasy combat illustration, strong readable silhouette, dramatic graphic lighting, hand-painted texture, stylized anatomy, expressive faces, mythic atmosphere, clean ability-icon readability, dark neutral battlefield presentation, rich regional artistic inspiration where appropriate, modern competitive-game readability, no copyrighted logos, no modern franchise iconography, no text baked into character art.

## Regional guidance
Draw on historical artistic traditions, never modern franchises, and avoid cultural caricature. Each culture needs specific research before final visual production (see OQ-12).
- **Japanese:** sumi-e brush language, woodblock-inspired composition, traditional pattern principles.
- **Greek:** weathered bronze, marble, geometric borders, Mediterranean architecture.
- **Slavic:** deep forests, folk ornament geometry, wood carving, winter landscapes, storybook atmosphere.
- **Egyptian/desert:** stone, gold, lapis-inspired palettes, hieroglyph-inspired geometry built from invented symbols (never randomly copied sacred text).

## CharacterArtSpec schema
```json
{
  "characterId": "",
  "name": "",
  "visualTheme": "",
  "silhouette": "",
  "face": "",
  "body": "",
  "clothingArmor": "",
  "weaponProps": "",
  "pose": "",
  "environment": "",
  "lighting": "",
  "specialEffects": "",
  "paletteConcept": "",
  "avoid": [],
  "splashPrompt": "",
  "portraitPrompt": "",
  "battleAvatarPrompt": "",
  "abilityIconPrompts": [],
  "transformationPrompts": [],
  "secretSilhouettePrompt": null,
  "legendRevealPrompt": null
}
```
Every `splashPrompt` must be detailed enough for an independent image generator to reproduce the character consistently. Vague prompts like "cool Greek warrior" are not acceptable; specify actual visual construction.

## CharacterVisualBible (consistency)
A reusable per-character record of: face, body type, clothing, weapons, markings, species, age range, silhouette, and signature props. All prompts (portraits, transformations, promo art) are **composed from the bible**, never regenerated from scratch. Build a prompt-composer function that takes bible + shot type + global language and returns the prompt, then validate that authored prompts include the bible's identity anchors.

## Reference splash prompts (quality bar)
**TORTUGA REX:** full-body ancient colossal anthropomorphic turtle warrior standing low and broad in a ruined arena, massive cracked fortress-like shell with original carved geometric markings, weathered reptilian skin, thick forearms, old battle scars, fragments of ancient bronze armor attached around shoulders and wrists, calm intimidating expression rather than cartoon smile, dust lifting around his feet, dramatic low-angle composition, strong readable silhouette, hand-painted high-detail 2D fantasy game illustration, original character design, no existing franchise elements, no text, no logo.

**MISTER WHISKERS:** small sleek black cat sitting innocently at the center of an enormous supernatural arena, slightly crooked whiskers, bright intelligent eyes, tiny damaged collar carrying an unidentified original charm, subtle impossible shadows extending behind him, playful but suspicious expression, surroundings implying that the harmless animal may secretly be extraordinarily dangerous, dramatic 2D competitive fantasy illustration, strong silhouette, no clothing resembling existing mascot characters, no text, no logo.

**MALACHAR:** towering original necromancer sovereign standing inside a ruined subterranean throne chamber, long gaunt silhouette, layered blackened ceremonial armor over ancient funeral robes, skeletal motifs that do not copy existing fantasy properties, floating fragments of broken gravestones and pale soul-fire, several translucent spirits reaching toward him without gore, crown formed from uneven fragments of ancient metal, face partially visible and unnervingly calm, one hand gathering spectral souls while the other points toward an opening grave, cinematic hand-painted 2D dark fantasy game art, dramatic rim lighting, original character, no text, no logo.

**MOONSHOT MADDOX:** fictional professional baseball slugger standing at home plate inside an impossible supernatural stadium, powerful athletic build, completely original cream and dark-red uniform without real-world logos, wooden bat resting over shoulder, stadium lights cutting through supernatural fog, bases faintly glowing behind him, confident competitive expression, dirt and chalk around cleats, dynamic sports illustration blended with fantasy game artwork, no resemblance to any real athlete, no MLB branding, no text.

**THE NAMELESS ONE:** the locked art must reveal almost nothing. The unlocked art stays uncanny and hard to visually interpret.
