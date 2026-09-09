import { useState, useEffect, useRef, useCallback } from 'react';
import { Swords, Loader2, Trophy, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  listenToRoom,
  updatePlayerScore,
  setWinner,
  leaveRoom,
  deleteRoom,
} from '@/lib/multiplayer';
import { MatchState, GameType, computeElo } from '@/lib/types';
import MultiplayerLobby from './MultiplayerLobby';
import DuelPauliGame from './DuelPauliGame';
import MatchResultModal from './MatchResultModal';
import AdBanner from './AdBanner';

type DuelPhase = 'lobby' | 'playing' | 'result';

interface DuelViewProps {
  onBack: () => void;
}

const gameLabels: Record<GameType, string> = {
  pauli: 'Pauli Test',
  reflex: 'Reflex',
  memory: 'Memory',
  typing: 'Typing',
};

export default function DuelView({ onBack }: DuelViewProps) {
  const { user, updateProfile } = useAuth();
  const [phase, setPhase] = useState<DuelPhase>('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [myProgressData, setMyProgressData] = useState<number[]>([]);
  const [intervalLabels, setIntervalLabels] = useState<string[]>([]);
  const [resultReady, setResultReady] = useState(false);
  const [ratingChange, setRatingChange] = useState(0);
  const [newRating, setNewRating] = useState(0);
  const unsubRef = useRef<(() => void) | null>(null);
  const myScoreRef = useRef(0);
  const resultProcessedRef = useRef(false);

  const gameType: GameType = 'pauli';
  const duration = 60;

  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current();
      if (roomCode && user) leaveRoom(roomCode, user.uid).catch(() => {});
    };
  }, [roomCode, user]);

  const handleMatchStart = useCallback(
    (code: string, state: MatchState) => {
      setRoomCode(code);
      setMatchState(state);
      setPhase('playing');
      myScoreRef.current = 0;
      resultProcessedRef.current = false;

      if (unsubRef.current) unsubRef.current();
      unsubRef.current = listenToRoom(code, (latestState) => {
        if (!latestState) return;
        setMatchState(latestState);

        if (latestState.status === 'finished' && !resultProcessedRef.current) {
          const players = Object.values(latestState.players);
          if (players.length === 2 && players.every((p) => p.finished)) {
            resultProcessedRef.current = true;
            processResult(latestState);
          }
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, updateProfile]
  );

  const processResult = useCallback(
    (state: MatchState) => {
      if (!user) return;
      const players = Object.values(state.players);
      const me = players.find((p) => p.uid === user.uid);
      const opponent = players.find((p) => p.uid !== user.uid);
      if (!me || !opponent) return;

      const won = me.score > opponent.score;
      const change = computeElo(user.rating, opponent.rating, won);
      setRatingChange(change - user.rating);
      setNewRating(change);
      updateProfile({ rating: change, gamesPlayed: user.gamesPlayed + 1, wins: user.wins + (won ? 1 : 0), losses: user.losses + (won ? 0 : 1) });
      setResultReady(true);
    },
    [user, updateProfile]
  );

  const handleGameEnd = useCallback(
    (score: number, progressData: number[], labels: string[]) => {
      setMyScore(score);
      setMyProgressData(progressData);
      setIntervalLabels(labels);
      myScoreRef.current = score;
    },
    []
  );

  const handlePlayAgain = useCallback(() => {
    if (roomCode) deleteRoom(roomCode).catch(() => {});
    setRoomCode('');
    setMatchState(null);
    setResultReady(false);
    resultProcessedRef.current = false;
    setPhase('lobby');
  }, [roomCode]);

  const handleBackToLobby = useCallback(() => {
    if (roomCode) deleteRoom(roomCode).catch(() => {});
    setRoomCode('');
    setMatchState(null);
    setResultReady(false);
    resultProcessedRef.current = false;
    setPhase('lobby');
  }, [roomCode]);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-sky-500" />
      </div>
    );
  }

  const opponentData = matchState
    ? Object.values(matchState.players).find((p) => p.uid !== user.uid)
    : null;
  const myData = matchState ? matchState.players[user.uid] : null;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-sky-500 transition">
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
      </div>

      {phase === 'lobby' && (
        <MultiplayerLobby gameType={gameType} duration={duration} onMatchStart={handleMatchStart} onBack={onBack} />
      )}

      {phase === 'playing' && matchState && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <DuelPauliGame
            roomCode={roomCode}
            matchState={matchState}
            onGameEnd={handleGameEnd}
          />
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <AdBanner variant="sidebar" />
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Swords size={18} className="text-rose-500" />
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-white">Match Info</h3>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                  <p>Game: <span className="font-medium text-slate-700 dark:text-slate-200">{gameLabels[gameType]}</span></p>
                  <p>Duration: <span className="font-medium text-slate-700 dark:text-slate-200">{duration}s</span></p>
                  <p>Your Rating: <span className="font-medium text-slate-700 dark:text-slate-200">{user.rating}</span></p>
                  {opponentData && <p>Opponent: <span className="font-medium text-slate-700 dark:text-slate-200">{opponentData.avatar} {opponentData.nickname}</span></p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {resultReady && myData && opponentData && (
        <MatchResultModal
          open={resultReady}
          myData={myData}
          opponentData={opponentData}
          ratingChange={ratingChange}
          newRating={newRating}
          myProgressData={myProgressData}
          opponentProgressData={[]}
          intervalLabels={intervalLabels}
          gameLabel={gameLabels[gameType]}
          onPlayAgain={handlePlayAgain}
          onBack={handleBackToLobby}
        />
      )}
    </div>
  );
}
