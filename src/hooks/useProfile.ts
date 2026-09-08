import { useState, useEffect, useCallback } from 'react';

export interface UserProfile {
  nickname: string;
  avatar: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  isGuest: boolean;
}

export const avatars = [
  { id: 'fox', emoji: '🦊', label: 'Fox' },
  { id: 'cat', emoji: '🐱', label: 'Cat' },
  { id: 'owl', emoji: '🦉', label: 'Owl' },
  { id: 'frog', emoji: '🐸', label: 'Frog' },
  { id: 'panda', emoji: '🐼', label: 'Panda' },
  { id: 'lion', emoji: '🦁', label: 'Lion' },
  { id: 'penguin', emoji: '🐧', label: 'Penguin' },
  { id: 'monkey', emoji: '🐵', label: 'Monkey' },
  { id: 'koala', emoji: '🐨', label: 'Koala' },
  { id: 'tiger', emoji: '🐯', label: 'Tiger' },
  { id: 'rabbit', emoji: '🐰', label: 'Rabbit' },
  { id: 'dragon', emoji: '🐲', label: 'Dragon' },
];

export function getAvatarEmoji(id: string): string {
  return avatars.find((a) => a.id === id)?.emoji ?? '🧠';
}

const DEFAULT_PROFILE: UserProfile = {
  nickname: '',
  avatar: 'fox',
  rating: 1000,
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  isGuest: true,
};

const STORAGE_KEY = 'brainflex-profile';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try { return JSON.parse(data); } catch { return null; }
    }
    return null;
  });

  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
    return !!localStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    if (profile) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
  }, [profile]);

  const createGuest = useCallback((nickname: string, avatar: string) => {
    const newProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      nickname: nickname.trim().slice(0, 16) || 'Player',
      avatar,
      isGuest: true,
    };
    setProfile(newProfile);
    setHasOnboarded(true);
  }, []);

  const signInGoogle = useCallback((nickname: string, avatar: string) => {
    const newProfile: UserProfile = {
      ...DEFAULT_PROFILE,
      nickname: nickname.trim().slice(0, 16) || 'Player',
      avatar,
      isGuest: false,
    };
    setProfile(newProfile);
    setHasOnboarded(true);
  }, []);

  const updateRating = useCallback((result: 'win' | 'loss' | 'draw', opponentRating: number) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const { newRating, delta } = calculateElo(prev.rating, opponentRating, result);
      return {
        ...prev,
        rating: newRating,
        gamesPlayed: prev.gamesPlayed + 1,
        wins: prev.wins + (result === 'win' ? 1 : 0),
        losses: prev.losses + (result === 'loss' ? 1 : 0),
        draws: prev.draws + (result === 'draw' ? 1 : 0),
      };
    });
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
    setHasOnboarded(false);
  }, []);

  return { profile, hasOnboarded, createGuest, signInGoogle, updateRating, signOut };
}

export function calculateElo(playerRating: number, opponentRating: number, result: 'win' | 'loss' | 'draw') {
  const K = 32;
  const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const score = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
  const delta = Math.round(K * (score - expected));
  return { newRating: Math.max(100, playerRating + delta), delta };
}

export function getRankName(rating: number): { name: string; color: string } {
  if (rating >= 2000) return { name: 'Grandmaster', color: 'text-violet-500' };
  if (rating >= 1800) return { name: 'Master', color: 'text-indigo-500' };
  if (rating >= 1600) return { name: 'Expert', color: 'text-sky-500' };
  if (rating >= 1400) return { name: 'Skilled', color: 'text-emerald-500' };
  if (rating >= 1200) return { name: 'Intermediate', color: 'text-amber-500' };
  if (rating >= 1000) return { name: 'Rookie', color: 'text-slate-500' };
  return { name: 'Beginner', color: 'text-slate-400' };
}
