import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Type, Image, Video, Square, Code, Trash2, Copy, Upload, X,
  Plus, Clock, AlignJustify, Calendar, Cloud, Share2, Globe, BarChart2, QrCode
} from 'lucide-react';
import type { SlideElement, ElementType, AnimationConfig } from '../types';

interface ElementEditorV2Props {
  elements: SlideElement[];
  selectedElement: SlideElement | null;
  onAddElement: (type: ElementType) => void;
  onUpdateElement: (id: string, updates: Partial<SlideElement>) => void;
  onUpdateStyle: (id: string, style: Partial<SlideElement['style']>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onAddAnimation: (elementId: string, animation: AnimationConfig) => void;
  onRemoveAnimation: (elementId: string, animationId: string) => void;
  onUpdateAnimation: (elementId: string, animationId: string, updates: Partial<AnimationConfig>) => void;
  onSelectElement?: (id: string | null) => void;
}

const elementTypes: { type: ElementType; icon: React.ReactNode; label: string; category: string; color?: string }[] = [
  // Basique
  { type: 'text', icon: <Type size={18} />, label: 'Texte', category: 'Basique' },
  { type: 'image', icon: <Image size={18} />, label: 'Image', category: 'Basique' },
  { type: 'video', icon: <Video size={18} />, label: 'Vidéo', category: 'Basique' },
  { type: 'shape', icon: <Square size={18} />, label: 'Forme', category: 'Basique' },
  { type: 'code', icon: <Code size={18} />, label: 'Code', category: 'Basique' },
  // Dynamique
  { type: 'marquee', icon: <AlignJustify size={18} />, label: 'Défilant', category: 'Dynamique', color: 'var(--accent-yellow)' },
  { type: 'datetime', icon: <Calendar size={18} />, label: 'Date / Heure', category: 'Dynamique', color: 'var(--accent-cyan)' },
  { type: 'weather', icon: <Cloud size={18} />, label: 'Météo', category: 'Dynamique', color: 'var(--accent-blue)' },
  // Réseaux & Web
  { type: 'social', icon: <Share2 size={18} />, label: 'Social', category: 'Réseaux & Web', color: 'var(--primary-400)' },
  { type: 'iframe', icon: <Globe size={18} />, label: 'Page Web', category: 'Réseaux & Web', color: 'var(--accent-green)' },
  // Données
  { type: 'chart', icon: <BarChart2 size={18} />, label: 'Graphique', category: 'Données', color: 'var(--accent-orange)' },
  { type: 'qrcode', icon: <QrCode size={18} />, label: 'QR Code', category: 'Données', color: 'var(--accent-pink)' },
];

const elementCategories = ['Basique', 'Dynamique', 'Réseaux & Web', 'Données'] as const;

const animationTypes = [
  { value: 'fade', label: 'Fondu Entrée', category: 'Entrée' },
  { value: 'slide', label: 'Glisser Entrée', category: 'Entrée' },
  { value: 'scale', label: 'Échelle Entrée', category: 'Entrée' },
  { value: 'rotate', label: 'Rotation', category: 'Entrée' },
  { value: 'zoom', label: 'Zoom', category: 'Entrée' },
  { value: 'fadeOut', label: 'Fondu Sortie', category: 'Sortie' },
  { value: 'slideOut', label: 'Glisser Sortie', category: 'Sortie' },
  { value: 'scaleOut', label: 'Échelle Sortie', category: 'Sortie' },
];

const easingOptions = [
  { value: 'linear', label: 'Linéaire' },
  { value: 'ease', label: 'Ease' },
  { value: 'easeIn', label: 'Ease In' },
  { value: 'easeOut', label: 'Ease Out' },
  { value: 'easeInOut', label: 'Ease In Out' },
  { value: 'spring', label: 'Spring' },
];

export const ElementEditorV2: React.FC<ElementEditorV2Props> = ({
  elements,
  selectedElement,
  onAddElement,
  onUpdateElement,
  onUpdateStyle,
  onDeleteElement,
  onDuplicateElement,
  onAddAnimation,
  onRemoveAnimation,
  onUpdateAnimation,
  onSelectElement,
}) => {
  const [activeTab, setActiveTab] = useState<'add' | 'properties' | 'timeline'>('add');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUpdateElement(selectedElement.id, {
        content: dataUrl,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const addNewAnimation = () => {
    if (!selectedElement) return;
    
    const newAnimation: AnimationConfig = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'fade',
      startTime: selectedElement.timeline.animations.length * 500,
      duration: 500,
      easing: 'easeOut',
    };
    
    onAddAnimation(selectedElement.id, newAnimation);
  };

  return (
    <div className="w-80 bg-[var(--bg-secondary)] border-l border-[var(--border-subtle)] flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-[var(--border-subtle)]">
        {[
          { id: 'add', label: 'Ajouter', icon: <Plus size={14} /> },
          { id: 'properties', label: 'Propriétés', icon: <Type size={14} /> },
          { id: 'timeline', label: 'Timeline', icon: <Clock size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 text-[12px] font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-[var(--primary-400)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              {tab.icon}
              {tab.label}
            </div>
            {activeTab === tab.id && (
              <motion.div
                layoutId="elementTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-500)]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <p className="text-[12px] text-[var(--text-secondary)]">
                Cliquez pour ajouter un élément au centre du slide
              </p>

              {/* Categories */}
              {elementCategories.map((category) => {
                const items = elementTypes.filter(e => e.category === category);
                return (
                  <div key={category}>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-2 mt-4">
                      {category}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map(({ type, icon, label, color }) => (
                        <button
                          key={type}
                          onClick={() => onAddElement(type)}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--primary-500)] transition-all hover:scale-[1.03] group"
                        >
                          <div style={{ color: color || 'var(--primary-400)' }} className="transition-transform group-hover:scale-110">
                            {icon}
                          </div>
                          <span className="text-[11px] font-medium text-center leading-tight">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Elements list */}
              <div className="mt-6">
                <h4 className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                  Éléments ({elements.length})
                </h4>
                <div className="space-y-1">
                  {elements.map((el, idx) => {
                    const elMeta = elementTypes.find(t => t.type === el.type);
                    return (
                      <div
                        key={el.id}
                        onClick={() => onSelectElement?.(el.id)}
                        className={`
                          flex items-center gap-2 p-2 rounded-lg text-[12px] cursor-pointer transition-colors
                          ${selectedElement?.id === el.id
                            ? 'bg-[var(--primary-500)]/10 border border-[var(--primary-500)]/30'
                            : 'bg-[var(--bg-tertiary)] border border-transparent hover:bg-[var(--bg-tertiary)]/80'
                          }
                        `}
                      >
                        <span style={{ color: elMeta?.color || 'var(--primary-400)' }}>
                          {elMeta?.icon ?? <Type size={14} />}
                        </span>
                        <span className="flex-1 truncate">{elMeta?.label || el.type} {idx + 1}</span>
                        {el.fileName && <span className="text-[10px] text-[var(--text-tertiary)] truncate max-w-20">{el.fileName}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'properties' && selectedElement && (
            <motion.div
              key="properties"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* File Upload for Image/Video */}
              {(selectedElement.type === 'image' || selectedElement.type === 'video') && (
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">
                    Fichier
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={selectedElement.type === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--primary-500)] transition-colors"
                  >
                    <Upload size={16} />
                    <span className="text-[12px]">
                      {selectedElement.fileName ? 'Changer le fichier' : 'Charger un fichier'}
                    </span>
                  </button>
                  {selectedElement.fileName && (
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-1 truncate">
                      {selectedElement.fileName}
                    </p>
                  )}
                </div>
              )}

              {/* Content */}
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">
                  Contenu
                </label>
                {selectedElement.type === 'text' || selectedElement.type === 'code' ? (
                  <textarea
                    value={selectedElement.content}
                    onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
                    className="input text-[13px] min-h-[80px] resize-none w-full"
                  />
                ) : selectedElement.type === 'image' || selectedElement.type === 'video' ? (
                  <input
                    type="text"
                    value={selectedElement.content}
                    onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
                    placeholder="URL ou fichier local..."
                    className="input text-[13px] w-full"
                  />
                ) : selectedElement.type === 'marquee' ? (
                  <textarea
                    value={selectedElement.content}
                    onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
                    className="input text-[13px] min-h-[60px] resize-none w-full"
                    placeholder="Texte défilant..."
                  />
                ) : null}
              </div>

              {/* Widget Config — Marquee */}
              {selectedElement.type === 'marquee' && (
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">
                    Configuration défilant
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] w-20">Direction</span>
                      <select
                        value={selectedElement.config?.marqueeDirection ?? 'left'}
                        onChange={(e) => onUpdateElement(selectedElement.id, { config: { ...selectedElement.config, marqueeDirection: e.target.value as any } })}
                        className="input text-[12px] flex-1"
                      >
                        <option value="left">Gauche</option>
                        <option value="right">Droite</option>
                        <option value="up">Haut</option>
                        <option value="down">Bas</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] w-20">Vitesse</span>
                      <input type="range" min={10} max={300} value={selectedElement.config?.marqueeSpeed ?? 80}
                        onChange={(e) => onUpdateElement(selectedElement.id, { config: { ...selectedElement.config, marqueeSpeed: Number(e.target.value) } })}
                        className="flex-1" />
                      <span className="text-[11px] w-8 text-right">{selectedElement.config?.marqueeSpeed ?? 80}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] w-20">Répéter</span>
                      <input type="checkbox" checked={selectedElement.config?.marqueeRepeat ?? true}
                        onChange={(e) => onUpdateElement(selectedElement.id, { config: { ...selectedElement.config, marqueeRepeat: e.target.checked } })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Widget Config — DateTime */}
              {selectedElement.type === 'datetime' && (
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">
                    Configuration Date/Heure
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] w-20">Format</span>
                      <select
                        value={selectedElement.config?.dateFormat ?? 'full'}
                        onChange={(e) => onUpdateElement(selectedElement.id, { config: { ...selectedElement.config, dateFormat: e.target.value } })}
                        className="input text-[12px] flex-1"
                      >
                        <option value="full">Date + Heure complète</option>
                        <option value="date">Date seulement</option>
                        <option value="time">Heure complète</option>
                        <option value="time-short">Heure courte</option>
                        <option value="date-short">Date courte</option>
                        <option value="clock">⏰ Horloge digitale</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] w-20">Fuseau</span>
                      <select
                        value={selectedElement.config?.timezone ?? 'Europe/Paris'}
                        onChange={(e) => onUpdateElement(selectedElement.id, { config: { ...selectedElement.config, timezone: e.target.value } })}
                        className="input text-[12px] flex-1"
                      >
                        <option value="Europe/Paris">Paris</option>
                        <option value="Europe/London">Londres</option>
                        <option value="America/New_York">New York</option>
                        <option value="America/Los_Angeles">Los Angeles</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                        <option value="Asia/Dubai">Dubai</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] w-20">Locale</span>
                      <select
                        value={selectedElement.config?.dateLocale ?? 'fr-FR'}
                        onChange={(e) => onUpdateElement(selectedElement.id, { config: { ...selectedElement.config, dateLocale: e.target.value } })}
                        className="input text-[12px] flex-1"
                      >
                        <option value="fr-FR">Français</option>
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="de-DE">Deutsch</option>
                        <option value="es-ES">Español</option>
                        <option value="ar-SA">Arabic</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Widget Config — Weather */}
              {selectedElement.type === 'weather' && (
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">
                    Configuration Météo
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] w-20">Ville</span>
                      <input type="text" value={selectedElement.config?.weatherCity ?? 'Paris'}
                        onChange={(e) => onUpdateElement(selectedElement.id, { config: { ...selectedElement.config, weatherCity: e.target.value } })}
                        className="input text-[12px] flex-1" placeholder="Paris, Lyon..." />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] w-20">Clé API</span>
                      <input type="password" value={selectedElement.config?.weatherApiKey ?? ''}
                        onChange={(e) => onUpdateElement(selectedElement.id, { config: { ...selectedElement.config, weatherApiKey: e.target.value } })}
                        className="input text-[12px] flex-1" placeholder="OpenWeatherMap API key" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] w-20">Unité</span>
                      <select value={selectedElement.config?.weatherUnit ?? 'celsius'}
                        onChange={(e) => onUpdateElement(selectedElement.id, { config: { ...selectedElement.config, weatherUnit: e.target.value as any } })}
                        className="input text-[12px] flex-1">
                        <option value="celsius">Celsius (°C)</option>
                        <option value="fahrenheit">Fahrenheit (°F)</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-[var(--text-tertiary)] p-2 rounded bg-[var(--bg-tertiary)]">
                      ⚠️ Clé API OpenWeatherMap requise pour les données réelles.<br />Sans clé : données de démonstration.
                    </p>
                  </div>
                </div>
              )}

              {/* Widget Config — Social */}
              {selectedElement.type === 'social' && (
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">
                    Configuration Réseau Social
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] w-20">Plateforme</span>
                      <select value={selectedElement.config?.socialPlatform ?? 'twitter'}
                        onChange={(e) => onUpdateElement(selectedElement.id, { config: { ...selectedElement.config, socialPlatform: e.target.value as any } })}
                        className="input text-[12px] flex-1">
                        <option value="twitter">Twitter / X</option>
                        <option value="instagram">Instagram</option>
                        <option value="youtube">YouTube</option>
                        <option value="facebook">Facebook</option>
                        <option value="tiktok">TikTok</option>
                        <option value="rss">RSS Feed</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] w-20">Handle</span>
                      <input type="text" value={selectedElement.config?.socialHandle ?? ''}
                        onChange={(e) => onUpdateElement(selectedElement.id, { config: { ...selectedElement.config, socialHandle: e.target.value } })}
                        className="input text-[12px] flex-1" placeholder="@moncompte" />
                    </div>
                  </div>
                </div>
              )}

              {/* Widget Config — IFrame */}
              {selectedElement.type === 'iframe' && (
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">
                    Configuration Page Web
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] w-20">URL</span>
                      <input type="text" value={selectedElement.config?.iframeUrl ?? ''}
                        onChange={(e) => onUpdateElement(selectedElement.id, { config: { ...selectedElement.config, iframeUrl: e.target.value } })}
                        className="input text-[12px] flex-1" placeholder="https://example.com" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] w-20">Zoom</span>
                      <input type="range" min={25} max={150} value={selectedElement.config?.iframeZoom ?? 100}
                        onChange={(e) => onUpdateElement(selectedElement.id, { config: { ...selectedElement.config, iframeZoom: Number(e.target.value) } })}
                        className="flex-1" />
                      <span className="text-[11px] w-10 text-right">{selectedElement.config?.iframeZoom ?? 100}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] w-20">Défilement</span>
                      <input type="checkbox" checked={selectedElement.config?.iframeScrolling ?? false}
                        onChange={(e) => onUpdateElement(selectedElement.id, { config: { ...selectedElement.config, iframeScrolling: e.target.checked } })} />
                    </div>
                    <p className="text-[10px] text-[var(--text-tertiary)] p-2 rounded bg-[var(--bg-tertiary)]">
                      ⚠️ Certains sites bloquent l’embedding (X-Frame-Options).
                    </p>
                  </div>
                </div>
              )}

              {/* Widget Config — QR Code */}
              {selectedElement.type === 'qrcode' && (
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">
                    Configuration QR Code
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] w-20">Contenu</span>
                      <input type="text" value={selectedElement.config?.qrCodeValue ?? ''}
                        onChange={(e) => onUpdateElement(selectedElement.id, { config: { ...selectedElement.config, qrCodeValue: e.target.value } })}
                        className="input text-[12px] flex-1" placeholder="https://... ou texte" />
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">
                  Position & Taille
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'X', key: 'x', min: 0, max: 100 },
                    { label: 'Y', key: 'y', min: 0, max: 100 },
                    { label: 'Larg.', key: 'width', min: 5, max: 100 },
                    { label: 'Haut.', key: 'height', min: 5, max: 100 },
                    { label: 'Rot.', key: 'rotation', min: -360, max: 360 },
                    { label: 'Éch.', key: 'scale', min: 0.1, max: 3, step: 0.1 },
                  ].map(({ label, key, min, max, step }) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-[11px] w-8">{label}</span>
                      <input
                        type="number"
                        value={(selectedElement as any)[key]}
                        onChange={(e) => onUpdateElement(selectedElement.id, { [key]: Number(e.target.value) })}
                        min={min}
                        max={max}
                        step={step || 1}
                        className="input text-[12px] py-1 flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">
                  Style
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] w-20">Couleur</span>
                    <input
                      type="color"
                      value={selectedElement.style.color}
                      onChange={(e) => onUpdateStyle(selectedElement.id, { color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] w-20">Fond</span>
                    <input
                      type="color"
                      value={selectedElement.style.backgroundColor}
                      onChange={(e) => onUpdateStyle(selectedElement.id, { backgroundColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] w-20">Taille police</span>
                    <input
                      type="range"
                      min={8}
                      max={120}
                      value={selectedElement.style.fontSize}
                      onChange={(e) => onUpdateStyle(selectedElement.id, { fontSize: Number(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-[11px] w-8 text-right">{selectedElement.style.fontSize}px</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  onClick={() => onDuplicateElement(selectedElement.id)}
                  className="btn btn-secondary flex-1"
                >
                  <Copy size={14} />
                  Dupliquer
                </button>
                <button
                  onClick={() => onDeleteElement(selectedElement.id)}
                  className="btn btn-secondary text-red-400 flex-1"
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'timeline' && selectedElement && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Total Duration */}
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">
                  Durée totale (ms)
                </label>
                <input
                  type="number"
                  value={selectedElement.timeline.totalDuration}
                  onChange={(e) => onUpdateElement(selectedElement.id, {
                    timeline: { ...selectedElement.timeline, totalDuration: Number(e.target.value) }
                  })}
                  className="input text-[13px] w-full"
                  step={100}
                  min={1000}
                />
              </div>

              {/* Animations List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                    Animations
                  </label>
                  <button
                    onClick={addNewAnimation}
                    className="btn btn-primary btn-icon"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedElement.timeline.animations.map((anim, idx) => (
                    <div key={anim.id} className="p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium">Animation {idx + 1}</span>
                        <button
                          onClick={() => onRemoveAnimation(selectedElement.id, anim.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <select
                          value={anim.type}
                          onChange={(e) => onUpdateAnimation(selectedElement.id, anim.id, { type: e.target.value as any })}
                          className="input text-[12px] w-full"
                        >
                          {animationTypes.map(({ value, label, category }) => (
                            <optgroup key={category} label={category}>
                              <option value={value}>{label}</option>
                            </optgroup>
                          ))}
                        </select>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-[var(--text-tertiary)]">Début (ms)</span>
                            <input
                              type="number"
                              value={anim.startTime}
                              onChange={(e) => onUpdateAnimation(selectedElement.id, anim.id, { startTime: Number(e.target.value) })}
                              className="input text-[12px] py-1 w-full"
                              step={100}
                              min={0}
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[var(--text-tertiary)]">Durée (ms)</span>
                            <input
                              type="number"
                              value={anim.duration}
                              onChange={(e) => onUpdateAnimation(selectedElement.id, anim.id, { duration: Number(e.target.value) })}
                              className="input text-[12px] py-1 w-full"
                              step={100}
                              min={100}
                            />
                          </div>
                        </div>

                        <select
                          value={anim.easing}
                          onChange={(e) => onUpdateAnimation(selectedElement.id, anim.id, { easing: e.target.value as any })}
                          className="input text-[12px] w-full"
                        >
                          {easingOptions.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedElement.timeline.animations.length === 0 && (
                  <p className="text-[11px] text-[var(--text-tertiary)] text-center py-4">
                    Aucune animation. Cliquez sur + pour ajouter.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
