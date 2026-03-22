import { useState, useRef } from 'react'
import { Upload, Search, Image, Video, Headphones, FileText, Globe, Grid3X3, List, MoreVertical, Trash2, Download, Eye, X } from 'lucide-react'

const TABS = [
  { key: 'all', label: 'Tous les médias', icon: Grid3X3 },
  { key: 'image', label: 'Images', icon: Image },
  { key: 'video', label: 'Vidéos', icon: Video },
  { key: 'audio', label: 'Audio', icon: Headphones },
  { key: 'doc', label: 'Documents', icon: FileText },
  { key: 'web', label: 'Pages Web', icon: Globe },
]

interface Media {
  id: number; name: string; type: string; size: string
  date: string; url: string; thumb?: string
}

function getType(mime: string): string {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.includes('pdf') || mime.includes('document') || mime.includes('text')) return 'doc'
  return 'other'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function Medias() {
  const [tab, setTab] = useState('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [medias, setMedias] = useState<Media[]>([
    { id: 1, name: 'Bannière accueil.png', type: 'image', size: '2.4 MB', date: '21 mars, 2026', url: '', thumb: '' },
    { id: 2, name: 'Promo été.mp4', type: 'video', size: '45 MB', date: '20 mars, 2026', url: '' },
    { id: 3, name: 'Ambiance.mp3', type: 'audio', size: '8.2 MB', date: '19 mars, 2026', url: '' },
    { id: 4, name: 'Menu restaurant.pdf', type: 'doc', size: '1.1 MB', date: '18 mars, 2026', url: '' },
  ])
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [preview, setPreview] = useState<Media | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = medias.filter(m =>
    (tab === 'all' || m.type === tab) &&
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleFiles(files: FileList) {
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        const url = e.target?.result as string
        const newMedia: Media = {
          id: Date.now() + Math.random(),
          name: file.name,
          type: getType(file.type),
          size: formatSize(file.size),
          date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
          url,
          thumb: getType(file.type) === 'image' ? url : undefined,
        }
        setMedias(prev => [newMedia, ...prev])
      }
      reader.readAsDataURL(file)
    })
  }

  function removeMedia(id: number) {
    setMedias(medias.filter(m => m.id !== id))
    setMenuOpen(null)
  }

  const typeIcon = (m: Media) => {
    if (m.thumb) return <img src={m.thumb} alt={m.name} className="w-full h-full object-cover" />
    if (m.type === 'image') return <Image size={32} className="text-blue-400" />
    if (m.type === 'video') return <Video size={32} className="text-purple-400" />
    if (m.type === 'audio') return <Headphones size={32} className="text-green-400" />
    if (m.type === 'doc') return <FileText size={32} className="text-orange-400" />
    return <Globe size={32} className="text-gray-400" />
  }

  return (
    <div className="space-y-4" onClick={() => setMenuOpen(null)}>
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'bg-orange-50 text-orange-500' : 'text-gray-400 hover:bg-gray-50'}`}>
            <Grid3X3 size={16} />
          </button>
          <button onClick={() => setView('list')} className={`p-2 ${view === 'list' ? 'bg-orange-50 text-orange-500' : 'text-gray-400 hover:bg-gray-50'}`}>
            <List size={16} />
          </button>
        </div>
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Upload size={15} /> Importer un média
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          className="hidden" onChange={e => e.target.files && handleFiles(e.target.files)} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
              ${tab === t.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        className={`border-2 border-dashed rounded-xl py-6 text-center transition-colors
          ${dragging ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
        <Upload size={24} className={`mx-auto mb-2 ${dragging ? 'text-orange-500' : 'text-gray-300'}`} />
        <p className="text-sm text-gray-400">
          Glissez-déposez vos fichiers ici ou{' '}
          <button onClick={() => fileRef.current?.click()} className="text-orange-500 hover:underline font-medium">
            parcourez votre PC
          </button>
        </p>
        <p className="text-xs text-gray-300 mt-1">Images, Vidéos, Audio, PDF supportés</p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-3 border-b border-gray-100 text-xs text-gray-400">
          {filtered.length} article{filtered.length > 1 ? 's' : ''}
        </div>

        {view === 'grid' ? (
          <div className="grid grid-cols-4 gap-4 p-4">
            {filtered.map(m => (
              <div key={m.id} className="group relative border border-gray-200 rounded-xl overflow-hidden hover:border-orange-300 transition-colors">
                <div className="h-32 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {typeIcon(m)}
                </div>
                <div className="p-3">
                  <div className="text-xs font-medium text-gray-700 truncate">{m.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{m.size} · {m.date}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === m.id ? null : m.id) }}
                  className="absolute top-2 right-2 p-1 bg-white rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical size={14} />
                </button>
                {menuOpen === m.id && (
                  <div className="absolute top-8 right-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[130px]" onClick={e => e.stopPropagation()}>
                    {m.url && <button onClick={() => { setPreview(m); setMenuOpen(null) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"><Eye size={13} /> Aperçu</button>}
                    {m.url && <a href={m.url} download={m.name}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50"><Download size={13} /> Télécharger</a>}
                    <button onClick={() => removeMedia(m.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50"><Trash2 size={13} /> Supprimer</button>
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && <div className="col-span-4 py-12 text-center text-gray-400 text-sm">Aucun média</div>}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">NOM</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">TYPE</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">TAILLE</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">DATE</th>
              <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium">ACTIONS</th>
            </tr></thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center overflow-hidden shrink-0">
                        {m.thumb ? <img src={m.thumb} alt="" className="w-full h-full object-cover" /> : typeIcon(m)}
                      </div>
                      <span className="text-gray-700 text-sm">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize text-xs">{m.type}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{m.size}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{m.date}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {m.url && <button onClick={() => setPreview(m)} className="p-1 text-gray-400 hover:text-gray-600"><Eye size={15} /></button>}
                      {m.url && <a href={m.url} download={m.name} className="p-1 text-gray-400 hover:text-gray-600"><Download size={15} /></a>}
                      <button onClick={() => removeMedia(m.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-gray-400 text-sm">Aucun média</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-medium text-gray-700 text-sm truncate">{preview.name}</span>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-4 flex items-center justify-center min-h-[300px] bg-gray-50">
              {preview.type === 'image' && <img src={preview.url} alt={preview.name} className="max-h-[500px] max-w-full object-contain rounded-xl" />}
              {preview.type === 'video' && <video src={preview.url} controls className="max-h-[500px] max-w-full rounded-xl" />}
              {preview.type === 'audio' && <audio src={preview.url} controls className="w-full" />}
              {(preview.type === 'doc' || preview.type === 'other') && (
                <div className="text-center">
                  <FileText size={64} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Aperçu non disponible</p>
                  <a href={preview.url} download={preview.name}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
                    <Download size={14} /> Télécharger
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
