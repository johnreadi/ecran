import { useState, useEffect, useRef } from 'react';
import { Settings, Save, Check, Upload, X } from 'lucide-react';
import api from '../../api';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    branding_logo_url: '',
    branding_primary_color: '#6366f1',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings({
        branding_logo_url: response.data.branding_logo_url || '',
        branding_primary_color: response.data.branding_primary_color || '#6366f1',
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/admin/settings/branding', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="text-indigo-600" />
          Paramètres généraux
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Logo
          </label>
          
          {/* Prévisualisation du logo */}
          {settings.branding_logo_url && (
            <div className="mb-3 flex items-center gap-3">
              <div className="w-16 h-16 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                <img 
                  src={settings.branding_logo_url} 
                  alt="Logo preview" 
                  className="w-full h-full object-contain"
                />
              </div>
              <button
                onClick={() => setSettings({ ...settings, branding_logo_url: '' })}
                className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg text-sm"
              >
                <X size={14} /> Supprimer
              </button>
            </div>
          )}
          
          {/* Upload depuis PC */}
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              <Upload size={16} /> Charger depuis le PC
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  setSettings({ ...settings, branding_logo_url: ev.target?.result as string });
                };
                reader.readAsDataURL(file);
              }
            }}
          />
          <p className="text-xs text-gray-500 mt-2">
            PNG, SVG, WEBP recommandé. Max 2MB. Taille recommandée : 200×200px.
          </p>
          
          {/* Ou URL */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Ou coller une URL
            </label>
            <input
              type="text"
              value={settings.branding_logo_url}
              onChange={(e) => setSettings({ ...settings, branding_logo_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Couleur principale
          </label>
          <div className="flex gap-3">
            <input
              type="color"
              value={settings.branding_primary_color}
              onChange={(e) => setSettings({ ...settings, branding_primary_color: e.target.value })}
              className="h-10 w-20 rounded border"
            />
            <input
              type="text"
              value={settings.branding_primary_color}
              onChange={(e) => setSettings({ ...settings, branding_primary_color: e.target.value })}
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : saved ? (
              <Check size={18} />
            ) : (
              <Save size={18} />
            )}
            {saved ? 'Sauvegardé !' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}
