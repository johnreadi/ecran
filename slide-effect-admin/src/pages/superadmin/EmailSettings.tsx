import { useState, useEffect } from 'react';
import { Mail, Send, Check, AlertCircle, Server, Lock, User } from 'lucide-react';
import api from '../../api';

interface SmtpSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_from: string;
  smtp_secure: number;
}

export default function EmailSettings() {
  const [settings, setSettings] = useState<SmtpSettings>({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_from: '',
    smtp_secure: 0,
  });
  const [smtpPass, setSmtpPass] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings({
        smtp_host: response.data.smtp_host || '',
        smtp_port: response.data.smtp_port || 587,
        smtp_user: response.data.smtp_user || '',
        smtp_from: response.data.smtp_from || '',
        smtp_secure: response.data.smtp_secure || 0,
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.put('/admin/settings/smtp', {
        ...settings,
        smtp_pass: smtpPass || undefined,
      });
      setMessage({ type: 'success', text: 'Configuration SMTP sauvegardée avec succès' });
      setSmtpPass('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Erreur lors de la sauvegarde' });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      setTestResult({ type: 'error', text: 'Veuillez entrer une adresse email de test' });
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      const response = await api.post('/admin/settings/smtp/test', { testEmail });
      setTestResult({ type: 'success', text: response.data.message });
    } catch (error: any) {
      setTestResult({ type: 'error', text: error.response?.data?.error || error.response?.data?.details || 'Échec de l\'envoi' });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Mail className="text-indigo-600" />
          Configuration Email (SMTP)
        </h1>
        <p className="text-gray-600 mt-1">
          Configurez les paramètres SMTP pour l'envoi des emails (notifications, confirmations, etc.)
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  <Server size={16} />
                  Serveur SMTP (Host)
                </span>
              </label>
              <input
                type="text"
                value={settings.smtp_host}
                onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Port
              </label>
              <input
                type="number"
                value={settings.smtp_port}
                onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                587 (TLS) ou 465 (SSL) ou 25 (non sécurisé)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  <User size={16} />
                  Nom d'utilisateur
                </span>
              </label>
              <input
                type="text"
                value={settings.smtp_user}
                onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                placeholder="votre@email.com"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  <Lock size={16} />
                  Mot de passe
                </span>
              </label>
              <input
                type="password"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                placeholder={settings.smtp_user ? '••••••••' : 'Entrez le mot de passe'}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {settings.smtp_user ? 'Laissez vide pour conserver le mot de passe actuel' : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse d'expédition (From)
              </label>
              <input
                type="email"
                value={settings.smtp_from}
                onChange={(e) => setSettings({ ...settings, smtp_from: e.target.value })}
                placeholder="noreply@votresite.com"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sécurité
              </label>
              <select
                value={settings.smtp_secure}
                onChange={(e) => setSettings({ ...settings, smtp_secure: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value={0}>TLS (STARTTLS) - Port 587</option>
                <option value={1}>SSL - Port 465</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Check size={18} />
              )}
              Sauvegarder la configuration
            </button>
          </div>
        </form>
      </div>

      {/* Test d'envoi */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Send size={20} className="text-indigo-600" />
          Tester l'envoi d'email
        </h2>

        {testResult && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
            testResult.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {testResult.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            {testResult.text}
          </div>
        )}

        <div className="flex gap-4">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="email@exemple.com"
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleTest}
            disabled={testLoading}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {testLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Send size={18} />
            )}
            Envoyer un test
          </button>
        </div>
      </div>

      {/* Informations */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mt-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Configuration recommandée</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Gmail :</strong> smtp.gmail.com, port 587, TLS</li>
          <li>• <strong>Outlook :</strong> smtp.office365.com, port 587, TLS</li>
          <li>• <strong>SendGrid :</strong> smtp.sendgrid.net, port 587, TLS</li>
          <li>• <strong>Mailgun :</strong> smtp.mailgun.org, port 587, TLS</li>
        </ul>
        <p className="text-xs text-blue-600 mt-3">
          Pour Gmail, vous devrez peut-être générer un "mot de passe d'application" dans vos paramètres de sécurité Google.
        </p>
      </div>
    </div>
  );
}
