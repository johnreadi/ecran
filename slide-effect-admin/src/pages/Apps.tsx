import { useState } from 'react'
import { Search, Star, Clock, Cloud, Calendar, Image, Globe, BarChart2, QrCode,
  MessageSquare, Rss, Youtube, Twitter, Play, Newspaper, ExternalLink } from 'lucide-react'

interface AppItem {
  id: number; name: string; desc: string; icon: React.ReactNode
  category: string; installed: boolean; color: string
}

const categories = ['Toutes les apps', 'Récent', 'Météo', 'Heure', 'Général', 'Infos', 'Calendriers', 'Interactivité', 'Plus']

const appsList: AppItem[] = [
  { id: 1, name: 'Date & Heure', desc: 'Horloge numérique avec date selon la localisation', icon: <Clock size={28} />, category: 'Heure', installed: true, color: '#3b82f6' },
  { id: 2, name: 'Météo', desc: 'Affiche la météo actuelle et prévisions', icon: <Cloud size={28} />, category: 'Météo', installed: true, color: '#06b6d4' },
  { id: 3, name: 'Calendrier', desc: 'Calendrier mensuel ou hebdomadaire', icon: <Calendar size={28} />, category: 'Calendriers', installed: false, color: '#f59e0b' },
  { id: 4, name: 'Diaporama Images', desc: 'Slideshow automatique de vos images', icon: <Image size={28} />, category: 'Général', installed: true, color: '#8b5cf6' },
  { id: 5, name: 'Page Web', desc: 'Intégrez n\'importe quelle URL en iframe', icon: <Globe size={28} />, category: 'Général', installed: false, color: '#10b981' },
  { id: 6, name: 'Graphiques', desc: 'Visualisez vos données en temps réel', icon: <BarChart2 size={28} />, category: 'Infos', installed: false, color: '#f97316' },
  { id: 7, name: 'QR Code', desc: 'Générez des QR codes dynamiques', icon: <QrCode size={28} />, category: 'Général', installed: true, color: '#1f2937' },
  { id: 8, name: 'Texte Défilant', desc: 'Bannière de texte animé (marquee)', icon: <MessageSquare size={28} />, category: 'Général', installed: true, color: '#ef4444' },
  { id: 9, name: 'Flux RSS', desc: 'Actualités depuis n\'importe quel flux RSS', icon: <Rss size={28} />, category: 'Infos', installed: false, color: '#f97316' },
  { id: 10, name: 'YouTube', desc: 'Diffusez des vidéos YouTube', icon: <Youtube size={28} />, category: 'Général', installed: false, color: '#ef4444' },
  { id: 11, name: 'Twitter/X Feed', desc: 'Flux en temps réel depuis Twitter/X', icon: <Twitter size={28} />, category: 'Infos', installed: false, color: '#1d4ed8' },
  { id: 12, name: 'Lecteur Vidéo', desc: 'Lecture en boucle de vos vidéos', icon: <Play size={28} />, category: 'Général', installed: true, color: '#7c3aed' },
  { id: 13, name: 'Actualités', desc: 'Titres d\'actualités agrégés', icon: <Newspaper size={28} />, category: 'Infos', installed: false, color: '#374151' },
  { id: 14, name: 'Lien Externe', desc: 'Redirigez vers une URL externe', icon: <ExternalLink size={28} />, category: 'Général', installed: false, color: '#0ea5e9' },
]

const featured = [1, 2, 8, 7]

export default function Apps() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Toutes les apps')
  const [tab, setTab] = useState<'my' | 'discover'>('discover')
  const [apps, setApps] = useState(appsList)

  function toggleInstall(id: number) {
    setApps(apps.map(a => a.id === id ? { ...a, installed: !a.installed } : a))
  }

  const filtered = apps.filter(a =>
    (tab === 'my' ? a.installed : true) &&
    a.name.toLowerCase().includes(search.toLowerCase()) &&
    (category === 'Toutes les apps' || a.category === category)
  )

  const featuredApps = apps.filter(a => featured.includes(a.id))

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1">
        {[['my', 'Mes apps'], ['discover', 'Découvrir des apps']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as 'my' | 'discover')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors
              ${tab === key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher (ex. météo, PowerBI, calendrier...)"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${category === c ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Featured */}
      {tab === 'discover' && search === '' && category === 'Toutes les apps' && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star size={15} className="text-orange-500" />
            <span className="text-sm font-semibold text-gray-700">Applications en vedette</span>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {featuredApps.map(a => (
              <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-sm transition-all">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3" style={{ background: a.color }}>
                  {a.icon}
                </div>
                <div className="font-semibold text-gray-800 text-sm">{a.name}</div>
                <div className="text-xs text-gray-400 mt-1 line-clamp-2">{a.desc}</div>
                <button onClick={() => toggleInstall(a.id)}
                  className={`mt-3 w-full py-1.5 text-xs rounded-lg font-medium transition-colors
                    ${a.installed ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
                  {a.installed ? '✓ Installé' : 'Installer'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tout */}
      <div>
        {tab === 'discover' && <div className="text-sm font-semibold text-gray-600 mb-3"># Tout <span className="text-gray-400 font-normal ml-2">A à Z</span></div>}
        {tab === 'my' && <div className="text-sm font-semibold text-gray-600 mb-3">Mes apps installées ({filtered.length})</div>}

        <div className="grid grid-cols-3 gap-4">
          {filtered.map(a => (
            <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 hover:border-orange-300 hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: a.color }}>
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 text-sm">{a.name}</div>
                <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{a.desc}</div>
              </div>
              <button onClick={() => toggleInstall(a.id)}
                className={`shrink-0 self-center px-3 py-1.5 text-xs rounded-lg font-medium transition-colors
                  ${a.installed ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600' : 'border border-gray-200 text-gray-600 hover:bg-orange-500 hover:text-white hover:border-orange-500'}`}>
                {a.installed ? '✓' : '+'}
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 py-12 text-center text-gray-400 text-sm">Aucune app trouvée</div>
          )}
        </div>
      </div>
    </div>
  )
}
