import { characterDefinitionSchema, type CharacterDefinition } from "../../schemas/character";
import type { Ability } from "../../schemas/ability";
import { LAST_USED_ABILITY } from "../../schemas/effect";
import { ALLY_SINGLE, ENEMY_SINGLE, ability, buildArt } from "./helpers";

// spec/03 #65 ANANSI (World Folklore) — the spider who owns all the stories. He tangles an enemy's best move so it cannot be used again soon, and spins a web around a friend. docs/design/characters/anansi.md

export const SPIDER_BITE = ability({
  id: "ability.anansi.spider-bite",
  displayName: "Spider Bite",
  description: "A quick bite: 20 damage and Poison for 3 turns.",
  cost: { might: 1 },
  target: ENEMY_SINGLE,
  effects: [{ kind: "damage", amount: 20 }, { kind: "applyStatus", statusId: "status.poison", magnitude: 5, durationTurns: 3 }],
});
export const TANGLED_TALE = ability({
  id: "ability.anansi.tangled-tale",
  displayName: "Tangled Tale",
  description: "Ties up the enemy's favourite trick: the ability it used last takes 2 turns longer to come back.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "modifyCooldown", abilityId: LAST_USED_ABILITY, mode: "delta", amount: 2 }],
});
export const TALL_TALE = ability({
  id: "ability.anansi.tall-tale",
  displayName: "Tall Tale",
  description: "A story too big to argue with: the enemy is weakened for 2 turns.",
  cost: { spirit: 1 },
  cooldown: 2,
  target: ENEMY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.weakness", magnitude: 10, durationTurns: 2 }],
});
export const WEB_OF_STORIES = ability({
  id: "ability.anansi.web-of-stories",
  displayName: "Web of Stories",
  description: "Spins a web round a friend: a shield of 30 for 3 turns.",
  cost: { focus: 1 },
  cooldown: 2,
  target: ALLY_SINGLE,
  effects: [{ kind: "applyStatus", statusId: "status.shield", magnitude: 30, durationTurns: 3 }],
});

export const ANANSI_ABILITIES: Ability[] = [SPIDER_BITE, TANGLED_TALE, TALL_TALE, WEB_OF_STORIES];

export const ANANSI: CharacterDefinition = characterDefinitionSchema.parse({
  id: "anansi",
  version: 1,
  displayName: "Anansi",
  rarity: "RARE",
  tags: ["FOLKLORE", "CONTROLLER", "SUPPORT"],
  baseHp: 110,
  abilityIds: ANANSI_ABILITIES.map((a) => a.id),
  artSpecId: "anansi",
});

const built = buildArt({
  bible: {
    characterId: "anansi",
    species: "a clever spider-man of West African folk tales",
    ageRange: "ageless",
    face: "a sly, laughing face with too many bright eyes above the brow",
    bodyType: "wiry and long-limbed, with a second pair of thin arms folded at his back",
    clothingArmor: "a patchwork waistcoat sewn from bright story-cloth and a wide straw hat",
    weaponsProps: "a ball of glittering silk thread and a small carved story drum",
    markings: "silver thread-lines running along the arms",
    silhouette: "a thin, many-armed figure crouched under a hat with a web behind him",
    signatureProps: ["a straw hat", "story-cloth waistcoat", "a ball of silk thread"],
  },
  region: "World folk-tale inspiration (storybook borders, market-day colour, moonlit roads, hand-stitched cloth and lacquer)",
  visualTheme: "every story ends the way he wants",
  environment: "a village square at dusk with story lanterns",
  lighting: "warm lantern glow and silver threads catching the light",
  paletteConcept: "lantern gold, indigo, story red, silver",
  avoid: ["any existing game's anansi design"],
  splashScene: "perched on a rooftop with threads spread like a great web over the village",
  portraitScene: "a laughing face with several bright eyes under a straw hat",
  avatarScene: "close crop on the hat and eyes",
  iconScenes: ["a spider on a leaf with a green drop, for Spider Bite", "a knot of silver thread round a small clock, for Tangled Tale", "an oversized speech-bubble shaped like a story, for Tall Tale", "a glowing web stretched between two hands, for Web of Stories"],
});
export const ANANSI_VISUAL_BIBLE = built.bible;
export const ANANSI_ART = built.art;
