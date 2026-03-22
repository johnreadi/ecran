import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import {
  ChevronLeft, Save, Eye, Upload, Image,
  MonitorPlay, Plus, GripVertical, X, Film
} from 'lucide-react'

interface Slide {
  id: string
  type: 'image' | 'video' | 'web' | 'composition'
  src?: string
  url?: string
  duration: number
  name: string
  thumb?: string
}

interface Playlist {
  id: string
  name: string
  description: string
  slides: Slide[]
  settings: {
    transition?: string
    transitionDuration?: number
    randomOrder?: boolean
    blackScreenBetweenVideos?: boolean
    syncPlayback?: boolean
  }
}

interface Media {
  id: string
  name: string
  type: string
  url: string
  thumb?: string
}

const TRANSITIONS = [
  { value: 'none', label: 'Aucune' },
  { value: 'fade', label: 'Fondu' },
  { value: 'slide', label: 'Glissement' },
  { value: 'zoom', label: 'Zoom' },
]

export default function PlaylistEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [settings, setSettings] = useState<Playlist['settings']>({})
  const [medias, setMedias] = useState<Media[]>([])
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video' | 'web'>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [selectedSlide, setSelectedSlide] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [plRes, medRes] = await Promise.all([
        api.get(`/playlists/${id}`),
        api.get('/medias').catch(() => ({ data: [] })),
      ])
      const pl = plRes.data
      setPlaylist(pl)
      setSlides(pl.slides || [])
      setSettings(pl.settings || {})
      setMedias(medRes.data || [])
    } catch {
      navigate('/playlists')
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      await api.put(`/playlists/${id}`, {
        name: playlist?.name,
        description: playlist?.description,
        slides,
        settings,
      })
    } catch {} finally { setSaving(false) }
  }

  const updatePlaylistMeta = (field: 'name' | 'description', value: string) => {
    setPlaylist(p => p ? { ...p, [field]: value } : null)
  }

  const addSlide = (media: Media) => {
    const newSlide: Slide = {
      id: Date.now().toString() + Math.random(),
      type: media.type.includes('video') ? 'video' : media.type.includes('web') ? 'web' : 'image',
      src: media.url,
      name: media.name,
      thumb: media.thumb || media.url,
      duration: media.type.includes('video') ? 0 : 10,
    }
    setSlides(s => [...s, newSlide])
  }

  const removeSlide = (slideId: string) => {
    setSlides(s => s.filter(x => x.id !== slideId))
    if (selectedSlide === slideId) setSelectedSlide(null)
  }

  const updateSlideDuration = (slideId: string, duration: number) => {
    setSlides(s => s.map(x => x.id === slideId ? { ...x, duration: Math.max(1, duration) } : x))
  }

  const moveSlide = (fromIndex: number, toIndex: number) => {
    const newSlides = [...slides]
    const [removed] = newSlides.splice(fromIndex, 1)
    newSlides.splice(toIndex, 0, removed)
    setSlides(newSlides)
  }

  const handleDragStart = (e: React.DragEvent, slideId: string) => {
    setDragging(slideId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    if (!dragging) return
    const fromIndex = slides.findIndex(s => s.id === dragging)
    if (fromIndex !== -1 && fromIndex !== toIndex) {
      moveSlide(fromIndex, toIndex)
    }
    setDragging(null)
    setDragOverIndex(null)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        const url = ev.target?.result as string
        const isVideo = file.type.startsWith('video/')
        const newSlide: Slide = {
          id: Date.now().toString() + Math.random(),
          type: isVideo ? 'video' : 'image',
          src: url,
          name: file.name,
          thumb: url,
          duration: isVideo ? 0 : 10,
        }
        setSlides(s => [...s, newSlide])
      }
      reader.readAsDataURL(file)
    })
  }

  const totalDuration = slides.reduce((acc, s) => acc + (s.duration || 0), 0)
  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Preview logic
  useEffect(() => {
    if (!showPreview || !isPlaying || slides.length === 0) return
    const currentSlide = slides[previewIndex]
    if (!currentSlide) return
    const duration = currentSlide.duration * 1000
    const timer = setTimeout(() => {
      setPreviewIndex(i => (i + 1) % slides.length)
    }, duration)
    return () => clearTimeout(timer)
  }, [showPreview, isPlaying, previewIndex, slides])

  const openPreview = () => {
    setPreviewIndex(0)
    setIsPlaying(true)
    setShowPreview(true)
  }

  const closePreview = () => {
    setShowPreview(false)
    setIsPlaying(false)
  }

  const goToSlide = (index: number) => {
    setPreviewIndex(index)
  }

  const togglePlay = () => {
    setIsPlaying(p => !p)
  }

  const filteredMedias = medias.filter(m => {
    if (mediaFilter === 'all') return true
    if (mediaFilter === 'image') return m.type.includes('image')
    if (mediaFilter === 'video') return m.type.includes('video')
    if (mediaFilter === 'web') return m.type.includes('web')
    return true
  })

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>
  if (!playlist) return null

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link to="/playlists" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
          <ChevronLeft size={16} /> Playlists
        </Link>
        <div className="w-px h-6 bg-gray-200" />
        <h1 className="text-lg font-semibold text-gray-800">Contenu de la Playlist</h1>
        <div className="flex-1" />
        <button onClick={() => {}} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
          Annuler
        </button>
        <button onClick={openPreview} disabled={slides.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
          <Eye size={16} /> Aperçu
        </button>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg disabled:opacity-50">
          <Save size={16} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Playlist info */}
          <div className="bg-white border-b px-6 py-4 space-y-3">
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-600 w-20">Nom*</label>
              <input value={playlist.name} onChange={e => updatePlaylistMeta('name', e.target.value)}
                className="flex-1 max-w-md px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <Link to="#" className="text-sm text-orange-500 hover:underline">
                Voir où cette playlist est déjà utilisée
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-600 w-20">Description</label>
              <input value={playlist.description || ''} onChange={e => updatePlaylistMeta('description', e.target.value)}
                placeholder="Saisir une description"
                className="flex-1 max-w-md px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>

            {/* Settings sections */}
            <div className="pt-2">
              <button onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                {showSettings ? '▼' : '▶'} Options de transition
              </button>
              {showSettings && (
                <div className="mt-3 grid grid-cols-2 gap-6 pl-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Ajouter un écran noir entre les vidéos</div>
                      <div className="text-xs text-gray-400">Insère un écran noir entre chaque vidéo</div>
                    </div>
                    <button onClick={() => setSettings(s => ({ ...s, blackScreenBetweenVideos: !s.blackScreenBetweenVideos }))}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.blackScreenBetweenVideos ? 'bg-orange-500' : 'bg-gray-200'}`}>
                      <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.blackScreenBetweenVideos ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Transitions d'images</div>
                      <div className="text-xs text-gray-400">Activer les transitions entre les images</div>
                    </div>
                    <select value={settings.transition || 'none'} onChange={e => setSettings(s => ({ ...s, transition: e.target.value }))}
                      className="px-3 py-1.5 border rounded-lg text-sm">
                      {TRANSITIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Lecture aléatoire</div>
                      <div className="text-xs text-gray-400">Lire les slides dans un ordre aléatoire</div>
                    </div>
                    <button onClick={() => setSettings(s => ({ ...s, randomOrder: !s.randomOrder }))}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.randomOrder ? 'bg-orange-500' : 'bg-gray-200'}`}>
                      <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.randomOrder ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800">Playlist</h3>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600">
                  <Plus size={14} /> Importer un média
                </button>
                <span>Durée totale <span className="font-mono font-medium text-gray-800">{formatDuration(totalDuration)}</span></span>
                <span className="text-gray-400">+{slides.length} élément{slides.length > 1 ? 's' : ''}</span>
              </div>
            </div>

            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*" onChange={handleFileUpload} />

            {/* Slides timeline */}
            <div className="flex gap-3 overflow-x-auto pb-4 min-h-[200px]">
              {slides.map((slide, index) => (
                <div key={slide.id}
                  draggable
                  onDragStart={e => handleDragStart(e, slide.id)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDrop={e => handleDrop(e, index)}
                  onClick={() => setSelectedSlide(slide.id)}
                  className={`relative flex-shrink-0 w-36 group cursor-pointer ${dragOverIndex === index ? 'ring-2 ring-orange-400' : ''} ${selectedSlide === slide.id ? 'ring-2 ring-blue-400' : ''}`}>
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                    {slide.thumb ? (
                      slide.type === 'video' ? (
                        <video src={slide.thumb} className="w-full h-full object-cover" />
                      ) : (
                        <img src={slide.thumb} alt={slide.name} className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        {slide.type === 'video' ? <Film size={24} /> : <Image size={24} />}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <button onClick={e => { e.stopPropagation(); removeSlide(slide.id) }}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                    <div className="absolute top-1 left-1 p-1 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                      <GripVertical size={12} />
                    </div>
                  </div>
                  {/* Duration control */}
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <button onClick={e => { e.stopPropagation(); updateSlideDuration(slide.id, slide.duration - 1) }}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600">-</button>
                    <span className="text-xs font-mono text-gray-600 w-10 text-center">{slide.duration}"</span>
                    <button onClick={e => { e.stopPropagation(); updateSlideDuration(slide.id, slide.duration + 1) }}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600">+</button>
                  </div>
                  <div className="text-xs text-gray-400 truncate px-1">{slide.name}</div>
                </div>
              ))}
              {slides.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12 border-2 border-dashed border-gray-200 rounded-xl">
                  <MonitorPlay size={40} className="mb-3 opacity-30" />
                  <p className="text-sm">Glissez des médias ici ou cliquez sur Importer</p>
                </div>
              )}
            </div>

            {/* Library */}
            <div className="mt-8 border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-800">Bibliothèque</h3>
                <div className="flex items-center gap-2">
                  {(['all', 'image', 'video', 'web'] as const).map(f => (
                    <button key={f} onClick={() => setMediaFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mediaFilter === f ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {f === 'all' ? 'Tous' : f === 'image' ? 'Images' : f === 'video' ? 'Vidéos' : 'Pages Web'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-6 gap-3">
                {filteredMedias.map(media => (
                  <button key={media.id} onClick={() => addSlide(media)}
                    className="group relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-orange-400 transition-colors">
                    {media.thumb || media.url ? (
                      <img src={media.thumb || media.url} alt={media.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        {media.type.includes('video') ? <Film size={20} /> : <Image size={20} />}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <Plus size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
                      <div className="text-xs text-white truncate">{media.name}</div>
                    </div>
                  </button>
                ))}
                <button onClick={() => fileInputRef.current?.click()}
                  className="aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 transition-colors">
                  <Upload size={20} className="mb-1" />
                  <span className="text-xs">Importer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col" onClick={closePreview}>
          {/* Preview Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-black/50 text-white">
            <div className="flex items-center gap-3">
              <MonitorPlay size={20} />
              <span className="font-medium">Aperçu : {playlist?.name}</span>
              <span className="text-sm text-gray-400">
                Slide {previewIndex + 1} / {slides.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={e => { e.stopPropagation(); togglePlay() }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm">
                {isPlaying ? '⏸ Pause' : '▶ Lecture'}
              </button>
              <button onClick={closePreview} className="p-2 hover:bg-white/10 rounded-lg">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 flex items-center justify-center p-8" onClick={e => e.stopPropagation()}>
            {slides[previewIndex] && (
              <div className="relative max-w-4xl max-h-full">
                {slides[previewIndex].type === 'video' ? (
                  <video src={slides[previewIndex].src || slides[previewIndex].thumb}
                    className="max-w-full max-h-[70vh] rounded-lg shadow-2xl"
                    autoPlay muted loop={false}
                    onEnded={() => setPreviewIndex(i => (i + 1) % slides.length)} />
                ) : (
                  <img src={slides[previewIndex].src || slides[previewIndex].thumb}
                    alt={slides[previewIndex].name}
                    className="max-w-full max-h-[70vh] rounded-lg shadow-2xl object-contain" />
                )}
                {/* Slide info */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 text-white px-4 py-2 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{slides[previewIndex].name}</span>
                    <span className="text-sm text-gray-300">{slides[previewIndex].duration}s</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview Timeline */}
          <div className="bg-black/50 px-6 py-4" onClick={e => e.stopPropagation()}>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {slides.map((slide, idx) => (
                <button key={slide.id} onClick={() => goToSlide(idx)}
                  className={`relative flex-shrink-0 w-24 aspect-video rounded-lg overflow-hidden border-2 transition-all
                    ${idx === previewIndex ? 'border-orange-500 ring-2 ring-orange-500/50' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  {slide.thumb || slide.src ? (
                    <img src={slide.thumb || slide.src} alt={slide.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <Image size={20} className="text-gray-600" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-black/60 text-white text-xs truncate">
                    {slide.duration}s
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
