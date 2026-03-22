import { useEffect, useState } from 'react'
import { Monitor, WifiOff, AlertCircle, CheckCircle2, Activity, Clock } from 'lucide-react'
import api from '../api'

interface Player { id: number; name: string; status: string; last_seen: string }
interface Playlist { id: number; name: string; updated_at: string }

export default function Dashboard() {
  const [players, setPlayers] = useState<Player[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [activities, setActivities] = useState<{ time: string; text: string }[]>([])
  const user = JSON.parse(localStorage.getItem('user') || '{"email":"admin@signage.local"}')

  useEffect(() => {
    api.get('/players').then(r => setPlayers(r.data)).catch(() => {})
    api.get('/playlists').then(r => setPlaylists(r.data)).catch(() => {})
    // Fake activities from local
    const stored = JSON.parse(localStorage.getItem('activities') || '[]')
    if (stored.length === 0) {
      const now = new Date()
      const acts = [
        { time: now.toLocaleString('fr-FR'), text: `${user.email} connecté.` },
      ]
      localStorage.setItem('activities', JSON.stringify(acts))
      setActivities(acts)
    } else {
      setActivities(stored)
    }
  }, [user.email])

  const online = players.filter(p => p.status === 'online').length
  const offline = players.filter(p => p.status !== 'online').length
  const registered = players.length

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-orange-500 text-white rounded-xl p-6">
        <h2 className="text-xl font-semibold">Bonjour, {user.name || user.email.split('@')[0]} 👋</h2>
        <p className="text-orange-100 mt-1 text-sm">Bienvenue sur votre tableau de bord !</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Centre de contrôle */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-orange-500" /> Centre de contrôle
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-green-50 border border-green-100">
              <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
                <CheckCircle2 size={12} /> Écrans en ligne
              </div>
              <div className="text-2xl font-bold text-green-700">{online}</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <WifiOff size={12} /> Hors ligne
              </div>
              <div className="text-2xl font-bold text-gray-600">{offline}</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
                <Monitor size={12} /> Enregistrés
              </div>
              <div className="text-2xl font-bold text-blue-700">{registered}</div>
            </div>
            <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
              <div className="flex items-center gap-1 text-xs text-orange-600 mb-1">
                <AlertCircle size={12} /> Non enregistrés
              </div>
              <div className="text-2xl font-bold text-orange-600">{Math.max(0, 1 - registered)}</div>
            </div>
          </div>
          <button className="mt-4 text-orange-500 text-xs font-medium hover:underline">
            Gérer les écrans →
          </button>
        </div>

        {/* Offre */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Offre d'abonnement</h3>
          <p className="text-xs text-gray-400 mb-1">Votre abonnement actuel :</p>
          <p className="font-semibold text-gray-800 text-sm">Free Enterprise plan</p>
          <p className="text-xs text-gray-400 mt-3 mb-1">La limite de votre abonnement est fixée à :</p>
          <p className="font-semibold text-gray-800 text-sm">{Math.max(registered, 1)} License{registered > 1 ? 's' : ''}</p>
          <button className="mt-4 text-orange-500 text-xs font-medium hover:underline">
            Gérer les abonnements →
          </button>
        </div>

        {/* Activités */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-orange-500" /> Activités récentes
          </h3>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-xs text-gray-400">Aucune activité récente</p>
            ) : activities.map((a, i) => (
              <div key={i} className="text-xs text-gray-500 border-b border-gray-50 pb-2">
                <div className="text-gray-400">{a.time}</div>
                <div className="text-gray-600">{a.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comment démarrer */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Démarrer avec un player pour vos écrans</h3>
        <p className="text-orange-500 text-sm font-medium mb-3">J'ai un player</p>
        <div className="space-y-2">
          <a href="http://localhost:3004" target="_blank" rel="noreferrer"
            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-sm text-gray-600 cursor-pointer">
            <span>Accéder au <strong>Player Web</strong> sur port 3004</span>
            <span className="text-gray-400">→</span>
          </a>
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm text-gray-600">
            <span>Ajouter un écran dans <strong>Écrans</strong> pour enregistrer votre device</span>
            <span className="text-gray-400">→</span>
          </div>
        </div>
      </div>

      {/* Playlists récentes */}
      {playlists.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-3">Playlists récentes</h3>
          <div className="grid grid-cols-3 gap-3">
            {playlists.slice(0, 3).map(p => (
              <div key={p.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div className="text-sm font-medium text-gray-700">{p.name}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(p.updated_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
