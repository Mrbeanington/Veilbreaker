import { z } from "zod";
import { archetypeTagSchema, idSchema } from "./common";
import { effectSchema } from "./effect";
import { statusDurationSchema } from "./status";

// spec/02 "Summon system": attached summons, temporary fourth units, minions,
// absorption counters, pets, thralls, totems, objects, and relics.
// `occupiesSlot: false` covers attachments like Malachar's Thralls that ride
// alongside a character rather than taking a team slot.
export const summonSchema = z.object({
  id: idSchema,
  displayName: z.string().min(1),
  occupiesSlot: z.boolean().default(false),
  hp: z.number().int().positive().optional(),
  abilityIds: z.array(idSchema).default([]),
  duration: statusDurationSchema,
  onExpireEffects: z.array(effectSchema).default([]),
  tags: z.array(archetypeTagSchema).default([]),
});
export type Summon = z.infer<typeof summonSchema>;
