import { describeRegionRoster } from "./regionRoster.testkit";

// phase-13, region 6 (spec/03 "World Folklore / Spirits / Tricksters", 12 characters), all new.
describeRegionRoster({
  name: "World Folklore / Spirits / Tricksters",
  added: ["anansi", "the-moon-rabbit", "jiangshi", "dokkaebi", "the-white-fox", "the-roc", "the-ghoul", "the-wandering-genie", "the-storyteller", "the-monkey-trickster", "the-thousand-faced-stranger", "madame-fortuna"],
  existing: [],
  secrets: ["the-thousand-faced-stranger"],
  legends: ["madame-fortuna"],
  tag: "FOLKLORE",
});
