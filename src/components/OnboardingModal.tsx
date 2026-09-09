import { useState } from 'react';
import { LogIn, User, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { AVATARS } from '@/lib/types';
import Modal from './Modal';

export default function OnboardingModal() {
  const { user, loading, signInWithGoogle, signInAsGuest } = useAuth();
  const [mode, setMode] = useState<'choose' | 'guest'>('choose');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950">
        <Loader2 size={32} className="animate-spin text-sky-500" />
      </div>
    );
  }

  if (user) return null;

  const handleGuest = async () => {
    if (nickname.trim().length < 2) return;
    setBusy(true);
    await signInAsGuest(nickname.trim(), selectedAvatar);
    setBusy(false);
  };

  const handleGoogle = async () => {
    setBusy(true);
    await signInWithGoogle();
    setBusy(false);
  };

  return (
    <Modal open={true} onClose={() => {}} showClose={false} maxWidth="max-w-md">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/30">
          <Sparkles size={28} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Welcome to Kei</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Cognitive & Speed Lab — train your brain and compete in real-time duels
        </p>

        {mode === 'choose' && (
          <div className="space-y-3 animate-fade-in">
            <button
              onClick={handleGoogle}
              disabled={busy}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
            >
              <GoogleIcon /> Sign in with Google
            </button>
            <button
              onClick={() => setMode('guest')}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-bold shadow-lg shadow-sky-500/30 hover:scale-[1.02] transition disabled:opacity-50"
            >
              <User size={18} /> Play as Guest
            </button>
            <p className="text-xs text-slate-400 mt-3">
              Guest scores are saved locally. Sign in with Google to save your ELO rating online and compete globally.
            </p>
          </div>
        )}

        {mode === 'guest' && (
          <div className="space-y-4 animate-fade-in text-left">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 16))}
                placeholder="Enter your name..."
                maxLength={16}
                className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white px-4 py-3 focus:outline-none focus:border-sky-500 transition"
                onKeyDown={(e) => e.key === 'Enter' && handleGuest()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Choose Avatar</label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition ${
                      selectedAvatar === avatar
                        ? 'bg-sky-100 dark:bg-sky-900/40 ring-2 ring-sky-500 scale-110'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setMode('choose')}
                className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Back
              </button>
              <button
                onClick={handleGuest}
                disabled={busy || nickname.trim().length < 2}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-bold shadow-lg shadow-sky-500/30 hover:scale-[1.02] transition disabled:opacity-50"
              >
                {busy ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                Start Playing
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
