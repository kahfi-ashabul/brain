import { useState, useEffect, useCallback, useRef } from 'react';
import { Swords, Users, Hash, Copy, Check, Loader2, Play, LogOut, Wifi } from 'lucide-react';
import { UserProfile, getAvatarEmoji } from '@/hooks/useProfile';
import AdBanner from './AdBanner';

type LobbyMode = 'menu' | 'create' | 'join' | 'quickmatch' | 'lobby';
type LobbyPhase = 'waiting' | 'ready' | 'countdown' | 'matched';

interface MultiplayerLobbyProps {
  profile: UserProfile;
  onStartDuel: (opponentName: string, opponentAvatar: string, opponentRating: number, roomCode: string) => void;
  onBack: () => void;
}

const aiNames = [
  { name: 'QuickMath', avatar: 'owl' },
  { name: 'BrainBot', avatar: 'cat' },
  { name: 'NumberNinja', avatar: 'fox' },
  { name: 'SpeedySloth', avatar: 'panda' },
  { name: 'CalcKing', avatar: 'lion' },
  { name: 'MentalMaven', avatar: 'dragon' },
  { name: 'ArithPro', avatar: 'tiger' },
  { name: 'FastFingers', avatar: 'rabbit' },
  { name: 'DigitDuel', avatar: 'penguin' },
  { name: 'MathWhiz', avatar: 'koala' },
];

