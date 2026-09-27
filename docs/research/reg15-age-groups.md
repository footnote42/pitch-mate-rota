# Reg 15 and the playing calendar for U7-U12

Research for issue #23 (map #22). Checked 2026-09-27.

## Headline

- Players on the pitch in `src/types/ageGroup.ts` (U7 4, U8 6, U9 7, U10 8, U11 9, U12 12) match the RFU Rules of Play exactly. **No mismatches.** Each figure is a *maximum* per team; teams can agree to fewer.
- Matches are played in two halves. Maximum half length: U7-U8 10 min, U9-U10 15 min, U11-U12 20 min. Maximum playing minutes per day, across all matches and festivals: 50 / 60 / 70.
- **The current season is now 2026-27.** A restructured Regulation 15 took effect on 1 August 2026. The playing-time table and the per-age player numbers are the same as 2025-26. The Half Game Rule has been **renumbered from 15.12 to 15.13** and reworded slightly (see below). `CONTEXT.md` and `docs/adr/0002-early-leavers-keep-full-minimum.md` still cite the 2025-26 numbering (15.12.3, 15.12.4).
- The RFU does not set a national festival format (games per day, minutes per game). Organisers choose it within the per-half and per-day caps. For U7-U11, the Competitive Menu allows friendly fixtures, triangulars and festivals.

## Per age group

Sources: Rules of Play appendices [A1]-[A6] (players, half length); Reg 15 playing-time table [R25 15.11.1], [R26 15.12(1)] (per-day cap); Competitive Menu [M25], [M26]; Reg 15 15.1.9 [R25].

| Age | Format | Max players on pitch per team | Halves | Max min per half | Max playing min per day | Competitive Menu formats | ageGroup.ts | Match? |
|---|---|---|---|---|---|---|---|---|
| U7 | Tag | 4 [A1] | 2 [A1] | 10 [A1][R25][R26] | 50 [R25][R26] | Friendly, triangular, festival [M25][M26] | 4 | Yes |
| U8 | Tag | 6 [A2] | 2 | 10 [A2][R25][R26] | 50 | same | 6 | Yes |
| U9 | Transitional contact (tackle only) | 7 [A3] | 2 | 15 [A3][R25][R26] | 60 | same | 7 | Yes |
| U10 | Contact | 8 [A4] | 2 | 15 [A4][R25][R26] | 60 | same | 8 | Yes |
| U11 | Contact | 9 [A5] | 2 | 20 [A5][R25][R26] | 70 | same | 9 | Yes |
| U12 | Contact | 12 [A6] | 2 | 20 [A6][R25][R26] | 70 | Adds waterfall competitions from U12, which must not be published as league tables [R25 15.1.9]. Other U12 cells unconfirmed (see gaps) | 12 | Yes |

The Activate injury-prevention programme can add a further 15 minutes per day. This time is not playing time [R25 15.11.1 footnote][R26 15.12 table].

Every appendix [A1]-[A6] says: "Rolling substitutions are permitted and substituted players can return at any time. Substitutions can only take place when the ball is dead and always with the referee's permission."

Maximum pitch sizes [A1]-[A6]: U7 20x12 m, U8 45x22 m, U9 60x30 m, U10 60x35 m, U11 60x43 m, U12 60x43 m.

## Limits on a player's playing time and matches

- **Per season:** no player may play more than 35 matches per season [R25 15.11.1][R26 15.12(1)].
- **Per half and per day:** see the table above. The caps apply "for all matches and festivals" [R26 15.12(1)].
- **No extra time**, except time a referee adds for injury stoppages. 2026-27 also bans place-kicking contests to settle a tie [R26 15.12(2)][R25 15.11.2].
- **Mismatch stop:** from U7 to U13, a match must be stopped if one team leads by more than 6 tries. The coaches may continue with an alternative format, and results from it are not recorded [R25 15.11.3-4][R26 15.12(3), image].
- **Half Game Rule (minimum):** every player in the match day squad must play at least half of the Available Playing Time. This covers contact and non-contact matches, 7-a-side, and festival and tournament matches [R25 15.12.1][R26 15.13(1)]. At a festival, "the Total Available Playing Time will be the total number of minutes allocated to all matches played by the team on that day" [R25 15.12.3][R26 15.13(3)(b)]. The 20% exception applies only to the U18 academy competition.

### Half Game Rule: what changed in 2026-27 (15.12 became 15.13)

