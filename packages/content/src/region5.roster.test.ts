import { describeRegionRoster } from "./regionRoster.testkit";

// phase-13, region 5 (spec/03 "Egypt / Desert / Ancient Kingdoms", 11 characters), all new.
describeRegionRoster({
  name: "Egypt / Desert / Ancient Kingdoms",
  added: ["jackal-guardian", "scarab-king", "the-mummy-prince", "desert-djinn", "ifrit", "the-sphinx", "sand-assassin", "pharaoh-without-a-tomb", "the-living-sarcophagus", "anubian-judge", "aurelia"],
  existing: [],
  secrets: ["anubian-judge"],
  legends: ["aurelia"],
  tag: "MYTHOLOGY",
});
