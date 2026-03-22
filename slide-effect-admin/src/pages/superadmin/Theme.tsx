import { useState } from 'react'
import { Palette, Save, RotateCcw } from 'lucide-react'

const defaultTheme = {
  primaryColor: '#f97316',
  secondaryColor: '#1f2937',
  accentColor: '#6366f1',
  bgColor: '#f9fafb',
  sidebarBg: '#ffffff',
  fontFamily: 'system-ui',
  borderRadius: '12',
  fontSize: '14',
}

export default function Theme() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('admin_theme')
    return stored ? JSON.parse(stored) : defaultTheme
  })
  const [saved, setSaved] = useState(false)

  function save() {
    localStorage.setItem('admin_theme', JSON.stringify(theme))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function reset() {
    setTheme(defaultTheme)
    localStorage.removeItem('admin_theme')
  }

  const ColorPicker = ({ label, key }: { label: string; key: keyof typeof theme }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <div className="text-sm font-medium text-gray-700">{label}</div>
        <div className="text-xs text-gray-400">{theme[key]}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm" style={{ background: theme[key] }} />
        <input type="color" value={theme[key]}
          onChange={e => setTheme({ ...theme, [key]: e.target.value })}
          className="w-10 h-8 rounded cursor-pointer border-0 p-0 bg-transparent" />
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Palette size={20} className="text-purple-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Thème & Couleurs</h2>
            <p className="text-xs text-gray-400">Personnalisez l'apparence de votre dashboard</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <RotateCcw size={14} /> Réinitialiser
          </button>
          <button onClick={save} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${saved ? 'bg-green-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
            <Save size={14} /> {saved ? 'Sauvegardé !' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Aperçu</h3>
        <div className="flex gap-3 items-center p-4 rounded-xl" style={{ background: theme.bgColor, fontFamily: theme.fontFamily }}>
          <div className="w-32 rounded-lg p-3" style={{ background: theme.sidebarBg, border: '1px solid #e5e7eb' }}>
            <div className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center text-white text-xs font-bold" style={{ background: theme.primaryColor }}>SE</div>
            {['Dashboard', 'Médias', 'Écrans'].map(i => (
              <div key={i} className="text-xs py-1.5 px-2 rounded mb-1" style={{ color: theme.secondaryColor }}>{i}</div>
            ))}
          </div>
          <div className="flex-1">
            <div className="h-6 w-32 rounded-md mb-3" style={{ background: theme.primaryColor }} />
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-12 rounded-lg" style={{ background: theme.sidebarBg, border: '1px solid #e5e7eb' }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Couleurs */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Palette de couleurs</h3>
        <ColorPicker label="Couleur principale" key="primaryColor" />
        <ColorPicker label="Couleur secondaire" key="secondaryColor" />
        <ColorPicker label="Couleur accent" key="accentColor" />
        <ColorPicker label="Arrière-plan" key="bgColor" />
        <ColorPicker label="Fond sidebar" key="sidebarBg" />
      </div>

      {/* Typographie */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Typographie</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Police de caractères</label>
            <select value={theme.fontFamily} onChange={e => setTheme({ ...theme, fontFamily: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="system-ui">System UI (défaut)</option>
              <option value="'Inter', sans-serif">Inter</option>
              <option value="'Roboto', sans-serif">Roboto</option>
              <option value="'Poppins', sans-serif">Poppins</option>
              <option value="'Open Sans', sans-serif">Open Sans</option>
              <option value="Georgia, serif">Georgia</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Taille de police : {theme.fontSize}px</label>
            <input type="range" min="12" max="18" value={theme.fontSize}
              onChange={e => setTheme({ ...theme, fontSize: e.target.value })}
              className="w-full accent-purple-600" />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Rayon de bordure : {theme.borderRadius}px</label>
            <input type="range" min="0" max="24" value={theme.borderRadius}
              onChange={e => setTheme({ ...theme, borderRadius: e.target.value })}
              className="w-full accent-purple-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
