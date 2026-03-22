import type { SlideElement } from '../../types';

interface QRCodeWidgetProps {
  element: SlideElement;
}

// Simple QR code generator using a public API (no external library needed)
export const QRCodeWidget: React.FC<QRCodeWidgetProps> = ({ element }) => {
  const config = element.config || {};
  const value = config.qrCodeValue || 'https://example.com';
  const color = element.style.color ?? '#ffffff';
  const bg = element.style.backgroundColor ?? '#000000';
  const size = Math.min(config.qrCodeSize || 200, 512);

  const encodedValue = encodeURIComponent(value);
  const encodedFg = color.replace('#', '');
  const encodedBg = bg.replace('#', '');

  // Use QR code API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodedValue}&size=${size}x${size}&color=${encodedFg}&bgcolor=${encodedBg}&format=svg&margin=1`;

  const hasValue = value.trim().length > 0;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: element.style.backgroundColor || '#ffffff',
        borderRadius: element.style.borderRadius ? `${element.style.borderRadius}px` : '12px',
        padding: element.style.padding ? `${element.style.padding}px` : '12px',
        gap: '8px',
        overflow: 'hidden',
      }}
    >
      {!hasValue ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            color: '#6366f1',
            opacity: 0.7,
          }}
        >
          <div style={{ fontSize: '3rem' }}>⬛</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#6366f1' }}>QR Code</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.6, textAlign: 'center' }}>
            Ajoutez l&apos;URL ou le texte<br />dans les propriétés
          </div>
        </div>
      ) : (
        <>
          <img
            src={qrUrl}
            alt="QR Code"
            style={{
              width: '80%',
              height: '80%',
              objectFit: 'contain',
              imageRendering: 'crisp-edges',
            }}
            loading="lazy"
          />
          <div
            style={{
              fontSize: '0.65rem',
              color: element.style.color ?? '#666',
              textAlign: 'center',
              opacity: 0.7,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {value}
          </div>
        </>
      )}
    </div>
  );
};
