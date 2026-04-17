import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useRotationState } from '../useRotationState';

beforeEach(() => {
  localStorage.clear();
});

describe('changeNumberOfGames', () => {
  it('increase returns { proceed: true } and preserves assignments', () => {
    const { result } = renderHook(() => useRotationState());

    act(() => {
      result.current.addPlayer('Alice', 3);
    });
    const playerId = result.current.players[0].id;
    act(() => {
      result.current.toggleAssignment(playerId, 1, 1);
    });

    let changeResult;
    act(() => {
      changeResult = result.current.changeNumberOfGames(result.current.numberOfGames + 1);
    });

    expect(changeResult).toEqual({ proceed: true });
    expect(result.current.assignments.length).toBe(1);
  });

  it('decrease with no tail assignments returns { proceed: true }', () => {
    const { result } = renderHook(() => useRotationState());

    act(() => {
      result.current.addPlayer('Bob', 3);
    });
    const playerId = result.current.players[0].id;
    // Assign only to game 1 (within a range below current count)
    act(() => {
      result.current.toggleAssignment(playerId, 1, 1);
    });
    // numberOfGames defaults to 5; reduce to 3 (games 4 and 5 are empty)
    let changeResult;
    act(() => {
      changeResult = result.current.changeNumberOfGames(3);
    });

    expect(changeResult).toEqual({ proceed: true });
    expect(result.current.numberOfGames).toBe(3);
  });

  it('decrease with tail assignments returns { proceed: false, affectedGames }', () => {
    const { result } = renderHook(() => useRotationState());

    act(() => {
      result.current.addPlayer('Carol', 3);
    });
    const playerId = result.current.players[0].id;
    // Assign to game 5 (tail when reducing to 3)
    act(() => {
      result.current.toggleAssignment(playerId, 5, 1);
    });

    let changeResult;
    act(() => {
      changeResult = result.current.changeNumberOfGames(3);
    });

    expect(changeResult).toEqual({ proceed: false, affectedGames: [5] });
    // Game count must NOT have changed yet
    expect(result.current.numberOfGames).toBe(5);
  });
});
