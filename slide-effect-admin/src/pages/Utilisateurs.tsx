import { useEffect, useState } from 'react'
import api from '../api'
import {
  UserPlus, Search, MoreVertical, Shield, ShieldOff,
  Trash2, Ban, CheckCircle, Clock, Edit3, X, Check
} from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'operator'
  status: 'active' | 'banned' | 'suspended'
  workspace: string
  last_login: string | null
  created_at: string
}

const ROLE_LABELS: Record<string, string> = { admin: 'Super Admin', operator: 'Opérateur' }
const STATUS_LABELS: Record<string, string> = { active: 'Actif', banned: 'Banni', suspended: 'Suspendu' }
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  banned: 'bg-red-100 text-red-700',
  suspended: 'bg-yellow-100 text-yellow-700',
}

export default function Utilisateurs() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState<User | null>(null)
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'operator', workspace: 'default' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'banned' | 'suspended'>('all')

  const load = async () => {
    try {
      const { data } = await api.get('/users')
      setUsers(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = users.filter(u => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || u.status === filter
    return matchSearch && matchFilter
  })

  const handleCreate = async () => {
    setSaving(true)
    setError('')
    try {
      await api.post('/users', form)
      setShowCreate(false)
      setForm({ email: '', password: '', name: '', role: 'operator', workspace: 'default' })
      load()
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur création')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!showEdit) return
    setSaving(true)
    setError('')
    try {
      const payload: any = { name: form.name, role: form.role, workspace: form.workspace, status: showEdit.status }
      if (form.email) payload.email = form.email
      if (form.password) payload.password = form.password
      await api.put(`/users/${showEdit.id}`, payload)
      setShowEdit(null)
      load()
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur modification')
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = (u: User) => {
    setForm({ email: u.email, password: '', name: u.name || '', role: u.role, workspace: u.workspace || 'default' })
    setShowEdit(u)
    setOpenMenu(null)
  }

  const toggleBan = async (u: User) => {
    const banned = u.status !== 'banned'
    await api.post(`/users/${u.id}/ban`, { banned })
    setOpenMenu(null)
    load()
  }

  const toggleSuspend = async (u: User) => {
    await api.post(`/users/${u.id}/suspend`, {})
    setOpenMenu(null)
    load()
  }

  const toggleRole = async (u: User) => {
    const role = u.role === 'admin' ? 'operator' : 'admin'
    await api.post(`/users/${u.id}/role`, { role })
    setOpenMenu(null)
    load()
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    await api.delete(`/users/${id}`)
    setOpenMenu(null)
    load()
  }

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    banned: users.filter(u => u.status === 'banned').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    admins: users.filter(u => u.role === 'admin').length,
  }

  const Modal = ({ title, onClose, onSave }: { title: string, onClose: () => void, onSave: () => void }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Jean Dupont" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@domaine.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe {showEdit ? '(laisser vide = inchangé)' : '*'}</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="operator">Opérateur</option>
                <option value="admin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workspace</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={form.workspace} onChange={e => setForm(p => ({ ...p, workspace: e.target.value }))} placeholder="default" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">Annuler</button>
          <button onClick={onSave} disabled={saving}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'bg-blue-50 text-blue-700', onClick: () => setFilter('all') },
          { label: 'Actifs', value: stats.active, color: 'bg-green-50 text-green-700', onClick: () => setFilter('active') },
          { label: 'Bannis', value: stats.banned, color: 'bg-red-50 text-red-700', onClick: () => setFilter('banned') },
          { label: 'Suspendus', value: stats.suspended, color: 'bg-yellow-50 text-yellow-700', onClick: () => setFilter('suspended') },
          { label: 'Admins', value: stats.admins, color: 'bg-purple-50 text-purple-700', onClick: () => setFilter('all') },
        ].map(s => (
          <button key={s.label} onClick={s.onClick}
            className={`${s.color} rounded-xl p-4 text-left cursor-pointer hover:opacity-80 transition-opacity`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm font-medium opacity-80">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Rechercher un utilisateur..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'active', 'banned', 'suspended'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'all' ? 'Tous' : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
        <button onClick={() => { setShowCreate(true); setError('') }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
          <UserPlus size={16} /> Nouvel utilisateur
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b text-sm text-gray-500">
          {filtered.length} utilisateur{filtered.length > 1 ? 's' : ''}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <UserPlus size={40} className="mb-3 opacity-30" />
            <p>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b">
                <th className="px-4 py-3 text-left font-medium">Utilisateur</th>
                <th className="px-4 py-3 text-left font-medium">Rôle</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
                <th className="px-4 py-3 text-left font-medium">Workspace</th>
                <th className="px-4 py-3 text-left font-medium">Dernière connexion</th>
                <th className="px-4 py-3 text-left font-medium">Créé le</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                        ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                        {(u.name || u.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 text-sm">{u.name || '—'}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                      ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role === 'admin' ? <Shield size={11} /> : null}
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[u.status] || 'bg-gray-100 text-gray-600'}`}>
                      {u.status === 'active' && <CheckCircle size={11} />}
                      {u.status === 'banned' && <Ban size={11} />}
                      {u.status === 'suspended' && <Clock size={11} />}
                      {STATUS_LABELS[u.status] || u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{u.workspace || 'default'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {u.last_login ? new Date(u.last_login + 'Z').toLocaleString('fr-FR') : <span className="text-gray-300">Jamais</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(u.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <button onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                        <MoreVertical size={16} />
                      </button>
                      {openMenu === u.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-xl z-50 min-w-[180px] py-1">
                          <button onClick={() => openEditModal(u)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50 text-gray-700">
                            <Edit3 size={14} /> Modifier
                          </button>
                          <button onClick={() => toggleRole(u)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50 text-gray-700">
                            {u.role === 'admin' ? <><ShieldOff size={14} /> Rétrograder opérateur</> : <><Shield size={14} /> Promouvoir admin</>}
                          </button>
                          <div className="border-t my-1" />
                          <button onClick={() => toggleSuspend(u)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50 text-yellow-600">
                            {u.status === 'suspended' ? <><Check size={14} /> Réactiver</> : <><Clock size={14} /> Suspendre</>}
                          </button>
                          <button onClick={() => toggleBan(u)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50 text-red-600">
                            {u.status === 'banned' ? <><CheckCircle size={14} /> Débannir</> : <><Ban size={14} /> Bannir</>}
                          </button>
                          <div className="border-t my-1" />
                          <button onClick={() => deleteUser(u.id)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-red-50 text-red-600">
                            <Trash2 size={14} /> Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Nouvel utilisateur" onClose={() => setShowCreate(false)} onSave={handleCreate} />
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title={`Modifier : ${showEdit.email}`} onClose={() => setShowEdit(null)} onSave={handleEdit} />
      )}

      {/* Overlay to close menus */}
      {openMenu && <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />}
    </div>
  )
}
