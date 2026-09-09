import Modal from './Modal';

interface InfoModalProps {
  type: 'privacy' | 'terms' | 'about' | null;
  onClose: () => void;
}

const content = {
  privacy: {
    title: 'Privacy Policy',
    body: (
      <>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          Kei respects your privacy. When you play as a guest, your scores and settings are stored locally in your
          browser. When you sign in with Google, your nickname, avatar, ELO rating, and match history are stored
          in our Firebase database to enable multiplayer features and global leaderboards.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          We do not sell or share your personal information with third parties. This site displays advertisements
          via Google AdSense, which may use cookies to serve ads based on your prior visits. You can opt out of
          personalized advertising by visiting Google's Ads Settings.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          By using this site, you consent to the use of cookies for advertising and authentication purposes as
          described above.
        </p>
      </>
    ),
  },
  terms: {
    title: 'Terms of Service',
    body: (
      <>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          Kei is a free-to-use cognitive training platform provided "as is" without warranties of any kind. We do
          not guarantee any specific cognitive improvement from using the tools on this site.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          The content and games on Kei are for entertainment and educational purposes only and are not a substitute
          for professional medical or psychological advice.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          You agree not to misuse the site, cheat in multiplayer matches, attempt to circumvent advertising, or use
          automated scripts to interact with the service.
        </p>
      </>
    ),
  },
  about: {
    title: 'About Kei',
    body: (
      <>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          Kei — Cognitive & Speed Lab is a collection of fast, browser-based cognitive tests designed to exercise
          your brain and let you compete in real-time duels. Inspired by classic psychology assessments like the
          Pauli Test and the N-Back paradigm, each game targets a different mental skill:
        </p>
        <ul className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2 mb-4 list-disc list-inside">
          <li><strong>Pauli Test</strong> — chained mental math speed and calculation fluency</li>
          <li><strong>Reflex</strong> — visual reaction time and processing speed</li>
          <li><strong>Memory</strong> — digit span and working memory capacity</li>
          <li><strong>Typing</strong> — typing speed and accuracy with domain vocabulary</li>
          <li><strong>1v1 Duels</strong> — compete head-to-head with an ELO rating system</li>
        </ul>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Sign in with Google to save your rating online and compete globally, or play as a guest with local scores.
        </p>
      </>
    ),
  },
};

export default function InfoModal({ type, onClose }: InfoModalProps) {
  if (!type) return null;
  const c = content[type];
  return (
    <Modal open={!!type} onClose={onClose} title={c.title}>
      <div className="max-h-[60vh] overflow-y-auto no-scrollbar">{c.body}</div>
    </Modal>
  );
}
