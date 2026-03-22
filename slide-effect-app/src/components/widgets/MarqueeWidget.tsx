import { useRef, useEffect } from 'react';
import type { SlideElement } from '../../types';

interface MarqueeWidgetProps {
  element: SlideElement;
  isEditing?: boolean;
}

export const MarqueeWidget: React.FC<MarqueeWidgetProps> = ({ element, isEditing }) => {
  const config = element.config || {};
  const speed = config.marqueeSpeed ?? 80;
  const direction = config.marqueeDirection ?? 'left';
  const repeat = config.marqueeRepeat ?? true;
  const isVertical = direction === 'up' || direction === 'down';
  const containerRef = useRef<HTMLDivElement>(null);

  const animName = `marquee-${element.id}`;
  const duration = `${Math.max(3, 300 / speed)}s`;

  // Build keyframes via style tag
  useEffect(() => {
    const styleId = `marquee-style-${element.id}`;
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    let fromVal = '';
    let toVal = '';
    if (direction === 'left') { fromVal = 'translateX(100%)'; toVal = 'translateX(-100%)'; }
    if (direction === 'right') { fromVal = 'translateX(-100%)'; toVal = 'translateX(100%)'; }
    if (direction === 'up') { fromVal = 'translateY(100%)'; toVal = 'translateY(-100%)'; }
    if (direction === 'down') { fromVal = 'translateY(-100%)'; toVal = 'translateY(100%)'; }

    styleEl.textContent = `
      @keyframes ${animName} {
        from { transform: ${fromVal}; }
        to   { transform: ${toVal}; }
      }
    `;
    return () => { styleEl?.remove(); };
  }, [animName, direction, element.id]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: isVertical ? 'flex-start' : 'center',
        backgroundColor: element.style.backgroundColor || 'transparent',
        borderRadius: element.style.borderRadius ? `${element.style.borderRadius}px` : undefined,
        padding: element.style.padding ? `${element.style.padding}px` : undefined,
        cursor: isEditing ? 'default' : 'default',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          whiteSpace: isVertical ? 'normal' : 'nowrap',
          animation: isEditing ? 'none' : `${animName} ${duration} linear ${repeat ? 'infinite' : 'forwards'}`,
          fontSize: element.style.fontSize ? `${element.style.fontSize}px` : '2rem',
          fontWeight: element.style.fontWeight ?? 'bold',
          fontFamily: element.style.fontFamily ?? 'Inter',
          color: element.style.color ?? '#ffffff',
        }}
      >
        {element.content || 'Texte défilant ici...'}
      </span>
    </div>
  );
};
