import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import type { Slide } from '../types';

interface PresentationModeProps {
  slides: Slide[];
  currentIndex: number;
  isPlaying: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onTogglePlay: () => void;
  onGoToSlide: (index: number) => void;
}

const transitionVariants = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  slide: { initial: { x: 100, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -100, opacity: 0 } },
  scale: { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 1.2, opacity: 0 } },
  rotate: { initial: { rotate: -90, opacity: 0 }, animate: { rotate: 0, opacity: 1 }, exit: { rotate: 90, opacity: 0 } },
  zoom: { initial: { scale: 2, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.5, opacity: 0 } },
};

export const PresentationMode: React.FC<PresentationModeProps> = ({
  slides,
  currentIndex,
  isPlaying,
  onClose,
  onNext,
  onPrev,
  onTogglePlay,
  onGoToSlide,
}) => {
  const currentSlide = slides[currentIndex];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        onNext();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onPrev();
        break;
      case 'Escape':
        onClose();
        break;
    }
  }, [onNext, onPrev, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const renderElement = (element: any) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}%`,
      top: `${element.y}%`,
      transform: `translate(-50%, -50%) rotate(${element.rotation}deg) scale(${element.scale})`,
      opacity: element.opacity,
      zIndex: element.zIndex,
    };

    const contentStyle: React.CSSProperties = {
      fontSize: `${element.style.fontSize}px`,
      fontWeight: element.style.fontWeight,
      fontFamily: element.style.fontFamily,
      color: element.style.color,
      backgroundColor: element.style.backgroundColor,
      borderRadius: `${element.style.borderRadius}px`,
      padding: `${element.style.padding}px`,
      textAlign: element.style.textAlign,
    };

    return (
      <motion.div
        key={element.id}
        style={style}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: (element.animation?.delay || 0) / 1000, duration: 0.5 }}
      >
        {element.type === 'text' && <div style={contentStyle}>{element.content}</div>}
        {element.type === 'image' && <img src={element.content} alt="" style={{ maxWidth: '100%', maxHeight: '100%' }} />}
        {element.type === 'video' && <video src={element.content} controls style={{ maxWidth: '100%', maxHeight: '100%' }} />}
        {element.type === 'shape' && <div style={{ ...contentStyle, width: 100, height: 100 }} />}
        {element.type === 'code' && <pre style={{ ...contentStyle, fontFamily: 'monospace' }}><code>{element.content}</code></pre>}
      </motion.div>
    );
  };

  const transition = transitionVariants[currentSlide?.transition as keyof typeof transitionVariants] || transitionVariants.fade;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black"
    >
      {/* Slide */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide?.id}
          initial={transition.initial}
          animate={transition.animate}
          exit={transition.exit}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{ background: currentSlide?.background }}
        >
          {currentSlide?.elements?.map(renderElement)}
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <X size={20} />
          </button>
          <span className="text-white/70 text-sm">
            {currentIndex + 1} / {slides.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onPrev} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <ChevronLeft size={20} />
          </button>
          <button onClick={onTogglePlay} className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white">
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button onClick={onNext} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => onGoToSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? 'bg-white w-6' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
