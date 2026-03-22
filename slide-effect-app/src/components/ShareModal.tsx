import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link, Copy, Check, Mail, Twitter, Facebook, Linkedin } from 'lucide-react';
import type { Presentation } from '../types';

interface ShareModalProps {
  presentation: Presentation;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ presentation, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'embed' | 'social'>('link');
  
  const shareUrl = `${window.location.origin}/present/${presentation.id}`;
  const embedCode = `<iframe src="${shareUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Présentation: ${presentation.name}`);
    const body = encodeURIComponent(`Bonjour,\n\nJe vous partage ma présentation "${presentation.name}".\n\n${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`Découvrez ma présentation "${presentation.name}" !`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`);
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
  };

  const shareViaLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-[var(--bg-secondary)] rounded-2xl w-full max-w-lg border border-[var(--border-subtle)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-lg font-semibold">Partager la présentation</h2>
            <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
              {presentation.name}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-subtle)] px-5">
          {(['link', 'embed', 'social'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? 'text-[var(--primary-400)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {tab === 'link' && 'Lien'}
              {tab === 'embed' && 'Intégrer'}
              {tab === 'social' && 'Réseaux'}
              {activeTab === tab && (
                <motion.div
                  layoutId="shareTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-500)]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            {activeTab === 'link' && (
              <motion.div
                key="link"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                    Lien de partage
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-subtle)]">
                      <Link size={16} className="text-[var(--text-tertiary)]" />
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)]"
                      />
                    </div>
                    <button
                      onClick={() => handleCopy(shareUrl)}
                      className="btn btn-primary px-4"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-subtle)]">
                  <p className="text-sm text-[var(--text-secondary)]">
                    <strong className="text-[var(--text-primary)]">Accès public</strong>
                    <br />
                    Toute personne disposant du lien peut voir cette présentation.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'embed' && (
              <motion.div
                key="embed"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                    Code d'intégration
                  </label>
                  <div className="relative">
                    <textarea
                      value={embedCode}
                      readOnly
                      rows={4}
                      className="w-full px-4 py-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-subtle)] text-sm font-mono text-[var(--text-secondary)] resize-none"
                    />
                    <button
                      onClick={() => handleCopy(embedCode)}
                      className="absolute top-2 right-2 btn btn-secondary btn-icon"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-tertiary)]">
                  Copiez ce code et collez-le dans votre site web ou blog.
                </p>
              </motion.div>
            )}

            {activeTab === 'social' && (
              <motion.div
                key="social"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Partager sur les réseaux sociaux
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={shareViaEmail}
                    className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[var(--neutral-600)] flex items-center justify-center">
                      <Mail size={20} className="text-white" />
                    </div>
                    <span className="font-medium">Email</span>
                  </button>
                  <button
                    onClick={shareViaTwitter}
                    className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#1DA1F2] flex items-center justify-center">
                      <Twitter size={20} className="text-white" />
                    </div>
                    <span className="font-medium">Twitter</span>
                  </button>
                  <button
                    onClick={shareViaFacebook}
                    className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#4267B2] flex items-center justify-center">
                      <Facebook size={20} className="text-white" />
                    </div>
                    <span className="font-medium">Facebook</span>
                  </button>
                  <button
                    onClick={shareViaLinkedIn}
                    className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#0077b5] flex items-center justify-center">
                      <Linkedin size={20} className="text-white" />
                    </div>
                    <span className="font-medium">LinkedIn</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};
