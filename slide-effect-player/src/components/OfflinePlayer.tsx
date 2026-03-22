import { useEffect } from 'react'

interface OfflinePlayerProps {
  playlist: { slides: any[]; settings?: any }
  currentSlideIndex: number
  onSlideChange: (index: number) => void
  onReset?: () => void
}

export function OfflinePlayer({
  playlist,
  currentSlideIndex,
  onSlideChange,
  // onReset unused but kept for API compatibility
}: OfflinePlayerProps) {
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

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: currentSlide?.background || '#000',
      }}
    >
      {/* Offline indicator */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(239,68,68,0.3)',
          borderRadius: '20px',
          fontSize: '0.8rem',
          color: '#fff',
          zIndex: 1000,
        }}
      >
        <span style={{ color: '#ef4444' }}>●</span>
        Mode hors-ligne
      </div>

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
        </div>
      ))}

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
