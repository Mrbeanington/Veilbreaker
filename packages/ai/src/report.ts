import { DETECTORS, type SimReport } from "./simulate";

// Findings are recommendations only (phase-07): nothing here changes a number.
// Thresholds are deliberately wide; spec/07 says situational characters need
// not sit at 50%, so a flag is a prompt to look, not a verdict.
const CHARACTER_HIGH = 60;
const CHARACTER_LOW = 40;
const MIN_CHARACTER_GAMES = 100;
const MIN_PAIR_GAMES = 30;
const PAIR_EXTREME = 75;

export interface Finding {
  severity: "watch" | "investigate";
  text: string;
}

const pct = (wins: number, games: number): number => (games === 0 ? 0 : Math.round((wins / games) * 1000) / 10);

export function findings(report: SimReport): Finding[] {
  const out: Finding[] = [];
  for (const c of report.characters) {
    if (c.games < MIN_CHARACTER_GAMES) continue;
    if (c.winRate >= CHARACTER_HIGH) out.push({ severity: "investigate", text: `${c.id} wins ${c.winRate}% over ${c.games} games (possible dominant pick).` });
    else if (c.winRate <= CHARACTER_LOW) out.push({ severity: "watch", text: `${c.id} wins only ${c.winRate}% over ${c.games} games (check it is situational, not just weak).` });
  }
  const { firstPlayerWinRate } = report.initiative;
  if (firstPlayerWinRate >= 55 || firstPlayerWinRate <= 45) {
    out.push({ severity: "watch", text: `Initiative wins ${firstPlayerWinRate}% of decided games; the first-turn advantage is outside 45-55%.` });
  }
  const limitRate = pct(report.length.turnLimitHits, report.meta.matches);
  if (limitRate > 15) out.push({ severity: "investigate", text: `${limitRate}% of matches hit the ${report.meta.maxTurns}-turn limit; look for stalls or under-powered damage.` });
  const { legendTeamWinRate, noLegendTeamWinRate, legendTeamGames } = report.legends;
  if (legendTeamGames >= MIN_CHARACTER_GAMES && legendTeamWinRate - noLegendTeamWinRate > 15) {
    out.push({ severity: "watch", text: `Teams with a Legend win ${legendTeamWinRate}% versus ${noLegendTeamWinRate}% without.` });
  }
  for (const [id, row] of Object.entries(report.counterMatrix)) {
    for (const [foe, cell] of Object.entries(row)) {
      if (cell.games < MIN_PAIR_GAMES) continue;
      const w = pct(cell.wins, cell.games);
      if (w >= PAIR_EXTREME) out.push({ severity: "watch", text: `${id} beats ${foe} ${w}% of the time (${cell.games} games).` });
    }
  }
  for (const d of DETECTORS) {
    const hit = report.detectors[d];
    if (hit.count === 0 || d === "turn-limit") continue;
    const severe = d === "engine-error" || d === "stalled" || d === "illegal-bot-action" || d === "rewind-loop" || d === "resurrection-loop";
    out.push({ severity: severe ? "investigate" : "watch", text: `Detector "${d}" fired ${hit.count} time(s).` });
  }
  return out;
}

export function renderMarkdown(report: SimReport, date: string): string {
  const m = report.meta;
  const lines: string[] = [];
  lines.push(`# Balance report — ${date}`);
  lines.push("");
  lines.push(
    `> Recommendations only. Nothing here changes a balance number. ${m.matches} matches, seed ${m.seed}, bots ${m.botA} vs ${m.botB}, ` +
      `${m.poolSize} playable characters, random ${m.teamSize}v${m.teamSize} teams, ${m.maxTurns}-turn limit. Bot skill shapes these numbers: ` +
      `re-run at a higher level before acting on a finding.`,
  );
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Seat results: playerA ${report.sides.playerAWins}, playerB ${report.sides.playerBWins}, draws ${report.sides.draws}`);
  lines.push(
    `- Initiative: the player moving first wins ${report.initiative.firstPlayerWinRate}% of decided games (${report.initiative.firstPlayerWins} vs ${report.initiative.secondPlayerWins})`,
  );
  lines.push(`- Match length: average ${report.length.average} turns (min ${report.length.min}, max ${report.length.max}); ${report.length.turnLimitHits} hit the turn limit`);
  lines.push(`- Engine errors: ${report.errors.length}`);
  lines.push("");
  lines.push("## Recommendations");
  lines.push("");
  const list = findings(report);
  if (list.length === 0) lines.push("_Nothing crossed a threshold in this run._");
  for (const f of list) lines.push(`- **${f.severity}**: ${f.text}`);
  lines.push("");
  lines.push("## Character win rates");
  lines.push("");
  lines.push("| Character | Games | Wins | Win % | Legend |");
  lines.push("|---|---:|---:|---:|:---:|");
  for (const c of report.characters) lines.push(`| ${c.id} | ${c.games} | ${c.wins} | ${c.winRate} | ${c.legend ? "yes" : ""} |`);
  lines.push("");
  lines.push("## Legend performance");
  lines.push("");
  lines.push(`- Teams containing a Legend: ${report.legends.legendTeamWinRate}% over ${report.legends.legendTeamGames} team-games`);
  lines.push(`- Teams without a Legend: ${report.legends.noLegendTeamWinRate}% over ${report.legends.noLegendTeamGames} team-games`);
  lines.push("");
  lines.push("## Counter matrix (extremes)");
  lines.push("");
  const cells: { a: string; b: string; games: number; win: number }[] = [];
  for (const [a, row] of Object.entries(report.counterMatrix)) {
    for (const [b, cell] of Object.entries(row)) if (cell.games >= MIN_PAIR_GAMES) cells.push({ a, b, games: cell.games, win: pct(cell.wins, cell.games) });
  }
  cells.sort((x, y) => y.win - x.win);
  if (cells.length === 0) {
    lines.push(`_No pairing reached ${MIN_PAIR_GAMES} games; run more matches for a meaningful matrix (full data is in the JSON)._`);
  } else {
    lines.push("| Character | vs | Games | Win % |");
    lines.push("|---|---|---:|---:|");
    for (const c of [...cells.slice(0, 10), ...cells.slice(-10)]) lines.push(`| ${c.a} | ${c.b} | ${c.games} | ${c.win} |`);
  }
  lines.push("");
  lines.push("## Degenerate-pattern detectors");
  lines.push("");
  lines.push("| Detector | Hits | Example |");
  lines.push("|---|---:|---|");
  for (const d of DETECTORS) {
    const h = report.detectors[d];
    const ex = h.examples[0];
    lines.push(`| ${d} | ${h.count} | ${ex ? `seed ${ex.seed}: ${ex.detail}`.replace(/\|/g, "/") : ""} |`);
  }
  lines.push("");
  return lines.join("\n");
}
