import { useState } from 'react'
import { Tag, GripVertical, Eye, EyeOff, Trash2, Plus, Save } from 'lucide-react'

interface MenuItem {
  id: string; label: string; icon: string; path: string; visible: boolean; order: number
}

const defaultMenu: MenuItem[] = [
  { id: '1', label: 'Tableau de bord', icon: '🏠', path: '/', visible: true, order: 1 },
  { id: '2', label: 'Médias', icon: '📁', path: '/medias', visible: true, order: 2 },
  { id: '3', label: 'Apps', icon: '🧩', path: '/apps', visible: true, order: 3 },
  { id: '4', label: 'Playlists', icon: '📋', path: '/playlists', visible: true, order: 4 },
  { id: '5', label: 'Compositions', icon: '🎨', path: '/compositions', visible: true, order: 5 },
  { id: '6', label: 'Programmation', icon: '📅', path: '/programmation', visible: true, order: 6 },
  { id: '7', label: 'Écrans', icon: '🖥️', path: '/ecrans', visible: true, order: 7 },
]

export default function MenuNav() {
  const [menu, setMenu] = useState<MenuItem[]>(() => {
    const stored = localStorage.getItem('admin_menu')
    return stored ? JSON.parse(stored) : defaultMenu
  })
  const [saved, setSaved] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [newLabel, setNewLabel] = useState('')
  const [newIcon, setNewIcon] = useState('📌')
  const [newPath, setNewPath] = useState('')

  function toggle(id: string) {
    setMenu(menu.map(m => m.id === id ? { ...m, visible: !m.visible } : m))
  }

  function remove(id: string) {
    setMenu(menu.filter(m => m.id !== id))
  }

  function rename(id: string, label: string) {
    setMenu(menu.map(m => m.id === id ? { ...m, label } : m))
  }

  function changeIcon(id: string, icon: string) {
    setMenu(menu.map(m => m.id === id ? { ...m, icon } : m))
  }

  function addItem() {
    if (!newLabel.trim() || !newPath.trim()) return
    const item: MenuItem = {
      id: Date.now().toString(), label: newLabel, icon: newIcon,
      path: newPath, visible: true, order: menu.length + 1
    }
    setMenu([...menu, item])
    setNewLabel(''); setNewIcon('📌'); setNewPath('')
  }

  function moveUp(index: number) {
    if (index === 0) return
    const newMenu = [...menu]
    ;[newMenu[index - 1], newMenu[index]] = [newMenu[index], newMenu[index - 1]]
    setMenu(newMenu)
  }

  function moveDown(index: number) {
    if (index === menu.length - 1) return
    const newMenu = [...menu]
    ;[newMenu[index], newMenu[index + 1]] = [newMenu[index + 1], newMenu[index]]
    setMenu(newMenu)
  }

  function save() {
    localStorage.setItem('admin_menu', JSON.stringify(menu))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Tag size={20} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Menu & Navigation</h2>
            <p className="text-xs text-gray-400">Réorganisez, masquez ou ajoutez des éléments de menu</p>
          </div>
        </div>
        <button onClick={save} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
          ${saved ? 'bg-green-500 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
          <Save size={14} /> {saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 text-xs text-gray-400 font-medium uppercase tracking-wider">
          Éléments du menu ({menu.filter(m => m.visible).length} visibles / {menu.length} total)
        </div>
        <div className="divide-y divide-gray-100">
          {menu.map((item, index) => (
            <div key={item.id}
              className={`flex items-center gap-3 px-4 py-3 ${!item.visible ? 'opacity-50' : ''} ${dragging === item.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              draggable onDragStart={() => setDragging(item.id)} onDragEnd={() => setDragging(null)}>
              <GripVertical size={16} className="text-gray-300 cursor-grab shrink-0" />
              
              {/* Icon picker */}
              <input value={item.icon} onChange={e => changeIcon(item.id, e.target.value)}
                className="w-10 h-8 text-center text-lg bg-gray-50 border border-gray-200 rounded-lg focus:outline-none" />

              {/* Label */}
              <input value={item.label} onChange={e => rename(item.id, e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />

              {/* Path */}
              <input value={item.path} readOnly
                className="w-32 px-2 py-1 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg" />

              {/* Up/Down */}
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveUp(index)} className="px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">▲</button>
                <button onClick={() => moveDown(index)} className="px-1.5 py-0.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">▼</button>
              </div>

              {/* Toggle visibility */}
              <button onClick={() => toggle(item.id)}
                className={`p-1.5 rounded-lg transition-colors ${item.visible ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-300 hover:bg-gray-100'}`}>
                {item.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>

              {/* Delete */}
              <button onClick={() => remove(item.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Ajouter un item */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Plus size={15} className="text-emerald-500" /> Ajouter un élément de menu
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Icône (emoji)</label>
            <input value={newIcon} onChange={e => setNewIcon(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Label *</label>
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Ex: Rapports"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Chemin *</label>
            <input value={newPath} onChange={e => setNewPath(e.target.value)} placeholder="/rapports"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
        <button onClick={addItem} className="mt-3 flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium">
          <Plus size={14} /> Ajouter
        </button>
      </div>
    </div>
  )
}
