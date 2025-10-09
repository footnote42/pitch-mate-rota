import { useState, useEffect } from 'react';
import { Player, Assignment, RotationState } from '@/types/rotation';

const STORAGE_KEY = 'squad-rotation-state';
const PLAYERS_ON_FIELD = 8;
const NUMBER_OF_GAMES = 5;

export const useRotationState = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed: RotationState = JSON.parse(savedState);
        setPlayers(parsed.players || []);
        setAssignments(parsed.assignments || []);
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const state: RotationState = { players, assignments };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setLastSaved(new Date());
  }, [players, assignments]);

  const addPlayer = (name: string, experienceLevel: 'experienced' | 'novice') => {
    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random()}`,
      name,
      experienceLevel,
    };
    setPlayers(prev => [...prev, newPlayer].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const removePlayer = (playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    setAssignments(prev => prev.filter(a => a.playerId !== playerId));
  };

  const toggleExperience = (playerId: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId 
        ? { ...p, experienceLevel: p.experienceLevel === 'experienced' ? 'novice' : 'experienced' }
        : p
    ));
  };

  const toggleAssignment = (playerId: string, game: number, half: number) => {
    const existingIndex = assignments.findIndex(
      a => a.playerId === playerId && a.game === game && a.half === half
    );

    if (existingIndex >= 0) {
      // Remove assignment
      setAssignments(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      // Check if half is full
      const halfAssignments = assignments.filter(a => a.game === game && a.half === half);
      if (halfAssignments.length >= PLAYERS_ON_FIELD) {
        return false; // Cannot assign - half is full
      }
      // Add assignment
      setAssignments(prev => [...prev, { playerId, game, half }]);
    }
    return true;
  };

  const clearHalf = (game: number, half: number) => {
    setAssignments(prev => prev.filter(a => !(a.game === game && a.half === half)));
  };

  const clearGame = (game: number) => {
    setAssignments(prev => prev.filter(a => a.game !== game));
  };

  const clearAllAssignments = () => {
    setAssignments([]);
  };

  const resetAll = () => {
    setPlayers([]);
    setAssignments([]);
  };

  const isAssigned = (playerId: string, game: number, half: number) => {
    return assignments.some(a => a.playerId === playerId && a.game === game && a.half === half);
  };

  const getHalfCount = (game: number, half: number) => {
    return assignments.filter(a => a.game === game && a.half === half).length;
  };

  const getPlayerHalfCount = (playerId: string) => {
    return assignments.filter(a => a.playerId === playerId).length;
  };

  const getTotalHalves = () => {
    return NUMBER_OF_GAMES * 2;
  };

  const getMinimumHalves = () => {
    return Math.ceil(getTotalHalves() / 2);
  };

  const getFairShare = () => {
    if (players.length === 0) return 0;
    return Math.round((getTotalHalves() * PLAYERS_ON_FIELD) / players.length);
  };

  const getExperienceBalance = (game: number, half: number) => {
    const halfAssignments = assignments.filter(a => a.game === game && a.half === half);
    const assignedPlayers = players.filter(p => halfAssignments.some(a => a.playerId === p.id));
    const experiencedCount = assignedPlayers.filter(p => p.experienceLevel === 'experienced').length;
    const noviceCount = assignedPlayers.filter(p => p.experienceLevel === 'novice').length;
    
    return { experiencedCount, noviceCount, total: assignedPlayers.length };
  };

  return {
    players,
    assignments,
    lastSaved,
    addPlayer,
    removePlayer,
    toggleExperience,
    toggleAssignment,
    clearHalf,
    clearGame,
    clearAllAssignments,
    resetAll,
    isAssigned,
    getHalfCount,
    getPlayerHalfCount,
    getTotalHalves,
    getMinimumHalves,
    getFairShare,
    getExperienceBalance,
    PLAYERS_ON_FIELD,
    NUMBER_OF_GAMES,
  };
};
