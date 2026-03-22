import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Moon, Sun, Monitor, Globe, Keyboard, Bell, Shield } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'shortcuts' | 'notifications'>('general');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [language, setLanguage] = useState('fr');
  const [autoSave, setAutoSave] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);

  const tabs = [
    { id: 'general', label: 'Général', icon: <Globe size={16} /> },
    { id: 'appearance', label: 'Apparence', icon: <Monitor size={16} /> },
    { id: 'shortcuts', label: 'Raccourcis', icon: <Keyboard size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  ];

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
        className="bg-[var(--bg-secondary)] rounded-2xl w-full max-w-2xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
              <Shield size={20} className="text-[var(--primary-400)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Paramètres</h2>
              <p className="text-sm text-[var(--text-tertiary)]">
                Personnalisez votre expérience
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={20} />
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-56 border-r border-[var(--border-subtle)] p-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[var(--primary-500)]/10 text-[var(--primary-400)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                    Langue
                  </h3>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg text-sm"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                    Sauvegarde
                  </h3>
                  <label className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-subtle)] cursor-pointer">
                    <div>
                      <p className="font-medium">Sauvegarde automatique</p>
                      <p className="text-sm text-[var(--text-tertiary)]">
                        Sauvegarder automatiquement les modifications
                      </p>
                    </div>
                    <div className={`w-11 h-6 rounded-full transition-colors relative ${autoSave ? 'bg-[var(--primary-500)]' : 'bg-[var(--bg-elevated)]'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${autoSave ? 'left-6' : 'left-1'}`} />
                    </div>
                    <input
                      type="checkbox"
                      checked={autoSave}
                      onChange={(e) => setAutoSave(e.target.checked)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                    Thème
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setTheme('dark')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        theme === 'dark'
                          ? 'border-[var(--primary-500)] bg-[var(--primary-500)]/10'
                          : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                      }`}
                    >
                      <Moon size={24} className="mx-auto mb-2" />
                      <span className="text-sm font-medium">Sombre</span>
                    </button>
                    <button
                      onClick={() => setTheme('light')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        theme === 'light'
                          ? 'border-[var(--primary-500)] bg-[var(--primary-500)]/10'
                          : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                      }`}
                    >
                      <Sun size={24} className="mx-auto mb-2" />
                      <span className="text-sm font-medium">Clair</span>
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        theme === 'system'
                          ? 'border-[var(--primary-500)] bg-[var(--primary-500)]/10'
                          : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                      }`}
                    >
                      <Monitor size={24} className="mx-auto mb-2" />
                      <span className="text-sm font-medium">Système</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                  Raccourcis clavier
                </h3>
                <div className="space-y-2">
                  {[
                    { key: '→ ou Espace', action: 'Slide suivant' },
                    { key: '←', action: 'Slide précédent' },
                    { key: 'Échap', action: 'Quitter le mode présentation' },
                    { key: 'F5', action: 'Démarrer la présentation' },
                    { key: 'Ctrl + N', action: 'Nouveau slide' },
                  ].map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg"
                    >
                      <span className="text-sm text-[var(--text-secondary)]">{shortcut.action}</span>
                      <kbd className="px-2 py-1 bg-[var(--bg-elevated)] rounded text-xs font-mono">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <label className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-subtle)] cursor-pointer">
                  <div>
                    <p className="font-medium">Notifications</p>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      Recevoir des notifications sur les activités
                    </p>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors relative ${showNotifications ? 'bg-[var(--primary-500)]' : 'bg-[var(--bg-elevated)]'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${showNotifications ? 'left-6' : 'left-1'}`} />
                  </div>
                  <input
                    type="checkbox"
                    checked={showNotifications}
                    onChange={(e) => setShowNotifications(e.target.checked)}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
