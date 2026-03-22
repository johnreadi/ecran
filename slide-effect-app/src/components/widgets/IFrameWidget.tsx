import type { SlideElement } from '../../types';

interface IFrameWidgetProps {
  element: SlideElement;
  isEditing?: boolean;
}

export const IFrameWidget: React.FC<IFrameWidgetProps> = ({ element, isEditing }) => {
  const config = element.config || {};
  const url = config.iframeUrl ?? '';
  const zoom = config.iframeZoom ?? 100;
  const scrolling = config.iframeScrolling ?? false;

  const hasUrl = url.trim().length > 0;

  const normalizeUrl = (raw: string): string => {
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return `https://${raw}`;
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: element.style.borderRadius ? `${element.style.borderRadius}px` : '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: element.style.backgroundColor || '#ffffff',
        position: 'relative',
      }}
    >
      {!hasUrl ? (
        /* Placeholder when no URL */
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: 'rgba(99,102,241,0.1)',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          <div style={{ fontSize: '3rem' }}>🌐</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Page Web</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.6, textAlign: 'center', padding: '0 20px' }}>
            Entrez une URL dans les propriétés<br />pour afficher une page web
          </div>
        </div>
      ) : (
        <>
          {/* Overlay when editing to prevent interaction */}
          {isEditing && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10,
                cursor: 'move',
                background: 'transparent',
              }}
            />
          )}

          {/* URL bar */}
          <div
            style={{
              background: 'rgba(0,0,0,0.8)',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <span>🌐</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {normalizeUrl(url)}
            </span>
          </div>

          {/* iFrame */}
          <iframe
            src={normalizeUrl(url)}
            style={{
              width: `${100 / (zoom / 100)}%`,
              height: `calc(${100 / (zoom / 100)}% - 28px)`,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
              border: 'none',
              pointerEvents: isEditing ? 'none' : 'auto',
            }}
            scrolling={scrolling ? 'yes' : 'no'}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title={`iframe-${element.id}`}
            loading="lazy"
          />
        </>
      )}
    </div>
  );
};