function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function MultiplayerLobby({ profile, onStartDuel, onBack }: MultiplayerLobbyProps) {
  const [mode, setMode] = useState<LobbyMode>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [phase, setPhase] = useState<LobbyPhase>('waiting');
  const [countdown, setCountdown] = useState(3);
  const [opponent, setOpponent] = useState<{ name: string; avatar: string; rating: number } | null>(null);
  const [searchTime, setSearchTime] = useState(0);
  const timersRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearInterval);
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const startMatchmaking = useCallback(() => {
    setPhase('waiting');
    setSearchTime(0);
    const searchTimer = setInterval(() => {
      setSearchTime((s) => s + 1);
    }, 1000);
    timersRef.current.push(searchTimer);

    // Simulated match found after 3-6 seconds
    const matchDelay = 3000 + Math.random() * 3000;
    const matchTimer = setTimeout(() => {
      clearInterval(searchTimer);
      const ai = aiNames[Math.floor(Math.random() * aiNames.length)];
      const oppRating = Math.max(800, profile.rating + Math.floor(Math.random() * 200 - 100));
      setOpponent({ name: ai.name, avatar: ai.avatar, rating: oppRating });
      setPhase('ready');
      setTimeout(() => beginCountdown(ai.name, ai.avatar, oppRating), 1500);
    }, matchDelay);
    timersRef.current.push(matchTimer as unknown as ReturnType<typeof setInterval>);
  }, [profile.rating]);

  const beginCountdown = useCallback((name: string, avatar: string, rating: number) => {
    setPhase('countdown');
    setCountdown(3);
    const cdTimer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(cdTimer);
          onStartDuel(name, avatar, rating, roomCode || 'QUICK');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    timersRef.current.push(cdTimer);
  }, [onStartDuel, roomCode]);

  const handleCreateRoom = useCallback(() => {
    const code = generateRoomCode();
    setRoomCode(code);
    setMode('lobby');
    setPhase('waiting');
    // Simulate opponent joining after 4-7 seconds
    const joinTimer = setTimeout(() => {
      const ai = aiNames[Math.floor(Math.random() * aiNames.length)];
      const oppRating = Math.max(800, profile.rating + Math.floor(Math.random() * 200 - 100));
      setOpponent({ name: ai.name, avatar: ai.avatar, rating: oppRating });
      setPhase('ready');
      setTimeout(() => beginCountdown(ai.name, ai.avatar, oppRating), 1500);
    }, 4000 + Math.random() * 3000);
    timersRef.current.push(joinTimer as unknown as ReturnType<typeof setInterval>);
  }, [profile.rating, beginCountdown]);

  const handleJoinRoom = useCallback(() => {
    if (joinCode.length !== 6) return;
    setRoomCode(joinCode);
    setMode('lobby');
    setPhase('ready');
    // Simulate host already in room
    const ai = aiNames[Math.floor(Math.random() * aiNames.length)];
    const oppRating = Math.max(800, profile.rating + Math.floor(Math.random() * 200 - 100));
    setOpponent({ name: ai.name, avatar: ai.avatar, rating: oppRating });
    setTimeout(() => beginCountdown(ai.name, ai.avatar, oppRating), 1500);
  }, [joinCode, profile.rating, beginCountdown]);

  const copyRoomCode = useCallback(() => {
    navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomCode]);

  const reset = useCallback(() => {
    clearTimers();
    setMode('menu');
    setPhase('waiting');
    setOpponent(null);
    setRoomCode('');
    setJoinCode('');
    setSearchTime(0);
    setCountdown(3);
  }, [clearTimers]);

  const rank = profile.rating;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-400 flex items-center justify-center">
            <Swords size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-white">Multiplayer Arena</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">1v1 real-time cognitive duels</p>
          </div>
        </div>

        {mode === 'menu' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => { setMode('quickmatch'); startMatchmaking(); }}
              className="group rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-6 text-left hover:border-sky-500 hover:shadow-lg transition"
            >
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Swords size={24} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-1">Quick Match</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Get matched with a random opponent at a similar skill level</p>
            </button>

            <button
              onClick={() => setMode('create')}
              className="group rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-6 text-left hover:border-emerald-500 hover:shadow-lg transition"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Users size={24} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-1">Create Room</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Generate a room code and invite a friend to duel</p>
            </button>

            <button
              onClick={() => setMode('join')}
              className="group rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-6 text-left hover:border-amber-500 hover:shadow-lg transition sm:col-span-2"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Hash size={24} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white mb-1">Join with Code</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Enter a 6-digit room code to join a friend's duel</p>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="text-center py-8 animate-fade-in">
            <p className="text-slate-600 dark:text-slate-300 mb-6">Click below to generate a unique room code</p>
            <button
              onClick={handleCreateRoom}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold shadow-lg shadow-emerald-500/30 hover:scale-105 transition"
            >
              <Users size={18} /> Generate Room Code
            </button>
            <div className="mt-6">
              <button onClick={() => setMode('menu')} className="text-sm text-slate-400 hover:text-slate-500 transition">← Back</button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="text-center py-8 animate-fade-in">
            <p className="text-slate-600 dark:text-slate-300 mb-4">Enter the 6-digit room code:</p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleJoinRoom(); }}
              placeholder="123456"
              autoFocus
              className="w-48 text-center text-3xl font-bold tracking-[0.3em] rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white px-4 py-3 focus:outline-none focus:border-sky-500 transition mb-6"
            />
            <div>
              <button
                onClick={handleJoinRoom}
                disabled={joinCode.length !== 6}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 text-white font-bold shadow-lg shadow-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition"
              >
                <Play size={18} /> Join Room
              </button>
            </div>
            <div className="mt-6">
              <button onClick={() => setMode('menu')} className="text-sm text-slate-400 hover:text-slate-500 transition">← Back</button>
            </div>
          </div>
        )}

        {mode === 'quickmatch' && phase === 'waiting' && (
          <div className="text-center py-12 animate-fade-in">
            <Loader2 size={48} className="text-sky-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Finding Match...</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Searching for an opponent near your rating ({rank})</p>
            <p className="text-xs text-slate-400 mt-2">Elapsed: {searchTime}s</p>
            <div className="mt-6">
              <button onClick={reset} className="text-sm text-slate-400 hover:text-slate-500 transition">Cancel</button>
            </div>
          </div>
        )}

        {mode === 'lobby' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Hash size={18} className="text-emerald-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Room Code:</span>
              </div>
              <button
                onClick={copyRoomCode}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold text-lg tracking-wider hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition"
              >
                {roomCode}
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            {phase === 'waiting' && (
              <div className="text-center py-10">
                <div className="flex items-center justify-center gap-2 text-slate-400 mb-4">
                  <Wifi size={20} className="animate-pulse" />
                  <span className="text-sm">Waiting for opponent to join...</span>
                </div>
                <div className="flex items-center justify-center gap-8 my-8">
                  <PlayerBadge name={profile.nickname} avatar={profile.avatar} rating={profile.rating} status="ready" />
                  <div className="text-2xl font-bold text-slate-300 dark:text-slate-600">VS</div>
                  <PlayerBadge name="???" avatar="" rating={0} status="waiting" />
                </div>
                <div className="mt-4 w-full max-w-xs mx-auto h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: '40%' }} />
                </div>
                <div className="mt-6">
                  <button onClick={reset} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-500 transition">
                    <LogOut size={14} /> Leave Room
                  </button>
                </div>
              </div>
            )}

            {phase === 'ready' && opponent && (
              <div className="text-center py-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-6 animate-pop">
                  <Check size={14} /> Opponent Found!
                </div>
                <div className="flex items-center justify-center gap-8 my-6">
                  <PlayerBadge name={profile.nickname} avatar={profile.avatar} rating={profile.rating} status="ready" />
                  <div className="text-2xl font-bold text-slate-300 dark:text-slate-600">VS</div>
                  <PlayerBadge name={opponent.name} avatar={opponent.avatar} rating={opponent.rating} status="ready" />
                </div>
                <p className="text-sm text-slate-400">Starting in...</p>
              </div>
            )}
          </div>
        )}

        {phase === 'countdown' && opponent && (
          <div className="text-center py-16 animate-fade-in">
            <div className="flex items-center justify-center gap-8 mb-8">
              <PlayerBadge name={profile.nickname} avatar={profile.avatar} rating={profile.rating} status="ready" />
              <div className="text-2xl font-bold text-slate-300 dark:text-slate-600">VS</div>
              <PlayerBadge name={opponent.name} avatar={opponent.avatar} rating={opponent.rating} status="ready" />
            </div>
            <div className="text-7xl font-bold text-sky-500 animate-pop" key={countdown}>
              {countdown}
            </div>
          </div>
        )}
      </div>

      <AdBanner variant="leaderboard" />
    </div>
  );
}

function PlayerBadge({ name, avatar, rating, status }: { name: string; avatar: string; rating: number; status: 'ready' | 'waiting' }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition ${
        status === 'ready' ? 'bg-sky-500/10 ring-2 ring-sky-500' : 'bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-200 dark:ring-slate-700'
      }`}>
        {avatar ? getAvatarEmoji(avatar) : '❓'}
      </div>
      <span className="text-sm font-semibold text-slate-800 dark:text-white max-w-[80px] truncate">{name}</span>
      {rating > 0 && <span className="text-xs text-amber-500 font-medium">{rating} RP</span>}
    </div>
  );
}
