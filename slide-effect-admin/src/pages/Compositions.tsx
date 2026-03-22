import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Layout, Star } from 'lucide-react'

const templates = [
  { id: 1, name: 'Écran de bienvenue', category: 'Général', bg: '#1a1a2e', preview: '🏢' },
  { id: 2, name: 'Menu Restaurant', category: 'Restauration', bg: '#2d1b00', preview: '🍽️' },
  { id: 3, name: 'Promo Vente', category: 'Commerce', bg: '#0a2e1a', preview: '💰' },
  { id: 4, name: 'Info Aéroport', category: 'Transport', bg: '#1a2a4a', preview: '✈️' },
  { id: 5, name: 'Alerte Urgence', category: 'Sécurité', bg: '#2e0a0a', preview: '⚠️' },
  { id: 6, name: 'Météo & Infos', category: 'Général', bg: '#0a1a2e', preview: '🌤️' },
  { id: 7, name: 'Horaires Bus', category: 'Transport', bg: '#1a2e1a', preview: '🚌' },
  { id: 8, name: 'Événement', category: 'Événements', bg: '#2a1a2e', preview: '🎉' },
  { id: 9, name: 'Corporate', category: 'Entreprise', bg: '#1a1a1a', preview: '📊' },
]

const categories = ['Tous', 'Récent', 'Météo', 'Heure', 'Général', 'Infos', 'Calendriers']

export default function Compositions() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'my' | 'branded' | 'discover'>('discover')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Tous')

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) &&
    (category === 'Tous' || t.category === category)
  )

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1">
        {[['my', 'Mes Compositions'], ['branded', 'Modèles de Marque'], ['discover', 'Explorer les Modèles']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as 'my' | 'branded' | 'discover')}
            className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium
              ${tab === key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'discover' && (
        <>
          <div className="text-center py-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Que souhaitez-vous afficher aujourd'hui ?</h2>
            <div className="relative max-w-lg mx-auto">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher des modèles (ex. menu, bienvenue)"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors
                  ${category === c ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {c}
              </button>
            ))}
          </div>

          {/* Create button */}
          <div className="flex gap-3 items-center">
            <button onClick={() => navigate('/compositions/new')}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-colors">
              <Plus size={16} /> Créer une nouvelle composition
            </button>
            <button onClick={() => navigate('/compositions/new')}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600">
              <Layout size={16} /> Ouvrir l'Éditeur
            </button>
          </div>

          {/* Templates grid */}
          <div className="grid grid-cols-4 gap-4">
            {filtered.map(t => (
              <div key={t.id} className="group relative rounded-xl overflow-hidden border border-gray-200 hover:border-orange-300 transition-all cursor-pointer hover:shadow-md">
                <div className="h-40 flex items-center justify-center text-5xl" style={{ background: t.bg }}>
                  {t.preview}
                </div>
                <div className="p-3 bg-white">
                  <div className="font-medium text-gray-700 text-sm">{t.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{t.category}</div>
                </div>
                <button className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Star size={14} className="text-gray-400 hover:text-orange-400" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'my' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Layout size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">Aucune composition créée. Commencez par créer un layout dans l'éditeur.</p>
          <button onClick={() => navigate('/compositions/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
            <Plus size={16} /> Créer dans l'Éditeur
          </button>
        </div>
      )}

      {tab === 'branded' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">Les modèles de marque apparaîtront ici.</p>
        </div>
      )}
    </div>
  )
}
