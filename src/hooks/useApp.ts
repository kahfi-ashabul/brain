import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem('brainflex-theme') as Theme | null;
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('brainflex-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}

export function useHighScores() {
  const getScore = useCallback((game: string, key: string = 'default') => {
    const data = localStorage.getItem(`brainflex-hs-${game}-${key}`);
    return data ? parseFloat(data) : 0;
  }, []);

  const saveScore = useCallback((game: string, value: number, key: string = 'default') => {
    const current = getScore(game, key);
    if (value > current) {
      localStorage.setItem(`brainflex-hs-${game}-${key}`, String(value));
      return true;
    }
    return false;
  }, [getScore]);

  return { getScore, saveScore };
}

export function useStats() {
  const getStats = useCallback(() => {
    const data = localStorage.getItem('brainflex-stats');
    return data ? JSON.parse(data) : { gamesPlayed: 0, totalScore: 0, bestReaction: 0, bestMemory: 0 };
  }, []);

  const saveStats = useCallback((updates: Record<string, number>) => {
    const current = getStats();
    const next = { ...current };
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'gamesPlayed') next.gamesPlayed = (current.gamesPlayed || 0) + value;
      else if (key === 'bestReaction') next.bestReaction = current.bestReaction ? Math.min(current.bestReaction, value) : value;
      else if (key === 'bestMemory') next.bestMemory = Math.max(current.bestMemory || 0, value);
      else next[key] = (current[key] || 0) + value;
    }
    localStorage.setItem('brainflex-stats', JSON.stringify(next));
    return next;
  }, [getStats]);

  return { getStats, saveStats };
}
