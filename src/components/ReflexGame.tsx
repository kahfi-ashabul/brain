import { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Trophy, RotateCcw, Play, MousePointerClick } from 'lucide-react';
import Modal from './Modal';
import AdBanner from './AdBanner';

interface ReflexGameProps {
  onScore: (avg: number) => void;
  getHighScore: () => number;
  saveHighScore: (score: number) => boolean;
}

type Phase = 'idle' | 'waiting' | 'ready' | 'result' | 'tooEarly' | 'over';

function getRating(ms: number): { label: string; color: string } {
  if (ms < 200) return { label: 'Godlike', color: 'text-violet-500' };
  if (ms < 250) return { label: 'Great', color: 'text-emerald-500' };
  if (ms < 300) return { label: 'Good', color: 'text-sky-500' };
  if (ms < 400) return { label: 'Average', color: 'text-amber-500' };
  return { label: 'Needs Practice', color: 'text-rose-500' };
}

export default function ReflexGame({ onScore, getHighScore, saveHighScore }: ReflexGameProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [lastTime, setLastTime] = useState(0);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const startTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const TOTAL_ROUNDS = 5;

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startRound = useCallback(() => {
    setPhase('waiting');
    const delay = 1500 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      startTimeRef.current = performance.now();
      setPhase('ready');
    }, delay);
  }, []);

  const handleClick = useCallback(() => {
    if (phase === 'idle' || phase === 'over') {
      setRound(0);
      setTimes([]);
      startRound();
      return;
    }
    if (phase === 'waiting') {
      cleanup();
      setPhase('tooEarly');
      return;
    }
    if (phase === 'tooEarly') {
      startRound();
      return;
    }
    if (phase === 'ready') {
      const reactionTime = Math.round(performance.now() - startTimeRef.current);
      setLastTime(reactionTime);
      const newTimes = [...times, reactionTime];
      setTimes(newTimes);
      const nextRound = round + 1;
      setRound(nextRound);

      if (nextRound >= TOTAL_ROUNDS) {
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
        onScore(avg);
        const isNew = saveHighScore(avg);
        setIsNewHigh(isNew);
        setPhase('over');
      } else {
        setPhase('result');
        setTimeout(() => startRound(), 1200);
      }
    }
  }, [phase, round, times, startRound, cleanup, onScore, saveHighScore]);

  const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const highScore = getHighScore();

  const bgClass = {
    idle: 'bg-slate-100 dark:bg-slate-800',
    waiting: 'bg-rose-500',
    ready: 'bg-emerald-500 animate-pulse-ring',
    result: 'bg-sky-500',
    tooEarly: 'bg-amber-500',
    over: 'bg-slate-100 dark:bg-slate-800',
  }[phase] || 'bg-slate-100 dark:bg-slate-800';

  const content = () => {
    switch (phase) {
      case 'idle':
        return (
          <>
            <MousePointerClick size={48} className="text-slate-400 dark:text-slate-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Reflex & Reaction Test</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
              Click when the screen turns <span className="font-bold text-emerald-500">green</span>. 5 rounds, averaged.
            </p>
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 text-white font-bold">
              <Play size={18} /> Click to Start
            </span>
            {highScore > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
                <Trophy size={16} /> Best: {highScore}ms
              </div>
            )}
          </>
        );
      case 'waiting':
        return (
          <>
            <div className="text-5xl font-bold text-white mb-2">Wait...</div>
            <p className="text-white/80 text-lg">Click when it turns green</p>
          </>
        );
      case 'ready':
        return (
          <>
            <div className="text-5xl font-bold text-white mb-2">CLICK!</div>
            <p className="text-white/80 text-lg">Now!</p>
          </>
        );
      case 'result':
        return (
          <>
            <div className="text-5xl font-bold text-white mb-2">{lastTime} ms</div>
            <p className={`text-lg font-semibold ${getRating(lastTime).color.replace('text-', 'text-white/90')}`}>
              {getRating(lastTime).label}
            </p>
            <p className="text-white/70 text-sm mt-2">Round {round}/{TOTAL_ROUNDS}</p>
          </>
        );
      case 'tooEarly':
        return (
          <>
            <div className="text-4xl font-bold text-white mb-2">Too Early!</div>
            <p className="text-white/80 text-lg">Click to try again</p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-800 dark:text-white">Reflex & Reaction Time</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">5 rounds · averaged score</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full transition ${
              i < times.length ? 'bg-emerald-500' : i === round && phase !== 'idle' ? 'bg-sky-400 animate-pulse' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>

      <button
        onClick={handleClick}
        className={`w-full min-h-[280px] sm:min-h-[340px] rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${bgClass} ${phase === 'ready' ? '' : 'hover:brightness-95'}`}
      >
        {content()}
      </button>

      {times.length > 0 && phase !== 'over' && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {times.map((t, i) => (
            <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300">
              R{i + 1}: {t}ms
            </span>
          ))}
        </div>
      )}

      <Modal open={phase === 'over'} onClose={() => setPhase('idle')} title="Reaction Test Complete!" showClose={false}>
        <div className="text-center">
          {isNewHigh && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm font-bold mb-4 animate-pop">
              <Trophy size={16} /> New Personal Best!
            </div>
          )}
          <div className="mb-6">
            <div className="text-5xl font-bold text-slate-800 dark:text-white">{avg}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Average Reaction Time (ms)</div>
            <div className={`text-lg font-semibold mt-2 ${getRating(avg).color}`}>{getRating(avg).label}</div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {times.map((t, i) => (
              <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300">
                R{i + 1}: {t}ms
              </span>
            ))}
          </div>
          <AdBanner variant="modal" className="mb-4" />
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setRound(0); setTimes([]); setPhase('idle'); }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition"
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
