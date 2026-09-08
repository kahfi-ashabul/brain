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
          BrainFlex respects your privacy. We do not collect personal information. All your scores, settings, and
          statistics are stored locally in your browser using localStorage. No data is sent to any server.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          This site displays advertisements via Google AdSense. AdSense may use cookies to serve ads based on your
          prior visits to this website or other websites. You can opt out of personalized advertising by visiting
          Google's Ads Settings.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          By using this site, you consent to the use of cookies for advertising purposes as described above.
        </p>
      </>
    ),
  },
  terms: {
    title: 'Terms of Service',
    body: (
      <>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          BrainFlex is a free-to-use cognitive training platform provided "as is" without warranties of any kind.
          We do not guarantee any specific cognitive improvement from using the tools on this site.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          The content and games on BrainFlex are for entertainment and educational purposes only and are not a
          substitute for professional medical or psychological advice.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          You agree not to misuse the site, attempt to circumvent advertising, or use automated scripts to interact
          with the service.
        </p>
      </>
    ),
  },
  about: {
    title: 'About BrainFlex',
    body: (
      <>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          BrainFlex is a collection of fast, browser-based cognitive tests designed to exercise your brain. Inspired
          by classic psychology assessments like the Pauli Test and the N-Back paradigm, each game targets a
          different mental skill:
        </p>
        <ul className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2 mb-4 list-disc list-inside">
          <li><strong>Arithmetic</strong> — mental math speed and calculation fluency</li>
          <li><strong>Reflex</strong> — visual reaction time and processing speed</li>
          <li><strong>Memory</strong> — digit span and working memory capacity</li>
          <li><strong>Typing</strong> — typing speed and accuracy with domain vocabulary</li>
        </ul>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          All games run entirely in your browser. No sign-up required. Your progress stays on your device.
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
