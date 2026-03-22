import { motion } from 'framer-motion';
import { X, Sparkles, Briefcase, Palette, Minimize2, Moon, ArrowRight } from 'lucide-react';
import { templates } from '../data/templatesV2';
import type { Template } from '../types';

interface TemplateGalleryProps {
  onSelect: (template: Template) => void;
  onClose: () => void;
}

const categoryIcons = {
  business: <Briefcase size={16} />,
  creative: <Palette size={16} />,
  minimal: <Minimize2 size={16} />,
  colorful: <Sparkles size={16} />,
  dark: <Moon size={16} />,
};

const categoryLabels = {
  business: 'Business',
  creative: 'Créatif',
  minimal: 'Minimal',
  colorful: 'Coloré',
  dark: 'Sombre',
};

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onSelect,
  onClose,
}) => {
  const categories = [...new Set(templates.map((t) => t.category))];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[var(--bg-primary)]/95 backdrop-blur-xl flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="bg-[var(--bg-secondary)] rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border-subtle)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-16 px-6 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--gradient-primary)] flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Templates</h2>
              <p className="text-[12px] text-[var(--text-tertiary)]">
                Choisissez un point de départ pour votre présentation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg-primary)]">
          {categories.map((category) => (
            <div key={category} className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[var(--primary-400)]">
                  {categoryIcons[category]}
                </span>
                <h3 className="text-[14px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  {categoryLabels[category]}
                </h3>
                <div className="flex-1 h-px bg-[var(--border-subtle)] ml-4" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {templates
                  .filter((t) => t.category === category)
                  .map((template, index) => (
                    <motion.button
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      onClick={() => onSelect(template)}
                      className="group relative rounded-xl overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--primary-500)] transition-all hover:shadow-lg hover:shadow-[var(--primary-500)]/10 bg-[var(--bg-secondary)]"
                    >
                      {/* Thumbnail */}
                      <div
                        className="aspect-video relative"
                        style={{ background: template.thumbnail }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        
                        {/* Slide count badge */}
                        <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium">
                          {template.slides.length} slides
                        </div>

                        {/* Title overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h4 className="font-semibold text-white text-left text-[14px]">
                            {template.name}
                          </h4>
                        </div>

                        {/* Hover overlay with CTA */}
                        <div className="absolute inset-0 bg-[var(--primary-500)]/0 group-hover:bg-[var(--primary-500)]/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[var(--bg-primary)] font-medium text-[13px] transform translate-y-4 group-hover:translate-y-0 transition-transform">
                            Utiliser
                            <ArrowRight size={14} />
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="h-14 px-6 border-t border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-secondary)]">
          <p className="text-[12px] text-[var(--text-tertiary)]">
            {templates.length} templates disponibles
          </p>
          <button
            onClick={onClose}
            className="btn btn-secondary text-[13px]"
          >
            Commencer à blanc
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
