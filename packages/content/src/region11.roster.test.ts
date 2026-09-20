import { describeRegionRoster } from "./regionRoster.testkit";

// phase-13, region 11 (spec/03 "Final Seven", 7 characters).
// Father Bell, Emperor Zero and The Nameless One were built in earlier phases.
describeRegionRoster({
  name: "Final Seven",
  added: ["the-tax-collector", "the-lawyer", "calypsa", "the-gatekeeper"],
  existing: ["father-bell", "emperor-zero", "the-nameless-one"],
  secrets: ["the-lawyer", "the-gatekeeper"],
  legends: ["calypsa"],
  tag: "FOLKLORE",
});
