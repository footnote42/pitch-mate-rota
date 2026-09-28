import { useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Festival, gameNumbers } from '@/rota';

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
  recorded?: (g: number) => boolean; // a Recorded game, marked with a tick
}

export const Pager = ({ festival, game, goTo, recorded }: PagerProps) => (
  <div className="pager">
    <button className="iconbtn" onClick={() => goTo(game - 1)} disabled={game === 1} aria-label="Previous game">
      <ChevronLeft size={24} strokeWidth={2.2} aria-hidden="true" />
    </button>
    <div>
      <h2>
        Game {game}
        {recorded?.(game) && <Check className="done" size={20} strokeWidth={3} aria-label="played" />}
        <small>
          {festival.labels[game] ? `${festival.labels[game]} · ` : ''}of {festival.games}
          {game < festival.games ? ' · swipe for the next' : ''}
        </small>
      </h2>
      <div className="dots" aria-hidden="true">
        {gameNumbers(festival).map(g => (
          <i key={g} className={g === game ? 'on' : undefined} />
        ))}
      </div>
    </div>
    <button className="iconbtn" onClick={() => goTo(game + 1)} disabled={game === festival.games} aria-label="Next game">
      <ChevronRight size={24} strokeWidth={2.2} aria-hidden="true" />
    </button>
  </div>
);
