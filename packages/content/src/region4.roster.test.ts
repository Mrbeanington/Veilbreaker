import { describeRegionRoster } from "./regionRoster.testkit";

// phase-13, region 4 (spec/03 "Northern / Celtic", 11 characters), all new.
describeRegionRoster({
  name: "Northern / Celtic",
  added: ["draugr", "shieldmaiden-yrsa", "the-berserker", "banshee", "the-dullahan", "puca", "frost-jotunn", "the-valkyrie", "fenris", "the-wild-huntsman", "morrigan"],
  existing: [],
  secrets: ["the-wild-huntsman"],
  legends: ["morrigan"],
  tag: "MYTHOLOGY",
});
