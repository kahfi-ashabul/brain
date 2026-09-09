export interface UserProfile {
  uid: string;
  nickname: string;
  avatar: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  isGuest: boolean;
}

export interface MatchPlayer {
  uid: string;
  nickname: string;
  avatar: string;
  rating: number;
  ready: boolean;
  score: number;
  finished: boolean;
}

export interface MatchState {
  status: 'waiting' | 'ready' | 'countdown' | 'playing' | 'finished';
  gameType: 'pauli' | 'reflex' | 'memory' | 'typing';
  duration: number;
  problemSeed: number;
  players: Record<string, MatchPlayer>;
  createdAt: number;
  winner: string | null;
}

export type GameType = 'pauli' | 'reflex' | 'memory' | 'typing';

export const AVATARS = ['🦊', '🐼', '🦁', '🐸', '🦉', '🐺', '🐉', '🦅', '🐯', '🐨', '🦄', '🐙'];

export function defaultProfile(uid: string, nickname: string, avatar: string, isGuest: boolean): UserProfile {
  return {
    uid,
    nickname,
    avatar,
    rating: 1000,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    isGuest,
  };
}

export function computeElo(playerRating: number, opponentRating: number, won: boolean, k = 32): number {
  const expected = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const score = won ? 1 : 0;
  return Math.round(playerRating + k * (score - expected));
}

export function getRankName(rating: number): { name: string; color: string } {
  if (rating >= 2400) return { name: 'Grandmaster', color: 'text-violet-500' };
  if (rating >= 2100) return { name: 'Master', color: 'text-sky-500' };
  if (rating >= 1800) return { name: 'Expert', color: 'text-emerald-500' };
  if (rating >= 1500) return { name: 'Advanced', color: 'text-amber-500' };
  if (rating >= 1200) return { name: 'Intermediate', color: 'text-cyan-500' };
  return { name: 'Beginner', color: 'text-slate-500' };
}