| Point | 2025-26 (15.12) [R25] | 2026-27 (15.13) [R26] |
|---|---|---|
| Name for half the time | none | "Half Game Threshold" (15.13(2)) |
| Time past the end of a half | not addressed | Does not count toward Available Playing Time; expiry is judged under World Rugby Law 5.7 (15.13(3)(a)) |
| Time off the pitch that counts toward the threshold | Temporary injury and yellow card count (15.12.3) | Temporary injury or enforced absence counts **up to a maximum of 10 minutes**; yellow card time counts (15.13(4)) |
| Exemptions (player permanently removed) | Injury, bona fide risk of injury, red card or referee request (15.12.4). Abandoned or shortened matches reduce Available Playing Time (15.12.3(b)) | "Where a player is capable of meeting the Half Game Rule": injury, genuine risk of injury, red card or referee request, or a match abandoned or shortened for genuine reasons or under 15.12(3) (15.13(5)) |

Leaving the festival early is still **not** an exemption under either version. This is consistent with ADR 0002, but its clause references need updating to 15.13(3)(b) and 15.13(5).

The Half Game FAQ [H2] adds non-regulatory guidance. It recommends rolling substitutions or planned changes (for example, by quarters), agreeing the approach with the referee before the game, and keeping a note of replacements. Referees are not asked to enforce the rule. Breaches are reported to the CB, CSU or ECRFU.

## Festival format

- **Not set nationally.** The Competitive Menu defines a festival only as a "competitive style playing opportunity for three teams where equal player participation is the emphasis" [M25][M26]. Neither the Menu, Reg 15 [R25][R26] nor the Codes of Practice [C2] prescribe the number of games or the minutes per game. Festivals are run under CB approval and must follow the Age Grade Playing Calendar [R25 15.9][R26 15.2(1)(c)].
- **Binding constraints on any festival format:** each half must not exceed the per-half cap, and the team's total match minutes that day must not exceed the per-day cap (50/60/70).
- **Example (local, one event, not a rule):** the Kent U8 Festival 2025 had squads of up to 10 with 6 on the pitch. It ran 5 pitches with 5 or 6 teams per pitch, and matches of "5 minutes each half with one minute break" [K1]. Five or six teams per pitch implies 4-5 games of 10 minutes (40-50 minutes), just within the U8 cap. The number of games per team is inferred from the pool size and is unconfirmed.
- **Caution on local documents:** the Kent "Mini Festival U10 Rules of Play" (Nov 2025) says both "Maximum minutes each half: 15" and "20-minute halves", and gives both ball size 4 and ball size 3 [K2]. Local copies drift, so the app should rely on the RFU appendices.
- The Codes of Practice [C2] give guidance, not rules. They cite research that players take 72 hours to recover from a match. They ask coaches to consider whether a child should play more than two physically intense matches in 72 hours, and to rotate players so that everyone has an equal chance.

## Canonical URLs (all checked 2026-09-27)

`www.englandrugby.com` returns 403 to WebFetch but 200 to curl with a browser user agent. Widen `/s/` links open a PDF viewer; the direct download is the `/content/.../original/...pdf` link.

| Document | Canonical page | Direct file |
|---|---|---|
| Reg 15 (current, 2026-27) | https://www.englandrugby.com/run/rules-governance/rfu-rules-and-regulations/regulation-15-age-grade-rugby (Last Updated 28 Aug 2026) | https://rfu.widen.net/s/fcvtlrnlqb/rfu-regulation-15-2026-27 (download: https://rfu.widen.net/content/yp4eaoi2pn/original/RFU-Regulation-15-2026-27.pdf) |
| Reg 15 2025-26 | superseded | https://cdn.prod.website-files.com/63920d7acb74b68d7c749c4e/691469f5fa93e7b0db9622ab_Regulation%2015%202025-26.pdf (still downloads; a print of the web page saved 12 Nov 2025) |
| Rules of Play U7-U12 (Appendices 1-6) | `.../regulation-15-age-grade-rugby/regulation-15-appendix-{1-u7,2-u8,3-u9,4-u10,5-u11,6-u12}-rules-of-play` (see [A1]-[A6]) | web pages only. They still say "Last Updated: 31 Jul 2025, Effective from Friday 1st August 2025", and the 2026-27 Reg 15 page links to the same pages |
| Half Game Rule page and FAQ | https://www.englandrugby.com/run/coaching/age-grade-rugby/half-game | FAQ: https://rfu.widen.net/s/fhvvrbcxfv/faq-low-res (high res: https://rfu.widen.net/s/9jrkwpxjgj/faq-high-res); Top Tips: https://rfu.widen.net/s/cxhrgms5jd/half-game-top-tips |
| Age Grade Codes of Practice | https://www.englandrugby.com/run/coaching/age-grade-rugby/codes-of-practice | https://rfu.widen.net/s/pdrvtjgbdf/231005-age-grade-rugby-codes-of-practice ("Updated Autumn 2023") |
| Playing Calendar and Competitive Menu | https://www.englandrugby.com/run/coaching/age-grade-rugby/playing-calendar | Menu 2026-27: https://rfu.widen.net/s/jlv5v8gzsc/calendar-competitive-menu-2026-27; Menu 2025-26: https://rfu.widen.net/s/lx5vlrdwmr/calendar-competitive-menu-2025-26; Key info 2026-27: https://rfu.widen.net/s/bvmdnbwjdv/calendar-key-information-2026-27 |

