interface AdBannerProps {
  variant?: 'leaderboard' | 'sidebar' | 'modal';
  className?: string;
}

export default function AdBanner({ variant = 'leaderboard', className = '' }: AdBannerProps) {
  const sizes: Record<string, string> = {
    leaderboard: 'h-[90px] sm:h-[90px] w-full max-w-[728px]',
    sidebar: 'h-[250px] w-full max-w-[300px]',
    modal: 'h-[90px] w-full max-w-[480px]',
  };

  return (
    <div
      className={`${sizes[variant]} ${className} mx-auto flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300/60 dark:border-slate-600/50 bg-slate-100/50 dark:bg-slate-800/30`}
      data-ad-slot="placeholder"
    >
      <span className="text-xs font-medium tracking-wider uppercase text-slate-400 dark:text-slate-500 select-none">
        Advertisement
      </span>
    </div>
  );
}
