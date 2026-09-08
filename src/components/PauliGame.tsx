import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Timer, Flame, Target, Trophy, RotateCcw, Play, Info, TrendingUp } from 'lucide-react';
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
import Modal from './Modal';
import AdBanner from './AdBanner';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

interface PauliGameProps {
  onScore: (score: number) => void;
  getHighScore: () => number;
  saveHighScore: (score: number) => boolean;
}

type Phase = 'idle' | 'playing' | 'over';

interface Problem {
  a: number;
  b: number;
  answer: number;
}

function newDigit(): number {
  return Math.floor(Math.random() * 10);
}

export default function PauliGame({ onScore, getHighScore, saveHighScore }: PauliGameProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [duration, setDuration] = useState(60);
  const [durationOption, setDurationOption] = useState<'30s' | '1m' | '10m' | 'custom'>('1m');
  const [customMinutes, setCustomMinutes] = useState('3');
  const [timeLeft, setTimeLeft] = useState(60);
  const [problem, setProblem] = useState<Problem>(() => {
    const a = newDigit();
    const b = newDigit();
    return { a, b, answer: (a + b) % 10 };
  });
  const [solved, setSolved] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [lastInput, setLastInput] = useState<number | null>(null);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>('idle');
  const problemRef = useRef<Problem>(problem);
  const lastDigitRef = useRef<number>(problem.b);
  const intervalCountRef = useRef<number>(0);
  const intervalSolvedRef = useRef<number>(0);
  const intervalDataRef = useRef<number[]>([]);
  const intervalLabelsRef = useRef<string[]>([]);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { problemRef.current = problem; }, [problem]);

  const intervalSize = duration <= 60 ? 5 : 30;

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Push final interval data
    if (intervalSolvedRef.current > 0 || intervalCountRef.current > 0) {
      intervalDataRef.current.push(intervalSolvedRef.current);
      intervalLabelsRef.current.push(formatLabel(intervalCountRef.current + 1, intervalSize));
    }
    setChartData({ labels: [...intervalLabelsRef.current], data: [...intervalDataRef.current] });
    setPhase('over');
  }, []);

  const startGame = useCallback(() => {
    const a = newDigit();
    const b = newDigit();
    const initialProblem = { a, b, answer: (a + b) % 10 };
    lastDigitRef.current = b;
    setProblem(initialProblem);
    problemRef.current = initialProblem;
    setPhase('playing');
    setTimeLeft(duration);
    setSolved(0);
    setAttempts(0);
    setCombo(0);
    setMaxCombo(0);
    setFeedback('none');
    setLastInput(null);
    setChartData({ labels: [], data: [] });
    intervalCountRef.current = 0;
    intervalSolvedRef.current = 0;
    intervalDataRef.current = [];
    intervalLabelsRef.current = [];
  }, [duration]);

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
      intervalLabelsRef.current.push(formatLabel(intervalCountRef.current, intervalSize));
      intervalSolvedRef.current = 0;
    }, intervalSize * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, intervalSize]);

  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0) endGame();
  }, [timeLeft, phase, endGame]);

  useEffect(() => {
    if (phase === 'over') {
      onScore(solved);
      const isNew = saveHighScore(solved);
      setIsNewHigh(isNew);
    }
  }, [phase, solved, onScore, saveHighScore]);

  const submitDigit = useCallback((digit: number) => {
    if (phaseRef.current !== 'playing') return;
    const currentProblem = problemRef.current;
    setAttempts((a) => a + 1);
    setLastInput(digit);

    if (digit === currentProblem.answer) {
      setSolved((s) => s + 1);
      intervalSolvedRef.current += 1;
      setCombo((c) => {
        const nc = c + 1;
        setMaxCombo((m) => Math.max(m, nc));
        return nc;
      });
      setFeedback('correct');
      setTimeout(() => setFeedback('none'), 150);
    } else {
      setCombo(0);
      setFeedback('wrong');
      setTimeout(() => setFeedback('none'), 250);
    }

    // Chained logic: second number becomes first, new digit becomes second
    const newB = newDigit();
    lastDigitRef.current = newB;
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

  const handleDurationOption = (opt: typeof durationOption) => {
    setDurationOption(opt);
    if (opt === '30s') setDuration(30);
    else if (opt === '1m') setDuration(60);
    else if (opt === '10m') setDuration(600);
  };

  const handleCustomMinutes = (val: string) => {
    setCustomMinutes(val);
    const mins = parseInt(val, 10);
    if (!isNaN(mins) && mins > 0 && mins <= 60) {
      setDuration(mins * 60);
    }
  };

  const accuracy = attempts > 0 ? Math.round((solved / attempts) * 100) : 100;
  const cpm = duration > 0 ? Math.round((solved / duration) * 60) : 0;
  const highScore = getHighScore();
  const multiplier = 1 + Math.floor(combo / 5);

  // Stability score: 100 - coefficient of variation of interval data * 100, clamped 0-100
  const stability = (() => {
    const data = chartData.data;
    if (data.length < 2) return 100;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    if (mean === 0) return 0;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;
    return Math.max(0, Math.min(100, Math.round(100 - cv * 100)));
  })();

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const chartConfig = {
    labels: chartData.labels,
    datasets: [{
      label: 'Calculations per interval',
      data: chartData.data,
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14, 165, 233, 0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: chartData.data.length > 20 ? 0 : 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#0ea5e9',
      borderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
        ticks: { color: isDark ? '#64748b' : '#94a3b8', maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
        grid: { display: false },
      },
      y: {
        ticks: { color: isDark ? '#64748b' : '#94a3b8', precision: 0 },
        grid: { color: isDark ? 'rgba(51,65,85,0.4)' : 'rgba(226,232,240,0.6)' },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center">
          <Plus size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-800 dark:text-white">Pauli Test</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Chained speed addition · work curve graph</p>
        </div>
      </div>

      {phase === 'idle' && (
        <div className="text-center py-8 animate-fade-in">
          <div className="max-w-md mx-auto mb-6 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 p-4 text-left">
            <div className="flex items-start gap-2.5">
              <Info size={18} className="text-sky-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">How it works</p>
                <p>Two single-digit numbers appear. Add them, enter only the <strong>last digit</strong> of the sum.</p>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">e.g. 7 + 8 = 15 → type <strong>5</strong>. Numbers chain: the second number becomes the first in the next problem. Press any digit key — no Enter needed.</p>
              </div>
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-300 mb-4">Choose your test duration:</p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4">
            {([['30s', '30 sec'], ['1m', '1 min'], ['10m', '10 min'], ['custom', 'Custom']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => handleDurationOption(val)}
                className={`px-4 sm:px-5 py-3 rounded-xl font-semibold text-sm transition ${
                  durationOption === val
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {durationOption === 'custom' && (
            <div className="mb-6 animate-fade-in">
              <label className="block text-sm text-slate-500 dark:text-slate-400 mb-2">Duration in minutes (1–60):</label>
              <input
                type="number"
                min={1}
                max={60}
                value={customMinutes}
                onChange={(e) => handleCustomMinutes(e.target.value)}
                className="w-28 text-center text-lg font-bold rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white px-4 py-2.5 focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          )}

          {highScore > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm font-medium mb-6">
              <Trophy size={16} /> High Score: {highScore} solved
            </div>
          )}
          <div>
            <button
              onClick={startGame}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-bold shadow-lg shadow-sky-500/30 hover:scale-105 transition"
            >
              <Play size={18} /> Start Test
            </button>
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard icon={<Timer size={16} />} label="Time" value={formatTime(timeLeft)} accent="text-sky-500" />
            <StatCard icon={<Flame size={16} />} label="Combo" value={`x${multiplier}`} accent="text-orange-500" />
            <StatCard icon={<Target size={16} />} label="Accuracy" value={`${accuracy}%`} accent="text-emerald-500" />
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

            <div className="mt-4 text-sm text-slate-400">
              Solved: <span className="font-bold text-slate-600 dark:text-slate-200">{solved}</span> · Attempts: <span className="font-bold text-slate-600 dark:text-slate-200">{attempts}</span>
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
          <p className="text-center text-xs text-slate-400 mt-4">Press digit keys on your keyboard or tap above</p>
        </div>
      )}

      <Modal open={phase === 'over'} onClose={() => setPhase('idle')} title="Test Complete!" showClose={false} maxWidth="max-w-lg">
        <div className="text-center">
          {isNewHigh && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm font-bold mb-4 animate-pop">
              <Trophy size={16} /> New High Score!
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <ResultCard label="Total Solved" value={String(solved)} />
            <ResultCard label="Accuracy" value={`${accuracy}%`} />
            <ResultCard label="CPM" value={String(cpm)} />
            <ResultCard label="Stability" value={`${stability}%`} />
          </div>

          {chartData.data.length > 0 && (
            <div className="mb-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-sky-500" />
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Performance Curve</h4>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4" style={{ height: '200px' }}>
                <Line data={chartConfig} options={chartOptions} />
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Calculations per {intervalSize}s interval — watch for fatigue dips
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
            <Trophy size={16} className="text-amber-400" /> High Score: {highScore}
          </div>
          <AdBanner variant="modal" className="mb-4" />
          <div className="flex gap-3 justify-center">
            <button
              onClick={startGame}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 text-white font-semibold hover:bg-sky-600 transition"
            >
              <RotateCcw size={18} /> Try Again
            </button>
            <button
              onClick={() => setPhase('idle')}
              className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Menu
            </button>
          </div>
        </div>
      </Modal>
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

function formatLabel(interval: number, size: number): string {
  const seconds = interval * size;
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s === 0 ? `${m}m` : `${m}m${s}s`;
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

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
      <div className="text-2xl font-bold text-slate-800 dark:text-white tabular-nums">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</div>
    </div>
  );
}
