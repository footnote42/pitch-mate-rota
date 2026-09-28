import { ChevronDown } from 'lucide-react';

const RFU_LINKS = [
  {
    href: 'https://rfu.widen.net/s/fcvtlrnlqb/rfu-regulation-15-2026-27',
    title: 'RFU Regulation 15: Age Grade Rugby',
    note: '2026-27 season (PDF)',
  },
  {
    href: 'https://www.englandrugby.com/run/rules-governance/rfu-rules-and-regulations/regulation-15-age-grade-rugby',
    title: 'Rules of Play for age grade rugby',
    note: '2026-27 season, U7 to U12 appendices',
  },
];

const Section = ({ title, open, children }: { title: string; open?: boolean; children: React.ReactNode }) => (
  <details className="guide" open={open}>
    <summary>
      {title}
      <ChevronDown size={20} strokeWidth={2.2} aria-hidden="true" />
    </summary>
    <div className="guide-body">{children}</div>
  </details>
);

export const GuideTab = () => (
  <div className="page">
    <div className="head"><h1>Guide</h1></div>

    <div>
      <Section title="A festival day in five steps" open>
        <ol>
          <li><b>Squad.</b> Add your players and set each as Novice, Intermediate or Experienced. Set the age group, the number of games and, if you know it, the minutes per half.</li>
          <li><b>Availability.</b> Tap a player's name to say which games they are here for.</li>
          <li><b>Plan.</b> Tap 1st or 2nd beside a player to put them in that half, or tap Auto-fill. Swipe between games; Overview shows the whole day.</li>
          <li><b>Share.</b> Tap the share button, then Copy for WhatsApp, and paste the plan into the parents' group.</li>
          <li><b>Record.</b> Between games, fix any quarters that went differently and tap Game n played.</li>
        </ol>
      </Section>

      <Section title="The Half Game Rule">
        <p>
          Every player in your squad must play at least half of the day's total playing time (RFU Regulation 15.13).
          At a festival that means across all your games, not in each game.
        </p>
        <p>
          <b>Example.</b> U9 play 7 a side. With 12 players and 4 games there are 8 halves, so 56 places. Everyone
          needs at least 4 halves, which takes 48 places, leaving 8 extra halves to share. With 8-minute halves, the
          minimum is 32 minutes.
        </p>
        <p>The line at the top of the Plan tab counts it for you.</p>
      </Section>

      <Section title="What the flags mean">
        <p>Flags are orange: worth a look, never a block.</p>
        <ul>
          <li><b>Tight:</b> exactly enough places left to reach the minimum. Pick them soon.</li>
          <li><b>Short:</b> they can no longer reach the minimum with the places left.</li>
          <li><b>N in a row:</b> more than three halves in a row without a rest.</li>
          <li><b>Light or Heavy on experience:</b> a full half well below or above your squad's average.</li>
          <li><b>Worth a look:</b> the minutes per half, or for the day, are over the RFU maximum. Check with the organiser.</li>
        </ul>
        <p>The one hard limit: you cannot pick more players than fit on the pitch.</p>
      </Section>

      <Section title="Auto-fill, Shuffle and Undo">
        <p>
          Auto-fill fills every empty place and never moves a pick you have made. First it makes sure everyone can
          reach the minimum, starting with early leavers. Then it shares the extra halves evenly and keeps each half's
          experience close to your squad's average. New picks get a gold ring.
        </p>
        <p>Shuffle gives a different suggestion for the same places. Undo takes back the last change, whatever it was.</p>
      </Section>

      <Section title="Recording who played">
        <p>
          Games rarely go exactly to plan. Record starts ticked from the plan, in quarters. Tap a quarter to change who
          actually played. A ring means played but not planned; a strike means planned but did not play.
        </p>
        <p>
          Tap Game n played when it is over. From then on that game counts from the record, and Auto-fill leaves it
          alone. You can still change it at any time, in any order. The plan itself never changes.
        </p>
      </Section>

      <Section title="Early leavers, late arrivals and Out for the day">
        <p>
          Tap a player's name in Squad to set Arrives for and Leaves after. They keep the full-day minimum: leaving
          early is not an exemption. Auto-fill gives them their halves while they are here, and Short shows if it
          cannot be done.
        </p>
        <p>
          If a player is injured, at genuine risk of injury or sent off for the rest of the day, tap their name in
          Record and choose Out for the day. Their later picks clear and the Half Game Rule no longer applies to them.
          A temporary injury still counts as playing time, up to 10 minutes: just record the quarters as they happened.
        </p>
      </Section>

      <Section title="Your data stays on this phone">
        <p>
          Names and plans are saved on this phone only. Nothing is sent anywhere unless you copy the plan into WhatsApp
          yourself.
        </p>
        <p>
          New festival, in the menu, clears the plan and record. Keep squad keeps your players for next time; Clear
          everything removes every name.
        </p>
      </Section>

      <Section title="RFU regulations">
        <ul className="links">
          {RFU_LINKS.map(l => (
            <li key={l.href}>
              <a href={l.href} target="_blank" rel="noreferrer">{l.title}</a>
              <small>{l.note}</small>
            </li>
          ))}
        </ul>
        <p className="hint">The RFU regulations are the authority; this app helps you follow them.</p>
      </Section>
    </div>
  </div>
);
