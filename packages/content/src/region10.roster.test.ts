import { describeRegionRoster } from "./regionRoster.testkit";

// phase-13, region 10 (spec/03 "Music / Entertainment / Chaos", 7 characters).
// Maestro Nocturne and The Gambler were built in earlier phases.
describeRegionRoster({
  name: "Music / Entertainment / Chaos",
  added: ["johnny-feedback", "dj-cataclysm", "the-mime", "chef-ramble", "orpheon"],
  existing: ["maestro-nocturne", "the-gambler"],
  secrets: [],
  legends: ["orpheon"],
  tag: "MUSIC",
});
