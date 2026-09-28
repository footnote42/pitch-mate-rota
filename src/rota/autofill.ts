// Auto-fill: fills empty places only, never moving a pick. Decision: issue #28.
// Two passes, each half by half in time order:
//   1. minimum: players still owed their minimum; Tight first, then whoever keeps the half on target, then urgency;
//   2. fill: the rest shared evenly (fewest halves first), balance choosing inside that.
// Recorded games are read-only; their quarters count (one quarter is half a half) and removed players aren't picked.
// Runs of more than MAX_RUN halves are avoided unless a Tight player needs one, or nobody else can play.
// Ties go to fewest halves, then rested last half, then squad order; a seed shuffles that last step. Early halves
// tie widely, so a new seed changes about 40% of places (12 players, 4 games) while every rule still holds.
import type { Pick, State, Half } from './model';
import { MAX_RUN, balanceTarget, canPlayHalf, gameNumbers, gameRecord, halfOf, isRecorded, minimumQuarters, sideSize } from './model';

// Small seeded PRNG (mulberry32), so the same seed always gives the same plan.
const random = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Squad order for seed 0, a seeded shuffle otherwise.
const tieOrder = (ids: string[], seed: number) => {
  const order = [...ids];
  if (seed !== 0) {
    const next = random(seed);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
  return new Map(order.map((id, i) => [id, i]));
};

// Compare candidates key by key: lower wins.
const byKeys = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};

export function autoFill(state: State, seed: number): State {
  const { squad, festival } = state;
  const cap = sideSize(festival);
  const slots = Array.from({ length: festival.games * 2 }, (_, i) => ({ game: Math.floor(i / 2) + 1, half: ((i % 2) + 1) as Half }));
  const minimum = minimumQuarters(festival);
  const level = new Map(squad.map(p => [p.id, p.experienceLevel]));
  const average = balanceTarget(state) / cap;
  const target = balanceTarget(state);
  const rank = tieOrder(squad.map(p => p.id), seed);

  // Quarters each player has in each half: from the record in recorded games, the plan elsewhere.
  const fixed = slots.map(s => isRecorded(festival, s.game));
  const quarters = new Map(squad.map(p => [p.id, slots.map(() => 0)]));
  const count = slots.map(() => 0);
  const total = slots.map(() => 0);
  for (const k of festival.picks) {
    const i = (k.game - 1) * 2 + (k.half - 1);
    if (!quarters.has(k.playerId) || i >= slots.length || fixed[i]) continue;
    quarters.get(k.playerId)[i] = 2;
    count[i]++;
    total[i] += level.get(k.playerId);
  }
  for (const game of gameNumbers(festival)) {
    if (!isRecorded(festival, game)) continue;
    for (const q of gameRecord(festival, game)) {
      if (quarters.has(q.playerId)) quarters.get(q.playerId)[(game - 1) * 2 + halfOf(q.quarter) - 1]++;
    }
  }
  const on = new Map(squad.map(p => [p.id, quarters.get(p.id).map(n => n > 0)])); // any quarter counts toward a run
  const added: Pick[] = [];

  const canPlay = (id: string, i: number) => !fixed[i] && canPlayHalf(festival, id, slots[i].game, slots[i].half) && !on.get(id)[i];
  const played = (id: string) => quarters.get(id).reduce((a, b) => a + b, 0) / 2; // halves
  // Halves still owed; a removed player is owed nothing.
  const owed = (id: string) => (festival.removals[id] ? 0 : Math.ceil(Math.max(0, minimum - quarters.get(id).reduce((a, b) => a + b, 0)) / 2));
  const chancesLeft = (id: string, from: number) =>
    slots.reduce((n, _, j) => n + (j >= from && canPlay(id, j) && count[j] < cap ? 1 : 0), 0);
  const runIfPicked = (id: string, i: number) => {
    const mine = on.get(id);
    let run = 1;
    for (let j = i - 1; j >= 0 && mine[j]; j--) run++;
    for (let j = i + 1; j < mine.length && mine[j]; j++) run++;
    return run;
  };
  const rested = (id: string, i: number) => (i > 0 && on.get(id)[i - 1] ? 1 : 0);
  // How far outside the balance target the half would end, if this player joined and the rest were average.
  const offTarget = (id: string, i: number) => {
    const projected = total[i] + level.get(id) + (cap - count[i] - 1) * average;
    return Math.max(0, Math.abs(projected - target) - 2);
  };
  const place = (id: string, i: number) => {
    on.get(id)[i] = true;
    quarters.get(id)[i] = 2;
    count[i]++;
    total[i] += level.get(id);
    added.push({ playerId: id, game: slots[i].game, half: slots[i].half });
  };

  // Pass 1: minimums.
  slots.forEach((_, i) => {
    while (count[i] < cap) {
      const keyed = squad
        .map(p => p.id)
        .filter(id => canPlay(id, i) && owed(id) > 0)
        .map(id => {
          const left = chancesLeft(id, i);
          const tight = owed(id) >= left;
          return { id, tight, keys: [tight ? 0 : 1, offTarget(id, i), -owed(id) / left, played(id), rested(id, i), rank.get(id)] };
        })
        .filter(c => c.tight || runIfPicked(c.id, i) <= MAX_RUN) // slack means they can wait for a later half
        .sort((a, b) => byKeys(a.keys, b.keys));
      if (keyed.length === 0) break;
      place(keyed[0].id, i);
    }
  });

  // Pass 2: share the rest evenly.
  slots.forEach((_, i) => {
    while (count[i] < cap) {
      const keyed = squad
        .map(p => p.id)
        .filter(id => canPlay(id, i))
        .map(id => ({ id, keys: [runIfPicked(id, i) > MAX_RUN ? 1 : 0, played(id), offTarget(id, i), rested(id, i), rank.get(id)] }))
        .sort((a, b) => byKeys(a.keys, b.keys));
      if (keyed.length === 0) break;
      place(keyed[0].id, i);
    }
  });

  if (added.length === 0) return state;
  return { ...state, festival: { ...festival, picks: [...festival.picks, ...added] } };
}
