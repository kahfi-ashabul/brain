import { useState, useEffect, useRef, useCallback } from 'react';
import { Swords, Trophy, Frown, Minus, RotateCcw, Home, TrendingUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import AdBanner from './AdBanner';
import { UserProfile, getAvatarEmoji, calculateElo } from '@/hooks/useProfile';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

interface PauliDuelProps {
  profile: UserProfile;
  opponent: { name: string; avatar: string; rating: number };
  roomCode: string;
  onMatchEnd: (result: 'win' | 'loss' | 'draw', opponentRating: number) => void;
  onExit: () => void;
}

type Phase = 'playing' | 'over';

interface Problem {
  a: number;
  b: number;
  answer: number;
}

function newDigit(): number {
  return Math.floor(Math.random() * 10);
}

const DUEL_DURATION = 30;

export default function PauliDuel({ profile, opponent, roomCode, onMatchEnd, onExit }: PauliDuelProps) {
  const [phase, setPhase] = useState<Phase>('playing');
  const [timeLeft, setTimeLeft] = useState(DUEL_DURATION);
  const [problem, setProblem] = useState<Problem>(() => {
    const a = newDigit();
    const b = newDigit();
    return { a, b, answer: (a + b) % 10 };
  });
  const [solved, setSolved] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [lastInput, setLastInput] = useState<number | null>(null);
  const [opponentSolved, setOpponentSolved] = useState(0);
  const [matchResult, setMatchResult] = useState<'win' | 'loss' | 'draw'>('draw');
  const [ratingDelta, setRatingDelta] = useState(0);
  const [chartData, setChartData] = useState<{ labels: string[]; player: number[]; opponent: number[] }>({ labels: [], player: [], opponent: [] });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const oppTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>('playing');
  const problemRef = useRef<Problem>(problem);
  const solvedRef = useRef(0);
  const oppSolvedRef = useRef(0);
  const playerHistoryRef = useRef<number[]>([]);
  const oppHistoryRef = useRef<number[]>([]);
  const labelsRef = useRef<string[]>([]);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { problemRef.current = problem; }, [problem]);
  useEffect(() => { solvedRef.current = solved; }, [solved]);

  const endMatch = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (oppTimerRef.current) clearInterval(oppTimerRef.current);
    if (trackRef.current) clearInterval(trackRef.current);

    // Push final data points
    playerHistoryRef.current.push(solvedRef.current);
    oppHistoryRef.current.push(oppSolvedRef.current);
    labelsRef.current.push(`${DUEL_DURATION}s`);

    setChartData({
      labels: [...labelsRef.current],
      player: [...playerHistoryRef.current],
      opponent: [...oppHistoryRef.current],
    });

    const mySolved = solvedRef.current;
    const oppSolved = oppSolvedRef.current;
    let result: 'win' | 'loss' | 'draw';
    if (mySolved > oppSolved) result = 'win';
    else if (mySolved < oppSolved) result = 'loss';
    else result = 'draw';

    const { delta } = calculateElo(profile.rating, opponent.rating, result);
    setMatchResult(result);
    setRatingDelta(delta);
    onMatchEnd(result, opponent.rating);
    setPhase('over');
  }, [onMatchEnd, opponent.rating, profile.rating]);

  // Main game timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          clearInterval(oppTimerRef.current!);
          clearInterval(trackRef.current!);
          endMatch();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // Opponent simulation: scores at a rate based on their rating
    // Higher rating = faster. Roughly: rating/1000 * 0.6 problems per second, with jitter
    const oppRate = (opponent.rating / 1000) * 0.65;
    const oppIntervalMs = 1000 / oppRate;
    oppTimerRef.current = setInterval(() => {
      if (phaseRef.current !== 'playing') return;
      // 88% accuracy simulation
      if (Math.random() < 0.88) {
        oppSolvedRef.current += 1;
        setOpponentSolved(oppSolvedRef.current);
      }
    }, oppIntervalMs + (Math.random() * 300 - 150));

    // Track progress every 5 seconds for chart
    trackRef.current = setInterval(() => {
      playerHistoryRef.current.push(solvedRef.current);
      oppHistoryRef.current.push(oppSolvedRef.current);
      const elapsed = DUEL_DURATION - (solvedRef.current === 0 ? DUEL_DURATION : 0);
      labelsRef.current.push(`${labelsRef.current.length * 5 + 5}s`);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (oppTimerRef.current) clearInterval(oppTimerRef.current);
      if (trackRef.current) clearInterval(trackRef.current);
    };
  }, []);

  const submitDigit = useCallback((digit: number) => {
    if (phaseRef.current !== 'playing') return;
    const currentProblem = problemRef.current;
    setAttempts((a) => a + 1);
    setLastInput(digit);

    if (digit === currentProblem.answer) {
      setSolved((s) => s + 1);
      setFeedback('correct');
      setTimeout(() => setFeedback('none'), 120);
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback('none'), 200);
    }

    const newB = newDigit();
    const next = { a: currentProblem.b, b: newB, answer: (currentProblem.b + newB) % 10 };
    setProblem(next);
    problemRef.current = next;
  }, []);

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
  const myCpm = Math.round((solved / DUEL_DURATION) * 60);
  const oppCpm = Math.round((opponentSolved / DUEL_DURATION) * 60);
  const myProgress = Math.min(100, (solved / Math.max(solved, opponentSolved, 1)) * 100);
  const oppProgress = Math.min(100, (opponentSolved / Math.max(solved, opponentSolved, 1)) * 100);

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const chartConfig = {
    labels: chartData.labels,
    datasets: [
      {
        label: profile.nickname,
        data: chartData.player,
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: '#0ea5e9',
        borderWidth: 2,
      },
      {
        label: opponent.name,
        data: chartData.opponent,
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: '#f43f5e',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: isDark ? '#cbd5e1' : '#475569', font: { size: 11 }, boxWidth: 12, boxHeight: 12 },
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#fff',
        titleColor: isDark ? '#fff' : '#1e293b',
        bodyColor: isDark ? '#cbd5e1' : '#475569',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 10,
      },
    },
    scales: {
      x: {
        ticks: { color: isDark ? '#64748b' : '#94a3b8', maxRotation: 0 },
        grid: { display: false },
      },
      y: {
        ticks: { color: isDark ? '#64748b' : '#94a3b8', precision: 0 },
        grid: { color: isDark ? 'rgba(51,65,85,0.4)' : 'rgba(226,232,240,0.6)' },
        beginAtZero: true,
      },
    },
  };

  if (phase === 'over') {
    const resultIcon = matchResult === 'win' ? <Trophy size={28} className="text-amber-400" /> :
      matchResult === 'loss' ? <Frown size={28} className="text-rose-400" /> :
      <Minus size={28} className="text-slate-400" />;
    const resultText = matchResult === 'win' ? 'Victory!' : matchResult === 'loss' ? 'Defeat' : 'Draw';
    const resultColor = matchResult === 'win' ? 'text-amber-500' : matchResult === 'loss' ? 'text-rose-500' : 'text-slate-400';

    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8 animate-fade-in">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">{resultIcon}</div>
          <h2 className={`text-3xl font-bold ${resultColor} mb-2`}>{resultText}</h2>
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${
            ratingDelta > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
            ratingDelta < 0 ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' :
            'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            {ratingDelta > 0 ? '+' : ''}{ratingDelta} RP · Now {profile.rating + ratingDelta}
          </div>
        </div>

        {/* Player vs Opponent summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`rounded-xl p-5 text-center ${matchResult === 'win' ? 'bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-400' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
            <div className="text-3xl mb-1">{getAvatarEmoji(profile.avatar)}</div>
            <div className="font-bold text-slate-800 dark:text-white text-sm truncate">{profile.nickname}</div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{solved}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">solved · {accuracy}% acc</div>
          </div>
          <div className={`rounded-xl p-5 text-center ${matchResult === 'loss' ? 'bg-rose-50 dark:bg-rose-900/20 ring-2 ring-rose-400' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
            <div className="text-3xl mb-1">{getAvatarEmoji(opponent.avatar)}</div>
            <div className="font-bold text-slate-800 dark:text-white text-sm truncate">{opponent.name}</div>
            <div className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{opponentSolved}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">solved</div>
          </div>
        </div>

        {chartData.labels.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-sky-500" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Head-to-Head Performance</h4>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4" style={{ height: '200px' }}>
              <Line data={chartConfig} options={chartOptions} />
            </div>
          </div>
        )}

        <AdBanner variant="modal" className="mb-4" />
        <div className="flex gap-3 justify-center">
          <button
            onClick={onExit}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 text-white font-semibold hover:bg-sky-600 transition"
          >
            <Home size={18} /> Back to Arena
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Swords size={20} className="text-rose-500" />
          <span className="text-sm font-bold text-slate-800 dark:text-white">1v1 Duel · Room {roomCode}</span>
        </div>
        <div className="text-2xl font-bold tabular-nums text-sky-500">{timeLeft}s</div>
      </div>

      {/* Live progress bars */}
      <div className="space-y-3 mb-6">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getAvatarEmoji(profile.avatar)}</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">{profile.nickname}</span>
            </div>
            <span className="text-sm font-bold text-sky-500 tabular-nums">{solved}</span>
          </div>
          <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-300" style={{ width: `${myProgress}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getAvatarEmoji(opponent.avatar)}</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">{opponent.name}</span>
            </div>
            <span className="text-sm font-bold text-rose-500 tabular-nums">{opponentSolved}</span>
          </div>
          <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-rose-500 to-orange-400 rounded-full transition-all duration-300" style={{ width: `${oppProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Problem display */}
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

      {/* Keypad */}
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
      <p className="text-center text-xs text-slate-400 mt-4">Press digit keys or tap above · Enter the last digit of the sum</p>

      {/* Footer stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
          <div className="text-xs text-sky-500 font-medium mb-1">Your CPM</div>
          <div className="text-lg font-bold text-slate-800 dark:text-white tabular-nums">{myCpm}</div>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
          <div className="text-xs text-emerald-500 font-medium mb-1">Accuracy</div>
          <div className="text-lg font-bold text-slate-800 dark:text-white tabular-nums">{accuracy}%</div>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
          <div className="text-xs text-rose-500 font-medium mb-1">Opp CPM</div>
          <div className="text-lg font-bold text-slate-800 dark:text-white tabular-nums">{oppCpm}</div>
        </div>
      </div>
    </div>
  );
}
