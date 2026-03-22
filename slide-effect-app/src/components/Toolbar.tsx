import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Upload,
  Settings,
  Share2,
  Undo2,
  Redo2,
  MoreHorizontal,
  Presentation,
} from 'lucide-react';
import type { EditorMode, Presentation as PresentationType } from '../types';
import { ShareModal } from './ShareModal';
import { SettingsModal } from './SettingsModal';
import { ImportExportModalV2 } from './ImportExportModalV2';

interface ToolbarProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  onPrev: () => void;
  onNext: () => void;
  currentIndex: number;
  totalSlides: number;
  presentationName: string;
  onNameChange: (name: string) => void;
  presentation: PresentationType;
  onImport: (presentation: PresentationType) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  mode,
  onModeChange,
  onPrev,
  onNext,
  currentIndex,
  totalSlides,
  presentationName,
  onNameChange,
  presentation,
  onImport,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-14 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] flex items-center justify-between px-4 select-none"
    >
      {/* Left Section: Logo & Document Info */}
      <div className="flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--gradient-primary)] flex items-center justify-center shadow-lg">
            <Presentation size={18} className="text-white" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight hidden lg:block">Slide Effect</span>
        </div>

        <div className="h-6 w-px bg-[var(--border-default)]" />

        {/* Document Name */}
        <div className="flex flex-col">
          <input
            type="text"
            value={presentationName}
            onChange={(e) => onNameChange(e.target.value)}
            className="bg-transparent text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)] px-2 py-1 rounded transition-all outline-none min-w-[200px]"
            placeholder="Nom de la présentation"
          />
          <span className="text-[11px] text-[var(--text-tertiary)] px-2">
            Dernière sauvegarde : à l'instant
          </span>
        </div>
      </div>

      {/* Center Section: Mode Switcher & Navigation */}
      <div className="flex items-center gap-2">
        {/* Mode Switcher */}
        <div className="flex items-center bg-[var(--bg-tertiary)] rounded-lg p-1 border border-[var(--border-subtle)]">
          {(['edit', 'preview'] as EditorMode[]).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all flex items-center gap-1.5 ${
                mode === m
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {m === 'edit' && <Edit3 size={13} />}
              {m === 'preview' && <Eye size={13} />}
              {m === 'edit' && 'Éditer'}
              {m === 'preview' && 'Aperçu'}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-[var(--border-default)] mx-2" />

        {/* Navigation Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            disabled={currentIndex === 0}
            className="btn btn-ghost btn-icon tooltip"
            data-tooltip="Précédent (←)"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-tertiary)] rounded-md border border-[var(--border-subtle)]">
            <span className="text-[12px] font-medium text-[var(--text-primary)] min-w-[20px] text-center">
              {currentIndex + 1}
            </span>
            <span className="text-[12px] text-[var(--text-tertiary)]">/</span>
            <span className="text-[12px] text-[var(--text-tertiary)] min-w-[20px] text-center">
              {totalSlides}
            </span>
          </div>

          <button
            onClick={onNext}
            disabled={currentIndex === totalSlides - 1}
            className="btn btn-ghost btn-icon tooltip"
            data-tooltip="Suivant (→)"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-1">
        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 mr-2">
          <button className="btn btn-ghost btn-icon tooltip" data-tooltip="Annuler">
            <Undo2 size={16} />
          </button>
          <button className="btn btn-ghost btn-icon tooltip" data-tooltip="Rétablir">
            <Redo2 size={16} />
          </button>
        </div>

        <div className="h-6 w-px bg-[var(--border-default)] mx-1" />

        {/* Share & Export */}
        <button 
          onClick={() => setShowShareModal(true)}
          className="btn btn-ghost btn-icon tooltip" 
          data-tooltip="Partager"
        >
          <Share2 size={16} />
        </button>
        
        <button 
          onClick={() => setShowImportExportModal(true)}
          className="btn btn-ghost btn-icon tooltip" 
          data-tooltip="Importer / Exporter"
        >
          <Upload size={16} />
        </button>

        <div className="h-6 w-px bg-[var(--border-default)] mx-1" />

        {/* Settings */}
        <button 
          onClick={() => setShowSettingsModal(true)}
          className="btn btn-ghost btn-icon tooltip" 
          data-tooltip="Paramètres"
        >
          <Settings size={16} />
        </button>

        <button className="btn btn-ghost btn-icon tooltip" data-tooltip="Plus d'options">
          <MoreHorizontal size={16} />
        </button>

        <div className="h-6 w-px bg-[var(--border-default)] mx-1" />

        {/* Present Button */}
        <button
          onClick={() => onModeChange('present')}
          className="btn btn-primary px-4 ml-2"
        >
          <Play size={14} fill="currentColor" />
          <span>Présenter</span>
        </button>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showShareModal && (
          <ShareModal 
            presentation={presentation} 
            onClose={() => setShowShareModal(false)} 
          />
        )}
        {showSettingsModal && (
          <SettingsModal 
            onClose={() => setShowSettingsModal(false)} 
          />
        )}
        {showImportExportModal && (
          <ImportExportModalV2
            presentation={presentation}
            slides={presentation.slides}
            onImport={onImport}
            onClose={() => setShowImportExportModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.header>
  );
};
