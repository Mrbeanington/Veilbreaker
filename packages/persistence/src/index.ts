// packages/persistence: IndexedDB storage and the versioned local profile
// (spec/06 "Persistence and profile"). Export/import, transfer codes and
// backups land in Phase 09.
export { createBestStore, createIndexedDbStore, createMemoryStore, type KeyValueStore } from "./store";
export {
  PROFILE_VERSION,
  createDefaultProfile,
  loadProfile,
  migrateProfile,
  profileSchema,
  saveProfile,
  settingsSchema,
  type Discovery,
  type Profile,
  type Settings,
  type TeamPreset,
} from "./profile";
