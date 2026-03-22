import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { SlideElement, AnimationConfig } from '../types';
import { MarqueeWidget } from './widgets/MarqueeWidget';
import { DateTimeWidget } from './widgets/DateTimeWidget';
import { WeatherWidget } from './widgets/WeatherWidget';
import { SocialWidget } from './widgets/SocialWidget';
import { IFrameWidget } from './widgets/IFrameWidget';
import { QRCodeWidget } from './widgets/QRCodeWidget';
import { ChartWidget } from './widgets/ChartWidget';

interface SlideCanvasV2Props {
  elements: SlideElement[];
  selectedElementId: string | null;
  background: string;
  currentTime: number;
  isPlaying: boolean;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<SlideElement>) => void;
  isPreview?: boolean;
}

// Get animation state at current time
const getElementStateAtTime = (element: SlideElement, currentTime: number) => {
  const { timeline } = element;
  let opacity = element.opacity;
  let x = element.x;
  let y = element.y;
  let scale = element.scale;
  let rotation = element.rotation;
  let visible = false;

  // Check if element should be visible based on timeline
  if (currentTime >= 0 && currentTime <= timeline.totalDuration) {
    visible = true;
  }

  // Apply animations
  timeline.animations.forEach((anim: AnimationConfig) => {
    const animStart = anim.startTime;
    const animEnd = anim.startTime + anim.duration;
    
    if (currentTime >= animStart && currentTime <= animEnd) {
      const progress = (currentTime - animStart) / anim.duration;
      const easedProgress = getEasedProgress(progress, anim.easing);
      
      switch (anim.type) {
        case 'fade':
          opacity = easedProgress * element.opacity;
          break;
        case 'fadeOut':
          opacity = (1 - easedProgress) * element.opacity;
          break;
        case 'slide':
          x = element.x - (1 - easedProgress) * 20;
          break;
        case 'slideOut':
          x = element.x + easedProgress * 20;
          break;
        case 'scale':
          scale = element.scale * (0.5 + 0.5 * easedProgress);
          break;
        case 'scaleOut':
          scale = element.scale * (1 - 0.5 * easedProgress);
          break;
        case 'rotate':
          rotation = element.rotation - (1 - easedProgress) * 360;
          break;
        case 'zoom':
          scale = element.scale * (1 + easedProgress);
          break;
      }
    }
  });

  // Check if element has faded out
  const hasFadeOut = timeline.animations.some((a: AnimationConfig) => 
    a.type === 'fadeOut' && currentTime > a.startTime + a.duration
  );
  if (hasFadeOut) {
    opacity = 0;
    visible = false;
  }

  return { opacity, x, y, scale, rotation, visible };
};

const getEasedProgress = (progress: number, easing: string): number => {
  switch (easing) {
    case 'easeIn':
      return progress * progress;
    case 'easeOut':
      return 1 - Math.pow(1 - progress, 2);
    case 'easeInOut':
      return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    case 'spring':
      return progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * ((2 * Math.PI) / 3));
    default:
      return progress;
  }
};

