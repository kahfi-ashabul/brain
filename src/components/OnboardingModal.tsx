import { useState } from 'react';
import { Brain, User, LogIn, ArrowRight } from 'lucide-react';
import Modal from './Modal';
import { avatars } from '@/hooks/useProfile';

interface OnboardingModalProps {
  open: boolean;
  onComplete: (nickname: string, avatar: string, isGoogle: boolean) => void;
}

export default function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('fox');
  const [mode, setMode] = useState<'choose' | 'guest' | 'google'>('choose');

  const handleSubmit = (isGoogle: boolean) => {
    if (nickname.trim().length === 0) return;
    onComplete(nickname, avatar, isGoogle);
  };

  const reset = () => {
    setNickname('');
    setAvatar('fox');
    setMode('choose');
  };

  return (
    <Modal
      open={open}
      onClose={reset}
      showClose={false}
      maxWidth="max-w-md"
    >
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/30 mx-auto mb-4">
          <Brain size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Welcome to BrainFlex</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Create your profile to start training</p>

        {mode === 'choose' && (
          <div className="space-y-3 animate-fade-in">
            <button
              onClick={() => setMode('guest')}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <User size={20} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-800 dark:text-white text-sm">Play as Guest</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Quick setup, no account needed</div>
              </div>
              <ArrowRight size={18} className="text-slate-400 group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={() => setMode('google')}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <LogIn size={20} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-800 dark:text-white text-sm">Sign in with Google</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Sync your rating across devices</div>
              </div>
              <ArrowRight size={18} className="text-slate-400 group-hover:translate-x-1 transition" />
            </button>
          </div>
        )}

        {(mode === 'guest' || mode === 'google') && (
          <div className="text-left animate-fade-in">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              {mode === 'google' ? 'Choose your display name' : 'Enter your nickname'}
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 16))}
              onKeyDown={(e) => { if (e.key === 'Enter' && nickname.trim()) handleSubmit(mode === 'google'); }}
              placeholder="e.g. SpeedMaster"
              autoFocus
              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white px-4 py-3 text-sm focus:outline-none focus:border-sky-500 transition mb-5"
            />

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Choose your avatar</label>
            <div className="grid grid-cols-6 gap-2 mb-6">
              {avatars.map((av) => (
                <button
                  key={av.id}
                  onClick={() => setAvatar(av.id)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition ${
                    avatar === av.id
                      ? 'bg-sky-500/15 ring-2 ring-sky-500 scale-110'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title={av.label}
                >
                  {av.emoji}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMode('choose')}
                className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-sm transition"
              >
                Back
              </button>
              <button
                onClick={() => handleSubmit(mode === 'google')}
                disabled={!nickname.trim()}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-bold text-sm shadow-lg shadow-sky-500/30 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] transition"
              >
                {mode === 'google' ? 'Sign In & Play' : 'Start Playing'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
