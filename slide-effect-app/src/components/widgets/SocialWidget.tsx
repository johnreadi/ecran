import type { SlideElement } from '../../types';

interface SocialWidgetProps {
  element: SlideElement;
}

const PLATFORM_COLORS: Record<string, string> = {
  twitter: '#1DA1F2',
  instagram: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
  youtube: '#FF0000',
  facebook: '#1877F2',
  tiktok: '#010101',
  rss: '#F26522',
};

const PLATFORM_ICONS: Record<string, string> = {
  twitter: '𝕏',
  instagram: '📸',
  youtube: '▶',
  facebook: 'f',
  tiktok: '♪',
  rss: '⛁',
};

const PLATFORM_LABELS: Record<string, string> = {
  twitter: 'Twitter / X',
  instagram: 'Instagram',
  youtube: 'YouTube',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  rss: 'RSS Feed',
};

// Sample demo posts per platform
const DEMO_CONTENT: Record<string, { avatar: string; name: string; handle: string; text: string; metrics: string }> = {
  twitter: {
    avatar: '🐦',
    name: 'Mon Compte',
    handle: '@moncompte',
    text: 'Ceci est un exemple de post Twitter/X. Ajoutez votre handle pour afficher vos vraies publications. #demo #slideeffect',
    metrics: '♥ 42  ↺ 12  💬 8',
  },
  instagram: {
    avatar: '📸',
    name: 'mon_compte',
    handle: '@mon_compte',
    text: 'Photo de démonstration Instagram ✨ Ajoutez votre compte pour afficher votre fil réel.',
    metrics: '❤️ 234  💬 18',
  },
  youtube: {
    avatar: '▶',
    name: 'Ma Chaîne',
    handle: 'youtube.com/@machaîne',
    text: '🎬 Dernière vidéo : "Comment créer des présentations époustouflantes" • 12:34 • 5 420 vues',
    metrics: '👍 312  💬 47  ▶ 5 420 vues',
  },
  facebook: {
    avatar: 'f',
    name: 'Ma Page',
    handle: 'facebook.com/mapage',
    text: 'Ceci est un exemple de publication Facebook. Configurez votre ID de page pour afficher votre contenu réel.',
    metrics: '👍 89  💬 12  ↗ 5',
  },
  tiktok: {
    avatar: '♪',
    name: 'moncompte',
    handle: '@moncompte',
    text: '🎵 Vidéo TikTok en tendance ! Musique originale • 1,2M vues • #trending #viral #foryou',
    metrics: '❤️ 45,2K  💬 1,2K  ↗ 890',
  },
  rss: {
    avatar: '⛁',
    name: 'Mon Blog RSS',
    handle: 'rss://monblog.com/feed',
    text: '📰 Dernière publication : "Les meilleures pratiques pour 2025" — 5 min de lecture',
    metrics: '📖 1 234 lecteurs',
  },
};

export const SocialWidget: React.FC<SocialWidgetProps> = ({ element }) => {
  const config = element.config || {};
  const platform = config.socialPlatform ?? 'twitter';
  const handle = config.socialHandle ?? '';
  const color = element.style.color ?? '#ffffff';
  const fontSize = element.style.fontSize ?? 20;
  const platformColor = PLATFORM_COLORS[platform] ?? '#6366f1';
  const demo = DEMO_CONTENT[platform];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: element.style.backgroundColor || 'rgba(0,0,0,0.7)',
        borderRadius: element.style.borderRadius ? `${element.style.borderRadius}px` : '16px',
        padding: element.style.padding ? `${element.style.padding}px` : '20px',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${typeof platformColor === 'string' && !platformColor.startsWith('linear') ? platformColor + '40' : 'rgba(255,255,255,0.1)'}`,
        overflow: 'hidden',
        gap: '12px',
      }}
    >
      {/* Platform header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: `${fontSize * 1.8}px`,
            height: `${fontSize * 1.8}px`,
            borderRadius: '50%',
            background: typeof platformColor === 'string' && platformColor.startsWith('linear')
              ? platformColor
              : platformColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${fontSize * 0.9}px`,
            fontWeight: 'bold',
            color: '#ffffff',
            flexShrink: 0,
          }}
        >
          {PLATFORM_ICONS[platform]}
        </div>
        <div>
          <div style={{ color, fontSize: `${fontSize * 0.85}px`, fontWeight: 'bold' }}>
            {handle || demo.name}
          </div>
          <div style={{ color, fontSize: `${fontSize * 0.6}px`, opacity: 0.6 }}>
            {handle ? `@${handle}` : demo.handle}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: `${fontSize * 0.7}px`, opacity: 0.5, color }}>
          {PLATFORM_LABELS[platform]}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />

      {/* Post content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{ color, fontSize: `${fontSize * 0.8}px`, lineHeight: 1.5, margin: 0 }}>
          {demo.text}
        </p>
      </div>

      {/* Metrics */}
      <div style={{ color, fontSize: `${fontSize * 0.65}px`, opacity: 0.7 }}>
        {demo.metrics}
      </div>

      {/* Demo notice */}
      {!handle && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '10px',
            fontSize: `${fontSize * 0.4}px`,
            color,
            opacity: 0.3,
          }}
        >
          Démo
        </div>
      )}
    </div>
  );
};
