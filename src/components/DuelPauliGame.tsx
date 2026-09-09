import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, Timer, Flame, Target, Info, Swords } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { updatePlayerScore } from '@/lib/multiplayer';
import { MatchState, MatchPlayer } from '@/lib/types';

interface DuelPauliGameProps {
  roomCode: string;
  matchState: MatchState;
  onGameEnd: (myScore: number, myProgressData: number[], intervalLabels: string[]) => void;
}

type Phase = 'countdown' | 'playing' | 'finished';

interface Problem {
  a: number;
  b: number;
  answer: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function newDigit(rng: () => number): number {
  return Math.floor(rng() * 10);
}

const INTERVAL_SIZE = 5;

export default function DuelPauliGame({ roomCode, matchState, onGameEnd }: DuelPauliGameProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [problem, setProblem] = useState<Problem>(() => {
    const rng = seededRandom(matchState.problemSeed);
    const a = newDigit(rng);
    const b = newDigit(rng);
    return { a, b, answer: (a + b) % 10 };
  });
  const [solved, setSolved] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [lastInput, setLastInput] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(matchState.duration);
  const [opponentScore, setOpponentScore] = useState(0);

  const phaseRef = useRef<Phase>('countdown');
  const problemRef = useRef<Problem>(problem);
  const rngRef = useRef(seededRandom(matchState.problemSeed));
  const solvedRef = useRef(0);
  const intervalSolvedRef = useRef(0);
  const intervalDataRef = useRef<number[]>([]);
  const intervalLabelsRef = useRef<string[]>([]);
  const intervalCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { problemRef.current = problem; }, [problem]);

  const opponent = useMemo(() => {
    return Object.values(matchState.players).find((p) => p.uid !== user?.uid);
  }, [matchState.players, user]);

