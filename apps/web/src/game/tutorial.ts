// ADR-039: the first-run tutorial is a real match against a beginner bot with a coach
// on top. The coach only reads the match's state to pick one short tip; it never
// changes the match, so a tutorial match plays exactly like any other.

/** A friendly, easy-to-read team: a tank to defend, a bruiser to attack and a healer to recover. */
export const TUTORIAL_TEAM: readonly string[] = ["tortuga-rex", "hydra", "the-moon-rabbit"];
/** Three simple opponents, none of which needs a rule explained. */
export const TUTORIAL_FOE: readonly string[] = ["the-scarecrow", "red-oni", "the-honey-badger"];
export const TUTORIAL_BOT_LEVEL = "BEGINNER" as const;

export interface TutorialContext {
  turn: number;
  /** The player is halfway through an ability that needs a target. */
  choosingTarget: boolean;
  /** Fighters that can act this turn. */
  ready: number;
  /** How many of them already have an action (or were passed). */
  decided: number;
}

export interface TutorialTip {
  id: "ability" | "target" | "next" | "lock" | "log" | "extras" | "goal";
  title: string;
  text: string;
}

const TIPS: Record<TutorialTip["id"], TutorialTip> = {
  ability: {
    id: "ability",
    title: "Choose an ability",
    text: "Every fighter acts once per turn. The highlighted fighter is up: pick one of its abilities below. The coloured numbers are its energy cost, and your whole team shares one energy pool, shown at the top.",
  },
  target: {
    id: "target",
    title: "Choose a target",
    text: "Click a fighter on the board. Attacks go to an enemy on the right. Healing and protection can go to your own side.",
  },
  next: {
    id: "next",
    title: "Nice. Now the next fighter",
    text: "Your choice is queued. Give each fighter an action, or press Pass if it cannot afford anything. You can cancel a queued action in the list below if you change your mind.",
  },
  lock: {
    id: "lock",
    title: "Lock it in",
    text: "Press Confirm below. Nothing happens until both sides have chosen, and your opponent never sees your picks first.",
  },
  log: {
    id: "log",
    title: "That was a turn",
    text: "The Battle log at the bottom lists what happened, in order. Energy refilled a little, and unspent energy carries over. Health bars and status icons on the fighter cards show the result.",
  },
  extras: {
    id: "extras",
    title: "Cooldowns and statuses",
    text: "A strong ability may need a cooldown before it can be used again, shown on its button. Statuses such as Stun or Bleed appear on the fighter cards, and Codex → Statuses explains each one.",
  },
  goal: {
    id: "goal",
    title: "Win by defeating all three",
    text: "Knock out every enemy fighter before yours fall. Try defending with Tortuga Rex, attacking with Hydra and healing with the Moon Rabbit. The Codex has every rule, and tutorials never count against you.",
  },
};

/** One tip for the moment the player is in. Pure, so every step is covered by a test. */
export function tutorialTip(ctx: TutorialContext): TutorialTip {
  const allDecided = ctx.ready > 0 && ctx.decided >= ctx.ready;
  if (ctx.choosingTarget) return TIPS.target;
  if (allDecided) return TIPS.lock;
  if (ctx.turn <= 1) return ctx.decided === 0 ? TIPS.ability : TIPS.next;
  if (ctx.turn === 2) return ctx.decided === 0 ? TIPS.log : TIPS.extras;
  return TIPS.goal;
}

export const TUTORIAL_TIP_IDS = Object.keys(TIPS) as TutorialTip["id"][];
