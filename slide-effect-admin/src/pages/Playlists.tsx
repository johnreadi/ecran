import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, MoreVertical, Edit, Trash2, Copy,
  RefreshCw, ListVideo, X, ArrowRight
} from 'lucide-react'
import api from '../api'

interface Playlist {
  id: string
  name: string
  description: string
  updated_at: string
  created_at: string
  slides?: any[]
}

export default function Playlists() {
  const navigate = useNavigate()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<Playlist | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const r = await api.get('/playlists')
      setPlaylists(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditItem(null)
    setForm({ name: '', description: '' })
    setShowAdd(true)
  }

  const openEdit = (p: Playlist) => {
    setEditItem(p)
    setForm({ name: p.name, description: p.description || '' })
    setMenuOpen(null)
    setShowAdd(true)
  }

  const [error, setError] = useState('')

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setError('')
    try {
      if (editItem) {
        await api.put(`/playlists/${editItem.id}`, { name: form.name, description: form.description })
      } else {
        await api.post('/playlists', { name: form.name, description: form.description, slides: [] })
      }
      setShowAdd(false)
      setForm({ name: '', description: '' })
      load()
    } catch (e: any) {
      console.error('Save error:', e)
      setError(e.response?.data?.error || e.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const deletePlaylist = async (id: string) => {
    if (!confirm('Supprimer cette playlist ?')) return
    await api.delete(`/playlists/${id}`)
    setMenuOpen(null)
    load()
  }

  const duplicate = async (p: Playlist) => {
    await api.post('/playlists', {
      name: `${p.name} (copie)`,
      description: p.description,
      slides: p.slides || [],
    })
    setMenuOpen(null)
    load()
  }

  const deleteSelected = async () => {
    if (!selected.length || !confirm(`Supprimer ${selected.length} playlist(s) ?`)) return
    await Promise.all(selected.map(id => api.delete(`/playlists/${id}`)))
    setSelected([])
    load()
  }

  const toggleSelect = (id: string) => {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  const toggleAll = () => {
    setSelected(p => p.length === filtered.length ? [] : filtered.map(p => p.id))
  }

  const filtered = playlists.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const slideCount = (p: Playlist) => {
    try { return Array.isArray(p.slides) ? p.slides.length : 0 } catch { return 0 }
  }

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
        {selected.length > 0 && (
          <button onClick={deleteSelected}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-100">
            <Trash2 size={14} /> Supprimer ({selected.length})
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">{filtered.length} article{filtered.length > 1 ? 's' : ''} | Par page : 10</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Chargement...</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" className="rounded"
                  checked={selected.length === filtered.length && filtered.length > 0}
                  onChange={toggleAll} />
              </th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">NOM</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">DESCRIPTION</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">MODIFIÉ</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">SLIDES</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">TYPE DE MÉDIA</th>
              <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium">ACTIONS</th>
            </tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 ${selected.includes(p.id) ? 'bg-orange-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} />
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/playlists/${p.id}`)} className="font-medium text-blue-600 hover:underline text-left flex items-center gap-1">
                      {p.name} <ArrowRight size={12} className="opacity-50" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.description || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(p.updated_at).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                      <ListVideo size={11} /> {slideCount(p)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">📄 Présentation</td>
                  <td className="px-4 py-3 text-right relative">
                    <button onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                      className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreVertical size={16} />
                    </button>
                    {menuOpen === p.id && (
                      <div className="absolute right-6 top-8 bg-white border border-gray-200 rounded-xl shadow-xl z-10 min-w-[150px] py-1">
                        <button onClick={() => openEdit(p)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50">
                          <Edit size={13} /> Modifier
                        </button>
                        <button onClick={() => duplicate(p)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50">
                          <Copy size={13} /> Dupliquer
                        </button>
                        <div className="border-t my-1" />
                        <button onClick={() => deletePlaylist(p.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-500 hover:bg-red-50">
                          <Trash2 size={13} /> Supprimer
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <ListVideo size={32} className="mx-auto mb-2 text-gray-200" />
                    <p className="text-gray-400 text-sm">Aucune playlist</p>
                    <button onClick={openCreate} className="mt-2 text-orange-500 text-sm hover:underline">Créer une playlist</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Create/Edit */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">{editItem ? 'Modifier la playlist' : 'Nouvelle playlist'}</h3>
              <button onClick={() => setShowAdd(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            {error && (
              <div className="mb-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Nom *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ma playlist"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Description</label>
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Description optionnelle"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={save} disabled={saving || !form.name.trim()}
                className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Enregistrement...' : editItem ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={openCreate} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={15} /> Ajouter une Playlist
        </button>
        {selected.length > 0 && (
          <button onClick={deleteSelected} className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50">
            <Trash2 size={14} /> Supprimer la sélection ({selected.length})
          </button>
        )}
      </div>

      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />}
    </div>
  )
}
