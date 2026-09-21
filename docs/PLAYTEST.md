# Running a playtest

The game has a playtest kit that needs no server. Testers play, answer a few questions in Settings, and send you a short report code. You read the codes with one command.

## What you need

- 5 to 10 people who have not seen the game. Friends of friends are better than close friends.
- A link to the game (the GitHub Pages site) or the single `veilbreak.html` file.
- 20 to 30 minutes per tester. Do not explain anything first: whether they get stuck is the data.

## What to tell a tester

> Play the game for about 20 minutes. Do the tutorial, then play a few matches against the bot. Say out loud anything that confuses you. When you are done, open **Settings > Playtest feedback**, answer the questions, press **Create my report** and send me the code.

If you can watch (in person or on a shared screen), note where they hesitate, what they click first, and what they say. That is worth more than the numbers.

## What the report holds

- Whether they started, finished or skipped the tutorial, and how long until their first match.
- Each match: mode, result, length in turns and seconds, and the two teams.
- Their level, fighters unlocked, quests finished, screen size and whether it is a touch device.
- Which screens they opened and how often, and any errors the page reported.
- Their answers: how fun, how clear, whether the tutorial taught enough, whether they would play again, and a free comment.

It has no name, no address and no save contents beyond counts. The game does not send it anywhere; the tester copies the code or saves it as a file.

## Reading the reports

Put the codes in text files (one per tester, or several per file) in a folder, then:

```bash
pnpm playtest:report path/to/folder
```

It prints a summary per tester and totals: tutorial start, finish and skip rates, median seconds to the first match, win rate against bots, match length, average fun and clarity, would-play-again counts, which screens were used, and every distinct error.

## What to look for

| Signal | Worry if |
|---|---|
| Tutorial finished | Under about 70% of testers finish it |
| Seconds to first match | Over about 180 |
| Win rate against the bot | Far above 60% or below 30% for new players |
| Match length | Median under 6 turns or over 25 |
| Fun and clear | Average under 3.5 |
| Would play again | More "no" than "yes" |
| Errors | Any |
| Comments | The same complaint twice |

These thresholds are starting guesses, not rules.

## After the playtest

1. List every place a tester hesitated or misread something.
2. Fix the top three before the next round, then test again with new people.
3. Note the quest and level pacing: did anyone unlock a fighter? Did they know how? (`apps/web/src/game/quests.ts` holds the numbers.)
4. Feed real win rates into the next balance patch (`docs/design/balance-workflow.md`).
