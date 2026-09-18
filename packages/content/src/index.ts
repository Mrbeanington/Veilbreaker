export { GAME_TITLE } from "./branding";
export * from "./schemas/index";
export * from "./data/statuses";

import energyRulesJson from "./config/energy-rules.json";
import matchFormatJson from "./config/match-format.json";
import resolutionOrderJson from "./config/resolution-order.json";
import { energyRulesSchema, matchFormatSchema, resolutionOrderSchema } from "./schemas/config";

// Parsed (not just imported) so a malformed default config fails loudly at
// startup instead of silently shipping bad balance data.
export const defaultEnergyRules = energyRulesSchema.parse(energyRulesJson);
export const defaultMatchFormat = matchFormatSchema.parse(matchFormatJson);
export const defaultResolutionOrder = resolutionOrderSchema.parse(resolutionOrderJson);
