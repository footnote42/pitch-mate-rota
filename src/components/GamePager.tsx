import { useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Assessment, Festival, toHalves } from '@/rota';

export const Flag = ({ children }: { children: React.ReactNode }) => <span className="flag">{children}</span>;

// Swipeable games, one page each (Plan and Record share it).
export const useGamePager = (initial = 1) => {
  const [game, setGame] = useState(initial);
  const carousel = useRef<HTMLDivElement>(null);
  const goTo = (g: number, smooth = true) => {
    const el = carousel.current;
    if (el) el.scrollTo({ left: (g - 1) * el.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
  };
  const onScroll = () => {
    const el = carousel.current;
    if (!el) return;
    const g = Math.round(el.scrollLeft / el.clientWidth) + 1;
    if (g !== game) setGame(g);
  };
  // A freshly mounted carousel sits at game 1; put it on the current game.
  const restore = () => requestAnimationFrame(() => goTo(game, false));
  return { game, carousel, goTo, onScroll, restore };
};

interface PagerProps {
  festival: Festival;
  game: number;
  goTo: (g: number) => void;
  done?: (g: number) => boolean; // a Recorded game, marked with a tick
}

export const Pager = ({ festival, game, goTo, done }: PagerProps) => (
  <div className="pager">
    <button className="iconbtn" onClick={() => goTo(game - 1)} disabled={game === 1} aria-label="Previous game">
      <ChevronLeft size={24} strokeWidth={2.2} aria-hidden="true" />
    </button>
    <div>
      <h2>
        Game {game}
        {done?.(game) && <Check className="done" size={20} strokeWidth={3} aria-label="played" />}
        <small>
          {festival.labels[game] ? `${festival.labels[game]} · ` : ''}of {festival.games}
          {game < festival.games ? ' · swipe for the next' : ''}
        </small>
      </h2>
      <div className="dots" aria-hidden="true">
        {Array.from({ length: festival.games }, (_, i) => i + 1).map(g => (
          <i key={g} className={g === game ? 'on' : undefined} />
        ))}
      </div>
    </div>
    <button className="iconbtn" onClick={() => goTo(game + 1)} disabled={game === festival.games} aria-label="Next game">
      <ChevronRight size={24} strokeWidth={2.2} aria-hidden="true" />
    </button>
  </div>
);

export const HalfGameRule = ({ assessment, players }: { assessment: Assessment; players: number }) => {
  const statuses = Object.values(assessment.players).map(p => p.status);
  const watch = statuses.filter(s => s === 'tight' || s === 'impossible').length;
  return (
    <div className="hgr">
      <span>
        Half Game Rule: <b>{players - watch}</b> of {players} on track for{' '}
        <span className="nowrap">
          {toHalves(assessment.minimum)} halves{assessment.minimumMinutes !== null && ` (${assessment.minimumMinutes} min)`}
        </span>
      </span>
      {watch > 0 ? <Flag>{watch} to watch</Flag> : <span className="ok"><Check size={16} strokeWidth={2.6} aria-label="All on track" /></span>}
    </div>
  );
};
