import { motion } from 'framer-motion';
import { Plus, Copy, Trash2, MoreVertical, Layers } from 'lucide-react';
import type { Slide, SlideElement } from '../types';

interface SlideThumbnailsProps {
  slides: Slide[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDuplicate?: (index: number) => void;
  onDelete?: (index: number) => void;
}

// Helper to render a mini preview of elements
const MiniSlidePreview: React.FC<{ slide: Slide }> = ({ slide }) => {
  return (
    <div 
      className="w-full h-full relative overflow-hidden"
      style={{ background: slide.background }}
    >
      {slide.elements?.slice(0, 3).map((el: SlideElement) => (
        <div
          key={el.id}
          className="absolute"
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            transform: 'translate(-50%, -50%)',
            fontSize: '3px',
            color: el.style.color,
            opacity: el.opacity,
          }}
        >
          {el.type === 'text' ? 'T' : el.type === 'image' ? 'IMG' : el.type === 'video' ? 'VID' : '•'}
        </div>
      ))}
      {slide.elements && slide.elements.length > 3 && (
        <div className="absolute bottom-1 right-1 text-[4px] text-white/50">
          +{slide.elements.length - 3}
        </div>
      )}
    </div>
  );
};

export const SlideThumbnails: React.FC<SlideThumbnailsProps> = ({
  slides,
  currentIndex,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
}) => {
  return (
    <div className="w-[280px] bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] flex flex-col">
      {/* Header */}
      <div className="h-12 px-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-[var(--text-tertiary)]" />
          <span className="text-[13px] font-medium text-[var(--text-secondary)]">
            {slides.length} {slides.length === 1 ? 'slide' : 'slides'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onAdd}
            className="btn btn-ghost btn-icon tooltip"
            data-tooltip="Nouveau slide"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {slides.map((slide, index) => (
          <motion.div
            key={slide.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            onClick={() => onSelect(index)}
            className={`group relative cursor-pointer transition-all ${
              currentIndex === index
                ? 'ring-2 ring-[var(--primary-500)] ring-offset-2 ring-offset-[var(--bg-secondary)]'
                : 'hover:ring-1 hover:ring-[var(--border-default)]'
            } rounded-lg overflow-hidden`}
          >
            {/* Slide Number Badge */}
            <div className="absolute top-2 left-2 z-10">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                currentIndex === index
                  ? 'bg-[var(--primary-500)] text-white'
                  : 'bg-black/40 text-white/90'
              }`}>
                {index + 1}
              </span>
            </div>

            {/* Actions Menu */}
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1 rounded bg-black/40 text-white/90 hover:bg-black/60 transition-colors">
                <MoreVertical size={12} />
              </button>
            </div>

            {/* Thumbnail Preview */}
            <div className="aspect-video relative bg-[var(--bg-tertiary)]">
              <MiniSlidePreview slide={slide} />

              {/* Animation Indicator */}
              <div className="absolute bottom-2 right-2">
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-black/30 text-white/70 capitalize">
                  {slide.transition || 'fade'}
                </span>
              </div>

              {/* Hover Overlay */}
              <div className={`absolute inset-0 transition-colors ${
                currentIndex === index
                  ? 'bg-[var(--primary-500)]/5'
                  : 'bg-transparent group-hover:bg-white/5'
              }`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer - Quick Actions */}
      <div className="h-10 px-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-tertiary)]">
          {currentIndex + 1} sur {slides.length}
        </span>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onDuplicate?.(currentIndex)}
            disabled={!onDuplicate}
            className="btn btn-ghost btn-icon disabled:opacity-30" 
            title="Dupliquer le slide"
          >
            <Copy size={14} />
          </button>
          <button 
            onClick={() => onDelete?.(currentIndex)}
            disabled={!onDelete || slides.length <= 1}
            className="btn btn-ghost btn-icon text-[var(--accent-red)] disabled:opacity-30" 
            title="Supprimer le slide"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
