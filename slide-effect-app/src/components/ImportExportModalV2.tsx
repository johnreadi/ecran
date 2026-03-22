import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileJson, FileText, FileVideo, FileImage, AlertCircle, Check, Loader2, Radio, Server, Send } from 'lucide-react';
import type { Presentation, Slide } from '../types';

interface ImportExportModalV2Props {
  presentation: Presentation;
  slides: Slide[];
  onImport: (presentation: Presentation) => void;
  onClose: () => void;
}

export const ImportExportModalV2: React.FC<ImportExportModalV2Props> = ({
  presentation,
  slides,
  onImport,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'publish'>('export');
  const [dragOver, setDragOver] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Publish states
  const [serverUrl, setServerUrl] = useState('http://localhost:3003');
  const [adminToken, setAdminToken] = useState('');
  const [players, setPlayers] = useState<{id: string; name: string; status: string}[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Export JSON
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

  // Export HTML
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

  // Export PDF
  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080],
      });

      // Create temporary container for rendering slides
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '1920px';
      container.style.height = '1080px';
      document.body.appendChild(container);

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        
        // Create slide element
        const slideEl = document.createElement('div');
        slideEl.style.width = '1920px';
        slideEl.style.height = '1080px';
        slideEl.style.background = slide.background;
        slideEl.style.position = 'relative';
        slideEl.style.overflow = 'hidden';
        
        // Add elements
        slide.elements.forEach((el) => {
          const elDiv = document.createElement('div');
          elDiv.style.position = 'absolute';
          elDiv.style.left = `${el.x}%`;
          elDiv.style.top = `${el.y}%`;
          elDiv.style.transform = 'translate(-50%, -50%)';
          elDiv.style.fontSize = `${el.style.fontSize || 24}px`;
          elDiv.style.color = el.style.color || '#ffffff';
          elDiv.style.fontFamily = el.style.fontFamily || 'Inter';
          elDiv.style.fontWeight = el.style.fontWeight || 'normal';
          elDiv.style.textAlign = (el.style.textAlign as any) || 'center';
          elDiv.style.padding = `${el.style.padding || 16}px`;
          elDiv.style.backgroundColor = el.style.backgroundColor || 'transparent';
          elDiv.style.borderRadius = `${el.style.borderRadius || 0}px`;
          
          if (el.type === 'text' || el.type === 'code') {
            elDiv.textContent = el.content;
          } else if (el.type === 'image') {
            const img = document.createElement('img');
            img.src = el.content;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            elDiv.appendChild(img);
          }
          
          slideEl.appendChild(elDiv);
        });
        
        container.appendChild(slideEl);
        
        // Capture canvas
        const canvas = await html2canvas(slideEl, {
          width: 1920,
          height: 1080,
          scale: 1,
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        if (i > 0) {
          pdf.addPage([1920, 1080], 'landscape');
        }
        
        pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
        
        container.removeChild(slideEl);
        setExportProgress(((i + 1) / slides.length) * 100);
      }
      
      document.body.removeChild(container);
      pdf.save(`${presentation.name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Erreur lors de l\'export PDF');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Export Video
  const handleExportVideo = async (format: 'webm' | 'mp4') => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Create canvas for recording
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // Setup MediaRecorder
      const mimeType = format === 'mp4' ? 'video/mp4' : 'video/webm;codecs=vp9';
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm',
        videoBitsPerSecond: 5000000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: format === 'mp4' ? 'video/mp4' : 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${presentation.name.replace(/\s+/g, '_')}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsExporting(false);
      };

      // Start recording
      mediaRecorder.start();

      // Render each slide
      const slideDuration = 5000; // 5 seconds per slide
      const fps = 30;
      const framesPerSlide = (slideDuration / 1000) * fps;

      for (let slideIndex = 0; slideIndex < slides.length; slideIndex++) {
        const slide = slides[slideIndex];
        
        for (let frame = 0; frame < framesPerSlide; frame++) {
          const currentTime = (frame / framesPerSlide) * slideDuration;
          
          // Clear canvas
          ctx.fillStyle = slide.background;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Render elements based on their timeline
          slide.elements.forEach((el) => {
            const { timeline } = el;
            let opacity = el.opacity;
            let x = el.x;
            let y = el.y;
            let scale = el.scale;
            let rotation = el.rotation;
            let visible = currentTime <= timeline.totalDuration;

            // Apply animations
            timeline.animations.forEach((anim) => {
              const animStart = anim.startTime;
              const animEnd = anim.startTime + anim.duration;
              
              if (currentTime >= animStart && currentTime <= animEnd) {
                const progress = (currentTime - animStart) / anim.duration;
                const easedProgress = getEasedProgress(progress, anim.easing);
                
                switch (anim.type) {
                  case 'fade':
                    opacity = easedProgress * el.opacity;
                    break;
                  case 'fadeOut':
                    opacity = (1 - easedProgress) * el.opacity;
                    break;
                  case 'slide':
                    x = el.x - (1 - easedProgress) * 20;
                    break;
                  case 'slideOut':
                    x = el.x + easedProgress * 20;
                    break;
                  case 'scale':
                    scale = el.scale * (0.5 + 0.5 * easedProgress);
                    break;
                  case 'scaleOut':
                    scale = el.scale * (1 - 0.5 * easedProgress);
                    break;
                  case 'rotate':
                    rotation = el.rotation - (1 - easedProgress) * 360;
                    break;
                  case 'zoom':
                    scale = el.scale * (1 + easedProgress);
                    break;
                }
              }
            });

            // Check fade out
            const hasFadeOut = timeline.animations.some((a) => 
              a.type === 'fadeOut' && currentTime > a.startTime + a.duration
            );
            if (hasFadeOut) visible = false;

            if (!visible) return;

            // Render element
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.translate((x / 100) * canvas.width, (y / 100) * canvas.height);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(scale, scale);

            if (el.type === 'text' || el.type === 'code') {
              ctx.font = `${el.style.fontWeight || 'normal'} ${(el.style.fontSize || 24) * 3}px ${el.style.fontFamily || 'Inter'}`;
              ctx.fillStyle = el.style.color || '#ffffff';
              ctx.textAlign = (el.style.textAlign as CanvasTextAlign) || 'center';
              ctx.fillText(el.content, 0, 0);
            }

            ctx.restore();
          });

          // Wait for next frame
          await new Promise((resolve) => setTimeout(resolve, 1000 / fps));
          
          const totalProgress = ((slideIndex * framesPerSlide + frame) / (slides.length * framesPerSlide)) * 100;
          setExportProgress(totalProgress);
        }
      }

      mediaRecorder.stop();
    } catch (err) {
      console.error('Video export error:', err);
      alert('Erreur lors de l\'export vidéo. Votre navigateur peut ne pas supporter ce format.');
      setIsExporting(false);
    }
  };

  const getEasedProgress = (progress: number, easing: string): number => {
    switch (easing) {
      case 'easeIn':
        return progress * progress;
      case 'easeOut':
        return 1 - Math.pow(1 - progress, 2);
      case 'easeInOut':
        return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case 'spring':
        return progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * ((2 * Math.PI) / 3));
      default:
        return progress;
    }
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
    body { font-family: system-ui, sans-serif; overflow: hidden; background: #000; }
    .slide { 
      position: fixed; 
      inset: 0; 
      display: none; 
      align-items: center; 
      justify-content: center;
      padding: 4rem;
    }
    .slide.active { display: flex; }
    .navigation { 
      position: fixed; 
      bottom: 2rem; 
      left: 50%; 
      transform: translateX(-50%); 
      display: flex; 
      gap: 1rem; 
      z-index: 100;
    }
    .nav-btn { 
      padding: 0.75rem 1.5rem; 
      background: rgba(255,255,255,0.1); 
      border: none; 
      color: white; 
      border-radius: 0.5rem; 
      cursor: pointer;
      backdrop-filter: blur(10px);
    }
    .nav-btn:hover { background: rgba(255,255,255,0.2); }
    .progress { position: fixed; bottom: 0; left: 0; height: 4px; background: #6366f1; transition: width 0.3s; }
  </style>
</head>
<body>
  ${pres.slides.map((slide, idx) => `
  <div class="slide ${idx === 0 ? 'active' : ''}" id="slide-${idx}" style="background: ${slide.background};">
    ${slide.elements?.map((el) => `
      <div style="position: absolute; left: ${el.x}%; top: ${el.y}%; transform: translate(-50%, -50%); font-size: ${el.style.fontSize}px; color: ${el.style.color};">
        ${el.type === 'text' ? el.content : ''}
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
        slide.classList.toggle('active', idx === n);
      });
      document.getElementById('progress').style.width = ((n + 1) / totalSlides * 100) + '%';
      currentSlide = n;
    }
    
    function nextSlide() {
      if (currentSlide < totalSlides - 1) showSlide(currentSlide + 1);
    }
    
    function prevSlide() {
      if (currentSlide > 0) showSlide(currentSlide - 1);
    }
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    });
  </script>
</body>
</html>`;
  };

  // Import handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileImport(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileImport(file);
  };

  const handleFileImport = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setImportError('Veuillez sélectionner un fichier JSON');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
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
        className="bg-[var(--bg-secondary)] rounded-2xl w-full max-w-2xl border border-[var(--border-subtle)] shadow-2xl"
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
          {(['export', 'import', 'publish'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? 'text-[var(--primary-400)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {tab === 'export' ? 'Exporter' : tab === 'import' ? 'Importer' : 'Diffuser'}
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
                {isExporting ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Loader2 size={48} className="animate-spin text-[var(--primary-500)]" />
                    <p className="text-sm text-[var(--text-secondary)]">Export en cours...</p>
                    <div className="w-64 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[var(--primary-500)] transition-all duration-300"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)]">{Math.round(exportProgress)}%</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Exportez votre présentation dans différents formats.
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      {/* JSON */}
                      <button
                        onClick={handleExportJSON}
                        className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--primary-500)] transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary-500)]/10 flex items-center justify-center group-hover:bg-[var(--primary-500)]/20 transition-colors">
                          <FileJson size={20} className="text-[var(--primary-400)]" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-sm">JSON</p>
                          <p className="text-xs text-[var(--text-tertiary)]">Réimportation</p>
                        </div>
                      </button>

                      {/* HTML */}
                      <button
                        onClick={handleExportHTML}
                        className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-[var(--accent-green)] transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-green)]/10 flex items-center justify-center group-hover:bg-[var(--accent-green)]/20 transition-colors">
                          <FileText size={20} className="text-[var(--accent-green)]" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-sm">HTML</p>
                          <p className="text-xs text-[var(--text-tertiary)]">Standalone</p>
                        </div>
                      </button>

                      {/* PDF */}
                      <button
                        onClick={handleExportPDF}
                        className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-red-500 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                          <FileImage size={20} className="text-red-400" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-sm">PDF</p>
                          <p className="text-xs text-[var(--text-tertiary)]">Diaporama</p>
                        </div>
                      </button>

                      {/* Video WebM */}
                      <button
                        onClick={() => handleExportVideo('webm')}
                        className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-purple-500 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                          <FileVideo size={20} className="text-purple-400" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-sm">Vidéo WebM</p>
                          <p className="text-xs text-[var(--text-tertiary)]">Qualité haute</p>
                        </div>
                      </button>

                      {/* Video MP4 */}
                      <button
                        onClick={() => handleExportVideo('mp4')}
                        className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] hover:border-pink-500 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                          <FileVideo size={20} className="text-pink-400" />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-sm">Vidéo MP4</p>
                          <p className="text-xs text-[var(--text-tertiary)]">Compatible</p>
                        </div>
                      </button>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-[var(--bg-tertiary)] text-xs text-[var(--text-tertiary)]">
                      <p className="font-medium text-[var(--text-secondary)] mb-1">Conseils :</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li><strong>JSON</strong> : Pour réimporter et modifier plus tard</li>
                        <li><strong>HTML</strong> : Pour partager et naviguer dans le navigateur</li>
                        <li><strong>PDF</strong> : Pour imprimer ou partager statiquement</li>
                        <li><strong>Vidéo</strong> : Pour les réseaux sociaux (5s par slide)</li>
                      </ul>
                    </div>
                  </>
                )}
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
            {activeTab === 'publish' && (
              <motion.div
                key="publish"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <p className="text-sm text-[var(--text-secondary)]">
                  Publiez cette présentation vers un serveur de digital signage pour la diffuser sur des écrans.
                </p>

                {/* Server URL */}
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">
                    URL du serveur
                  </label>
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="https://votre-serveur.com"
                    className="input text-[13px] w-full"
                  />
                </div>

                {/* Admin Token */}
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">
                    Token Admin
                  </label>
                  <input
                    type="password"
                    value={adminToken}
                    onChange={(e) => setAdminToken(e.target.value)}
                    placeholder="Votre token JWT admin"
                    className="input text-[13px] w-full"
                  />
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    Obtenez votre token depuis le dashboard admin → Profil
                  </p>
                </div>

                {/* Fetch Players Button */}
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`${serverUrl.replace(/\/$/, '')}/api/players`, {
                        headers: { Authorization: `Bearer ${adminToken}` },
                      });
                      if (!res.ok) throw new Error('Token invalide');
                      const data = await res.json();
                      setPlayers(data);
                    } catch (err: any) {
                      setPublishError(err.message);
                    }
                  }}
                  className="btn btn-secondary w-full"
                >
                  <Server size={16} />
                  Charger les players
                </button>

                {/* Players List */}
                {players.length > 0 && (
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">
                      Sélectionner les players ({players.length} disponibles)
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {players.map((player) => (
                        <label
                          key={player.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)] cursor-pointer hover:bg-[var(--bg-tertiary)]/80"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPlayers.includes(player.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPlayers([...selectedPlayers, player.id]);
                              } else {
                                setSelectedPlayers(selectedPlayers.filter((id) => id !== player.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-[var(--border-subtle)]"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{player.name}</div>
                            <div className="text-xs text-[var(--text-tertiary)]">
                              {player.status === 'online' ? '🟢 En ligne' : '🔴 Hors ligne'}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Publish Button */}
                <button
                  onClick={async () => {
                    if (selectedPlayers.length === 0) {
                      setPublishError('Sélectionnez au moins un player');
                      return;
                    }
                    setIsPublishing(true);
                    setPublishError(null);
                    try {
                      // 1. Create playlist on server
                      const playlistRes = await fetch(`${serverUrl.replace(/\/$/, '')}/api/playlists`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${adminToken}`,
                        },
                        body: JSON.stringify({
                          name: presentation.name,
                          description: `Publié depuis l'éditeur le ${new Date().toLocaleString()}`,
                          slides: slides,
                          settings: { slideDuration: 5000 },
                        }),
                      });
                      if (!playlistRes.ok) throw new Error('Erreur création playlist');
                      const playlist = await playlistRes.json();

                      // 2. Assign to selected players
                      for (const playerId of selectedPlayers) {
                        await fetch(`${serverUrl.replace(/\/$/, '')}/api/players/${playerId}/assign`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${adminToken}`,
                          },
                          body: JSON.stringify({ playlist_id: playlist.id }),
                        });
                      }

                      setPublishSuccess(true);
                      setTimeout(() => setPublishSuccess(false), 3000);
                    } catch (err: any) {
                      setPublishError(err.message);
                    } finally {
                      setIsPublishing(false);
                    }
                  }}
                  disabled={isPublishing || selectedPlayers.length === 0}
                  className="btn btn-primary w-full"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Publication en cours...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Publier vers {selectedPlayers.length} player{selectedPlayers.length > 1 ? 's' : ''}
                    </>
                  )}
                </button>

                {publishError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    <AlertCircle size={16} />
                    <span className="text-sm">{publishError}</span>
                  </div>
                )}

                {publishSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                    <Check size={16} />
                    <span className="text-sm">Publication réussie ! Les players recevront le contenu dans quelques secondes.</span>
                  </div>
                )}

                <div className="mt-4 p-3 rounded-lg bg-[var(--bg-tertiary)] text-xs text-[var(--text-tertiary)]">
                  <p className="font-medium text-[var(--text-secondary)] mb-1">💡 Astuce :</p>
                  <p>Les players doivent être en ligne pour recevoir le contenu immédiatement. S'ils sont hors-ligne, ils recevront la mise à jour à leur prochaine connexion.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};
