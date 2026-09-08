import { ReactNode } from 'react';
import { ArrowRight, Trophy } from 'lucide-react';

interface GameCardProps {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  accent: string;
  highScore?: string;
  onClick: () => void;
}

export default function GameCard({ id, title, description, icon, accent, highScore, onClick }: GameCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up"
    >
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 group-hover:opacity-20 transition-opacity ${accent}`} />
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${accent} text-white shadow-lg`}>
        {icon}
      </div>
      <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{description}</p>
      {highScore && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 mb-3">
          <Trophy size={14} />
          Best: {highScore}
        </div>
      )}
      <div className="flex items-center gap-1.5 text-sm font-semibold text-sky-500 group-hover:gap-2.5 transition-all">
        Play Now <ArrowRight size={16} />
      </div>
    </button>
  );
}