export const SlideCanvasV2: React.FC<SlideCanvasV2Props> = ({
  elements,
  selectedElementId,
  background,
  currentTime,
  isPlaying,
  onSelectElement,
  onUpdateElement,
  isPreview = false,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    if (isPreview) return;
    e.stopPropagation();
    onSelectElement(elementId);
    
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDraggingId(elementId);
    setDragOffset({
      x: ((e.clientX - rect.left) / rect.width) * 100 - element.x,
      y: ((e.clientY - rect.top) / rect.height) * 100 - element.y,
    });
  }, [elements, isPreview, onSelectElement]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x;
    const newY = ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y;

    onUpdateElement(draggingId, {
      x: Math.max(0, Math.min(100 - 10, newX)),
      y: Math.max(0, Math.min(100 - 10, newY)),
    });
  }, [draggingId, dragOffset, onUpdateElement]);

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  const renderElement = (element: SlideElement) => {
    const isSelected = selectedElementId === element.id;
    const state = getElementStateAtTime(element, currentTime);
    
    if (!state.visible && isPlaying) return null;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${state.x}%`,
      top: `${state.y}%`,
      width: `${element.width}%`,
      transform: `translate(-50%, -50%) rotate(${state.rotation}deg) scale(${state.scale})`,
      opacity: state.opacity,
      zIndex: element.zIndex,
      cursor: isPreview ? 'default' : 'move',
    };

    const contentStyle: React.CSSProperties = {
      fontSize: `${element.style.fontSize}px`,
      fontWeight: element.style.fontWeight,
      fontFamily: element.style.fontFamily,
      color: element.style.color,
      backgroundColor: element.style.backgroundColor,
      borderRadius: `${element.style.borderRadius}px`,
      border: `${element.style.borderWidth}px solid ${element.style.borderColor}`,
      padding: `${element.style.padding}px`,
      textAlign: element.style.textAlign,
      boxShadow: element.style.boxShadow,
      wordWrap: 'break-word',
      overflow: 'hidden',
    };

    const content = () => {
      switch (element.type) {
        case 'text':
          return (
            <div style={contentStyle}>
              {element.content}
            </div>
          );
        case 'image':
          return (
            <img
              src={element.content}
              alt={element.fileName || ''}
              style={{
                ...contentStyle,
                width: '100%',
                height: 'auto',
                objectFit: 'cover',
              }}
            />
          );
        case 'video':
          return (
            <video
              src={element.content}
              controls={!isPlaying}
              autoPlay={isPlaying}
              muted
              style={{
                ...contentStyle,
                width: '100%',
                height: 'auto',
              }}
            />
          );
        case 'shape':
          return (
            <div
              style={{
                ...contentStyle,
                width: '100%',
                aspectRatio: '1',
              }}
            />
          );
        case 'code':
          return (
            <pre
              style={{
                ...contentStyle,
                fontFamily: 'monospace',
                fontSize: '14px',
                overflow: 'auto',
                maxHeight: '200px',
              }}
            >
              <code>{element.content}</code>
            </pre>
          );
        case 'marquee':
          return (
            <div style={{ width: `${element.width}vw`, height: `${element.height * 0.5625}vw`, minHeight: '40px' }}>
              <MarqueeWidget element={element} isEditing={!isPreview} />
            </div>
          );
        case 'datetime':
          return (
            <div style={{ width: `${element.width}vw`, height: `${element.height * 0.5625}vw`, minHeight: '60px' }}>
              <DateTimeWidget element={element} />
            </div>
          );
        case 'weather':
          return (
            <div style={{ width: `${element.width}vw`, height: `${element.height * 0.5625}vw`, minHeight: '120px' }}>
              <WeatherWidget element={element} />
            </div>
          );
        case 'social':
          return (
            <div style={{ width: `${element.width}vw`, height: `${element.height * 0.5625}vw`, minHeight: '120px', position: 'relative' }}>
              <SocialWidget element={element} />
            </div>
          );
        case 'iframe':
          return (
            <div style={{ width: `${element.width}vw`, height: `${element.height * 0.5625}vw`, minHeight: '150px' }}>
              <IFrameWidget element={element} isEditing={!isPreview} />
            </div>
          );
        case 'chart':
          return (
            <div style={{ width: `${element.width}vw`, height: `${element.height * 0.5625}vw`, minHeight: '120px' }}>
              <ChartWidget element={element} />
            </div>
          );
        case 'qrcode':
          return (
            <div style={{ width: `${element.width}vw`, height: `${element.height * 0.5625}vw`, minHeight: '100px' }}>
              <QRCodeWidget element={element} />
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <motion.div
        key={element.id}
        style={baseStyle}
        onMouseDown={(e) => handleMouseDown(e, element.id)}
        className={`
          ${isSelected && !isPreview ? 'ring-2 ring-[var(--primary-500)]' : ''}
          ${!isPreview ? 'hover:ring-1 hover:ring-[var(--primary-500)]/50' : ''}
        `}
      >
        {content()}
        
        {/* Selection handles */}
        {isSelected && !isPreview && (
          <>
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-[var(--primary-500)] rounded-full" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--primary-500)] rounded-full" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[var(--primary-500)] rounded-full" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[var(--primary-500)] rounded-full" />
          </>
        )}
      </motion.div>
    );
  };

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => onSelectElement(null)}
    >
      {/* Grid overlay for editing */}
      {!isPreview && (
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(to right, #fff 1px, transparent 1px),
              linear-gradient(to bottom, #fff 1px, transparent 1px)
            `,
            backgroundSize: '10% 10%',
          }} />
        </div>
      )}

      {/* Elements */}
      {elements
        .sort((a, b) => a.zIndex - b.zIndex)
        .map(renderElement)}
    </div>
  );
};
