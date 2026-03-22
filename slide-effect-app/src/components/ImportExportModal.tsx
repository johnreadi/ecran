import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileJson, FileText, AlertCircle, Check } from 'lucide-react';
import type { Presentation } from '../types';

interface ImportExportModalProps {
  presentation: Presentation;
  onImport: (presentation: Presentation) => void;
  onClose: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  presentation,
  onImport,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('export');
  const [dragOver, setDragOver] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(presentation, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${presentation.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportHTML = () => {
    const htmlContent = generateHTMLExport(presentation);
    const dataBlob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${presentation.name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateHTMLExport = (pres: Presentation): string => {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pres.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0a0a0f; color: white; }
    .slide { width: 100vw; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 4rem; }
    .slide h1 { font-size: 4rem; margin-bottom: 1rem; }
    .slide h2 { font-size: 2rem; opacity: 0.8; margin-bottom: 1rem; }
    .slide p { font-size: 1.5rem; max-width: 800px; text-align: center; }
    .navigation { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); display: flex; gap: 1rem; z-index: 100; }
    .nav-btn { padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.1); border: none; color: white; border-radius: 0.5rem; cursor: pointer; }
    .nav-btn:hover { background: rgba(255,255,255,0.2); }
    .progress { position: fixed; bottom: 0; left: 0; height: 4px; background: #6366f1; transition: width 0.3s; }
  </style>
</head>
<body>
  ${pres.slides.map((slide, idx) => `
  <div class="slide" id="slide-${idx}" style="background: ${slide.background}; color: #ffffff; display: ${idx === 0 ? 'flex' : 'none'};">
    ${slide.elements?.map((el: any) => `
      <div style="position: absolute; left: ${el.x}%; top: ${el.y}%; transform: translate(-50%, -50%);">
        ${el.type === 'text' ? `<p style="color: ${el.style.color}; font-size: ${el.style.fontSize}px;">${el.content}</p>` : ''}
      </div>
    `).join('') || ''}
  </div>
  `).join('')}
  
  <div class="progress" id="progress" style="width: ${100 / pres.slides.length}%"></div>
  
  <div class="navigation">
    <button class="nav-btn" onclick="prevSlide()">← Précédent</button>
    <button class="nav-btn" onclick="nextSlide()">Suivant →</button>
  </div>
  
  <script>
    let currentSlide = 0;
    const totalSlides = ${pres.slides.length};
    
    function showSlide(n) {
      document.querySelectorAll('.slide').forEach((slide, idx) => {
        slide.style.display = idx === n ? 'flex' : 'none';
      });
      document.getElementById('progress').style.width = ((n + 1) / totalSlides * 100) + '%';
    }
    
    function nextSlide() {
      if (currentSlide < totalSlides - 1) {
        currentSlide++;
        showSlide(currentSlide);
      }
    }
    
    function prevSlide() {
      if (currentSlide > 0) {
        currentSlide--;
        showSlide(currentSlide);
      }
    }
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    });
  </script>
</body>
</html>`;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    setImportError(null);
    setImportSuccess(false);

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setImportError('Veuillez sélectionner un fichier JSON valide.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        
        // Validate structure
        if (!imported.name || !Array.isArray(imported.slides)) {
          throw new Error('Format de fichier invalide');
        }

        onImport(imported);
        setImportSuccess(true);
        setTimeout(() => onClose(), 1500);
      } catch (err) {
        setImportError('Erreur lors de l\'importation. Vérifiez le format du fichier.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-[var(--bg-secondary)] rounded-2xl w-full max-w-lg border border-[var(--border-subtle)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold">Importer / Exporter</h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-subtle)] px-5">
          {(['export', 'import'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? 'text-[var(--primary-400)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {tab === 'export' ? 'Exporter' : 'Importer'}
              {activeTab === tab && (
                <motion.div
                  layoutId="ioTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary-500)]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5">
          <AnimatePresence mode="wait">
            {activeTab === 'export' && (
              <motion.div
                key="export"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <p className="text-sm text-[var(--text-secondary)]">
                  Exportez votre présentation dans différents formats.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleExportJSON}
                    className="flex flex-col items-center gap-3 p-5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--primary-500)] transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[var(--primary-500)]/10 flex items-center justify-center group-hover:bg-[var(--primary-500)]/20 transition-colors">
                      <FileJson size={24} className="text-[var(--primary-400)]" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Format JSON</p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Pour réimportation
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={handleExportHTML}
                    className="flex flex-col items-center gap-3 p-5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--primary-500)] transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-green)]/10 flex items-center justify-center group-hover:bg-[var(--accent-green)]/20 transition-colors">
                      <FileText size={24} className="text-[var(--accent-green)]" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Format HTML</p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Standalone, navigable
                      </p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'import' && (
              <motion.div
                key="import"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <p className="text-sm text-[var(--text-secondary)]">
                  Importez une présentation depuis un fichier JSON.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-[var(--primary-500)] bg-[var(--primary-500)]/10'
                      : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                  }`}
                >
                  <Upload size={32} className="mx-auto mb-3 text-[var(--text-tertiary)]" />
                  <p className="font-medium">Glissez-déposez un fichier</p>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">
                    ou cliquez pour sélectionner
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-2">
                    Fichiers .json uniquement
                  </p>
                </div>

                {importError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    <AlertCircle size={16} />
                    <span className="text-sm">{importError}</span>
                  </div>
                )}

                {importSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                    <Check size={16} />
                    <span className="text-sm">Importation réussie !</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};
