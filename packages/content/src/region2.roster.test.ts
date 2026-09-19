import { describeRegionRoster } from "./regionRoster.testkit";

// phase-13, region 2 (spec/03 "Japanese Folklore / Ink Realm", 15 characters).
// The Nine-Tailed Trickster and Shiro were built in earlier phases.
describeRegionRoster({
  name: "Japanese Folklore / Ink Realm",
  added: ["red-oni", "blue-oni", "kappa-kiro", "yuki-onna", "tengu-swordsman", "lantern-spirit", "umbrella-yokai", "the-paper-monk", "nekomata", "the-mirror-samurai", "gashadokuro", "oni-of-the-red-gate", "the-painted-ronin"],
  existing: ["nine-tailed-trickster", "shiro"],
  secrets: ["oni-of-the-red-gate", "the-painted-ronin"],
  tag: "FOLKLORE",
});
