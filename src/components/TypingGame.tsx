import { useState, useEffect, useRef, useCallback } from 'react';
import { Keyboard, Trophy, RotateCcw, Play, Timer, Gauge, Target, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import AdBanner from './AdBanner';

interface TypingGameProps {
  onScore: (wpm: number) => void;
  getHighScore: (category: string) => number;
  saveHighScore: (wpm: number, category: string) => boolean;
}

const categories: Record<string, { label: string; words: string[] }> = {
  medical: {
    label: 'Medical Terms',
    words: ['cardiology', 'pharmaceutical', 'diagnosis', 'anatomy', 'physiology', 'pathology', 'treatment', 'symptom', 'prescription', 'medication', 'therapy', 'prognosis', 'infection', 'immunity', 'surgical', 'clinical', 'patient', 'hemoglobin', 'neurology', 'pediatric'],
  },
  programming: {
    label: 'Programming & Code',
    words: ['async', 'await', 'array', 'mapping', 'return', 'payload', 'function', 'variable', 'callback', 'promise', 'object', 'string', 'boolean', 'iterate', 'recursion', 'algorithm', 'debugging', 'compile', 'runtime', 'framework'],
  },
  legal: {
    label: 'Legal & Corporate',
    words: ['affidavit', 'jurisdiction', 'indemnity', 'liability', 'contract', 'plaintiff', 'defendant', 'statute', 'regulation', 'compliance', 'corporate', 'merger', 'acquisition', 'shareholder', 'fiduciary', 'arbitration', 'litigation', 'tort', 'clause', 'provision'],
  },
  tech: {
    label: 'General Tech',
    words: ['cloud', 'computing', 'artificial', 'intelligence', 'cybersecurity', 'network', 'database', 'algorithm', 'software', 'hardware', 'protocol', 'encryption', 'firewall', 'bandwidth', 'server', 'client', 'browser', 'responsive', 'deployment', 'scalable'],
  },
};

type Phase = 'idle' | 'playing' | 'over';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateText(category: string): string {
  const words = categories[category].words;
  const shuffled = shuffle(words);
  const count = 40;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length]);
  }
  return result.join(' ');
}

export default function TypingGame({ onScore, getHighScore, saveHighScore }: TypingGameProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [category, setCategory] = useState<keyof typeof categories>('medical');
  const [text, setText] = useState('');
  const [typed, setTyped] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [startTime, setStartTime] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback(() => {
    setText(generateText(category));
    setTyped('');
    setTimeLeft(60);
    setMistakes(0);
    setStartTime(0);
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [category]);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (startTime === 0 && value.length > 0) {
      setStartTime(performance.now());
    }
    let errs = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== text[i]) errs++;
    }
    setMistakes(errs);
    setTyped(value);
  }, [text, startTime]);

  const elapsed = startTime > 0 ? (performance.now() - startTime) / 1000 : 0;
  const wordsTyped = typed.trim().split(/\s+/).filter(Boolean).length;
  const wpm = elapsed > 0 ? Math.round((wordsTyped / elapsed) * 60) : 0;
  const accuracy = typed.length > 0 ? Math.round(((typed.length - mistakes) / typed.length) * 100) : 100;

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('over');
    onScore(wpm);
    const isNew = saveHighScore(wpm, category);
    setIsNewHigh(isNew);
  }, [wpm, category, onScore, saveHighScore]);

  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0) endGame();
  }, [timeLeft, phase, endGame]);

  useEffect(() => {
    if (phase === 'playing' && typed === text && text.length > 0) endGame();
  }, [typed, text, phase, endGame]);
  const highScore = getHighScore(category);

  const chars = text.split('');

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center">
          <Keyboard size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-800 dark:text-white">Typing Speed Test</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Niche vocabulary · 60 seconds</p>
        </div>
      </div>

      {phase === 'idle' && (
        <div className="text-center py-8 animate-fade-in">
          <p className="text-slate-600 dark:text-slate-300 mb-4">Choose a vocabulary category:</p>
          <div className="max-w-xs mx-auto mb-8">
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as keyof typeof categories)}
                className="w-full appearance-none px-4 py-3.5 pr-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm cursor-pointer focus:outline-none focus:border-amber-500 transition"
              >
                {Object.entries(categories).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.label}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {highScore > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm font-medium mb-6">
              <Trophy size={16} /> Best ({categories[category].label}): {highScore} WPM
            </div>
          )}
          <div>
            <button
              onClick={startGame}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 text-white font-bold shadow-lg shadow-amber-500/30 hover:scale-105 transition"
            >
              <Play size={18} /> Start Typing
            </button>
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-4 gap-3 mb-6">
            <TypingStat icon={<Timer size={16} />} label="Time" value={`${timeLeft}s`} accent="text-sky-500" />
            <TypingStat icon={<Gauge size={16} />} label="WPM" value={String(wpm)} accent="text-amber-500" />
            <TypingStat icon={<Target size={16} />} label="Accuracy" value={`${accuracy}%`} accent="text-emerald-500" />
            <TypingStat icon={<AlertCircle size={16} />} label="Mistakes" value={String(mistakes)} accent="text-rose-500" />
          </div>

          <div
            className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-6 mb-4 cursor-text min-h-[140px] text-lg sm:text-xl leading-relaxed font-mono select-none"
            onClick={() => inputRef.current?.focus()}
          >
            {chars.map((char, i) => {
              let className = 'text-slate-400 dark:text-slate-500';
              if (i < typed.length) {
                className = typed[i] === char ? 'text-emerald-500' : 'text-rose-500 bg-rose-100 dark:bg-rose-900/30 rounded';
              }
              if (i === typed.length) {
                className = 'text-slate-800 dark:text-white bg-sky-200 dark:bg-sky-900/40 rounded';
              }
              return (
                <span key={i} className={className}>
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={typed}
            onChange={handleInput}
            onBlur={() => inputRef.current?.focus()}
            autoFocus
            className="sr-only"
            aria-label="Typing input"
          />
          <p className="text-center text-sm text-slate-400">Type the text above. The box updates automatically.</p>
        </div>
      )}

      <Modal open={phase === 'over'} onClose={() => setPhase('idle')} title="Typing Test Complete!" showClose={false}>
        <div className="text-center">
          {isNewHigh && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm font-bold mb-4 animate-pop">
              <Trophy size={16} /> New High Score!
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <ResultCard label="WPM" value={String(wpm)} />
            <ResultCard label="Accuracy" value={`${accuracy}%`} />
            <ResultCard label="Mistakes" value={String(mistakes)} />
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
            <Trophy size={16} className="text-amber-400" /> Best ({categories[category].label}): {highScore} WPM
          </div>
          <AdBanner variant="modal" className="mb-4" />
          <div className="flex gap-3 justify-center">
            <button
              onClick={startGame}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition"
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

function TypingStat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
      <div className={`flex items-center justify-center gap-1 text-xs font-medium ${accent} mb-1`}>{icon}{label}</div>
      <div className="text-lg font-bold text-slate-800 dark:text-white">{value}</div>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
      <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</div>
    </div>
  );
}
