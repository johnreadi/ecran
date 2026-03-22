import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import {
  ChevronLeft, Save, Eye, Undo, Redo, ZoomIn, ZoomOut, Grid3X3,
  Type, Image, Square, Layout, Layers, Palette,
  Settings, X, Trash2, Copy, MonitorPlay,
  BringToFront, SendToBack, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline,
  Clock, Cloud, Calendar, Globe, BarChart2, QrCode,
  MessageSquare, Rss, Youtube, Twitter, Play, Newspaper, ExternalLink,
  Zap, Sparkles
} from 'lucide-react'

// ─── Animation types ───────────────────────────────────────────────────────────
interface ElementAnimation {
  type: 'none' | 'fadeIn' | 'fadeOut' | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown'
    | 'zoomIn' | 'zoomOut' | 'bounce' | 'rotate' | 'pulse' | 'flip'
  duration: number   // secondes
  delay: number      // secondes
  repeat: 'none' | 'loop' | 'alternate'
  trigger: 'auto' | 'onLoad'
}

interface Element {
  id: string
  type: 'text' | 'image' | 'shape' | 'video' | 'widget'
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  content?: string
  src?: string
  shapeType?: 'rect' | 'circle' | 'triangle' | 'star' | 'diamond' | 'line' | 'arrow' | 'rounded-rect' | 'hexagon'
  widgetType?: string
  widgetConfig?: {
    // Date & Heure
    timeFormat?: '12h' | '24h'
    showDate?: boolean
    showSeconds?: boolean
    timezone?: string
    dateFormat?: string
    // Météo
    city?: string
    weatherUnit?: 'celsius' | 'fahrenheit'
    showForecast?: boolean
    // Calendrier
    calendarView?: 'month' | 'week' | 'agenda'
    calendarUrl?: string
    // Texte Défilant
    tickerText?: string
    tickerSpeed?: number
    tickerDirection?: 'left' | 'right'
    // Page Web
    url?: string
    refreshInterval?: number
    // QR Code
    qrData?: string
    qrErrorLevel?: 'L' | 'M' | 'Q' | 'H'
    // YouTube
    youtubeUrl?: string
    youtubeAutoplay?: boolean
    youtubeMuted?: boolean
    // RSS
    rssUrl?: string
    rssMaxItems?: number
    rssScrollSpeed?: number
    // Twitter/X
    twitterHandle?: string
    twitterCount?: number
    // Graphiques
    chartType?: 'bar' | 'line' | 'pie' | 'donut'
    chartTitle?: string
    chartData?: string
    // Diaporama
    slideshowInterval?: number
    slideshowTransition?: 'fade' | 'slide' | 'zoom'
    // Lecteur Vidéo
    videoUrl?: string
    videoLoop?: boolean
    videoMuted?: boolean
  }
  animation?: ElementAnimation
  style?: {
    backgroundColor?: string
    color?: string
    fontSize?: number
    fontWeight?: string
    fontStyle?: string
    textDecoration?: string
    textAlign?: string
    fontFamily?: string
    lineHeight?: number
    letterSpacing?: number
    borderRadius?: number
    borderWidth?: number
    borderColor?: string
    borderStyle?: string
    opacity?: number
    zIndex?: number
    // image/video specific
    objectFit?: string
    filter?: string
    boxShadow?: string
    // shape gradient
    gradient?: string
  }
}

interface Composition {
  id: string
  name: string
  width: number
  height: number
  backgroundColor: string
  elements: Element[]
}

const CANVAS_WIDTH = 1920
const CANVAS_HEIGHT = 1080

const FONTS = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
  'Roboto', 'Open Sans', 'Montserrat', 'Lato', 'Poppins',
  'Oswald', 'Raleway', 'PT Sans', 'Merriweather', 'Playfair Display',
  'Impact', 'Comic Sans MS', 'Courier New', 'Trebuchet MS', 'Tahoma'
]

