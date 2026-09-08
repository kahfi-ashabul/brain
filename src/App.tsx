import { useState, useCallback } from 'react';
import { Plus, Zap, Brain, Keyboard, BarChart3, Activity, Target, Clock } from 'lucide-react';
import { useTheme, useHighScores, useStats } from '@/hooks/useApp';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GameCard from '@/components/GameCard';
import AdBanner from '@/components/AdBanner';
import InfoModal from '@/components/InfoModal';
import PauliGame from '@/components/PauliGame';
import ReflexGame from '@/components/ReflexGame';
import MemoryGame from '@/components/MemoryGame';
import TypingGame from '@/components/TypingGame';

type View = 'dashboard' | 'pauli' | 'reflex' | 'memory' | 'typing';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { getScore, saveScore } = useHighScores();
  const { getStats, saveStats } = useStats();
  const [view, setView] = useState<View>('dashboard');
  const [infoModal, setInfoModal] = useState<'privacy' | 'terms' | 'about' | null>(null);
  const [stats, setStats] = useState(getStats());

  const navigate = useCallback((id: string) => {
    setView(id as View);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openInfo = useCallback((type: 'privacy' | 'terms' | 'about') => setInfoModal(type), []);
  const closeInfo = useCallback(() => setInfoModal(null), []);

  const updateStats = useCallback((updates: Record<string, number>) => {
    const next = saveStats(updates);
    setStats(next);
  }, [saveStats]);

  const games = [
    {
      id: 'pauli',
      title: 'Pauli Test',
      description: 'Chained speed addition with work curve graph. Add numbers, enter the last digit. Instant auto-submit.',
      icon: <Plus size={22} />,
      accent: 'bg-gradient-to-br from-sky-500 to-cyan-400',
      highScore: getScore('pauli') > 0 ? `${getScore('pauli')} solved` : undefined,
    },
    {
      id: 'reflex',
      title: 'Reflex & Reaction',
      description: 'Test your reaction time in milliseconds. 5 rounds averaged. How fast are you?',
      icon: <Zap size={22} />,
      accent: 'bg-gradient-to-br from-emerald-500 to-teal-400',
      highScore: getScore('reflex') > 0 ? `${getScore('reflex')}ms` : undefined,
    },
    {
      id: 'memory',
      title: 'Number Memory',
      description: 'Digit span memory training. Memorize numbers that grow longer each level.',
      icon: <Brain size={22} />,
      accent: 'bg-gradient-to-br from-violet-500 to-purple-400',
      highScore: getScore('memory') > 0 ? `Level ${getScore('memory')}` : undefined,
    },
    {
      id: 'typing',
      title: 'Typing Speed',
      description: 'WPM test with niche vocabularies: medical, programming, legal, and tech terms.',
      icon: <Keyboard size={22} />,
      accent: 'bg-gradient-to-br from-amber-500 to-orange-400',
      highScore: getScore('typing', 'medical') > 0 ? `${getScore('typing', 'medical')} WPM` : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Header theme={theme} onToggleTheme={toggleTheme} onNavigate={navigate} onOpenInfo={openInfo} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {view === 'dashboard' && (
          <div className="animate-fade-in">
            {/* Hero */}
            <section className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 text-xs font-semibold mb-4">
                <Activity size={14} /> Train Your Brain
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold text-slate-800 dark:text-white mb-4 text-balance">
                Speed & Cognitive Tests
              </h1>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-balance">
                Four science-inspired brain games. Test your mental math, reaction time, memory, and typing speed —
                all in one place. No sign-up required.
              </p>
            </section>

            {/* Leaderboard Ad */}
            <div className="mb-10">
              <AdBanner variant="leaderboard" />
            </div>

            {/* Stats Bar */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
              <StatChip icon={<BarChart3 size={18} />} label="Games Played" value={String(stats.gamesPlayed || 0)} />
              <StatChip icon={<Zap size={18} />} label="Best Reaction" value={stats.bestReaction ? `${stats.bestReaction}ms` : '—'} />
              <StatChip icon={<Brain size={18} />} label="Best Memory" value={stats.bestMemory ? `L${stats.bestMemory}` : '—'} />
              <StatChip icon={<Target size={18} />} label="Total Solved" value={String(stats.totalScore || 0)} />
            </section>

            {/* Game Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
              {games.map((game, i) => (
                <div key={game.id} style={{ animationDelay: `${i * 80}ms` }}>
                  <GameCard
                    id={game.id}
                    title={game.title}
                    description={game.description}
                    icon={game.icon}
                    accent={game.accent}
                    highScore={game.highScore}
                    onClick={() => navigate(game.id)}
                  />
                </div>
              ))}
            </section>

            {/* Sidebar Ad + SEO section */}
            <section className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">Why Brain Training Matters</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  Cognitive training exercises — like mental math, reaction time tests, and memory drills — engage
                  different parts of your brain. The <strong>Pauli Arithmetic Test</strong> builds calculation fluency
                  and numerical processing speed. <strong>Reaction time tests</strong> measure how quickly your brain
                  processes visual stimuli and triggers a motor response, a key indicator of neural efficiency.
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  <strong>Digit span memory tests</strong> exercise your working memory — the mental workspace you use
                  to hold and manipulate information. Research suggests that regular working memory practice can
                  improve focus and attention control. <strong>Typing speed tests</strong> with specialized vocabulary
                  build muscle memory and domain-specific fluency, whether you're a medical professional, programmer,
                  or legal worker.
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  BrainFlex brings all these tests together in a fast, clean, free platform. Play daily to track your
                  progress and keep your mind sharp. Your scores are saved locally on your device — no account needed.
                </p>
              </div>
              <div className="space-y-4">
                <AdBanner variant="sidebar" />
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={18} className="text-sky-500" />
                    <h3 className="font-semibold text-sm text-slate-800 dark:text-white">Quick Tips</h3>
                  </div>
                  <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                    <li>• Play each game daily for best results</li>
                    <li>• Try different typing categories to broaden vocabulary</li>
                    <li>• Aim for consistent reaction times, not just your fastest</li>
                    <li>• Try the 10-minute Pauli test to map your fatigue curve</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}

        {view !== 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 animate-fade-in">
            <div>
              {view === 'pauli' && (
                <PauliGame
                  onScore={(s) => updateStats({ gamesPlayed: 1, totalScore: s })}
                  getHighScore={() => getScore('pauli')}
                  saveHighScore={(s) => saveScore('pauli', s)}
                />
              )}
              {view === 'reflex' && (
                <ReflexGame
                  onScore={(avg) => updateStats({ gamesPlayed: 1, bestReaction: avg })}
                  getHighScore={() => getScore('reflex')}
                  saveHighScore={(s) => saveScore('reflex', s)}
                />
              )}
              {view === 'memory' && (
                <MemoryGame
                  onScore={(lvl) => updateStats({ gamesPlayed: 1, bestMemory: lvl })}
                  getHighScore={() => getScore('memory')}
                  saveHighScore={(s) => saveScore('memory', s)}
                />
              )}
              {view === 'typing' && (
                <TypingGame
                  onScore={() => updateStats({ gamesPlayed: 1 })}
                  getHighScore={(cat) => getScore('typing', cat)}
                  saveHighScore={(wpm, cat) => saveScore('typing', wpm, cat)}
                />
              )}
            </div>
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <AdBanner variant="sidebar" />
                <button
                  onClick={() => navigate('dashboard')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  ← Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile back button */}
      {view !== 'dashboard' && (
        <div className="px-4 pb-6 lg:hidden">
          <button
            onClick={() => navigate('dashboard')}
            className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      )}

      <Footer onOpenInfo={openInfo} />
      <InfoModal type={infoModal} onClose={closeInfo} />
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-500 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold text-slate-800 dark:text-white leading-tight truncate">{value}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{label}</div>
      </div>
    </div>
  );
}
