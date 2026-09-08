import { Brain, Sun, Moon, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigate: (id: string) => void;
  onOpenInfo: (type: 'privacy' | 'terms' | 'about') => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'pauli', label: 'Arithmetic' },
  { id: 'reflex', label: 'Reflex' },
  { id: 'memory', label: 'Memory' },
  { id: 'typing', label: 'Typing' },
];

export default function Header({ theme, onToggleTheme, onNavigate, onOpenInfo }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
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
                className="px-4 py-2.5 rounded-lg text-left text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
