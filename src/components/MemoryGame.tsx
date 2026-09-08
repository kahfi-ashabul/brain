import { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Trophy, RotateCcw, Play, Eye, EyeOff } from 'lucide-react';
import Modal from './Modal';
import AdBanner from './AdBanner';

interface MemoryGameProps {
  onScore: (level: number) => void;
  getHighScore: () => number;
  saveHighScore: (score: number) => boolean;
}

type Phase = 'idle' | 'showing' | 'input' | 'over';

function generateNumber(digits: number): string {
  let num = '';
  for (let i = 0; i < digits; i++) {
    num += Math.floor(Math.random() * 10).toString();
  }
  return num;
}

export default function MemoryGame({ onScore, getHighScore, saveHighScore }: MemoryGameProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [level, setLevel] = useState(1);
  const [digits, setDigits] = useState(3);
  const [number, setNumber] = useState('');
  const [input, setInput] = useState('');
  const [showNumber, setShowNumber] = useState(true);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startGame = useCallback(() => {
    const startDigits = 3;
    setLevel(1);
    setDigits(startDigits);
    const num = generateNumber(startDigits);
    setNumber(num);
    setInput('');
    setShowNumber(true);
    setPhase('showing');
    timerRef.current = setTimeout(() => {
      setShowNumber(false);
      setPhase('input');
      setTimeout(() => inputRef.current?.focus(), 100);
    }, 2000);
  }, []);

  const handleSubmit = useCallback(() => {
    if (phase !== 'input' || input.trim() === '') return;
    const correct = input === number;
    setWasCorrect(correct);
    if (correct) {
      const nextLevel = level + 1;
      const nextDigits = digits + 1;
      setLevel(nextLevel);
      setDigits(nextDigits);
      const num = generateNumber(nextDigits);
      setNumber(num);
      setInput('');
      setShowNumber(true);
      setPhase('showing');
      timerRef.current = setTimeout(() => {
        setShowNumber(false);
        setPhase('input');
        setTimeout(() => inputRef.current?.focus(), 100);
      }, 2000);
    } else {
      onScore(level);
      const isNew = saveHighScore(level);
      setIsNewHigh(isNew);
      setPhase('over');
    }
  }, [phase, input, number, level, digits, onScore, saveHighScore]);

  const highScore = getHighScore();

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center">
          <Brain size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-800 dark:text-white">Number Memory Test</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Digit span memory training</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Level</span>
          <span className="text-lg font-bold text-slate-800 dark:text-white">{level}</span>
        </div>
        <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 block">Digits</span>
          <span className="text-lg font-bold text-slate-800 dark:text-white">{digits}</span>
        </div>
        {highScore > 0 && (
          <div className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20">
            <span className="text-xs text-amber-600 dark:text-amber-400 block">Best</span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">L{highScore}</span>
          </div>
        )}
      </div>

      {phase === 'idle' && (
        <div className="text-center py-12 animate-fade-in">
          <p className="text-slate-600 dark:text-slate-300 mb-2 max-w-sm mx-auto">
            A number will appear for <strong>2 seconds</strong>. Memorize it, then type it back.
          </p>
          <p className="text-sm text-slate-400 mb-8">Each correct answer adds a digit. How far can you go?</p>
          <button
            onClick={startGame}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-400 text-white font-bold shadow-lg shadow-violet-500/30 hover:scale-105 transition"
          >
            <Play size={18} /> Start
          </button>
        </div>
      )}

      {(phase === 'showing' || phase === 'input') && (
        <div className="text-center py-12 animate-fade-in">
          {phase === 'showing' ? (
            <>
              <div className="inline-flex items-center gap-2 text-sm text-sky-500 font-medium mb-6">
                <Eye size={18} /> Memorize!
              </div>
              <div className={`text-5xl sm:text-6xl font-bold tracking-[0.1em] text-slate-800 dark:text-white transition-all ${showNumber ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                {number}
              </div>
              <div className="mt-6 w-full max-w-xs mx-auto h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ animation: 'shrink 2s linear forwards' }} />
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 text-sm text-slate-400 font-medium mb-6">
                <EyeOff size={18} /> Type what you saw
              </div>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                autoFocus
                className="w-64 text-center text-4xl font-bold tracking-[0.1em] rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white px-4 py-4 focus:outline-none focus:border-violet-500 transition"
                placeholder="?"
                style={{ letterSpacing: '0.15em' }}
              />
              <div className="mt-6">
                <button
                  onClick={handleSubmit}
                  className="px-8 py-3 rounded-xl bg-violet-500 text-white font-bold hover:bg-violet-600 transition"
                >
                  Submit
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <Modal open={phase === 'over'} onClose={() => setPhase('idle')} title="Game Over" showClose={false}>
        <div className="text-center">
          {wasCorrect ? null : (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">The number was:</p>
          )}
          <div className="text-3xl font-bold text-slate-400 dark:text-slate-500 tracking-[0.1em] mb-6 line-through">
            {number}
          </div>
          {isNewHigh && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm font-bold mb-4 animate-pop">
              <Trophy size={16} /> New Personal Best!
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
              <div className="text-3xl font-bold text-slate-800 dark:text-white">L{level}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Max Level Reached</div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
              <div className="text-3xl font-bold text-slate-800 dark:text-white">{digits}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Max Digits</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
            <Trophy size={16} className="text-amber-400" /> Best: Level {highScore}
          </div>
          <AdBanner variant="modal" className="mb-4" />
          <div className="flex gap-3 justify-center">
            <button
              onClick={startGame}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600 transition"
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

      <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
    </div>
  );
}
