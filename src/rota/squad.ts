// Squad import: names from a pasted WhatsApp selection message.
import { Player } from '@/types/rotation';

// Lines that are clearly not a player: headers, times, instructions.
const NOT_A_NAME = /\b(squad|team|selection|selected|festival|players|sunday|saturday|monday|tuesday|wednesday|thursday|friday|meet|please|training)\b/i;
const WORD = /^\p{L}[\p{L}'’.-]*$/u;

export const nameKey = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

export function parseSquad(text: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw
      .replace(/\p{Extended_Pictographic}|\p{Emoji_Modifier}|\u{FE0F}|\u{200D}/gu, ' ') // emoji
      .replace(/^\s*(\d+\s*[.):-]|[-•*·])\s*/u, '') // numbering or bullets
      .trim()
      .replace(/\s+/g, ' ');
    const words = line.split(' ');
    if (!line || words.length > 4 || !words.every(w => WORD.test(w)) || NOT_A_NAME.test(line)) continue;
    if (seen.has(nameKey(line))) continue;
    seen.add(nameKey(line));
    names.push(line);
  }
  return names;
}

// Splits pasted names into new players and ones already in the squad.
export function matchSquad(squad: Player[], names: string[]): { fresh: string[]; existing: string[] } {
  const have = new Set(squad.map(p => nameKey(p.name)));
  return { fresh: names.filter(n => !have.has(nameKey(n))), existing: names.filter(n => have.has(nameKey(n))) };
}