const SHAPES = [
  { type: 'rect', label: 'Rectangle', svg: <rect x="2" y="2" width="20" height="20" rx="0" /> },
  { type: 'circle', label: 'Cercle', svg: <circle cx="12" cy="12" r="10" /> },
  { type: 'rounded-rect', label: 'Rect. arrondi', svg: <rect x="2" y="2" width="20" height="20" rx="6" /> },
  { type: 'triangle', label: 'Triangle', svg: <polygon points="12,2 22,22 2,22" /> },
  { type: 'star', label: 'Étoile', svg: <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" /> },
  { type: 'diamond', label: 'Losange', svg: <polygon points="12,2 22,12 12,22 2,12" /> },
  { type: 'hexagon', label: 'Hexagone', svg: <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" /> },
  { type: 'line', label: 'Ligne', svg: <line x1="2" y1="12" x2="22" y2="12" strokeWidth="3" /> },
  { type: 'arrow', label: 'Flèche', svg: <><line x1="2" y1="12" x2="20" y2="12" strokeWidth="2.5" /><polyline points="14,6 20,12 14,18" strokeWidth="2.5" fill="none" /></> },
]

const SHAPE_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#1f2937',
  '#ffffff', '#000000',
]

const TEXT_PRESETS = [
  { label: 'Titre principal', fontSize: 72, fontWeight: 'bold', content: 'Titre principal' },
  { label: 'Sous-titre', fontSize: 48, fontWeight: '600', content: 'Sous-titre' },
  { label: 'Texte courant', fontSize: 32, fontWeight: 'normal', content: 'Texte courant' },
  { label: 'Légende', fontSize: 24, fontWeight: 'normal', content: 'Légende / description' },
  { label: 'Prix', fontSize: 80, fontWeight: 'bold', content: '19,99 €', color: '#f97316' },
  { label: 'Annonce', fontSize: 56, fontWeight: 'bold', content: '⚡ PROMOTION', color: '#ef4444' },
]

const FILTERS = [
  { label: 'Aucun', value: 'none' },
  { label: 'Noir & blanc', value: 'grayscale(100%)' },
  { label: 'Sépia', value: 'sepia(80%)' },
  { label: 'Contraste +', value: 'contrast(150%)' },
  { label: 'Luminosité +', value: 'brightness(130%)' },
  { label: 'Flou léger', value: 'blur(2px)' },
  { label: 'Saturé', value: 'saturate(200%)' },
  { label: 'Inversé', value: 'invert(100%)' },
]

// ─── Apps disponibles ─────────────────────────────────────────────────────────
const APPS_LIST = [
  { id: 'clock', name: 'Date & Heure', desc: 'Horloge numérique avec date', icon: Clock, color: '#3b82f6', category: 'Heure', emoji: '🕐' },
  { id: 'weather', name: 'Météo', desc: 'Météo actuelle et prévisions', icon: Cloud, color: '#06b6d4', category: 'Météo', emoji: '🌤️' },
  { id: 'calendar', name: 'Calendrier', desc: 'Calendrier mensuel / hebdo', icon: Calendar, color: '#f59e0b', category: 'Calendriers', emoji: '📅' },
  { id: 'slideshow', name: 'Diaporama', desc: 'Slideshow automatique', icon: Image, color: '#8b5cf6', category: 'Général', emoji: '🖼️' },
  { id: 'webpage', name: 'Page Web', desc: 'Intégrez n\'importe quelle URL', icon: Globe, color: '#10b981', category: 'Général', emoji: '🌐' },
  { id: 'charts', name: 'Graphiques', desc: 'Données en temps réel', icon: BarChart2, color: '#f97316', category: 'Infos', emoji: '📊' },
  { id: 'qrcode', name: 'QR Code', desc: 'QR codes dynamiques', icon: QrCode, color: '#1f2937', category: 'Général', emoji: '⬛' },
  { id: 'ticker', name: 'Texte Défilant', desc: 'Bannière de texte animé', icon: MessageSquare, color: '#ef4444', category: 'Général', emoji: '📝' },
  { id: 'rss', name: 'Flux RSS', desc: 'Actualités RSS en temps réel', icon: Rss, color: '#f97316', category: 'Infos', emoji: '📡' },
  { id: 'youtube', name: 'YouTube', desc: 'Diffusez des vidéos YouTube', icon: Youtube, color: '#ef4444', category: 'Général', emoji: '▶️' },
  { id: 'twitter', name: 'Twitter/X', desc: 'Flux Twitter/X en temps réel', icon: Twitter, color: '#1d4ed8', category: 'Infos', emoji: '𝕏' },
  { id: 'video', name: 'Lecteur Vidéo', desc: 'Lecture en boucle de vidéos', icon: Play, color: '#7c3aed', category: 'Général', emoji: '🎬' },
  { id: 'news', name: 'Actualités', desc: 'Titres d\'actualités agrégés', icon: Newspaper, color: '#374151', category: 'Infos', emoji: '📰' },
  { id: 'link', name: 'Lien Externe', desc: 'Redirigez vers une URL', icon: ExternalLink, color: '#0ea5e9', category: 'Général', emoji: '🔗' },
]

const APP_CATEGORIES = ['Toutes', 'Heure', 'Météo', 'Calendriers', 'Infos', 'Général']

// ─── Animations disponibles ───────────────────────────────────────────────────
const ANIMATION_TYPES = [
  { value: 'none', label: 'Aucune', emoji: '⛔' },
  { value: 'fadeIn', label: 'Apparition', emoji: '✨' },
  { value: 'fadeOut', label: 'Disparition', emoji: '🌫️' },
  { value: 'slideLeft', label: 'Glisser ←', emoji: '⬅️' },
  { value: 'slideRight', label: 'Glisser →', emoji: '➡️' },
  { value: 'slideUp', label: 'Glisser ↑', emoji: '⬆️' },
  { value: 'slideDown', label: 'Glisser ↓', emoji: '⬇️' },
  { value: 'zoomIn', label: 'Zoom avant', emoji: '🔍' },
  { value: 'zoomOut', label: 'Zoom arrière', emoji: '🔎' },
  { value: 'bounce', label: 'Rebond', emoji: '🏀' },
  { value: 'rotate', label: 'Rotation', emoji: '🔄' },
  { value: 'pulse', label: 'Pulsation', emoji: '💓' },
  { value: 'flip', label: 'Retournement', emoji: '🔃' },
]

const DEFAULT_ANIMATION: ElementAnimation = {
  type: 'none', duration: 1, delay: 0, repeat: 'none', trigger: 'auto'
}

// ─── CSS keyframes injectés dans le DOM ───────────────────────────────────────
const ANIMATION_CSS = `
@keyframes ce-fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes ce-fadeOut { from { opacity: 1 } to { opacity: 0 } }
@keyframes ce-slideLeft { from { transform: translateX(100%) } to { transform: translateX(0) } }
@keyframes ce-slideRight { from { transform: translateX(-100%) } to { transform: translateX(0) } }
@keyframes ce-slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
@keyframes ce-slideDown { from { transform: translateY(-100%) } to { transform: translateY(0) } }
@keyframes ce-zoomIn { from { transform: scale(0.2); opacity: 0 } to { transform: scale(1); opacity: 1 } }
@keyframes ce-zoomOut { from { transform: scale(2); opacity: 0 } to { transform: scale(1); opacity: 1 } }
@keyframes ce-bounce { 0%,100% { transform: translateY(0) } 30% { transform: translateY(-20%) } 60% { transform: translateY(-10%) } }
@keyframes ce-rotate { from { transform: rotate(-180deg); opacity: 0 } to { transform: rotate(0deg); opacity: 1 } }
@keyframes ce-pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.08) } }
@keyframes ce-flip { from { transform: rotateY(90deg); opacity: 0 } to { transform: rotateY(0deg); opacity: 1 } }
`

export default function CompositionEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [composition, setComposition] = useState<Composition | null>(null)
  const [elements, setElements] = useState<Element[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(0.5)
  const [showGrid, setShowGrid] = useState(true)
  const [sidebarTab, setSidebarTab] = useState<'templates' | 'media' | 'text' | 'elements' | 'apps' | 'settings'>('templates')
  const [history, setHistory] = useState<Element[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#3b82f6')

  // Template states
  const [templateTab, setTemplateTab] = useState<'pour-vous' | 'decouvrir'>('pour-vous')
  const [templateSearch, setTemplateSearch] = useState('')
  const [templateCategory, setTemplateCategory] = useState('Pour vous')

  // Apps states
  const [appSearch, setAppSearch] = useState('')
  const [appCategory, setAppCategory] = useState('Toutes')

  // Inject animation CSS keyframes once
  useEffect(() => {
    if (!document.getElementById('ce-animation-styles')) {
      const style = document.createElement('style')
      style.id = 'ce-animation-styles'
      style.textContent = ANIMATION_CSS
      document.head.appendChild(style)
    }
  }, [])

  useEffect(() => {
    if (id === 'new') {
      const newComp: Composition = {
        id: 'new', name: 'Nouvelle composition',
        width: CANVAS_WIDTH, height: CANVAS_HEIGHT,
        backgroundColor: '#ffffff', elements: []
      }
      setComposition(newComp)
      setElements([])
      saveHistory([])
    } else {
      loadComposition()
    }
  }, [id])

  const loadComposition = async () => {
    try {
      const res = await api.get(`/compositions/${id}`)
      const comp = res.data
      setComposition(comp)
      setElements(comp.elements || [])
      saveHistory(comp.elements || [])
    } catch {
      const newComp: Composition = {
        id: id || 'new', name: 'Composition ' + id?.slice(0, 6),
        width: CANVAS_WIDTH, height: CANVAS_HEIGHT,
        backgroundColor: '#f5f5f5', elements: []
      }
      setComposition(newComp)
      setElements([])
      saveHistory([])
    }
  }

  const saveHistory = (els: Element[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push([...els])
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setElements([...history[historyIndex - 1]])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setElements([...history[historyIndex + 1]])
    }
  }

  const addElement = (type: Element['type'], defaults: Partial<Element> = {}) => {
    const newEl: Element = {
      id: Date.now().toString(),
      type,
      x: 80 + Math.random() * 120,
      y: 80 + Math.random() * 120,
      width: defaults.width || (type === 'text' ? 300 : type === 'shape' ? 160 : 200),
      height: defaults.height || (type === 'text' ? 60 : type === 'shape' ? 160 : 150),
      content: defaults.content || (type === 'text' ? 'Votre texte ici' : ''),
      src: defaults.src,
      shapeType: defaults.shapeType || 'rect',
      widgetType: defaults.widgetType,
      widgetConfig: defaults.widgetConfig,
      style: {
        backgroundColor: type === 'shape' ? selectedColor : type === 'text' ? 'transparent' : undefined,
        color: '#000000',
        fontSize: 32,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        lineHeight: 1.4,
        letterSpacing: 0,
        borderRadius: 0,
        borderWidth: 0,
        borderColor: '#000000',
        borderStyle: 'solid',
        opacity: 1,
        objectFit: 'cover',
        filter: 'none',
        zIndex: elements.length,
        ...defaults.style
      }
    }
    const newElements = [...elements, newEl]
    setElements(newElements)
    saveHistory(newElements)
    setSelectedId(newEl.id)
    setSidebarTab(type === 'text' ? 'text' : type === 'shape' ? 'elements' : 'media')
  }

  const updateElement = (id: string, updates: Partial<Element>) => {
    const newElements = elements.map(el => el.id === id ? { ...el, ...updates } : el)
    setElements(newElements)
  }

  const updateStyle = (id: string, styleUpdates: Partial<Element['style']>) => {
    const el = elements.find(e => e.id === id)
    if (!el) return
    updateElement(id, { style: { ...el.style, ...styleUpdates } })
  }

  const deleteElement = (id: string) => {
    const newElements = elements.filter(el => el.id !== id)
    setElements(newElements)
    saveHistory(newElements)
    setSelectedId(null)
  }

  const duplicateElement = (id: string) => {
    const el = elements.find(e => e.id === id)
    if (!el) return
    const newEl = { ...el, id: Date.now().toString(), x: el.x + 20, y: el.y + 20 }
    const newElements = [...elements, newEl]
    setElements(newElements)
    saveHistory(newElements)
    setSelectedId(newEl.id)
  }

  const bringToFront = (id: string) => {
    const maxZ = Math.max(...elements.map(e => e.style?.zIndex || 0))
    updateStyle(id, { zIndex: maxZ + 1 })
  }

  const sendToBack = (id: string) => {
    const minZ = Math.min(...elements.map(e => e.style?.zIndex || 0))
    updateStyle(id, { zIndex: minZ - 1 })
  }

  const handleMouseDown = (e: React.MouseEvent, elId?: string) => {
    if (elId) {
      setSelectedId(elId)
      setIsDragging(true)
      const el = elements.find(e => e.id === elId)
      if (el) setDragStart({ x: e.clientX - el.x * zoom, y: e.clientY - el.y * zoom })
    } else {
      setSelectedId(null)
    }
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedId) return
    const newX = (e.clientX - dragStart.x) / zoom
    const newY = (e.clientY - dragStart.y) / zoom
    updateElement(selectedId, { x: Math.max(0, newX), y: Math.max(0, newY) })
  }, [isDragging, selectedId, dragStart, zoom])

  const handleMouseUp = () => {
    if (isDragging) { setIsDragging(false); saveHistory(elements) }
  }

  const save = async () => {
    if (!composition) return
    setSaving(true)
    try {
      const data = { ...composition, elements }
      if (id === 'new') await api.post('/compositions', data)
      else await api.put(`/compositions/${id}`, data)
      navigate('/compositions')
    } catch {} finally { setSaving(false) }
  }

  const selectedElement = elements.find(e => e.id === selectedId)

  // ─── Animation helper ─────────────────────────────────────────────────────
  const getAnimationStyle = (anim?: ElementAnimation): React.CSSProperties => {
    if (!anim || anim.type === 'none') return {}
    const iterCount = anim.repeat === 'loop' ? 'infinite'
      : anim.repeat === 'alternate' ? 'infinite' : '1'
    const direction = anim.repeat === 'alternate' ? 'alternate' : 'normal'
    return {
      animation: `ce-${anim.type} ${anim.duration}s ${anim.delay}s ${iterCount} ${direction} both`
    }
  }

  const updateAnimation = (id: string, animUpdates: Partial<ElementAnimation>) => {
    const el = elements.find(e => e.id === id)
    if (!el) return
    updateElement(id, { animation: { ...(el.animation || DEFAULT_ANIMATION), ...animUpdates } })
  }

  const updateWidgetConfig = (id: string, cfg: Partial<Element['widgetConfig']>) => {
    const el = elements.find(e => e.id === id)
    if (!el) return
    updateElement(id, { widgetConfig: { ...(el.widgetConfig || {}), ...cfg } })
  }

  // Render shape SVG on canvas
  const renderShapeSvg = (el: Element) => {
    const fill = el.style?.backgroundColor || '#3b82f6'
    const stroke = el.style?.borderWidth ? el.style.borderColor || '#000' : 'none'
    const sw = el.style?.borderWidth || 0
    const w = el.width * zoom
    const h = el.height * zoom
    const shapeType = el.shapeType || 'rect'

    if (shapeType === 'line') {
      return (
        <svg width={w} height={h} className="absolute inset-0">
          <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke={fill} strokeWidth={Math.max(sw * zoom, 4 * zoom)} />
        </svg>
      )
    }
    if (shapeType === 'arrow') {
      const ah = Math.max(8 * zoom, 1)
      return (
        <svg width={w} height={h} className="absolute inset-0">
          <line x1="0" y1={h / 2} x2={w - ah} y2={h / 2} stroke={fill} strokeWidth={Math.max(sw * zoom, 3 * zoom)} />
          <polyline points={`${w - ah * 2},${h / 2 - ah} ${w},${h / 2} ${w - ah * 2},${h / 2 + ah}`}
            stroke={fill} strokeWidth={Math.max(sw * zoom, 3 * zoom)} fill="none" />
        </svg>
      )
    }
    if (shapeType === 'triangle') {
      return (
        <svg width={w} height={h} className="absolute inset-0">
          <polygon points={`${w / 2},0 ${w},${h} 0,${h}`} fill={fill} stroke={stroke} strokeWidth={sw * zoom} />
        </svg>
      )
    }
    if (shapeType === 'star') {
      const cx = w / 2, cy = h / 2
      const or = Math.min(w, h) / 2, ir = or * 0.4
      const pts = Array.from({ length: 10 }, (_, i) => {
        const angle = (i * Math.PI) / 5 - Math.PI / 2
        const r = i % 2 === 0 ? or : ir
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
      }).join(' ')
      return <svg width={w} height={h} className="absolute inset-0"><polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw * zoom} /></svg>
    }
    if (shapeType === 'diamond') {
      return (
        <svg width={w} height={h} className="absolute inset-0">
          <polygon points={`${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`} fill={fill} stroke={stroke} strokeWidth={sw * zoom} />
        </svg>
      )
    }
    if (shapeType === 'hexagon') {
      const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2
      const pts = Array.from({ length: 6 }, (_, i) => {
        const angle = (i * Math.PI) / 3 - Math.PI / 6
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
      }).join(' ')
      return <svg width={w} height={h} className="absolute inset-0"><polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw * zoom} /></svg>
    }
    return null // rect & circle handled via CSS
  }

  // Templates data
  const templateCategories = ['Pour vous', 'Restaurant', 'Commerce', 'Transport', 'Urgence', 'Entreprise']
  const templatesList = [
    { name: 'Fond blanc', bg: '#ffffff', category: 'Pour vous', emoji: null },
    { name: 'Mode sombre', bg: '#1a1a2e', category: 'Pour vous', emoji: null },
    { name: 'Dégradé violet', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', category: 'Pour vous', emoji: null },
    { name: 'Dégradé rose', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', category: 'Pour vous', emoji: null },
    { name: 'Dégradé vert', bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', category: 'Pour vous', emoji: null },
    { name: 'Nuit bleue', bg: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', category: 'Pour vous', emoji: null },
    { name: 'Menu du jour', bg: 'linear-gradient(135deg, #2d1b00 0%, #6b3a0c 100%)', category: 'Restaurant', emoji: '🍽️' },
    { name: 'Spécial du chef', bg: 'linear-gradient(135deg, #1a0a00 0%, #8b2500 100%)', category: 'Restaurant', emoji: '👨‍🍳' },
    { name: 'Happy Hour', bg: 'linear-gradient(135deg, #1a3a00 0%, #3d8b00 100%)', category: 'Restaurant', emoji: '🍺' },
    { name: 'Promo Flash', bg: 'linear-gradient(135deg, #0a2e1a 0%, #1a7a40 100%)', category: 'Commerce', emoji: '💥' },
    { name: 'Soldes', bg: 'linear-gradient(135deg, #2e0a0a 0%, #7a1a1a 100%)', category: 'Commerce', emoji: '🏷️' },
    { name: 'Arrivée vol', bg: 'linear-gradient(135deg, #0a1a3e 0%, #1a3a8a 100%)', category: 'Transport', emoji: '✈️' },
    { name: 'Horaires bus', bg: 'linear-gradient(135deg, #1a2e1a 0%, #3a6a3a 100%)', category: 'Transport', emoji: '🚌' },
    { name: 'Alerte urgence', bg: 'linear-gradient(135deg, #2e0000 0%, #8a0000 100%)', category: 'Urgence', emoji: '🚨' },
    { name: 'Évacuation', bg: 'linear-gradient(135deg, #2e1a00 0%, #8a5a00 100%)', category: 'Urgence', emoji: '⚠️' },
    { name: 'Corporate', bg: 'linear-gradient(135deg, #1a1a1a 0%, #3a3a3a 100%)', category: 'Entreprise', emoji: '📊' },
    { name: 'Réunion', bg: 'linear-gradient(135deg, #0a1a3e 0%, #1a2e6a 100%)', category: 'Entreprise', emoji: '📅' },
  ]
  const filteredTemplates = templatesList.filter(t => {
    const matchCat = templateCategory === 'Pour vous' || t.category === templateCategory
    return matchCat && t.name.toLowerCase().includes(templateSearch.toLowerCase())
  })

  if (!composition) return <div className="p-8 text-center">Chargement...</div>

  const inputCls = "w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
  const labelCls = "text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-1 block"
  const sectionCls = "border-t border-gray-100 pt-3 mt-3"

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b px-4 py-2 flex items-center gap-4 shrink-0">
        <Link to="/compositions" className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm">
          <ChevronLeft size={16} /> Compositions
        </Link>
        <div className="w-px h-6 bg-gray-200" />
        <input value={composition.name} onChange={e => setComposition({ ...composition, name: e.target.value })}
          className="font-medium text-gray-800 border-none focus:ring-0 bg-transparent text-sm" />
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={historyIndex <= 0} title="Annuler" className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"><Undo size={16} /></button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Rétablir" className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"><Redo size={16} /></button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-2 hover:bg-gray-100 rounded"><ZoomOut size={16} /></button>
          <span className="text-xs text-gray-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 hover:bg-gray-100 rounded"><ZoomIn size={16} /></button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <button onClick={() => setShowGrid(!showGrid)} title="Grille" className={`p-2 rounded ${showGrid ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Grid3X3 size={16} /></button>
          <button onClick={() => setSidebarTab('settings')} title="Fond" className="p-2 hover:bg-gray-100 rounded"><Palette size={16} /></button>
          <button title="Calques" className="p-2 hover:bg-gray-100 rounded"><Layers size={16} /></button>
        </div>
        <div className="flex-1" />
        <button onClick={() => setShowPreview(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"><Eye size={16} /> Aperçu</button>
        <button onClick={() => navigate('/compositions')} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
        <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          <Save size={16} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Icon sidebar */}
        <aside className="w-16 bg-white border-r flex flex-col items-center py-3 gap-1 shrink-0">
          {[
            { id: 'templates', icon: Layout, label: 'Modèles' },
            { id: 'media', icon: Image, label: 'Médias' },
            { id: 'text', icon: Type, label: 'Texte' },
            { id: 'elements', icon: Square, label: 'Éléments' },
            { id: 'apps', icon: Zap, label: 'Apps' },
            { id: 'settings', icon: Settings, label: 'Paramètres' },
          ].map(tool => (
            <button key={tool.id} onClick={() => setSidebarTab(tool.id as any)}
              className={`w-12 h-12 flex flex-col items-center justify-center rounded-lg transition-colors ${sidebarTab === tool.id ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-100'}`}>
              <tool.icon size={20} />
              <span className="text-[9px] mt-0.5 leading-none">{tool.label}</span>
            </button>
          ))}
        </aside>

        {/* Sidebar content */}
        <div className="w-64 bg-white border-r overflow-y-auto shrink-0">

          {/* ── MODÈLES ── */}
          {sidebarTab === 'templates' && (
            <div className="flex flex-col h-full">
              <div className="flex border-b border-gray-100 shrink-0">
                {(['pour-vous', 'decouvrir'] as const).map(t => (
                  <button key={t} onClick={() => setTemplateTab(t)}
                    className={`flex-1 py-2.5 text-xs font-medium transition-colors ${templateTab === t ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-700'}`}>
                    {t === 'pour-vous' ? 'Mes modèles' : 'Découvrir'}
                  </button>
                ))}
              </div>
              <div className="px-3 py-2 shrink-0">
                <div className="relative">
                  <input value={templateSearch} onChange={e => setTemplateSearch(e.target.value)}
                    placeholder="Rechercher..." className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400" />
                  <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>
              <div className="px-3 pb-2 flex flex-wrap gap-1 shrink-0">
                {templateCategories.map(cat => (
                  <button key={cat} onClick={() => setTemplateCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${templateCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  {filteredTemplates.map(t => (
                    <button key={t.name} onClick={() => setComposition({ ...composition, backgroundColor: t.bg })}
                      className="group relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-orange-400 transition-all shadow-sm">
                      <div className="w-full h-full" style={{ background: t.bg }}>
                        {t.emoji && <div className="w-full h-full flex items-center justify-center text-2xl">{t.emoji}</div>}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
                        <span className="text-[9px] text-white font-medium">{t.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── MÉDIAS ── */}
          {sidebarTab === 'media' && (
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm">Médias</h3>
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-orange-400 hover:text-orange-500 text-sm flex flex-col items-center gap-1">
                <Image size={20} />
                <span>+ Ajouter image / vidéo</span>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={e => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = ev => {
                    const isVideo = file.type.startsWith('video/')
                    addElement(isVideo ? 'video' : 'image', {
                      src: ev.target?.result as string,
                      width: 400, height: 250
                    })
                  }
                  reader.readAsDataURL(file)
                }
              }} />
              <p className="text-[10px] text-gray-400 text-center">Images : JPG, PNG, GIF, SVG, WEBP<br />Vidéos : MP4, WEBM, MOV</p>
            </div>
          )}

          {/* ── TEXTE ── */}
          {sidebarTab === 'text' && (
            <div className="p-3 space-y-2">
              <h3 className="font-semibold text-gray-800 text-sm mb-3">Ajouter du texte</h3>
              {TEXT_PRESETS.map(preset => (
                <button key={preset.label} onClick={() => addElement('text', {
                  width: 400, height: preset.fontSize * 1.5,
                  content: preset.content,
                  style: {
                    fontSize: preset.fontSize, fontWeight: preset.fontWeight,
                    color: preset.color || '#000000', fontFamily: 'Arial',
                    textAlign: 'center', backgroundColor: 'transparent'
                  }
                })}
                  className="w-full p-2.5 bg-gray-50 hover:bg-orange-50 hover:border-orange-300 border border-transparent rounded-lg text-left transition-colors">
                  <span style={{ fontSize: Math.min(preset.fontSize / 3.5, 18), fontWeight: preset.fontWeight, color: preset.color || '#111' }}>
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* ── ÉLÉMENTS / FORMES ── */}
          {sidebarTab === 'elements' && (
            <div className="p-3 space-y-4">
              <h3 className="font-semibold text-gray-800 text-sm">Formes</h3>

              {/* Couleur active */}
              <div>
                <label className={labelCls}>Couleur de la forme</label>
                <div className="grid grid-cols-6 gap-1.5 mb-2">
                  {SHAPE_COLORS.map(c => (
                    <button key={c} onClick={() => setSelectedColor(c)}
                      className={`w-7 h-7 rounded-md border-2 transition-transform hover:scale-110 ${selectedColor === c ? 'border-orange-500 scale-110' : 'border-gray-200'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-500">Personnalisée :</label>
                  <input type="color" value={selectedColor} onChange={e => setSelectedColor(e.target.value)}
                    className="h-7 w-14 rounded cursor-pointer border border-gray-200" />
                </div>
              </div>

              {/* Grille de formes */}
              <div className="grid grid-cols-3 gap-2">
                {SHAPES.map(s => (
                  <button key={s.type}
                    onClick={() => addElement('shape', {
                      shapeType: s.type as any,
                      width: s.type === 'line' || s.type === 'arrow' ? 200 : 150,
                      height: s.type === 'line' || s.type === 'arrow' ? 40 : 150,
                      style: {
                        backgroundColor: selectedColor,
                        borderRadius: s.type === 'circle' ? 50 : s.type === 'rounded-rect' ? 12 : 0,
                      }
                    })}
                    className="group flex flex-col items-center gap-1.5 p-3 bg-gray-50 hover:bg-orange-50 border border-transparent hover:border-orange-300 rounded-xl transition-colors">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill={selectedColor} stroke={selectedColor} strokeWidth="1">
                      {s.svg}
                    </svg>
                    <span className="text-[9px] text-gray-500 group-hover:text-orange-600 leading-none text-center">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── APPS ── */}
          {sidebarTab === 'apps' && (
            <div className="flex flex-col h-full">
              <div className="px-3 pt-3 pb-2 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} className="text-orange-500" />
                  <h3 className="font-semibold text-gray-800 text-sm">Applications</h3>
                </div>
                <div className="relative mb-2">
                  <input value={appSearch} onChange={e => setAppSearch(e.target.value)}
                    placeholder="Rechercher une app..."
                    className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400" />
                  <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div className="flex flex-wrap gap-1">
                  {APP_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setAppCategory(cat)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${appCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
                {APPS_LIST
                  .filter(a =>
                    (appCategory === 'Toutes' || a.category === appCategory) &&
                    a.name.toLowerCase().includes(appSearch.toLowerCase())
                  )
                  .map(app => {
                    const AppIcon = app.icon
                    return (
                      <button key={app.id}
                        onClick={() => addElement('widget', {
                          width: app.id === 'ticker' ? 500 : app.id === 'clock' ? 280 : 320,
                          height: app.id === 'ticker' ? 80 : app.id === 'clock' ? 120 : 200,
                          widgetType: app.id,
                          content: app.name,
                          style: { backgroundColor: app.color + '22', borderRadius: 8, borderWidth: 1, borderColor: app.color + '66', color: app.color }
                        })}
                        className="w-full flex items-center gap-3 p-2.5 bg-gray-50 hover:bg-orange-50 hover:border-orange-300 border border-transparent rounded-xl transition-colors text-left group">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: app.color + '22' }}>
                          <AppIcon size={18} style={{ color: app.color }} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-gray-700 group-hover:text-orange-700 leading-none mb-0.5">{app.name}</div>
                          <div className="text-[10px] text-gray-400 leading-tight truncate">{app.desc}</div>
                        </div>
                        <span className="ml-auto text-base shrink-0">{app.emoji}</span>
                      </button>
                    )
                  })}
              </div>
              <div className="px-3 py-2 border-t border-gray-100 shrink-0">
                <p className="text-[10px] text-gray-400 text-center">Cliquez sur une app pour l'ajouter au canvas</p>
              </div>
            </div>
          )}

          {/* ── PARAMÈTRES ── */}
          {sidebarTab === 'settings' && (
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-gray-800 text-sm">Paramètres canvas</h3>
              <div>
                <label className={labelCls}>Couleur de fond</label>
                <input type="color" value={composition.backgroundColor.startsWith('#') ? composition.backgroundColor : '#1a1a2e'}
                  onChange={e => setComposition({ ...composition, backgroundColor: e.target.value })}
                  className="w-full h-10 rounded border border-gray-200 cursor-pointer" />
              </div>
              <div>
                <label className={labelCls}>Dimensions (px)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={composition.width} onChange={e => setComposition({ ...composition, width: parseInt(e.target.value) })}
                    className={inputCls} placeholder="Largeur" />
                  <input type="number" value={composition.height} onChange={e => setComposition({ ...composition, height: parseInt(e.target.value) })}
                    className={inputCls} placeholder="Hauteur" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Résolutions prédéfinies</label>
                <div className="space-y-1.5">
                  {[
                    { label: 'Full HD (1920×1080)', w: 1920, h: 1080 },
                    { label: '4K UHD (3840×2160)', w: 3840, h: 2160 },
                    { label: 'Portrait HD (1080×1920)', w: 1080, h: 1920 },
                    { label: 'Carré (1080×1080)', w: 1080, h: 1080 },
                  ].map(r => (
                    <button key={r.label} onClick={() => setComposition({ ...composition, width: r.w, height: r.h })}
                      className="w-full px-3 py-2 text-left text-xs border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors">
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-200 p-8" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
          <div className="relative mx-auto shadow-2xl" style={{
            width: composition.width * zoom,
            height: composition.height * zoom,
            background: composition.backgroundColor,
          }}>
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none opacity-20" style={{
                backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
                backgroundSize: `${50 * zoom}px ${50 * zoom}px`
              }} />
            )}
            {elements.map(el => {
              const isShape = el.type === 'shape'
              const needsSvg = isShape && ['triangle', 'star', 'diamond', 'hexagon', 'line', 'arrow'].includes(el.shapeType || '')
              const isCss = isShape && ['rect', 'circle', 'rounded-rect', undefined].includes(el.shapeType)
              const animStyle = getAnimationStyle(el.animation)
              const appInfo = el.type === 'widget' ? APPS_LIST.find(a => a.id === el.widgetType) : null
              return (
                <div key={el.id} onMouseDown={e => handleMouseDown(e, el.id)}
                  className={`absolute cursor-move ${selectedId === el.id ? 'ring-2 ring-orange-500 ring-offset-1' : ''}`}
                  style={{
                    left: el.x * zoom, top: el.y * zoom,
                    width: el.width * zoom, height: el.height * zoom,
                    backgroundColor: isCss ? el.style?.backgroundColor : el.type === 'widget' ? (el.style?.backgroundColor) : 'transparent',
                    color: el.style?.color,
                    fontSize: (el.style?.fontSize || 16) * zoom,
                    fontFamily: el.style?.fontFamily,
                    fontWeight: el.style?.fontWeight,
                    fontStyle: el.style?.fontStyle,
                    textDecoration: el.style?.textDecoration,
                    textAlign: el.style?.textAlign as any,
                    lineHeight: el.style?.lineHeight,
                    letterSpacing: (el.style?.letterSpacing || 0) * zoom,
                    borderRadius: el.shapeType === 'circle' ? '50%' : (el.style?.borderRadius || 0) * zoom,
                    borderWidth: el.style?.borderWidth ? el.style.borderWidth * zoom : 0,
                    borderColor: el.style?.borderColor,
                    borderStyle: el.style?.borderStyle || 'solid',
                    opacity: el.style?.opacity ?? 1,
                    filter: (el.type === 'image' || el.type === 'video') ? (el.style?.filter !== 'none' ? el.style?.filter : undefined) : undefined,
                    boxShadow: el.style?.boxShadow,
                    zIndex: el.style?.zIndex || 0,
                    overflow: 'hidden',
                    ...animStyle,
                  }}>
                  {el.type === 'text' && (
                    <div className="w-full h-full flex items-center p-2" style={{ justifyContent: el.style?.textAlign === 'left' ? 'flex-start' : el.style?.textAlign === 'right' ? 'flex-end' : 'center' }}>
                      {el.content}
                    </div>
                  )}
                  {el.type === 'image' && el.src && (
                    <img src={el.src} alt="" className="w-full h-full" style={{ objectFit: (el.style?.objectFit || 'cover') as any }} />
                  )}
                  {el.type === 'video' && el.src && (
                    <video src={el.src} className="w-full h-full" style={{ objectFit: (el.style?.objectFit || 'cover') as any }} muted autoPlay loop />
                  )}
                  {el.type === 'widget' && appInfo && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                      <div className="rounded-full p-2" style={{ backgroundColor: appInfo.color + '33' }}>
                        <appInfo.icon size={Math.max(18 * zoom, 14)} style={{ color: appInfo.color }} />
                      </div>
                      <span className="font-semibold text-center leading-tight" style={{ fontSize: Math.max(10 * zoom, 8), color: appInfo.color }}>
                        {appInfo.name}
                      </span>
                      <span className="text-center opacity-60 leading-tight" style={{ fontSize: Math.max(8 * zoom, 7) }}>
                        {appInfo.emoji}
                      </span>
                    </div>
                  )}
                  {needsSvg && renderShapeSvg(el)}
                  {selectedId === el.id && (
                    <>
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-orange-500 rounded-full z-50" />
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-orange-500 rounded-full z-50" />
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-orange-500 rounded-full z-50" />
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-orange-500 rounded-full z-50" />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedElement && (
          <div className="w-72 bg-white border-l overflow-y-auto shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">Propriétés</h3>
                <span className="text-[10px] text-gray-400 capitalize">
                  {selectedElement.type === 'shape' ? `Forme — ${selectedElement.shapeType}` : selectedElement.type}
                </span>
              </div>
              <button onClick={() => setSelectedId(null)} className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button>
            </div>

            <div className="p-4 space-y-4">
              {/* Position & Taille */}
              <div>
                <label className={labelCls}>Position & Taille</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { l: 'X', k: 'x', v: Math.round(selectedElement.x) },
                    { l: 'Y', k: 'y', v: Math.round(selectedElement.y) },
                    { l: 'Largeur', k: 'width', v: Math.round(selectedElement.width) },
                    { l: 'Hauteur', k: 'height', v: Math.round(selectedElement.height) },
                  ].map(f => (
                    <div key={f.k}>
                      <span className="text-[9px] text-gray-400 mb-0.5 block">{f.l}</span>
                      <input type="number" value={f.v}
                        onChange={e => updateElement(selectedId!, { [f.k]: parseInt(e.target.value) || 0 })}
                        className={inputCls} />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── WIDGET CONFIG ── */}
              {selectedElement.type === 'widget' && (() => {
                const wt = selectedElement.widgetType
                const cfg = selectedElement.widgetConfig || {}
                const wInfo = APPS_LIST.find(a => a.id === wt)
                return (
                  <div className={sectionCls}>
                    {/* En-tête widget */}
                    <div className="flex items-center gap-2 mb-3">
                      {wInfo && <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: wInfo.color + '22' }}>
                        <wInfo.icon size={14} style={{ color: wInfo.color }} />
                      </div>}
                      <div>
                        <label className={labelCls} style={{ marginBottom: 0 }}>{wInfo?.name || 'Widget'}</label>
                        <p className="text-[9px] text-gray-400">{wInfo?.desc}</p>
                      </div>
                    </div>

                    {/* ── Date & Heure ── */}
                    {wt === 'clock' && (<div className="space-y-2.5">
                      <div>
                        <label className={labelCls}>Format horaire</label>
                        <div className="flex gap-1.5">
                          {(['24h', '12h'] as const).map(f => (
                            <button key={f} onClick={() => updateWidgetConfig(selectedId!, { timeFormat: f })}
                              className={`flex-1 py-1.5 rounded-lg border text-xs transition-colors ${(cfg.timeFormat || '24h') === f ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-600">Afficher la date</label>
                        <button onClick={() => updateWidgetConfig(selectedId!, { showDate: !cfg.showDate })}
                          className={`w-10 h-5 rounded-full transition-colors relative ${cfg.showDate !== false ? 'bg-orange-500' : 'bg-gray-200'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cfg.showDate !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-600">Afficher les secondes</label>
                        <button onClick={() => updateWidgetConfig(selectedId!, { showSeconds: !cfg.showSeconds })}
                          className={`w-10 h-5 rounded-full transition-colors relative ${cfg.showSeconds ? 'bg-orange-500' : 'bg-gray-200'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cfg.showSeconds ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                      <div>
                        <label className={labelCls}>Format de date</label>
                        <select value={cfg.dateFormat || 'DD/MM/YYYY'} onChange={e => updateWidgetConfig(selectedId!, { dateFormat: e.target.value })} className={inputCls}>
                          {['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'dddd D MMMM', 'D MMMM YYYY'].map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Fuseau horaire</label>
                        <select value={cfg.timezone || 'Europe/Paris'} onChange={e => updateWidgetConfig(selectedId!, { timezone: e.target.value })} className={inputCls}>
                          {['Europe/Paris', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'Asia/Dubai', 'Australia/Sydney', 'UTC'].map(tz => <option key={tz} value={tz}>{tz}</option>)}
                        </select>
                      </div>
                    </div>)}

                    {/* ── Météo ── */}
                    {wt === 'weather' && (<div className="space-y-2.5">
                      <div>
                        <label className={labelCls}>Ville</label>
                        <input type="text" value={cfg.city || ''} placeholder="Ex: Paris, London..." onChange={e => updateWidgetConfig(selectedId!, { city: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Unité de température</label>
                        <div className="flex gap-1.5">
                          {([['celsius', '°C'], ['fahrenheit', '°F']] as const).map(([v, l]) => (
                            <button key={v} onClick={() => updateWidgetConfig(selectedId!, { weatherUnit: v })}
                              className={`flex-1 py-1.5 rounded-lg border text-xs transition-colors ${(cfg.weatherUnit || 'celsius') === v ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-600">Afficher les prévisions</label>
                        <button onClick={() => updateWidgetConfig(selectedId!, { showForecast: !cfg.showForecast })}
                          className={`w-10 h-5 rounded-full transition-colors relative ${cfg.showForecast ? 'bg-orange-500' : 'bg-gray-200'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cfg.showForecast ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>)}

                    {/* ── Calendrier ── */}
                    {wt === 'calendar' && (<div className="space-y-2.5">
                      <div>
                        <label className={labelCls}>Vue</label>
                        <div className="flex gap-1.5">
                          {([['month', 'Mois'], ['week', 'Semaine'], ['agenda', 'Agenda']] as const).map(([v, l]) => (
                            <button key={v} onClick={() => updateWidgetConfig(selectedId!, { calendarView: v })}
                              className={`flex-1 py-1.5 rounded-lg border text-[10px] transition-colors ${(cfg.calendarView || 'month') === v ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>URL Calendrier (iCal)</label>
                        <input type="text" value={cfg.calendarUrl || ''} placeholder="https://..." onChange={e => updateWidgetConfig(selectedId!, { calendarUrl: e.target.value })} className={inputCls} />
                      </div>
                    </div>)}

                    {/* ── Texte Défilant ── */}
                    {wt === 'ticker' && (<div className="space-y-2.5">
                      <div>
                        <label className={labelCls}>Texte à afficher</label>
                        <textarea value={cfg.tickerText || ''} rows={3} placeholder="Entrez votre message défilant..." onChange={e => updateWidgetConfig(selectedId!, { tickerText: e.target.value })} className={`${inputCls} resize-none`} />
                      </div>
                      <div>
                        <label className={labelCls}>Vitesse de défilement : {cfg.tickerSpeed || 50}px/s</label>
                        <input type="range" min="10" max="200" step="10" value={cfg.tickerSpeed || 50} onChange={e => updateWidgetConfig(selectedId!, { tickerSpeed: parseInt(e.target.value) })} className="w-full accent-orange-500" />
                      </div>
                      <div>
                        <label className={labelCls}>Direction</label>
                        <div className="flex gap-1.5">
                          {([['left', '← Gauche'], ['right', 'Droite →']] as const).map(([v, l]) => (
                            <button key={v} onClick={() => updateWidgetConfig(selectedId!, { tickerDirection: v })}
                              className={`flex-1 py-1.5 rounded-lg border text-xs transition-colors ${(cfg.tickerDirection || 'left') === v ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>)}

                    {/* ── Page Web ── */}
                    {wt === 'webpage' && (<div className="space-y-2.5">
                      <div>
                        <label className={labelCls}>URL</label>
                        <input type="text" value={cfg.url || ''} placeholder="https://example.com" onChange={e => updateWidgetConfig(selectedId!, { url: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Actualisation auto : {cfg.refreshInterval ? `${cfg.refreshInterval}s` : 'Jamais'}</label>
                        <select value={cfg.refreshInterval || 0} onChange={e => updateWidgetConfig(selectedId!, { refreshInterval: parseInt(e.target.value) })} className={inputCls}>
                          <option value={0}>Jamais</option>
                          <option value={30}>30 secondes</option>
                          <option value={60}>1 minute</option>
                          <option value={300}>5 minutes</option>
                          <option value={600}>10 minutes</option>
                          <option value={3600}>1 heure</option>
                        </select>
                      </div>
                    </div>)}

                    {/* ── QR Code ── */}
                    {wt === 'qrcode' && (<div className="space-y-2.5">
                      <div>
                        <label className={labelCls}>Contenu du QR Code</label>
                        <textarea value={cfg.qrData || ''} rows={3} placeholder="URL, texte, email..." onChange={e => updateWidgetConfig(selectedId!, { qrData: e.target.value })} className={`${inputCls} resize-none`} />
                      </div>
                      <div>
                        <label className={labelCls}>Niveau de correction d'erreur</label>
                        <div className="flex gap-1.5">
                          {(['L', 'M', 'Q', 'H'] as const).map(v => (
                            <button key={v} onClick={() => updateWidgetConfig(selectedId!, { qrErrorLevel: v })}
                              className={`flex-1 py-1.5 rounded-lg border text-xs transition-colors ${(cfg.qrErrorLevel || 'M') === v ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>
                              {v}
                            </button>
                          ))}
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1">L = faible, H = maximum</p>
                      </div>
                    </div>)}

                    {/* ── YouTube ── */}
                    {wt === 'youtube' && (<div className="space-y-2.5">
                      <div>
                        <label className={labelCls}>URL de la vidéo YouTube</label>
                        <input type="text" value={cfg.youtubeUrl || ''} placeholder="https://youtube.com/watch?v=..." onChange={e => updateWidgetConfig(selectedId!, { youtubeUrl: e.target.value })} className={inputCls} />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-600">Lecture automatique</label>
                        <button onClick={() => updateWidgetConfig(selectedId!, { youtubeAutoplay: !cfg.youtubeAutoplay })}
                          className={`w-10 h-5 rounded-full transition-colors relative ${cfg.youtubeAutoplay !== false ? 'bg-orange-500' : 'bg-gray-200'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cfg.youtubeAutoplay !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-600">Son coupé</label>
                        <button onClick={() => updateWidgetConfig(selectedId!, { youtubeMuted: !cfg.youtubeMuted })}
                          className={`w-10 h-5 rounded-full transition-colors relative ${cfg.youtubeMuted !== false ? 'bg-orange-500' : 'bg-gray-200'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cfg.youtubeMuted !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>)}

                    {/* ── Flux RSS ── */}
                    {wt === 'rss' && (<div className="space-y-2.5">
                      <div>
                        <label className={labelCls}>URL du flux RSS</label>
                        <input type="text" value={cfg.rssUrl || ''} placeholder="https://example.com/feed.xml" onChange={e => updateWidgetConfig(selectedId!, { rssUrl: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Nombre d'articles : {cfg.rssMaxItems || 5}</label>
                        <input type="range" min="1" max="20" step="1" value={cfg.rssMaxItems || 5} onChange={e => updateWidgetConfig(selectedId!, { rssMaxItems: parseInt(e.target.value) })} className="w-full accent-orange-500" />
                      </div>
                      <div>
                        <label className={labelCls}>Vitesse de défilement : {cfg.rssScrollSpeed || 40}px/s</label>
                        <input type="range" min="10" max="150" step="5" value={cfg.rssScrollSpeed || 40} onChange={e => updateWidgetConfig(selectedId!, { rssScrollSpeed: parseInt(e.target.value) })} className="w-full accent-orange-500" />
                      </div>
                    </div>)}

                    {/* ── Twitter/X ── */}
                    {wt === 'twitter' && (<div className="space-y-2.5">
                      <div>
                        <label className={labelCls}>Compte Twitter/X</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">@</span>
                          <input type="text" value={cfg.twitterHandle || ''} placeholder="nom_du_compte" onChange={e => updateWidgetConfig(selectedId!, { twitterHandle: e.target.value })} className={`${inputCls} pl-6`} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Nombre de tweets : {cfg.twitterCount || 5}</label>
                        <input type="range" min="1" max="20" step="1" value={cfg.twitterCount || 5} onChange={e => updateWidgetConfig(selectedId!, { twitterCount: parseInt(e.target.value) })} className="w-full accent-orange-500" />
                      </div>
                    </div>)}

                    {/* ── Graphiques ── */}
                    {wt === 'charts' && (<div className="space-y-2.5">
                      <div>
                        <label className={labelCls}>Type de graphique</label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {([['bar', '📊 Barres'], ['line', '📈 Courbe'], ['pie', '🥧 Camembert'], ['donut', '🍩 Donut']] as const).map(([v, l]) => (
                            <button key={v} onClick={() => updateWidgetConfig(selectedId!, { chartType: v })}
                              className={`py-1.5 rounded-lg border text-xs transition-colors ${(cfg.chartType || 'bar') === v ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Titre du graphique</label>
                        <input type="text" value={cfg.chartTitle || ''} placeholder="Ex: Ventes 2024" onChange={e => updateWidgetConfig(selectedId!, { chartTitle: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Données (JSON)</label>
                        <textarea value={cfg.chartData || ''} rows={4} placeholder={'[{"label":"Jan","value":120},...]'} onChange={e => updateWidgetConfig(selectedId!, { chartData: e.target.value })} className={`${inputCls} resize-none font-mono text-[10px]`} />
                      </div>
                    </div>)}

                    {/* ── Diaporama ── */}
                    {wt === 'slideshow' && (<div className="space-y-2.5">
                      <div>
                        <label className={labelCls}>Durée par diapositive : {cfg.slideshowInterval || 5}s</label>
                        <input type="range" min="1" max="60" step="1" value={cfg.slideshowInterval || 5} onChange={e => updateWidgetConfig(selectedId!, { slideshowInterval: parseInt(e.target.value) })} className="w-full accent-orange-500" />
                      </div>
                      <div>
                        <label className={labelCls}>Transition</label>
                        <div className="flex gap-1.5">
                          {([['fade', 'Fondu'], ['slide', 'Glisser'], ['zoom', 'Zoom']] as const).map(([v, l]) => (
                            <button key={v} onClick={() => updateWidgetConfig(selectedId!, { slideshowTransition: v })}
                              className={`flex-1 py-1.5 rounded-lg border text-xs transition-colors ${(cfg.slideshowTransition || 'fade') === v ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>)}

                    {/* ── Lecteur Vidéo ── */}
                    {(wt === 'video' || wt === 'link') && wt === 'video' && (<div className="space-y-2.5">
                      <div>
                        <label className={labelCls}>URL de la vidéo</label>
                        <input type="text" value={cfg.videoUrl || ''} placeholder="https://..." onChange={e => updateWidgetConfig(selectedId!, { videoUrl: e.target.value })} className={inputCls} />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-600">Lecture en boucle</label>
                        <button onClick={() => updateWidgetConfig(selectedId!, { videoLoop: !cfg.videoLoop })}
                          className={`w-10 h-5 rounded-full transition-colors relative ${cfg.videoLoop !== false ? 'bg-orange-500' : 'bg-gray-200'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cfg.videoLoop !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-600">Son coupé</label>
                        <button onClick={() => updateWidgetConfig(selectedId!, { videoMuted: !cfg.videoMuted })}
                          className={`w-10 h-5 rounded-full transition-colors relative ${cfg.videoMuted !== false ? 'bg-orange-500' : 'bg-gray-200'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cfg.videoMuted !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>)}

                    {/* ── Lien Externe ── */}
                    {wt === 'link' && (<div className="space-y-2.5">
                      <div>
                        <label className={labelCls}>URL de redirection</label>
                        <input type="text" value={cfg.url || ''} placeholder="https://..." onChange={e => updateWidgetConfig(selectedId!, { url: e.target.value })} className={inputCls} />
                      </div>
                    </div>)}

                    {/* ── Actualités ── */}
                    {wt === 'news' && (<div className="space-y-2.5">
                      <div>
                        <label className={labelCls}>Source RSS ou URL des actualités</label>
                        <input type="text" value={cfg.rssUrl || ''} placeholder="https://..." onChange={e => updateWidgetConfig(selectedId!, { rssUrl: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Nombre d'articles : {cfg.rssMaxItems || 5}</label>
                        <input type="range" min="1" max="15" step="1" value={cfg.rssMaxItems || 5} onChange={e => updateWidgetConfig(selectedId!, { rssMaxItems: parseInt(e.target.value) })} className="w-full accent-orange-500" />
                      </div>
                    </div>)}

                    {/* Couleur du widget */}
                    <div className="border-t border-gray-100 pt-2.5 mt-2.5">
                      <label className={labelCls}>Couleur du widget</label>
                      <div className="flex gap-2">
                        <input type="color" value={selectedElement.style?.color || (wInfo?.color || '#3b82f6')}
                          onChange={e => updateStyle(selectedId!, { color: e.target.value })}
                          className="h-8 w-12 rounded border border-gray-200 cursor-pointer" />
                        <input type="color" value={selectedElement.style?.backgroundColor === 'transparent' ? '#ffffff' : (selectedElement.style?.backgroundColor || '#ffffff')}
                          onChange={e => updateStyle(selectedId!, { backgroundColor: e.target.value })}
                          className="h-8 w-12 rounded border border-gray-200 cursor-pointer" />
                        <div className="flex-1 flex flex-col justify-center">
                          <span className="text-[9px] text-gray-400 leading-none">Texte</span>
                          <span className="text-[9px] text-gray-400 leading-none mt-1">Fond</span>
                        </div>
                        <button onClick={() => updateStyle(selectedId!, { backgroundColor: 'transparent' })}
                          className="px-2 py-1 text-[9px] border border-gray-200 rounded hover:bg-gray-50">Transparent</button>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* ── TEXTE ── */}
              {selectedElement.type === 'text' && (
                <>
                  <div className={sectionCls}>
                    <label className={labelCls}>Contenu</label>
                    <textarea value={selectedElement.content}
                      onChange={e => updateElement(selectedId!, { content: e.target.value })}
                      className={`${inputCls} resize-none`} rows={3} />
                  </div>

                  <div className={sectionCls}>
                    <label className={labelCls}>Police</label>
                    <select value={selectedElement.style?.fontFamily || 'Arial'}
                      onChange={e => updateStyle(selectedId!, { fontFamily: e.target.value })}
                      className={inputCls}>
                      {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                    </select>
                  </div>

                  <div className={sectionCls}>
                    <label className={labelCls}>Taille de police</label>
                    <div className="flex items-center gap-2">
                      <input type="range" min="8" max="300" step="2"
                        value={selectedElement.style?.fontSize || 32}
                        onChange={e => updateStyle(selectedId!, { fontSize: parseInt(e.target.value) })}
                        className="flex-1 accent-orange-500" />
                      <input type="number" min="8" max="500"
                        value={selectedElement.style?.fontSize || 32}
                        onChange={e => updateStyle(selectedId!, { fontSize: parseInt(e.target.value) || 32 })}
                        className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center" />
                    </div>
                  </div>

                  <div className={sectionCls}>
                    <label className={labelCls}>Style</label>
                    <div className="flex gap-1.5">
                      <button onClick={() => updateStyle(selectedId!, { fontWeight: selectedElement.style?.fontWeight === 'bold' ? 'normal' : 'bold' })}
                        className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-colors ${selectedElement.style?.fontWeight === 'bold' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <Bold size={13} className="mx-auto" />
                      </button>
                      <button onClick={() => updateStyle(selectedId!, { fontStyle: selectedElement.style?.fontStyle === 'italic' ? 'normal' : 'italic' })}
                        className={`flex-1 py-2 rounded-lg border text-xs transition-colors ${selectedElement.style?.fontStyle === 'italic' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <Italic size={13} className="mx-auto" />
                      </button>
                      <button onClick={() => updateStyle(selectedId!, { textDecoration: selectedElement.style?.textDecoration === 'underline' ? 'none' : 'underline' })}
                        className={`flex-1 py-2 rounded-lg border text-xs transition-colors ${selectedElement.style?.textDecoration === 'underline' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <Underline size={13} className="mx-auto" />
                      </button>
                    </div>
                  </div>

                  <div className={sectionCls}>
                    <label className={labelCls}>Alignement</label>
                    <div className="flex gap-1.5">
                      {(['left', 'center', 'right'] as const).map(a => {
                        const Icon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight
                        return (
                          <button key={a} onClick={() => updateStyle(selectedId!, { textAlign: a })}
                            className={`flex-1 py-2 rounded-lg border text-xs transition-colors ${selectedElement.style?.textAlign === a ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <Icon size={13} className="mx-auto" />
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className={sectionCls}>
                    <label className={labelCls}>Couleur du texte</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={selectedElement.style?.color || '#000000'}
                        onChange={e => updateStyle(selectedId!, { color: e.target.value })}
                        className="h-9 w-14 rounded-lg border border-gray-200 cursor-pointer" />
                      <input type="text" value={selectedElement.style?.color || '#000000'}
                        onChange={e => updateStyle(selectedId!, { color: e.target.value })}
                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs" />
                    </div>
                  </div>

                  <div className={sectionCls}>
                    <label className={labelCls}>Interligne : {selectedElement.style?.lineHeight || 1.4}</label>
                    <input type="range" min="0.8" max="3" step="0.1"
                      value={selectedElement.style?.lineHeight || 1.4}
                      onChange={e => updateStyle(selectedId!, { lineHeight: parseFloat(e.target.value) })}
                      className="w-full accent-orange-500" />
                  </div>

                  <div className={sectionCls}>
                    <label className={labelCls}>Espacement lettres : {selectedElement.style?.letterSpacing || 0}px</label>
                    <input type="range" min="-5" max="20" step="0.5"
                      value={selectedElement.style?.letterSpacing || 0}
                      onChange={e => updateStyle(selectedId!, { letterSpacing: parseFloat(e.target.value) })}
                      className="w-full accent-orange-500" />
                  </div>

                  <div className={sectionCls}>
                    <label className={labelCls}>Couleur de fond du texte</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={selectedElement.style?.backgroundColor === 'transparent' ? '#ffffff' : (selectedElement.style?.backgroundColor || '#ffffff')}
                        onChange={e => updateStyle(selectedId!, { backgroundColor: e.target.value })}
                        className="h-9 w-14 rounded-lg border border-gray-200 cursor-pointer" />
                      <button onClick={() => updateStyle(selectedId!, { backgroundColor: 'transparent' })}
                        className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">Transparent</button>
                    </div>
                  </div>
                </>
              )}

              {/* ── FORME ── */}
              {selectedElement.type === 'shape' && (
                <>
                  <div className={sectionCls}>
                    <label className={labelCls}>Couleur de remplissage</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={selectedElement.style?.backgroundColor || '#3b82f6'}
                        onChange={e => updateStyle(selectedId!, { backgroundColor: e.target.value })}
                        className="h-9 w-14 rounded-lg border border-gray-200 cursor-pointer" />
                      <input type="text" value={selectedElement.style?.backgroundColor || '#3b82f6'}
                        onChange={e => updateStyle(selectedId!, { backgroundColor: e.target.value })}
                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs" />
                    </div>
                    <div className="grid grid-cols-6 gap-1 mt-2">
                      {SHAPE_COLORS.map(c => (
                        <button key={c} onClick={() => updateStyle(selectedId!, { backgroundColor: c })}
                          className="w-7 h-7 rounded-md border border-gray-200 hover:scale-110 transition-transform"
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>

                  <div className={sectionCls}>
                    <label className={labelCls}>Bordure</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-gray-400 mb-0.5 block">Épaisseur</span>
                        <input type="number" min="0" max="20"
                          value={selectedElement.style?.borderWidth || 0}
                          onChange={e => updateStyle(selectedId!, { borderWidth: parseInt(e.target.value) || 0 })}
                          className={inputCls} />
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 mb-0.5 block">Couleur</span>
                        <input type="color" value={selectedElement.style?.borderColor || '#000000'}
                          onChange={e => updateStyle(selectedId!, { borderColor: e.target.value })}
                          className="h-8 w-full rounded-lg border border-gray-200 cursor-pointer" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-[9px] text-gray-400 mb-0.5 block">Style de bordure</span>
                      <select value={selectedElement.style?.borderStyle || 'solid'}
                        onChange={e => updateStyle(selectedId!, { borderStyle: e.target.value })}
                        className={inputCls}>
                        {['solid', 'dashed', 'dotted', 'double'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {['rect', 'rounded-rect', undefined].includes(selectedElement.shapeType) && (
                    <div className={sectionCls}>
                      <label className={labelCls}>Arrondi des coins : {selectedElement.style?.borderRadius || 0}px</label>
                      <input type="range" min="0" max="100" step="2"
                        value={selectedElement.style?.borderRadius || 0}
                        onChange={e => updateStyle(selectedId!, { borderRadius: parseInt(e.target.value) })}
                        className="w-full accent-orange-500" />
                    </div>
                  )}
                </>
              )}

              {/* ── IMAGE / VIDÉO ── */}
              {(selectedElement.type === 'image' || selectedElement.type === 'video') && (
                <>
                  <div className={sectionCls}>
                    <label className={labelCls}>Ajustement</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { v: 'cover', l: 'Remplir' },
                        { v: 'contain', l: 'Contenir' },
                        { v: 'fill', l: 'Étirer' },
                        { v: 'none', l: 'Original' },
                      ].map(o => (
                        <button key={o.v} onClick={() => updateStyle(selectedId!, { objectFit: o.v })}
                          className={`py-1.5 rounded-lg border text-xs transition-colors ${selectedElement.style?.objectFit === o.v ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={sectionCls}>
                    <label className={labelCls}>Filtre</label>
                    <select value={selectedElement.style?.filter || 'none'}
                      onChange={e => updateStyle(selectedId!, { filter: e.target.value })}
                      className={inputCls}>
                      {FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>

                  <div className={sectionCls}>
                    <label className={labelCls}>Arrondi des coins : {selectedElement.style?.borderRadius || 0}px</label>
                    <input type="range" min="0" max="100" step="2"
                      value={selectedElement.style?.borderRadius || 0}
                      onChange={e => updateStyle(selectedId!, { borderRadius: parseInt(e.target.value) })}
                      className="w-full accent-orange-500" />
                  </div>

                  <div className={sectionCls}>
                    <label className={labelCls}>Ombre portée</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { l: 'Aucune', v: 'none' },
                        { l: 'Légère', v: '0 4px 12px rgba(0,0,0,0.15)' },
                        { l: 'Moyenne', v: '0 8px 24px rgba(0,0,0,0.25)' },
                        { l: 'Forte', v: '0 16px 40px rgba(0,0,0,0.40)' },
                      ].map(o => (
                        <button key={o.l} onClick={() => updateStyle(selectedId!, { boxShadow: o.v })}
                          className={`py-1.5 rounded-lg border text-xs transition-colors ${selectedElement.style?.boxShadow === o.v ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── COMMUN (opacité, ordre, actions) ── */}
              <div className={sectionCls}>
                <label className={labelCls}>
                  <Sparkles size={11} className="inline mr-1 text-orange-500" />
                  Animation
                </label>
                {/* Grille de types */}
                <div className="grid grid-cols-3 gap-1 mb-3">
                  {ANIMATION_TYPES.map(a => (
                    <button key={a.value}
                      onClick={() => updateAnimation(selectedId!, { type: a.value as ElementAnimation['type'] })}
                      className={`flex flex-col items-center gap-0.5 py-2 rounded-lg border text-[9px] transition-colors ${(selectedElement.animation?.type || 'none') === a.value ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      <span className="text-sm">{a.emoji}</span>
                      <span className="leading-none text-center">{a.label}</span>
                    </button>
                  ))}
                </div>
                {selectedElement.animation?.type && selectedElement.animation.type !== 'none' && (
                  <div className="space-y-2.5">
                    <div>
                      <label className={labelCls}>Durée : {selectedElement.animation?.duration || 1}s</label>
                      <input type="range" min="0.2" max="10" step="0.2"
                        value={selectedElement.animation?.duration || 1}
                        onChange={e => updateAnimation(selectedId!, { duration: parseFloat(e.target.value) })}
                        className="w-full accent-orange-500" />
                    </div>
                    <div>
                      <label className={labelCls}>Délai : {selectedElement.animation?.delay || 0}s</label>
                      <input type="range" min="0" max="10" step="0.5"
                        value={selectedElement.animation?.delay || 0}
                        onChange={e => updateAnimation(selectedId!, { delay: parseFloat(e.target.value) })}
                        className="w-full accent-orange-500" />
                    </div>
                    <div>
                      <label className={labelCls}>Répétition</label>
                      <div className="flex gap-1.5">
                        {([['none', 'Une fois'], ['loop', 'Boucle'], ['alternate', 'Aller-ret.']] as const).map(([v, l]) => (
                          <button key={v} onClick={() => updateAnimation(selectedId!, { repeat: v })}
                            className={`flex-1 py-1.5 rounded-lg border text-[10px] transition-colors ${(selectedElement.animation?.repeat || 'none') === v ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 hover:bg-gray-50'}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => updateElement(selectedId!, { animation: { ...DEFAULT_ANIMATION, type: selectedElement.animation?.type || 'none' } })}
                      className="w-full py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
                      🔄 Prévisualiser dans l'aperçu
                    </button>
                  </div>
                )}
              </div>

              {/* ── Opacité ── */}
              <div className={sectionCls}>
                <label className={labelCls}>Opacité : {Math.round((selectedElement.style?.opacity ?? 1) * 100)}%</label>
                <input type="range" min="0" max="1" step="0.05"
                  value={selectedElement.style?.opacity ?? 1}
                  onChange={e => updateStyle(selectedId!, { opacity: parseFloat(e.target.value) })}
                  className="w-full accent-orange-500" />
              </div>

              <div className={sectionCls}>
                <label className={labelCls}>Ordre de superposition</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => bringToFront(selectedId!)} className="flex items-center justify-center gap-1.5 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs">
                    <BringToFront size={13} /> Premier plan
                  </button>
                  <button onClick={() => sendToBack(selectedId!)} className="flex items-center justify-center gap-1.5 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs">
                    <SendToBack size={13} /> Arrière plan
                  </button>
                </div>
              </div>

              <div className={sectionCls}>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => duplicateElement(selectedId!)} className="flex items-center justify-center gap-1.5 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs">
                    <Copy size={13} /> Dupliquer
                  </button>
                  <button onClick={() => deleteElement(selectedId!)} className="flex items-center justify-center gap-1.5 p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs">
                    <Trash2 size={13} /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col" onClick={() => setShowPreview(false)}>
          <div className="flex items-center justify-between px-6 py-3 bg-black/50 text-white shrink-0">
            <div className="flex items-center gap-3">
              <MonitorPlay size={18} />
              <span className="font-medium text-sm">Aperçu : {composition.name}</span>
            </div>
            <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-white/10 rounded-lg"><X size={18} /></button>
          </div>
          <div className="flex-1 flex items-center justify-center p-8" onClick={e => e.stopPropagation()}>
            <div className="relative shadow-2xl overflow-hidden" style={{
              width: Math.min(composition.width * 0.75, window.innerWidth * 0.85),
              height: Math.min(composition.height * 0.75, window.innerHeight * 0.75),
              background: composition.backgroundColor,
            }}>
              {elements.map(el => {
                const pw = Math.min(composition.width * 0.75, window.innerWidth * 0.85)
                const ph = Math.min(composition.height * 0.75, window.innerHeight * 0.75)
                const scaleX = pw / composition.width
                const scaleY = ph / composition.height
                const isShape = el.type === 'shape'
                const needsSvg = isShape && ['triangle', 'star', 'diamond', 'hexagon', 'line', 'arrow'].includes(el.shapeType || '')
                const isCss = isShape && !needsSvg
                return (
                  <div key={el.id} className="absolute" style={{
                    left: el.x * scaleX, top: el.y * scaleY,
                    width: el.width * scaleX, height: el.height * scaleY,
                    backgroundColor: isCss ? el.style?.backgroundColor : 'transparent',
                    color: el.style?.color, fontSize: (el.style?.fontSize || 16) * scaleX,
                    fontFamily: el.style?.fontFamily, fontWeight: el.style?.fontWeight,
                    fontStyle: el.style?.fontStyle, textDecoration: el.style?.textDecoration,
                    textAlign: el.style?.textAlign as any, lineHeight: el.style?.lineHeight,
                    borderRadius: el.shapeType === 'circle' ? '50%' : (el.style?.borderRadius || 0) * scaleX,
                    borderWidth: el.style?.borderWidth ? el.style.borderWidth * scaleX : 0,
                    borderColor: el.style?.borderColor, borderStyle: el.style?.borderStyle,
                    opacity: el.style?.opacity ?? 1, filter: el.style?.filter !== 'none' ? el.style?.filter : undefined,
                    boxShadow: el.style?.boxShadow,
                    zIndex: el.style?.zIndex || 0, overflow: 'hidden',
                  }}>
                    {el.type === 'text' && <div className="w-full h-full flex items-center p-2" style={{ justifyContent: el.style?.textAlign === 'left' ? 'flex-start' : el.style?.textAlign === 'right' ? 'flex-end' : 'center' }}>{el.content}</div>}
                    {el.type === 'image' && el.src && <img src={el.src} alt="" className="w-full h-full" style={{ objectFit: (el.style?.objectFit || 'cover') as any }} />}
                    {el.type === 'video' && el.src && <video src={el.src} className="w-full h-full" muted autoPlay loop style={{ objectFit: (el.style?.objectFit || 'cover') as any }} />}
                    {needsSvg && null}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
