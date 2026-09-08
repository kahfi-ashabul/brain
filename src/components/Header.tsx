import { Brain, Sun, Moon, Menu, X, Swords } from 'lucide-react';
import { useState } from 'react';
import { UserProfile, getAvatarEmoji, getRankName } from '@/hooks/useProfile';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigate: (id: string) => void;
  onOpenInfo: (type: 'privacy' | 'terms' | 'about') => void;
  profile: UserProfile | null;
  onSignOut: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'multiplayer', label: 'Arena' },
  { id: 'pauli', label: 'Arithmetic' },
  { id: 'reflex', label: 'Reflex' },
  { id: 'memory', label: 'Memory' },
  { id: 'typing', label: 'Typing' },
];

export default function Header({ theme, onToggleTheme, onNavigate, onOpenInfo, profile, onSignOut }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const rank = profile ? getRankName(profile.rating) : null;

  const handleNav = (id: string) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 glass">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => handleNav('dashboard')} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:scale-110 transition-transform">
              <Brain size={20} className="text-white" />
            </div>
            <div className="text-left">
              <span className="block font-bold text-slate-800 dark:text-white leading-tight text-sm sm:text-base">BrainFlex</span>
              <span className="block text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 leading-tight">Speed & Brain Trainer</span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  item.id === 'multiplayer'
                    ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.id === 'multiplayer' && <Swords size={14} />}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {profile && (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <span className="text-xl">{getAvatarEmoji(profile.avatar)}</span>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-slate-800 dark:text-white leading-tight max-w-[80px] truncate">{profile.nickname}</div>
                    <div className={`text-[10px] font-medium ${rank?.color} leading-tight`}>{profile.rating} RP · {rank?.name}</div>
                  </div>
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-20 animate-pop overflow-hidden">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{getAvatarEmoji(profile.avatar)}</span>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-white text-sm">{profile.nickname}</div>
                            <div className={`text-xs ${rank?.color}`}>{rank?.name} · {profile.rating} RP</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-sm font-bold text-emerald-500">{profile.wins}</div>
                            <div className="text-[10px] text-slate-400">Wins</div>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-rose-500">{profile.losses}</div>
                            <div className="text-[10px] text-slate-400">Losses</div>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-500">{profile.draws}</div>
                            <div className="text-[10px] text-slate-400">Draws</div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => { onSignOut(); setProfileOpen(false); }}
                        className="w-full px-4 py-3 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-1 animate-slide-up">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`px-4 py-2.5 rounded-lg text-left text-sm font-medium transition flex items-center gap-2 ${
                  item.id === 'multiplayer'
                    ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.id === 'multiplayer' && <Swords size={16} />}
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
