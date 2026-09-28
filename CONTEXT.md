# Pitch-Mate-Rota

Festival-day squad rotation for age-grade rugby: who plays which half of which game, keeping playing time fair under the RFU Half Game Rule and experience balanced on the pitch.

## Language

### Festival and games

**Festival**:
A single day of several short games played by one squad, the unit a rota is built for. Availability, the plan and the match record all belong to one festival and are cleared when a new one starts.
_Avoid_: Tournament, event

**Game**:
One match within a festival, split into two halves.
_Avoid_: Match, fixture

**Half**:
One of the two periods of a game; the unit of the plan.

**Quarter**:
Half of a half; the unit of the match record, reflecting substitutions made mid-half.

### Planning

**Festival overview**:
A read-only view of the whole plan across every game, showing each player's time and each half's balance at a glance.

**Plan**:
The coach's intended selection of players for each half of each game. The plan is primary; everything else informs it.
_Avoid_: Rota (as a synonym for the data), schedule

**Pick**:
One player planned into one half of one game.
_Avoid_: Assignment (code term only), selection

**Auto-fill**:
A suggestion that fills empty places in the plan only, never replacing existing picks, flagging halves it could not balance.
_Avoid_: Auto-populate, generate

**Experience level**:
A coach's rating of a player as Novice, Intermediate or Experienced, used to balance halves.

**Consecutive halves**:
An unbroken run of halves played by one player across games. Auto-fill avoids more than three in a row; longer runs are flagged, left to coaching judgement.

**Balance**:
Whether the combined experience of a half's players sits in an acceptable range. A soft indicator, never a block.

**Balance target**:
The experience total auto-fill aims each half at: the squad's average experience times the side size, give or take two points. Distinct from the wider range that flags a half as unbalanced.

**Shuffle**:
Re-running auto-fill over the same empty places for a different suggestion, varying only between choices that stay within the balance target and still meet minimums and an even share.

### Fairness

**Half Game Rule**:
RFU Regulation 15.13 (2026-27): every player selected in a match day squad plays at least half of the Available Playing Time. Waived only for a player permanently removed (injury, genuine risk of injury, red card) or a match abandoned or shortened.
_Avoid_: RFU minimum, fair play rule

**Available Playing Time**:
The total time allocated to all of a team's matches on the day (Reg 15.13(3)(b)), so at a festival it spans every game, not each game separately.

**Minimum**:
Half of the Available Playing Time, expressed in halves; the least any squad member may play. The regulation calls it the Half Game Threshold.

**Fair share**:
An even split of available places across the squad; a target above the minimum, not a rule.

### Availability

**Availability**:
The games a player is present for, set per player as arriving for a given game and/or leaving after a given game.

**Early leaver**:
A player who leaves the festival before its final game. Their minimum is unchanged (leaving early is not a Reg 15 exemption), so their games are front-loaded; where the minimum cannot be reached before they leave, the plan is flagged for the coach.
_Avoid_: Dropout

**Late arrival**:
A player who joins the festival after its first game. As with an early leaver, their minimum is unchanged and a shortfall is flagged.

**Permanent removal**:
A player taken out for the rest of the festival through injury, risk of injury or a red card; the one player-level case where the Half Game Rule is waived (Reg 15.13(5)).
_Avoid_: Withdrawal, retired

### Recording

**Match record**:
Quarters actually played by each player, recorded pitchside as a check against the plan. It never alters the plan.
_Avoid_: Actuals, tracking

**Recorded game**:
A game the coach has confirmed as played. From then on its match record, not the plan, counts toward each player's time, and auto-fill leaves it alone; the record itself stays editable.

### Squad

**Squad**:
The players, with their experience levels, the coach has entered on this phone. It outlives a single festival only if the coach chooses to keep it when starting a new one; it never leaves the device.

**Squad import**:
Creating the squad from pasted text (typically a WhatsApp selection message), reducing each name to a display name.

**Display name**:
A player's forename, plus surname initial only when another squad member shares that forename.
