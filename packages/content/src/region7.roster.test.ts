import { describeRegionRoster } from "./regionRoster.testkit";

// phase-13, region 7 (spec/03 "Horror / Monsters / Dead", 12 characters).
// Patient Zero, The Plague Doctor, Malachar and Behemoth were built in earlier phases.
describeRegionRoster({
  name: "Horror / Monsters / Dead",
  added: ["the-headless-bride", "the-marionettist", "the-scarecrow", "the-grave-digger", "the-vampire-countess", "the-collector", "ashmouth", "the-thing-beneath-the-bed"],
  existing: ["patient-zero", "plague-doctor", "malachar", "behemoth"],
  secrets: [],
  tag: "FOLKLORE",
});
