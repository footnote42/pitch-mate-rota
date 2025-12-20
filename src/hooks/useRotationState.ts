import { useState, useEffect } from 'react';
import { Player, Assignment, RotationState, ExperienceLevel, LegacyExperienceLevel } from '@/types/rotation';
import { AgeGroup, AGE_GROUP_CONFIGS, DEFAULT_AGE_GROUP, AGE_GROUP_PREFERENCE_KEY } from '@/types/ageGroup';

const STORAGE_KEY = 'squad-rotation-state';
const DEFAULT_NUMBER_OF_GAMES = 5;
const MIN_GAMES = 3;
const MAX_GAMES = 8;

export const useRotationState = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [numberOfGames, setNumberOfGames] = useState<number>(DEFAULT_NUMBER_OF_GAMES);
  const [gameLabels, setGameLabels] = useState<Record<number, string>>({});
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(DEFAULT_AGE_GROUP);

  const playersOnField = AGE_GROUP_CONFIGS[ageGroup].playersOnField;

  // Load age group preference from localStorage on mount
  useEffect(() => {
    const savedAgeGroup = localStorage.getItem(AGE_GROUP_PREFERENCE_KEY);
    if (savedAgeGroup) {
      try {
        const parsed = savedAgeGroup as AgeGroup;
        if (AGE_GROUP_CONFIGS[parsed]) {
          setAgeGroup(parsed);
        }
      } catch (error) {
        console.warn('Error loading age group preference');
      }
    }
  }, []);

  // Migration helper: convert legacy experience levels to new system
  const migrateExperienceLevel = (level: any): ExperienceLevel => {
    if (typeof level === 'number' && (level === 1 || level === 2 || level === 3)) {
      return level as ExperienceLevel;
    }
    // Legacy string values
    if (level === 'experienced') return 3;
    if (level === 'novice') return 1;
    // Default fallback
    return 2;
  };

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed: any = JSON.parse(savedState);
        // Migrate players if needed
        const migratedPlayers = (parsed.players || []).map((p: any) => ({
          ...p,
          experienceLevel: migrateExperienceLevel(p.experienceLevel)
        }));
        setPlayers(migratedPlayers);
        setAssignments(parsed.assignments || []);
        setNumberOfGames(parsed.numberOfGames || DEFAULT_NUMBER_OF_GAMES);
        setGameLabels(parsed.gameLabels || {});
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, []);

  // Save age group preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(AGE_GROUP_PREFERENCE_KEY, ageGroup);
  }, [ageGroup]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const state: RotationState = { players, assignments, numberOfGames, gameLabels };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setLastSaved(new Date());
  }, [players, assignments, numberOfGames, gameLabels]);

  const addPlayer = (name: string, experienceLevel: ExperienceLevel = 2) => {
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

  const setExperienceLevel = (playerId: string, level: ExperienceLevel) => {
    setPlayers(prev => prev.map(p =>
      p.id === playerId
        ? { ...p, experienceLevel: level }
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
      if (halfAssignments.length >= playersOnField) {
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
    setGameLabels({});
  };

  const updateGameLabel = (game: number, label: string) => {
    setGameLabels(prev => ({
      ...prev,
      [game]: label
    }));
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
    return numberOfGames * 2;
  };

  const getMinimumHalves = () => {
    return Math.ceil(getTotalHalves() / 2);
  };

  const getFairShare = () => {
    if (players.length === 0) return 0;
    return Math.round((getTotalHalves() * playersOnField) / players.length);
  };

  const getExperienceBalance = (game: number, half: number) => {
    const halfAssignments = assignments.filter(a => a.game === game && a.half === half);
    const assignedPlayers = players.filter(p => halfAssignments.some(a => a.playerId === p.id));

    // Calculate weighted points (1-3 based on experience level)
    const totalPoints = assignedPlayers.reduce((sum, p) => sum + p.experienceLevel, 0);
    const playerCount = assignedPlayers.length;

    // Target: 2 points per player (ideal mix)
    // For 8 players: target = 16, acceptable range 12-20
    const targetPoints = playersOnField * 2;
    const minPoints = playersOnField * 1.5;
    const maxPoints = playersOnField * 2.5;

    const isBalanced = playerCount === 0 || (totalPoints >= minPoints && totalPoints <= maxPoints);

    return { totalPoints, playerCount, isBalanced, targetPoints };
  };

  const changeNumberOfGames = (newNumber: number): boolean => {
    if (newNumber < MIN_GAMES || newNumber > MAX_GAMES) {
      return false;
    }

    // Check if there are any assignments
    if (assignments.length > 0) {
      // Return false to trigger confirmation dialog in component
      return false;
    }

    setNumberOfGames(newNumber);
    return true;
  };

  const confirmChangeNumberOfGames = (newNumber: number) => {
    if (newNumber < MIN_GAMES || newNumber > MAX_GAMES) {
      return;
    }

    // Clear all assignments and update game count
    setAssignments([]);
    setNumberOfGames(newNumber);
  };

  const changeAgeGroup = (newAgeGroup: AgeGroup): boolean => {
    // Check if there are any assignments
    if (assignments.length > 0) {
      // Return false to trigger confirmation dialog in component
      return false;
    }

    setAgeGroup(newAgeGroup);
    return true;
  };

  const confirmChangeAgeGroup = (newAgeGroup: AgeGroup) => {
    // Clear all assignments and update age group
    setAssignments([]);
    setAgeGroup(newAgeGroup);
  };

  return {
    players,
    assignments,
    lastSaved,
    numberOfGames,
    ageGroup,
    playersOnField,
    addPlayer,
    removePlayer,
    setExperienceLevel,
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
    changeNumberOfGames,
    confirmChangeNumberOfGames,
    changeAgeGroup,
    confirmChangeAgeGroup,
    gameLabels,
    updateGameLabel,
    MIN_GAMES,
    MAX_GAMES,
  };
};