Link notes:

- The old `/participation/coaching/age-grade-rugby/...` URLs, which the 2026-27 PDF still prints, redirect (200) to `/run/coaching/age-grade-rugby/...`. Use the `/run/` form.
- `age-graderugby` (for example, `/run/coaching/age-graderugby/half-game`) returns **404**. It is a line-wrap artefact in the PDF (`age-` + `grade-rugby`), not a real path.
- There are no national playing calendar grids for U7-U11. The published calendars start at U12 (Female U12-U18, Male U12-U16) [CAL].

## Gaps / unconfirmed

- **Competitive Menu cells:** the Menu is a colour-coded grid, and the text extraction cannot show which cells are filled. "U7-11: friendly, triangular, festival" is inferred from the grid layout, the "Under 7 to 11" column and Reg 15.1.9 (waterfall from U12, league from U15). The full set of U12 cells is unconfirmed. Check it visually in [M26].
- **2026-27 appendices:** the Rules of Play pages are dated for 2025-26 and have not been re-issued. The 2026-27 Reg 15 page links to them unchanged, so they are presumed current.
- **Festival norms** (games per day, minutes per game) vary by CB and event. The only confirmed example is [K1].

## Sources

- [R25] RFU Regulation 15, 2025-26 (web print), sections 15.1.9, 15.9, 15.11, 15.12: https://cdn.prod.website-files.com/63920d7acb74b68d7c749c4e/691469f5fa93e7b0db9622ab_Regulation%2015%202025-26.pdf
- [R26] RFU Regulation 15, 2026-27, effective 1 Aug 2026, sections 15.2, 15.12, 15.13 (playing-time and mismatch tables are images inside the PDF): https://rfu.widen.net/content/yp4eaoi2pn/original/RFU-Regulation-15-2026-27.pdf
- [A1] U7 Rules of Play: https://www.englandrugby.com/run/rules-governance/rfu-rules-and-regulations/regulation-15-age-grade-rugby/regulation-15-appendix-1-u7-rules-of-play
- [A2] U8: https://www.englandrugby.com/run/rules-governance/rfu-rules-and-regulations/regulation-15-age-grade-rugby/regulation-15-appendix-2-u8-rules-of-play
- [A3] U9: https://www.englandrugby.com/run/rules-governance/rfu-rules-and-regulations/regulation-15-age-grade-rugby/regulation-15-appendix-3-u9-rules-of-play
- [A4] U10: https://www.englandrugby.com/run/rules-governance/rfu-rules-and-regulations/regulation-15-age-grade-rugby/regulation-15-appendix-4-u10-rules-of-play
- [A5] U11: https://www.englandrugby.com/run/rules-governance/rfu-rules-and-regulations/regulation-15-age-grade-rugby/regulation-15-appendix-5-u11-rules-of-play
- [A6] U12: https://www.englandrugby.com/run/rules-governance/rfu-rules-and-regulations/regulation-15-age-grade-rugby/regulation-15-appendix-6-u12-rules-of-play
- [M25] Competitive Menu 2025-26: https://rfu.widen.net/content/ei71ayhftx/original/Calendar-Competitive-Menu-2025-26.pdf
- [M26] Competitive Menu 2026-27 (text identical to 2025-26 apart from the year): https://rfu.widen.net/content/k5hqpror25/original/Calendar-Competitive-Menu-2026-27.pdf
- [CAL] Playing Calendar page: https://www.englandrugby.com/run/coaching/age-grade-rugby/playing-calendar
- [H2] Half Game FAQ: https://rfu.widen.net/content/ny78rzcwrb/original/FAQ-Low-res.pdf
- [C2] Age Grade Codes of Practice (Autumn 2023): https://rfu.widen.net/content/5tygqixama/original/231005-Age-Grade-Rugby-Codes-of-Practice.pdf
- [K1] Kent U8 Festival 2025 information pack (local example): https://www.kent-rugby.org/wp-content/uploads/2025/03/U8-SITTINGBOURNE-Kent-Festival-2025-1.pdf
- [K2] KCRFU Mini Festival U10 Rules of Play (local, internally inconsistent): https://www.kent-rugby.org/wp-content/uploads/2025/11/UNDER-10s-RULES-OF-PLAY-Contact-Rugby.pdf
