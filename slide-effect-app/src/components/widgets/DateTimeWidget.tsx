import { useState, useEffect } from 'react';
import type { SlideElement } from '../../types';

interface DateTimeWidgetProps {
  element: SlideElement;
}

export const DateTimeWidget: React.FC<DateTimeWidgetProps> = ({ element }) => {
  const config = element.config || {};
  const format = config.dateFormat ?? 'full';
  const locale = config.dateLocale ?? 'fr-FR';
  const timezone = config.timezone ?? 'Europe/Paris';
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (): string => {
    try {
      const opts: Intl.DateTimeFormatOptions = { timeZone: timezone };

      if (format === 'full') {
        return now.toLocaleString(locale, {
          ...opts,
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      }
      if (format === 'date') {
        return now.toLocaleDateString(locale, {
          ...opts,
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
      }
      if (format === 'time') {
        return now.toLocaleTimeString(locale, {
          ...opts,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      }
      if (format === 'time-short') {
        return now.toLocaleTimeString(locale, { ...opts, hour: '2-digit', minute: '2-digit' });
      }
      if (format === 'date-short') {
        return now.toLocaleDateString(locale, { ...opts, day: '2-digit', month: '2-digit', year: 'numeric' });
      }
      return now.toLocaleString(locale, opts);
    } catch {
      return now.toLocaleString();
    }
  };

  const getClockDigits = () => {
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    return { h, m, s };
  };

  const isClockStyle = format === 'clock';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: element.style.backgroundColor || 'rgba(0,0,0,0.5)',
        borderRadius: element.style.borderRadius ? `${element.style.borderRadius}px` : '16px',
        padding: element.style.padding ? `${element.style.padding}px` : '16px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden',
      }}
    >
      {isClockStyle ? (
        <ClockDisplay getDigits={getClockDigits} element={element} />
      ) : (
        <span
          style={{
            fontSize: element.style.fontSize ? `${element.style.fontSize}px` : '2rem',
            fontWeight: element.style.fontWeight ?? 'bold',
            fontFamily: element.style.fontFamily ?? 'Inter',
            color: element.style.color ?? '#ffffff',
            textAlign: (element.style.textAlign as any) ?? 'center',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            lineHeight: 1.3,
          }}
        >
          {formatDate()}
        </span>
      )}
    </div>
  );
};

const ClockDisplay: React.FC<{
  getDigits: () => { h: string; m: string; s: string };
  element: SlideElement;
}> = ({ getDigits, element }) => {
  const { h, m, s } = getDigits();
  const fontSize = element.style.fontSize ?? 64;
  const color = element.style.color ?? '#ffffff';
  const fontFamily = element.style.fontFamily ?? 'monospace';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {[h, ':', m, ':', s].map((seg, i) => (
        <span
          key={i}
          style={{
            fontSize: `${seg === ':' ? fontSize * 0.7 : fontSize}px`,
            fontWeight: 'bold',
            fontFamily,
            color,
            textShadow: `0 0 20px ${color}80`,
            minWidth: seg === ':' ? undefined : `${fontSize * 1.2}px`,
            textAlign: 'center',
            display: 'inline-block',
            background: seg !== ':' ? 'rgba(255,255,255,0.05)' : undefined,
            borderRadius: seg !== ':' ? '8px' : undefined,
            padding: seg !== ':' ? '4px 8px' : undefined,
          }}
        >
          {seg}
        </span>
      ))}
    </div>
  );
};
