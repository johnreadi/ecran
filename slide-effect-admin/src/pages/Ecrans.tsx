import { useEffect, useState } from 'react'
import { Plus, Search, MoreVertical, Edit, Copy, Trash2, Wifi, WifiOff, RefreshCw, Send, Key } from 'lucide-react'
import api from '../api'

interface Player {
  id: number; name: string; status: string; last_seen: string
  playlist_id?: number; playlist_name?: string; pairing_code?: string
}

interface Playlist { id: number; name: string }

export default function Ecrans() {
  const [players, setPlayers] = useState<Player[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [assignModal, setAssignModal] = useState<Player | null>(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState('')

  function load() {
    api.get('/players').then(r => setPlayers(r.data)).catch(() => {})
    api.get('/playlists').then(r => setPlaylists(r.data)).catch(() => {})
  }

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t) }, [])

  async function addScreen() {
    if (!newName.trim()) return
    const res = await api.post('/players', { name: newName })
    setPairingCode(res.data.pairing_code)
    setNewName('')
    setShowAdd(false)
    load()
  }

  async function deletePlayer(id: number) {
    await api.delete(`/players/${id}`)
    load()
  }

  async function assignPlaylist() {
    if (!assignModal || !selectedPlaylist) return
    await api.post(`/players/${assignModal.id}/assign`, { playlist_id: parseInt(selectedPlaylist) })
    setAssignModal(null)
    setSelectedPlaylist('')
    load()
  }

  async function sendCommand(id: number, cmd: string) {
    await api.post(`/players/${id}/command`, { command: cmd })
  }

  const filtered = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <button onClick={load} className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">{filtered.length} article{filtered.length > 1 ? 's' : ''} | Par page : 100</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {players.filter(p => p.status === 'online').length} en ligne
            </span>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded" /></th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">NOM</th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">STATUT</th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">TYPE</th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">ID</th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">CONTENU AFFICHÉ</th>
            <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium">ACTIONS</th>
          </tr></thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3"><input type="checkbox" className="rounded" /></td>
                <td className="px-4 py-3 font-medium text-blue-600 hover:underline cursor-pointer">{p.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                    ${p.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.status === 'online' ? <Wifi size={11} /> : <WifiOff size={11} />}
                    {p.status === 'online' ? 'En ligne' : 'Hors ligne'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-500">
                    ⚙️
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs font-mono">{p.id}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {p.playlist_name || 'Aucun contenu affecté'}
                </td>
                <td className="px-4 py-3 text-right relative">
                  <button onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                    className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreVertical size={16} />
                  </button>
                  {menuOpen === p.id && (
                    <div className="absolute right-6 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"><Edit size={13} /> Modifier</button>
                      <button onClick={() => { setAssignModal(p); setMenuOpen(null) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"><Send size={13} /> Assigner playlist</button>
                      <button onClick={() => sendCommand(p.id, 'refresh')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"><RefreshCw size={13} /> Rafraîchir</button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"><Copy size={13} /> Dupliquer</button>
                      <button onClick={() => { deletePlayer(p.id); setMenuOpen(null) }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50"><Trash2 size={13} /> Supprimer</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">Aucun écran enregistré</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-4">Ajouter un écran</h3>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nom de l'écran"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Annuler</button>
              <button onClick={addScreen} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium">Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* Pairing code modal */}
      {pairingCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-sm shadow-xl text-center">
            <Key size={40} className="text-orange-500 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-800 mb-2">Code d'appairage</h3>
            <p className="text-sm text-gray-500 mb-4">Entrez ce code sur votre player web :</p>
            <div className="text-4xl font-mono font-bold text-orange-500 tracking-widest bg-orange-50 py-4 rounded-xl mb-4">
              {pairingCode}
            </div>
            <p className="text-xs text-gray-400 mb-4">http://localhost:3004</p>
            <button onClick={() => setPairingCode(null)} className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Assign playlist modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-4">Assigner une playlist à "{assignModal.name}"</h3>
            <select value={selectedPlaylist} onChange={e => setSelectedPlaylist(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4">
              <option value="">-- Sélectionner une playlist --</option>
              {playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setAssignModal(null)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Annuler</button>
              <button onClick={assignPlaylist} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium">Assigner</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={15} /> Ajouter un écran
        </button>
        <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Actions</button>
      </div>
    </div>
  )
}
