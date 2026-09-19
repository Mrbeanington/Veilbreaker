// packages/persistence: IndexedDB storage, the versioned local profile with
// migrations, atomic saves with rolling backups, JSON backup, device-transfer
// and replay codes, and QR rendering/decoding (spec/06 "Persistence and
// profile"). Runs entirely in the browser; no network.
export { createBestStore, createIndexedDbStore, createMemoryStore, type KeyValueStore } from "./store";
export {
  MAX_HISTORY,
  MIGRATIONS,
  PROFILE_VERSION,
  createDefaultProfile,
  historyEntrySchema,
  levelForXp,
  levelProgress,
  migrateProfile,
  parseProfile,
  profileSchema,
  settingsSchema,
  summarizeProfile,
  type Discovery,
  type HistoryEntry,
  type ParseResult,
  type Profile,
  type ProfileSummary,
  type Settings,
  type TeamPreset,
} from "./profile";
export { BACKUP_KEYS, SAVE_KEY, loadProfile, saveProfile, type LoadResult, type LoadSource, type SaveOptions } from "./save";
export {
  MAX_BACKUP_BYTES,
  MAX_REPLAY_LINK_CHARS,
  QR_MAX_BYTES,
  REPLAY_PREFIX,
  TRANSFER_PREFIX,
  decodeReplay,
  decodeTransfer,
  encodeReplay,
  encodeTransfer,
  exportBackup,
  extractTransferCode,
  importBackup,
  parseReplayFile,
  replayFileText,
  transferLink,
  type ImportResult,
  type ReplayDecode,
  type TransferResult,
} from "./codec";
export { MAX_STORED_REPLAYS, listReplays, loadReplay, replayRecordSchema, saveReplay, type ReplayRecord } from "./replay";
export { decodeQr, qrMatrix, renderQrRgba, renderQrSvg, type QrMatrix, type RgbaImage } from "./qr";
export { checksumOf, crc32 } from "./bytes";
