import { useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, Swords } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import Modal from './Modal';
import AdBanner from './AdBanner';
import { MatchPlayer } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

interface MatchResultModalProps {
  open: boolean;
  myData: MatchPlayer;
  opponentData: MatchPlayer;
  ratingChange: number;
  newRating: number;
  myProgressData: number[];
  opponentProgressData: number[];
  intervalLabels: string[];
  gameLabel: string;
  onPlayAgain: () => void;
  onBack: () => void;
}

export default function MatchResultModal({
  open,
  myData,
  opponentData,
  ratingChange,
  newRating,
  myProgressData,
  opponentProgressData,
  intervalLabels,
  gameLabel,
  onPlayAgain,
  onBack,
}: MatchResultModalProps) {
  const won = myData.score > opponentData.score;
  const tie = myData.score === opponentData.score;

  const chartData = useMemo(
    () => ({
      labels: intervalLabels.length > 0 ? intervalLabels : ['Start', 'End'],
      datasets: [
        {
          label: myData.nickname,
          data: myProgressData.length > 0 ? myProgressData : [0, myData.score],
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          borderWidth: 2,
        },
        {
          label: opponentData.nickname,
          data: opponentProgressData.length > 0 ? opponentProgressData : [0, opponentData.score],
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          borderWidth: 2,
        },
      ],
    }),
    [myData, opponentData, myProgressData, opponentProgressData, intervalLabels]
  );

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: { color: isDark ? '#cbd5e1' : '#475569', font: { size: 11 }, boxWidth: 12, padding: 10 },
      },
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
    <Modal open={open} onClose={onBack} title="Match Results" showClose={false} maxWidth="max-w-lg">
      <div className="text-center">
        <div
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold mb-5 animate-pop ${
            won
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : tie
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
              : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          {won ? <><Trophy size={16} /> Victory!</> : tie ? <><Swords size={16} /> Draw</> : <><Swords size={16} /> Defeat</>}
        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6">
          <PlayerResult player={myData} isMe highlight={won} />
          <div className="text-2xl font-bold text-slate-300 dark:text-slate-600">VS</div>
          <PlayerResult player={opponentData} highlight={!won && !tie} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
            <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${ratingChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {ratingChange >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              {ratingChange >= 0 ? '+' : ''}{ratingChange}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Rating Change</div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{newRating}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">New Rating</div>
          </div>
        </div>

        {myProgressData.length > 0 && (
          <div className="mb-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-sky-500" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Head-to-Head Performance — {gameLabel}</h4>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4" style={{ height: '200px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        <AdBanner variant="modal" className="mb-4" />
        <div className="flex gap-3 justify-center">
          <button
            onClick={onPlayAgain}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 text-white font-semibold hover:bg-sky-600 transition"
          >
            <Swords size={18} /> Play Again
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PlayerResult({ player, isMe, highlight }: { player: MatchPlayer; isMe?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex flex-col items-center ${isMe ? '' : ''}`}>
      <div className={`text-4xl mb-1 ${highlight ? 'animate-float' : ''}`}>{player.avatar}</div>
      <div className={`text-sm font-semibold truncate max-w-[100px] ${isMe ? 'text-sky-500' : 'text-slate-700 dark:text-slate-200'}`}>
        {player.nickname}
      </div>
      <div className="text-2xl font-bold text-slate-800 dark:text-white">{player.score}</div>
      <div className="text-xs text-slate-400">score</div>
    </div>
  );
}
