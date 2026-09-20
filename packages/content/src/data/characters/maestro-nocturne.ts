import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import { passiveDefinitionSchema, type PassiveDefinition } from "../../schemas/passive";
import { LAST_USED_ABILITY } from "../../schemas/effect";
import type { Ability } from "../../schemas/ability";
import type { TargetRule } from "../../schemas/common";
import { ability, buildArt, ENEMY_SINGLE } from "./helpers";

// spec/03 #111 MAESTRO NOCTURNE — tempo and cooldown manipulation.
// docs/design/characters/maestro-nocturne.md

const ALLY_SINGLE: TargetRule = { side: "ally", scope: "single", count: 1, includeSelf: true, filterTags: [] };

export const ADAGIO = ability({
  id: "ability.maestro-nocturne.adagio",
  displayName: "Adagio",
  description: "Slows an enemy's tempo: their cooldowns stop ticking for three turns.",
  cost: { spirit: 1, focus: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [
    { kind: "damage", amount: 10 },
    { kind: "applyStatus", statusId: "status.cooldown-increase", magnitude: 1, durationTurns: 3 },
  ],
});
export const ALLEGRO = ability({
  id: "ability.maestro-nocturne.allegro",
  displayName: "Allegro",
  description: "Quickens an ally: their cooldowns tick twice as fast for three turns.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: ALLY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.cooldown-reduction", magnitude: 1, durationTurns: 3 }],
});
export const DA_CAPO = ability({
  id: "ability.maestro-nocturne.da-capo",
  displayName: "Da Capo",
  description: "From the top: an ally's most recent ability is ready again.",
  cost: { spirit: 2, focus: 1 },
  cooldown: 4,
  target: ALLY_SINGLE,
  effects: [{ kind: "modifyCooldown", abilityId: LAST_USED_ABILITY, mode: "set", amount: 0 }],
});
export const STACCATO = ability({
  id: "ability.maestro-nocturne.staccato",
  displayName: "Staccato",
  description: "Short, sharp strikes.",
  cost: { might: 1, focus: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 30 }],
});

// Every note he plays hurries the next Da Capo along.
export const PERFECT_TEMPO: PassiveDefinition = passiveDefinitionSchema.parse({
  id: "passive.maestro-nocturne.perfect-tempo",
  displayName: "Perfect Tempo",
  description: "Each ability he uses shaves a turn off Da Capo's cooldown.",
  trigger: { event: "onAbilityUsed", relation: "self" },
  effects: [{ kind: "modifyCooldown", abilityId: DA_CAPO.id, mode: "delta", amount: -1 }],
});

export const MAESTRO_NOCTURNE_ABILITIES: Ability[] = [ADAGIO, ALLEGRO, DA_CAPO, STACCATO];

export const MAESTRO_NOCTURNE: CharacterDefinition = characterDefinitionSchema.parse({
  id: "maestro-nocturne",
  version: 1,
  displayName: "Maestro Nocturne",
  rarity: "RARE",
  tags: ["MUSIC", "SUPPORT", "CONTROLLER"],
  baseHp: 120,
  abilityIds: MAESTRO_NOCTURNE_ABILITIES.map((a) => a.id),
  passiveId: PERFECT_TEMPO.id,
  artSpecId: "maestro-nocturne",
});

const built = buildArt({
  bible: {
    characterId: "maestro-nocturne",
    species: "a tall, spectral human conductor of a phantom orchestra",
    ageRange: "ageless, elegant",
    face: "a pale, sharp face with closed eyes and a faint smile",
    bodyType: "tall and impossibly slender",
    clothingArmor: "a long midnight-blue tailcoat with silver thread and a high collar",
    weaponsProps: "a slim silver baton trailing faint light",
    markings: "silver staff-line patterns running along the sleeves",
    silhouette: "a thin figure in a long tailcoat with one arm raised, baton pointing up",
    signatureProps: ["silver baton", "floating sheet music"],
  },
  region: "Gothic concert hall (velvet, candlelight, arched balconies)",
  visualTheme: "a night performance where time itself keeps the beat",
  environment: "an empty midnight concert hall with a ghostly orchestra pit",
  lighting: "cool blue candlelight with silver highlights",
  paletteConcept: "midnight blue, silver, bone white, deep plum",
  avoid: ["any real conductor's likeness", "any real composition's score"],
  splashScene: "baton raised on the podium, ghostly musicians rising from the pit behind him",
  portraitScene: "eyes closed, baton at his lips, silver light on his cheek",
  avatarScene: "close crop on the face and baton",
  iconScenes: [
    "a slow drifting clock hand over a sustained note, for Adagio",
    "a quickened flurry of notes, for Allegro",
    "a repeat sign glowing over sheet music, for Da Capo",
    "sharp short notes striking like darts, for Staccato",
  ],
});
export const MAESTRO_NOCTURNE_VISUAL_BIBLE = built.bible;
export const MAESTRO_NOCTURNE_ART = built.art;
