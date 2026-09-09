import { Brain, Heart } from 'lucide-react';

interface FooterProps {
  onOpenInfo: (type: 'privacy' | 'terms' | 'about') => void;
}

export default function Footer({ onOpenInfo }: FooterProps) {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center">
                <Brain size={16} className="text-white" />
              </div>
              <span className="font-bold text-slate-800 dark:text-white">Kei</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Sharpen your mind with science-inspired cognitive tests. Train your reaction time, mental math speed,
              working memory, and typing accuracy — and compete in real-time duels against players worldwide.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => onOpenInfo('about')} className="text-slate-500 dark:text-slate-400 hover:text-sky-500 transition">About Kei</button></li>
              <li><button onClick={() => onOpenInfo('privacy')} className="text-slate-500 dark:text-slate-400 hover:text-sky-500 transition">Privacy Policy</button></li>
              <li><button onClick={() => onOpenInfo('terms')} className="text-slate-500 dark:text-slate-400 hover:text-sky-500 transition">Terms of Service</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 text-sm">Why Brain Training?</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Studies suggest that regular cognitive exercises — like speed arithmetic, reaction tests, and memory drills —
              can improve focus, processing speed, and working memory over time. Kei brings these exercises together
              in a clean, fast platform with competitive multiplayer duels.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} Kei — Cognitive & Speed Lab. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            Built with <Heart size={12} className="text-rose-400 fill-rose-400" /> for sharp minds
          </p>
        </div>
      </div>
    </footer>
  );
}
