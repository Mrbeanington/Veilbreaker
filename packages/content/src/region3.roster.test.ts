import { describeRegionRoster } from "./regionRoster.testkit";

// phase-13, region 3 (spec/03 "Slavic / Russian Night", 12 characters).
// Baba Yaga and Koschei the Deathless were built in earlier phases.
describeRegionRoster({
  name: "Slavic / Russian Night",
  added: ["leshy", "domovoi", "rusalka", "father-frost", "the-birch-witch", "zmey-gorynych", "the-firebird", "one-eyed-likho", "marya-the-warrior", "the-midnight-tsar"],
  existing: ["baba-yaga", "koschei"],
  secrets: ["the-midnight-tsar"],
  tag: "FOLKLORE",
});
