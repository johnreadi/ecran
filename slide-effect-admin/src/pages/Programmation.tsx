import { useEffect, useState } from 'react'
import { Plus, Search, MoreVertical, Edit, Copy, Trash2, RefreshCw, Monitor, ListVideo, Clock, X } from 'lucide-react'
import api from '../api'

interface Schedule {
  id: string
  player_id: string | null
  group_id: string | null
  playlist_id: string
  playlist_name?: string
  player_name?: string
  group_name?: string
  schedule: any
  priority: number
  active: number
  created_at: string
}

interface Player { id: string; name: string }
interface Playlist { id: string; name: string }

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAYS_FULL = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function Programmation() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Schedule | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    player_id: '',
    playlist_id: '',
    priority: 0,
    active: true,
    allDay: true,
    startTime: '09:00',
    endTime: '18:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as string[],
    type: '24/7' as '24/7' | 'scheduled',
  })

  const load = async () => {
    try {
      const [aRes, pRes, plRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/players'),
        api.get('/playlists'),
      ])
      setSchedules(aRes.data)
      setPlayers(pRes.data)
      setPlaylists(plRes.data)
    } catch {}
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditItem(null)
    setForm({ name: '', player_id: '', playlist_id: '', priority: 0, active: true, allDay: true, startTime: '09:00', endTime: '18:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], type: '24/7' })
    setShowModal(true)
  }

  const openEdit = (s: Schedule) => {
    setEditItem(s)
    const sc = s.schedule || {}
    setForm({
      name: sc.name || '',
      player_id: s.player_id || '',
      playlist_id: s.playlist_id,
      priority: s.priority,
      active: s.active === 1,
      allDay: sc.allDay !== false,
      startTime: sc.startTime || '09:00',
      endTime: sc.endTime || '18:00',
      days: sc.days || DAYS_FULL,
      type: sc.type || '24/7',
    })
    setMenuOpen(null)
    setShowModal(true)
  }

  const save = async () => {
    if (!form.playlist_id) return
    setSaving(true)
    const schedule = {
      name: form.name,
      type: form.type,
      allDay: form.allDay,
      startTime: form.startTime,
      endTime: form.endTime,
      days: form.days,
    }
    try {
      if (editItem) {
        await api.put(`/assignments/${editItem.id}`, {
          playlist_id: form.playlist_id,
          player_id: form.player_id || null,
          schedule,
          priority: form.priority,
          active: form.active ? 1 : 0,
        })
      } else {
        await api.post('/assignments', {
          playlist_id: form.playlist_id,
          player_id: form.player_id || null,
          schedule,
          priority: form.priority,
          active: form.active ? 1 : 0,
        })
      }
      setShowModal(false)
      load()
    } catch {} finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('Supprimer cette programmation ?')) return
    await api.delete(`/assignments/${id}`)
    setMenuOpen(null)
    load()
  }

  const duplicate = async (s: Schedule) => {
    await api.post('/assignments', {
      playlist_id: s.playlist_id,
      player_id: s.player_id,
      schedule: { ...(s.schedule || {}), name: `${(s.schedule?.name || 'Copie')} (copie)` },
      priority: s.priority,
      active: s.active,
    })
    setMenuOpen(null)
    load()
  }

  const toggleDay = (d: string) => {
    setForm(p => ({
      ...p,
      days: p.days.includes(d) ? p.days.filter(x => x !== d) : [...p.days, d]
    }))
  }

  const filtered = schedules.filter(s => {
    const name = (s.schedule?.name || s.playlist_name || '').toLowerCase()
    return name.includes(search.toLowerCase()) ||
      (s.player_name || '').toLowerCase().includes(search.toLowerCase())
  })

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
        <div className="px-5 py-3 border-b border-gray-100">
          <span className="text-xs text-gray-400">{filtered.length} programmation{filtered.length > 1 ? 's' : ''} | Par page : 10</span>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded" /></th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">NOM</th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">PLAYLIST</th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">ÉCRAN</th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">HORAIRE</th>
            <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">STATUT</th>
            <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium">ACTIONS</th>
          </tr></thead>
          <tbody>
            {filtered.map(s => {
              const sc = s.schedule || {}
              return (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3"><input type="checkbox" className="rounded" /></td>
                  <td className="px-4 py-3 font-medium text-blue-600 hover:underline cursor-pointer" onClick={() => openEdit(s)}>
                    {sc.name || `Programmation #${s.id.slice(0, 6)}`}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    <div className="flex items-center gap-1"><ListVideo size={12} className="text-orange-400" />{s.playlist_name || s.playlist_id}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {s.player_name ? <div className="flex items-center gap-1"><Monitor size={12} />{s.player_name}</div> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {sc.type === '24/7' ? (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">24/7</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Clock size={11} />
                        {sc.startTime}–{sc.endTime}
                        {sc.days && <span className="text-gray-400 ml-1">{sc.days.map((d: string) => d.slice(0, 2)).join(' ')}</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {s.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right relative">
                    <button onClick={() => setMenuOpen(menuOpen === s.id ? null : s.id)}
                      className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreVertical size={16} />
                    </button>
                    {menuOpen === s.id && (
                      <div className="absolute right-6 top-8 bg-white border border-gray-200 rounded-xl shadow-xl z-10 min-w-[160px] py-1">
                        <button onClick={() => openEdit(s)} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50"><Edit size={13} /> Modifier</button>
                        <button onClick={() => duplicate(s)} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50"><Copy size={13} /> Dupliquer</button>
                        <div className="border-t my-1" />
                        <button onClick={() => remove(s.id)} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-500 hover:bg-red-50"><Trash2 size={13} /> Supprimer</button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                <Clock size={32} className="mx-auto mb-2 opacity-20" />
                Aucune programmation
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button onClick={openCreate} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={15} /> Ajouter une programmation
        </button>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-800">{editItem ? 'Modifier la programmation' : 'Nouvelle programmation'}</h3>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la programmation</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Affichage 24/7 Hall" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Playlist *</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={form.playlist_id} onChange={e => setForm(p => ({ ...p, playlist_id: e.target.value }))}>
                    <option value="">-- Sélectionner --</option>
                    {playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Écran (optionnel)</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    value={form.player_id} onChange={e => setForm(p => ({ ...p, player_id: e.target.value }))}>
                    <option value="">-- Tous les écrans --</option>
                    {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de diffusion</label>
                <div className="flex gap-3">
                  {(['24/7', 'scheduled'] as const).map(t => (
                    <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors
                        ${form.type === t ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {t === '24/7' ? '🔄 24h/24 7j/7' : '🕐 Planifié'}
                    </button>
                  ))}
                </div>
              </div>
              {/* Scheduled settings */}
              {form.type === 'scheduled' && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Heure début</label>
                      <input type="time" className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Heure fin</label>
                      <input type="time" className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Jours actifs</label>
                    <div className="flex gap-1.5">
                      {DAYS.map((d, i) => (
                        <button key={d} onClick={() => toggleDay(DAYS_FULL[i])}
                          className={`w-9 h-9 rounded-full text-xs font-medium transition-colors
                            ${form.days.includes(DAYS_FULL[i]) ? 'bg-orange-500 text-white' : 'bg-white border text-gray-500 hover:bg-gray-50'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.active}
                  onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="rounded" />
                <label htmlFor="active" className="text-sm text-gray-700">Programmation active</label>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
              <button onClick={save} disabled={saving || !form.playlist_id}
                className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Enregistrement...' : editItem ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />}
    </div>
  )
}
