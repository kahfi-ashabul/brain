import { useState, useEffect, useCallback, useRef } from 'react';
import { Swords, Link, Search, Copy, Check, Loader2, X, Zap, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  createRoom,
  joinRoom,
  listenToRoom,
  setPlayerReady,
  startMatch,
  leaveRoom,
  findQuickMatch,
} from '@/lib/multiplayer';
import { MatchState, GameType } from '@/lib/types';

interface LobbyProps {
  gameType: GameType;
  duration: number;
  onMatchStart: (roomCode: string, matchState: MatchState) => void;
  onBack: () => void;
}

type LobbyMode = 'menu' | 'create' | 'join' | 'searching' | 'lobby';

export default function MultiplayerLobby({ gameType, duration, onMatchStart, onBack }: LobbyProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<LobbyMode>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);
  const startedRef = useRef(false);

  const setupListener = useCallback(
    (code: string) => {
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = listenToRoom(code, (state) => {
        if (!state) {
          if (mode !== 'menu') {
            setError('Opponent left the room');
            setMode('menu');
          }
          return;
        }
        setMatchState(state);
        if (state.status === 'countdown' && !startedRef.current) {
          startedRef.current = true;
          onMatchStart(code, state);
        }
      });
    },
    [mode, onMatchStart]
  );

  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current();
      if (roomCode && user) leaveRoom(roomCode, user.uid).catch(() => {});
    };
  }, [roomCode, user]);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && roomParam.length === 6 && mode === 'menu') {
      setJoinCode(roomParam);
      setBusy(true);
      joinRoom(roomParam, user).then((result) => {
        if (result.success) {
          setRoomCode(roomParam);
          setMode('lobby');
          setupListener(roomParam);
        } else {
          setError(result.error || 'Failed to join room');
        }
        setBusy(false);
      });
    }
  }, [user, mode, setupListener]);

  const handleCreate = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    setError('');
    const { roomCode: code, promise } = createRoom(user, gameType, duration);
    setRoomCode(code);
    await promise;
    setMode('lobby');
    setupListener(code);
    setBusy(false);
  }, [user, gameType, duration, setupListener]);

  const handleJoin = useCallback(async () => {
    if (!user || joinCode.length !== 6) return;
    setBusy(true);
    setError('');
    const result = await joinRoom(joinCode, user);
    if (result.success) {
      setRoomCode(joinCode);
      setMode('lobby');
      setupListener(joinCode);
    } else {
      setError(result.error || 'Failed to join room');
    }
    setBusy(false);
  }, [user, joinCode, setupListener]);

  const handleQuickMatch = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      const result = await findQuickMatch(user, gameType, duration);
      setRoomCode(result.roomCode);
      setMode('lobby');
      setupListener(result.roomCode);
    } catch (err) {
      setError('Matchmaking failed. Please try again.');
      setMode('menu');
    }
    setBusy(false);
  }, [user, gameType, duration, setupListener]);

  const handleReady = useCallback(() => {
    if (!user || !matchState) return;
    const myData = matchState.players[user.uid];
    setPlayerReady(roomCode, user.uid, !myData.ready);
  }, [user, matchState, roomCode]);

  const handleStart = useCallback(() => {
    if (!matchState || !user) return;
    const players = Object.values(matchState.players);
    if (players.length === 2 && players.every((p) => p.ready)) {
      startMatch(roomCode);
    }
  }, [matchState, user, roomCode]);

  const handleCopy = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomCode]);

  const handleLeave = useCallback(() => {
    if (roomCode && user) leaveRoom(roomCode, user.uid).catch(() => {});
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    startedRef.current = false;
    setRoomCode('');
    setMatchState(null);
    setMode('menu');
  }, [roomCode, user]);

  if (!user) return null;

  const players = matchState ? Object.values(matchState.players) : [];
  const myData = matchState?.players[user.uid];
  const bothReady = players.length === 2 && players.every((p) => p.ready);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
          <ChevronLeft size={18} className="text-slate-500" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
          <Swords size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-800 dark:text-white">1v1 Duel</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Real-time multiplayer match</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm animate-shake">
          {error}
        </div>
      )}

      {mode === 'menu' && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center">
            Challenge a friend or find a random opponent for a real-time duel
          </p>
          <button
            onClick={handleCreate}
            disabled={busy}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-bold shadow-lg shadow-sky-500/30 hover:scale-[1.01] transition disabled:opacity-50"
          >
            <Link size={20} /> Create Room — Get Invite Link
          </button>
          <button
            onClick={handleQuickMatch}
            disabled={busy}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold shadow-lg shadow-emerald-500/30 hover:scale-[1.01] transition disabled:opacity-50"
          >
            <Search size={20} /> Find Match — Quick Matchmaking
          </button>
          <div className="pt-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400">or join with code</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                className="flex-1 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white px-4 py-3 text-center text-lg font-bold tracking-widest focus:outline-none focus:border-sky-500 transition"
              />
              <button
                onClick={handleJoin}
                disabled={busy || joinCode.length !== 6}
                className="px-5 py-3 rounded-xl bg-slate-800 dark:bg-slate-700 text-white font-semibold hover:bg-slate-700 dark:hover:bg-slate-600 transition disabled:opacity-50"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'lobby' && matchState && (
        <div className="animate-fade-in">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 mb-5 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Share this link or code with your opponent:</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold tracking-[0.3em] text-slate-800 dark:text-white">{roomCode}</span>
              <button onClick={handleCopy} className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition">
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-slate-500" />}
              </button>
            </div>
            <button onClick={handleCopy} className="mt-2 text-xs text-sky-500 hover:underline">
              {copied ? 'Link copied!' : 'Copy invite link'}
            </button>
          </div>

          <div className="space-y-3 mb-5">
            {players.map((p, i) => (
              <div
                key={p.uid}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition ${
                  p.uid === user.uid
                    ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                <div className="text-3xl">{p.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white truncate">
                    {p.nickname} {p.uid === user.uid && <span className="text-xs text-sky-500">(You)</span>}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Rating: {p.rating}</p>
                </div>
                {p.ready ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg">
                    <Check size={14} /> Ready
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Waiting...
                  </span>
                )}
              </div>
            ))}
            {players.length < 2 && (
              <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <div className="text-3xl opacity-30">👤</div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-400 dark:text-slate-500">Waiting for opponent...</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Loader2 size={12} className="animate-spin text-slate-400" />
                    <span className="text-xs text-slate-400">Share the code above</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleLeave}
              className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Leave
            </button>
            {players.length === 2 ? (
              bothReady ? (
                <button
                  onClick={handleStart}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold shadow-lg shadow-emerald-500/30 hover:scale-[1.01] transition animate-pulse"
                >
                  <Zap size={18} /> Start Match!
                </button>
              ) : (
                <button
                  onClick={handleReady}
                  className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold transition ${
                    myData?.ready
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      : 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-500/30 hover:scale-[1.01]'
                  }`}
                >
                  {myData?.ready ? <><X size={18} /> Not Ready</> : <><Check size={18} /> I'm Ready</>}
                </button>
              )
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
