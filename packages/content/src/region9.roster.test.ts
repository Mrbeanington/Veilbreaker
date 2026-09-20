import { describeRegionRoster } from "./regionRoster.testkit";

// phase-13, region 9 (spec/03 "Sports / Fighters", 8 characters).
// Mason "Moonshot" Maddox, The Referee and The Black Knight were built in earlier phases.
describeRegionRoster({
  name: "Sports / Fighters",
  added: ["fourth-and-one", "the-gunslinger-qb", "el-magnifico", "the-contender", "ace"],
  existing: ["moonshot-maddox", "the-referee", "black-knight"],
  secrets: [],
  tag: "ATHLETE",
});
