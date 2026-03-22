import { useState } from 'react'
import { Wrench, Clock, Cloud, Globe, QrCode, MessageSquare, Calendar, BarChart2, Save, Eye, EyeOff, Settings } from 'lucide-react'

interface Widget {
  id: string; name: string; icon: React.ReactNode; enabled: boolean
  config: Record<string, string>; category: string
}

const defaultWidgets: Widget[] = [
  { id: 'datetime', name: 'Date & Heure', icon: <Clock size={20} />, enabled: true, category: 'Temps',
    config: { format: 'DD/MM/YYYY HH:mm', timezone: 'Europe/Paris', showSeconds: 'true' } },
  { id: 'weather', name: 'Météo', icon: <Cloud size={20} />, enabled: true, category: 'Info',
    config: { city: 'Paris', unit: 'celsius', apiKey: '' } },
  { id: 'webpage', name: 'Page Web (iFrame)', icon: <Globe size={20} />, enabled: false, category: 'Contenu',
    config: { url: '', refreshInterval: '60', scrolling: 'no' } },
  { id: 'qrcode', name: 'QR Code', icon: <QrCode size={20} />, enabled: true, category: 'Général',
    config: { content: 'https://example.com', size: '200', color: '#000000' } },
  { id: 'marquee', name: 'Texte Défilant', icon: <MessageSquare size={20} />, enabled: true, category: 'Général',
    config: { text: 'Bienvenue sur Slide Effect !', speed: '5', color: '#ffffff', bg: '#f97316' } },
  { id: 'calendar', name: 'Calendrier', icon: <Calendar size={20} />, enabled: false, category: 'Temps',
    config: { view: 'month', lang: 'fr', startDay: '1' } },
  { id: 'chart', name: 'Graphiques', icon: <BarChart2 size={20} />, enabled: false, category: 'Données',
    config: { type: 'bar', dataSource: '', refreshInterval: '30' } },
]

const categoryColors: Record<string, string> = {
  'Temps': 'bg-blue-100 text-blue-700',
  'Info': 'bg-cyan-100 text-cyan-700',
  'Contenu': 'bg-purple-100 text-purple-700',
  'Général': 'bg-gray-100 text-gray-600',
  'Données': 'bg-orange-100 text-orange-700',
}

export default function Widgets() {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets)
  const [editing, setEditing] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function toggle(id: string) {
    setWidgets(widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w))
  }

  function updateConfig(id: string, key: string, value: string) {
    setWidgets(widgets.map(w => w.id === id ? { ...w, config: { ...w.config, [key]: value } } : w))
  }

  function save() {
    localStorage.setItem('admin_widgets', JSON.stringify(widgets))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const categories = [...new Set(widgets.map(w => w.category))]

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Wrench size={20} className="text-orange-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Widgets & Outils</h2>
            <p className="text-xs text-gray-400">Configurez les widgets disponibles sur vos players</p>
          </div>
        </div>
        <button onClick={save} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
          ${saved ? 'bg-green-500 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
          <Save size={14} /> {saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{widgets.length}</div>
          <div className="text-xs text-gray-400">Total widgets</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{widgets.filter(w => w.enabled).length}</div>
          <div className="text-xs text-green-500">Activés</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-500">{widgets.filter(w => !w.enabled).length}</div>
          <div className="text-xs text-gray-400">Désactivés</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-700">{categories.length}</div>
          <div className="text-xs text-purple-400">Catégories</div>
        </div>
      </div>

      {/* Widgets par catégorie */}
      {categories.map(cat => (
        <div key={cat}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${categoryColors[cat] || 'bg-gray-100 text-gray-600'}`}>{cat}</span>
          </div>
          <div className="space-y-3">
            {widgets.filter(w => w.category === cat).map(widget => (
              <div key={widget.id} className={`bg-white border rounded-xl overflow-hidden transition-all
                ${widget.enabled ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                    ${widget.enabled ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                    {widget.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 text-sm">{widget.name}</div>
                    <div className="text-xs text-gray-400">
                      {Object.keys(widget.config).length} paramètre{Object.keys(widget.config).length > 1 ? 's' : ''}
                    </div>
                  </div>
                  <button onClick={() => setEditing(editing === widget.id ? null : widget.id)}
                    className={`p-2 rounded-lg transition-colors ${editing === widget.id ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'}`}>
                    <Settings size={16} />
                  </button>
                  <button onClick={() => toggle(widget.id)}
                    className={`p-2 rounded-lg transition-colors ${widget.enabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-100'}`}>
                    {widget.enabled ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={widget.enabled} onChange={() => toggle(widget.id)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                {/* Config panel */}
                {editing === widget.id && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(widget.config).map(([key, value]) => (
                        <div key={key}>
                          <label className="text-xs text-gray-500 block mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</label>
                          <input value={value} onChange={e => updateConfig(widget.id, key, e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
