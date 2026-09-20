import { describeRegionRoster } from "./regionRoster.testkit";

// phase-13, region 8 (spec/03 "Animals / Weird Characters", 10 characters).
// Tortuga Rex and Mister Whiskers were built in earlier phases; Whiskers, Devourer of Worlds is a transformation stage of Mister Whiskers, not a separate playable character.
describeRegionRoster({
  name: "Animals / Weird Characters",
  added: ["sir-hopsalot", "general-goose", "the-honey-badger", "professor-octopus", "king-croak", "the-albino-gorilla", "minotaur-king"],
  existing: ["tortuga-rex", "mister-whiskers"],
  secrets: [],
  legends: ["minotaur-king"],
  tag: "FOLKLORE",
});
