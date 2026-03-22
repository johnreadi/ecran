export type ElementType = 'text' | 'image' | 'video' | 'shape' | 'icon' | 'code' | 'marquee' | 'datetime' | 'weather' | 'social' | 'iframe' | 'chart' | 'qrcode';

export interface ElementConfig {
  // Marquee
  marqueeSpeed?: number; // pixels per second
  marqueeDirection?: 'left' | 'right' | 'up' | 'down';
  marqueeRepeat?: boolean;
  // DateTime
  dateFormat?: string; // ex: 'DD/MM/YYYY HH:mm:ss'
  timezone?: string;
  dateLocale?: string;
  // Weather
  weatherCity?: string;
  weatherApiKey?: string;
  weatherUnit?: 'celsius' | 'fahrenheit';
  weatherShowIcon?: boolean;
  // Social
  socialPlatform?: 'twitter' | 'instagram' | 'youtube' | 'facebook' | 'tiktok' | 'rss';
  socialHandle?: string;
  socialPostId?: string;
  socialShowAvatar?: boolean;
  // IFrame
  iframeUrl?: string;
  iframeScrolling?: boolean;
  iframeZoom?: number;
  // Chart
  chartType?: 'bar' | 'line' | 'pie' | 'donut';
  chartData?: { labels: string[]; datasets: { label: string; data: number[]; color?: string }[] };
  // QR Code
  qrCodeValue?: string;
  qrCodeSize?: number;
}

export type AnimationType = 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'flip' | 'pulse' | 'shake' | 'zoom' | 'fadeOut' | 'slideOut' | 'scaleOut';
export type EasingType = 'linear' | 'ease' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spring';

export interface AnimationConfig {
  id: string;
  type: AnimationType;
  startTime: number; // temps de début en ms sur la timeline
  duration: number; // durée en ms
  easing: EasingType;
  properties?: {
    opacity?: number;
    x?: number;
    y?: number;
    scale?: number;
    rotation?: number;
  };
}

export interface ElementTimeline {
  animations: AnimationConfig[];
  totalDuration: number; // durée totale de visibilité de l'élément
}

export interface SlideElement {
  id: string;
  type: ElementType;
  content: string; // URL ou data URI pour les fichiers locaux
  fileName?: string; // nom du fichier pour les uploads locaux
  x: number; // position en pourcentage (0-100)
  y: number; // position en pourcentage (0-100)
  width: number; // taille en pourcentage
  height: number; // taille en pourcentage
  rotation: number; // degrés
  scale: number;
  opacity: number;
  zIndex: number;
  style: {
    fontSize?: number;
    fontWeight?: string;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    padding?: number;
    textAlign?: 'left' | 'center' | 'right';
    boxShadow?: string;
  };
  timeline: ElementTimeline;
  config?: ElementConfig; // configuration spécifique au type d'élément
}

export interface Slide {
  id: string;
  name: string;
  background: string;
  elements: SlideElement[];
  transition: TransitionType;
  duration: number;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption?: string;
}

export type TransitionType = 
  | 'fade' 
  | 'slide' 
  | 'scale' 
  | 'rotate' 
  | 'flip' 
  | 'cube' 
  | 'zoom' 
  | 'wipe'
  | 'morph'
  | 'glitch';

export interface Presentation {
  id: string;
  name: string;
  slides: Slide[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Template {
  id: string;
  name: string;
  thumbnail: string;
  slides: Slide[];
  category: 'business' | 'creative' | 'minimal' | 'colorful' | 'dark';
}

export type EditorMode = 'edit' | 'preview' | 'present';
