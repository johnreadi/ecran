import { useState, useRef } from 'react'
import { ImageIcon, Upload, Trash2, Save, RefreshCw } from 'lucide-react'

export default function Branding() {
  const [logo, setLogo] = useState<string>(localStorage.getItem('admin_logo') || '')
  const [favicon, setFavicon] = useState<string>(localStorage.getItem('admin_favicon') || '')
  const [siteName, setSiteName] = useState(localStorage.getItem('admin_sitename') || 'Slide Effect')
  const [tagline, setTagline] = useState(localStorage.getItem('admin_tagline') || 'Digital Signage Platform')
  const [saved, setSaved] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const faviconRef = useRef<HTMLInputElement>(null)

  function handleImageUpload(file: File, setter: (v: string) => void) {
    const reader = new FileReader()
    reader.onload = (e) => setter(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function save() {
    localStorage.setItem('admin_logo', logo)
    localStorage.setItem('admin_favicon', favicon)
    localStorage.setItem('admin_sitename', siteName)
    localStorage.setItem('admin_tagline', tagline)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <ImageIcon size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Logo & Identité visuelle</h2>
            <p className="text-xs text-gray-400">Personnalisez le logo, favicon et nom de la plateforme</p>
          </div>
        </div>
        <button onClick={save} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
          ${saved ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
          <Save size={14} /> {saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>

      {/* Prévisualisation header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Aperçu du header sidebar</h3>
        <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl w-fit">
          {logo ? (
            <img src={logo} alt="logo" className="w-8 h-8 object-contain rounded-lg" />
          ) : (
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">SE</div>
          )}
          <div>
            <div className="font-bold text-gray-900 text-sm">{siteName || 'Slide Effect'}</div>
            <div className="text-xs text-gray-400">{tagline || 'Digital Signage Platform'}</div>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Logo principal</h3>
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden">
            {logo ? (
              <img src={logo} alt="logo" className="w-full h-full object-contain" />
            ) : (
              <ImageIcon size={32} className="text-gray-300" />
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs text-gray-500">PNG, SVG, WEBP recommandé. Max 2MB.<br />Taille recommandée : 200×200px.</p>
            <div className="flex gap-2">
              <button onClick={() => logoRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                <Upload size={14} /> Charger depuis le PC
              </button>
              {logo && (
                <button onClick={() => setLogo('')}
                  className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-sm">
                  <Trash2 size={14} /> Supprimer
                </button>
              )}
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], setLogo)} />
          </div>
        </div>
      </div>

      {/* Favicon */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Favicon</h3>
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden">
            {favicon ? (
              <img src={favicon} alt="favicon" className="w-full h-full object-contain" />
            ) : (
              <ImageIcon size={24} className="text-gray-300" />
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs text-gray-500">ICO, PNG. 32×32px recommandé.</p>
            <div className="flex gap-2">
              <button onClick={() => faviconRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                <Upload size={14} /> Charger depuis le PC
              </button>
              {favicon && (
                <button onClick={() => setFavicon('')}
                  className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-sm">
                  <Trash2 size={14} /> Supprimer
                </button>
              )}
            </div>
            <input ref={faviconRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], setFavicon)} />
          </div>
        </div>
      </div>

      {/* Nom et slogan */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Nom & Slogan</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Nom de la plateforme</label>
            <input value={siteName} onChange={e => setSiteName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Slogan / Sous-titre</label>
            <input value={tagline} onChange={e => setTagline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-red-700">Réinitialiser l'identité visuelle</div>
          <div className="text-xs text-red-500">Supprime le logo, favicon et restaure les valeurs par défaut</div>
        </div>
        <button onClick={() => { setLogo(''); setFavicon(''); setSiteName('Slide Effect'); setTagline('Digital Signage Platform') }}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium">
          <RefreshCw size={14} /> Réinitialiser
        </button>
      </div>
    </div>
  )
}
