import { useEffect, useState, useCallback } from 'react'

interface SlidePlayerProps {
  playlist: { id: string; slides: any[]; settings?: any } | null
  currentSlideIndex: number
  onSlideChange: (index: number) => void
  isConnected: boolean
  playerName: string
  onReset: () => void
}

export function SlidePlayer({
  playlist,
  currentSlideIndex,
  onSlideChange,
  isConnected,
  playerName,
  onReset,
}: SlidePlayerProps) {
  const [showControls, setShowControls] = useState(false)
  const slides = playlist?.slides || []
  const currentSlide = slides[currentSlideIndex]

  // Auto-advance slides
  useEffect(() => {
    if (!playlist || slides.length === 0) return

    const duration = playlist.settings?.slideDuration || 5000
    const timer = setInterval(() => {
      onSlideChange((currentSlideIndex + 1) % slides.length)
    }, duration)

    return () => clearInterval(timer)
  }, [playlist, slides.length, currentSlideIndex, onSlideChange])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        onSlideChange((currentSlideIndex + 1) % slides.length)
      } else if (e.key === 'ArrowLeft') {
        onSlideChange(Math.max(0, currentSlideIndex - 1))
      } else if (e.key === 'Escape') {
        setShowControls(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSlideIndex, slides.length, onSlideChange])

  // Prevent context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setShowControls(true)
    setTimeout(() => setShowControls(false), 5000)
  }, [])

  // No playlist yet
  if (!playlist || slides.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
          color: '#fff',
          gap: '20px',
        }}
        onContextMenu={handleContextMenu}
      >
        <div style={{ fontSize: '4rem' }}>📺</div>
        <h1 style={{ fontSize: '2rem' }}>En attente de contenu...</h1>
        <p style={{ opacity: 0.6 }}>Aucune playlist assignée à ce player</p>
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: isConnected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
            borderRadius: '20px',
            fontSize: '0.8rem',
          }}
        >
          <span style={{ color: isConnected ? '#22c55e' : '#ef4444' }}>●</span>
          {playerName}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: currentSlide?.background || '#000',
      }}
      onContextMenu={handleContextMenu}
    >
      {/* Render slide elements */}
      {currentSlide?.elements?.map((element: any) => (
        <div
          key={element.id}
          style={{
            position: 'absolute',
            left: `${element.x}%`,
            top: `${element.y}%`,
            transform: `translate(-50%, -50%) rotate(${element.rotation || 0}deg) scale(${element.scale || 1})`,
            opacity: element.opacity ?? 1,
            zIndex: element.zIndex || 0,
            fontSize: `${element.style?.fontSize || 24}px`,
            color: element.style?.color || '#fff',
            fontFamily: element.style?.fontFamily || 'system-ui',
            fontWeight: element.style?.fontWeight || 'normal',
            backgroundColor: element.style?.backgroundColor || 'transparent',
            padding: `${element.style?.padding || 16}px`,
            borderRadius: `${element.style?.borderRadius || 0}px`,
            textAlign: element.style?.textAlign || 'center',
            maxWidth: `${element.width}%`,
          }}
        >
          {element.type === 'text' && element.content}
          {element.type === 'image' && (
            <img
              src={element.content}
              alt=""
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          )}
          {element.type === 'marquee' && (
            <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
              {element.content}
            </span>
          )}
          {element.type === 'datetime' && <LiveDateTime config={element.config} />}
          {element.type === 'weather' && <WeatherDisplay config={element.config} />}
        </div>
      ))}

      {/* Status indicator */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '20px',
          fontSize: '0.8rem',
          color: '#fff',
          backdropFilter: 'blur(10px)',
        }}
      >
        <span style={{ color: isConnected ? '#22c55e' : '#ef4444' }}>●</span>
        {playerName} • Slide {currentSlideIndex + 1}/{slides.length}
      </div>

      {/* Hidden controls (shown on right-click) */}
      {showControls && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '12px',
            padding: '12px 24px',
            background: 'rgba(0,0,0,0.8)',
            borderRadius: '12px',
          }}
        >
          <button
            onClick={() => onSlideChange(Math.max(0, currentSlideIndex - 1))}
            style={controlButtonStyle}
          >
            ◀ Précédent
          </button>
          <button
            onClick={() => onSlideChange((currentSlideIndex + 1) % slides.length)}
            style={controlButtonStyle}
          >
            Suivant ▶
          </button>
          <button onClick={onReset} style={{ ...controlButtonStyle, color: '#ef4444' }}>
            ⚙️ Config
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'rgba(255,255,255,0.1)',
        }}
      >
        <div
          style={{
            width: `${((currentSlideIndex + 1) / slides.length) * 100}%`,
            height: '100%',
            background: '#6366f1',
            transition: 'width 0.3s',
          }}
        />
      </div>
    </div>
  )
}

const controlButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '8px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '0.9rem',
}

// Simple live date/time component
function LiveDateTime({ config }: { config?: any }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const format = config?.dateFormat || 'full'
  const locale = config?.dateLocale || 'fr-FR'

  let text = ''
  if (format === 'full') {
    text = now.toLocaleString(locale, {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  } else if (format === 'time') {
    text = now.toLocaleTimeString(locale)
  } else if (format === 'date') {
    text = now.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long' })
  }

  return <span>{text}</span>
}

// Simple weather display (demo data)
function WeatherDisplay({ config }: { config?: any }) {
  const city = config?.weatherCity || 'Paris'
  const unit = config?.weatherUnit === 'fahrenheit' ? '°F' : '°C'

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3rem' }}>⛅</div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>18{unit}</div>
      <div style={{ opacity: 0.8 }}>{city}</div>
    </div>
  )
}
