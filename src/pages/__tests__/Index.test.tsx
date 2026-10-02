import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, within } from '@testing-library/react';
import Index from '../Index';
import { State, reduce, assess, emptyState } from '@/rota';
import { STORAGE_KEY, serialize } from '@/rota/storage';
import * as toastHook from '@/hooks/use-toast';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));

describe('Index completion celebration toast', () => {
  const toastMock = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(toastHook, 'useToast').mockReturnValue({
      toast: toastMock,
      toasts: [],
      dismiss: vi.fn(),
    });
  });

  const createCompleteState = (): State => {
    let s = emptyState();
    s = reduce(s, { type: 'setAgeGroup', ageGroup: 'U7' }); // 4 players on field
    s = reduce(s, { type: 'setGames', games: 3 });
    s = reduce(s, {
      type: 'addPlayers',
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
        { id: 'p3', name: 'Charlie' },
        { id: 'p4', name: 'Dave' },
      ],
    });
    s = reduce(s, { type: 'autoFill', seed: 0 });
    expect(assess(s).complete).toBe(true);
    return s;
  };

  it('does NOT fire toast on page load/refresh if allocation is already complete', () => {
    const completeState = createCompleteState();
    localStorage.setItem(STORAGE_KEY, serialize(completeState));

    render(<Index />);

    expect(toastMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Looking good, Coach!',
      })
    );
  });

  it('fires toast when selections are made to complete the allocation', () => {
    let s = emptyState();
    s = reduce(s, { type: 'setAgeGroup', ageGroup: 'U7' });
    s = reduce(s, { type: 'setGames', games: 3 });
    s = reduce(s, {
      type: 'addPlayers',
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
        { id: 'p3', name: 'Charlie' },
        { id: 'p4', name: 'Dave' },
      ],
    });
    localStorage.setItem(STORAGE_KEY, serialize(s));

    const { getByRole } = render(<Index />);

    // Initially incomplete: no celebration toast
    expect(toastMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Looking good, Coach!',
      })
    );

    // Switch to Plan tab
    act(() => {
      getByRole('button', { name: /plan/i }).click();
    });

    // Auto-fill to complete the allocation
    const autoFillBtn = getByRole('button', { name: /auto-fill/i });
    act(() => {
      autoFillBtn.click();
    });

    // Toast should have fired once!
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Looking good, Coach!',
        description: 'Your squad is match-ready.',
      })
    );
  });

  it('does NOT fire toast again on re-render if allocation did not change', () => {
    const completeState = createCompleteState();
    localStorage.setItem(STORAGE_KEY, serialize(completeState));

    const { getByRole } = render(<Index />);
    const nav = getByRole('navigation', { name: 'Sections' });

    // Switch tab to Plan and back to Squad
    act(() => {
      within(nav).getByRole('button', { name: /plan/i }).click();
    });
    act(() => {
      within(nav).getByRole('button', { name: /squad/i }).click();
    });

    expect(toastMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Looking good, Coach!',
      })
    );
  });

  it('fires toast again when an allocation changes', () => {
    const completeState = createCompleteState();
    localStorage.setItem(STORAGE_KEY, serialize(completeState));

    // Render initially complete (simulates page refresh: toast does not fire)
    const { getByRole } = render(<Index />);
    expect(toastMock).not.toHaveBeenCalled();

    // Switch to Plan tab
    act(() => {
      getByRole('button', { name: /plan/i }).click();
    });

    // Toggle Alice out of game 1 first half (makes allocation incomplete)
    const alicePick = getByRole('button', { name: /Alice, game 1 first half/i });
    act(() => {
      alicePick.click();
    });

    expect(toastMock).not.toHaveBeenCalled();

    // Toggle Alice back into game 1 first half (completes allocation)
    act(() => {
      alicePick.click();
    });

    // Toast should fire now because allocation was completed by user selections!
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Looking good, Coach!',
        description: 'Your squad is match-ready.',
      })
    );
  });

  it('fires toast when an allocation changes from one complete plan to another', () => {
    // 5 players, 4 on field: swap who plays game 1 first half
    let s = emptyState();
    s = reduce(s, { type: 'setAgeGroup', ageGroup: 'U7' });
    s = reduce(s, { type: 'setGames', games: 3 });
    s = reduce(s, {
      type: 'addPlayers',
      players: [
        { id: 'p1', name: 'Alice' },
        { id: 'p2', name: 'Bob' },
        { id: 'p3', name: 'Charlie' },
        { id: 'p4', name: 'Dave' },
        { id: 'p5', name: 'Eve' },
      ],
    });
    s = reduce(s, { type: 'autoFill', seed: 0 });
    expect(assess(s).complete).toBe(true);

    localStorage.setItem(STORAGE_KEY, serialize(s));

    // Page load / refresh with complete state: no toast
    const { getByRole } = render(<Index />);
    expect(toastMock).not.toHaveBeenCalled();

    // Switch to Plan tab
    const nav = getByRole('navigation', { name: 'Sections' });
    act(() => {
      within(nav).getByRole('button', { name: /plan/i }).click();
    });

    // Swap Alice for Eve in game 1 first half
    const alicePick = getByRole('button', { name: /Alice, game 1 first half/i });
    act(() => {
      alicePick.click();
    });

    const evePick = getByRole('button', { name: /Eve, game 1 first half/i });
    act(() => {
      evePick.click();
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Looking good, Coach!',
        description: 'Your squad is match-ready.',
      })
    );
  });
});