  useEffect(() => {
    if (opponent) {
      setOpponentScore(opponent.score);
    }
  }, [opponent]);

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setPhase('playing');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, phase]);

  // Timer + interval tracking
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          clearInterval(intervalRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    intervalRef.current = setInterval(() => {
      intervalCountRef.current += 1;
      intervalDataRef.current.push(intervalSolvedRef.current);
      intervalLabelsRef.current.push(`${intervalCountRef.current * INTERVAL_SIZE}s`);
      intervalSolvedRef.current = 0;
    }, INTERVAL_SIZE * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  // End game
  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0) {
      if (intervalSolvedRef.current > 0 || intervalCountRef.current > 0) {
        intervalDataRef.current.push(intervalSolvedRef.current);
        intervalLabelsRef.current.push(`${(intervalCountRef.current + 1) * INTERVAL_SIZE}s`);
      }
      const myScore = solvedRef.current;
      updatePlayerScore(roomCode, user!.uid, myScore, true);
      setPhase('finished');
      onGameEnd(myScore, [...intervalDataRef.current], [...intervalLabelsRef.current]);
    }
  }, [timeLeft, phase, roomCode, user, onGameEnd]);

  const submitDigit = useCallback((digit: number) => {
    if (phaseRef.current !== 'playing') return;
    const currentProblem = problemRef.current;
    setAttempts((a) => a + 1);
    setLastInput(digit);

    if (digit === currentProblem.answer) {
      setSolved((s) => {
        const ns = s + 1;
        solvedRef.current = ns;
        return ns;
      });
      intervalSolvedRef.current += 1;
      setCombo((c) => {
        const nc = c + 1;
        setMaxCombo((m) => Math.max(m, nc));
        return nc;
      });
      setFeedback('correct');
      setTimeout(() => setFeedback('none'), 150);
      updatePlayerScore(roomCode, user!.uid, solvedRef.current, false);
    } else {
      setCombo(0);
      setFeedback('wrong');
      setTimeout(() => setFeedback('none'), 250);
    }

    const rng = rngRef.current;
    const newB = newDigit(rng);
    const next = { a: currentProblem.b, b: newB, answer: (currentProblem.b + newB) % 10 };
    setProblem(next);
    problemRef.current = next;
  }, [roomCode, user]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phaseRef.current !== 'playing') return;
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        submitDigit(parseInt(e.key, 10));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [submitDigit]);

  const accuracy = attempts > 0 ? Math.round((solved / attempts) * 100) : 100;
  const multiplier = 1 + Math.floor(combo / 5);
  const myScore = solved;
  const opponentProgress = opponentScore > 0 ? Math.min(100, (opponentScore / Math.max(myScore, opponentScore, 1)) * 100) : 0;
  const myProgress = myScore > 0 ? Math.min(100, (myScore / Math.max(myScore, opponentScore, 1)) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
            <Swords size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-white">Pauli Duel</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">1v1 Chained addition match</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-2xl">{user?.avatar}</span>
          <span className="font-bold text-sky-500">{myScore}</span>
          <span className="text-slate-400">:</span>
          <span className="font-bold text-rose-500">{opponentScore}</span>
          <span className="text-2xl">{opponent?.avatar}</span>
        </div>
      </div>

      {phase === 'countdown' && (
        <div className="text-center py-20 animate-fade-in">
          <div className="text-7xl font-bold text-sky-500 animate-pop">{countdown > 0 ? countdown : 'GO!'}</div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">Get ready to add!</p>
        </div>
      )}

      {phase === 'playing' && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatCard icon={<Timer size={16} />} label="Time" value={formatTime(timeLeft)} accent="text-sky-500" />
            <StatCard icon={<Flame size={16} />} label="Combo" value={`x${multiplier}`} accent="text-orange-500" />
            <StatCard icon={<Target size={16} />} label="Accuracy" value={`${accuracy}%`} accent="text-emerald-500" />
          </div>

          {/* Live progress bars */}
          <div className="mb-4 space-y-2">
            <ProgressBar label={`${user?.nickname} (You)`} value={myProgress} score={myScore} color="bg-sky-500" />
            <ProgressBar label={opponent?.nickname || 'Opponent'} value={opponentProgress} score={opponentScore} color="bg-rose-500" />
          </div>

          <div className={`rounded-2xl p-8 sm:p-12 text-center transition-all ${
            feedback === 'correct' ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-400' :
            feedback === 'wrong' ? 'bg-rose-50 dark:bg-rose-900/20 ring-2 ring-rose-400 animate-shake' :
            'bg-slate-50 dark:bg-slate-800/50'
          }`}>
            <div className="inline-flex flex-col items-center gap-1 mb-6">
              <span className="text-5xl sm:text-6xl font-bold text-slate-800 dark:text-white tabular-nums">{problem.a}</span>
              <span className="text-3xl sm:text-4xl font-bold text-sky-500 leading-none">+</span>
              <span className="text-5xl sm:text-6xl font-bold text-slate-800 dark:text-white tabular-nums">{problem.b}</span>
              <span className="text-2xl text-slate-400 leading-none mt-1">━━━</span>
            </div>
            <div className="text-6xl sm:text-7xl font-bold tabular-nums min-h-[1.2em] flex items-center justify-center">
              {feedback === 'correct' ? (
                <span className="text-emerald-500 animate-pop">{lastInput}</span>
              ) : feedback === 'wrong' ? (
                <span className="text-rose-500 line-through">{lastInput}</span>
              ) : (
                <span className="text-slate-300 dark:text-slate-600">?</span>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-5 gap-2 sm:gap-3 max-w-sm mx-auto">
            {Array.from({ length: 10 }, (_, i) => i).map((d) => (
              <button
                key={d}
                onClick={() => submitDigit(d)}
                className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-2xl font-bold tabular-nums hover:bg-sky-100 dark:hover:bg-sky-900/40 hover:text-sky-500 active:scale-90 transition-all touch-manipulation select-none"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'finished' && (
        <div className="text-center py-20 animate-fade-in">
          <div className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Match Complete!</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">You solved {myScore} problems</p>
          <div className="mt-4 flex items-center justify-center gap-4 text-lg">
            <span className="text-2xl">{user?.avatar}</span>
            <span className="font-bold text-sky-500">{myScore}</span>
            <span className="text-slate-400">:</span>
            <span className="font-bold text-rose-500">{opponentScore}</span>
            <span className="text-2xl">{opponent?.avatar}</span>
          </div>
          <p className="text-xs text-slate-400 mt-4">Waiting for results...</p>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  return `${seconds}s`;
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
      <div className={`flex items-center justify-center gap-1.5 text-xs font-medium ${accent} mb-1`}>{icon}{label}</div>
      <div className="text-xl font-bold text-slate-800 dark:text-white tabular-nums">{value}</div>
    </div>
  );
}

function ProgressBar({ label, value, score, color }: { label: string; value: number; score: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500 dark:text-slate-400 truncate max-w-[60%]">{label}</span>
        <span className="font-bold text-slate-600 dark:text-slate-300 tabular-nums">{score}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-300`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
