import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { usePresentationV2 } from './hooks/usePresentationV2';
import { Toolbar } from './components/Toolbar';
import { SlideThumbnails } from './components/SlideThumbnails';
import { SlideCanvasV2 } from './components/SlideCanvasV2';
import { ElementEditorV2 } from './components/ElementEditorV2';
import { AnimationTimelineV2 } from './components/AnimationTimelineV2';
import { PresentationMode } from './components/PresentationMode';
import { TemplateGallery } from './components/TemplateGallery';
import type { EditorMode, Template, AnimationConfig } from './types';

function App() {
  const [mode, setMode] = useState<EditorMode>('edit');
  const [showTemplates, setShowTemplates] = useState(true);
  const [timelineTime, setTimelineTime] = useState(0);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);

  const {
    presentation,
    currentSlide,
    currentSlideIndex,
    isPlaying,
    selectedElement,
    selectedElementId,
    setIsPlaying,
    setSelectedElementId,
    addSlide,
    duplicateSlide,
    deleteSlide,
    addElement,
    updateElement,
    updateElementStyle,

    addAnimationToElement,
    removeAnimationFromElement,
    updateAnimation,
    deleteElement,
    duplicateElement,
    nextSlide,
    prevSlide,
    goToSlide,
    updatePresentationName,
    loadPresentation,
  } = usePresentationV2();

  const handleNext = () => nextSlide();
  const handlePrev = () => prevSlide();
  const handleGoToSlide = (index: number) => goToSlide(index);

  const handleTemplateSelect = (template: Template) => {
    const newPresentation = {
      ...presentation,
      slides: template.slides.map((slide) => ({
        ...slide,
        id: Math.random().toString(36).substring(2, 9),
        elements: slide.elements?.map((el: any) => ({
          ...el,
          id: Math.random().toString(36).substring(2, 9),
          timeline: el.timeline || { animations: [], totalDuration: 5000 },
        })) || [],
      })),
      name: template.name,
    };
    loadPresentation(newPresentation);
    setShowTemplates(false);
  };

  // Calculate total duration from all elements
  const totalDuration = Math.max(
    ...currentSlide?.elements.map(el => el.timeline.totalDuration) || [5000],
    5000
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
        case 'n':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            addSlide();
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (selectedElementId && mode === 'edit') {
            e.preventDefault();
            deleteElement(currentSlide.id, selectedElementId);
          }
          break;
        case 'F5':
          e.preventDefault();
          setMode('present');
          break;
        case 'Escape':
          if (mode === 'present') {
            setMode('edit');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, presentation.slides.length, selectedElementId, currentSlide?.id, mode]);

  // Timeline playback
  useEffect(() => {
    if (!isTimelinePlaying) return;
    
    const interval = setInterval(() => {
      setTimelineTime(prev => {
        if (prev >= totalDuration) {
          setIsTimelinePlaying(false);
          return 0;
        }
        return prev + 50;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isTimelinePlaying, totalDuration]);

  const handleAddAnimation = useCallback((elementId: string) => {
    const element = currentSlide?.elements.find(el => el.id === elementId);
    if (!element) return;

    const newAnimation: AnimationConfig = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'fade',
      startTime: element.timeline.animations.length * 500,
      duration: 500,
      easing: 'easeOut',
    };

    addAnimationToElement(currentSlide.id, elementId, newAnimation);
  }, [currentSlide, addAnimationToElement]);

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-dark)]">
      {/* Toolbar */}
      <Toolbar
        mode={mode}
        onModeChange={setMode}
        onPrev={handlePrev}
        onNext={handleNext}
        currentIndex={currentSlideIndex}
        totalSlides={presentation.slides.length}
        presentationName={presentation.name}
        onNameChange={updatePresentationName}
        presentation={presentation}
        onImport={loadPresentation}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide thumbnails - hidden in present mode */}
        {mode !== 'present' && (
          <SlideThumbnails
            slides={presentation.slides}
            currentIndex={currentSlideIndex}
            onSelect={handleGoToSlide}
            onAdd={addSlide}
            onDuplicate={duplicateSlide}
            onDelete={deleteSlide}
          />
        )}

        {/* Center area - Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Slide canvas */}
          <div className="flex-1 relative bg-black">
            <AnimatePresence mode="wait" initial={false}>
              <SlideCanvasV2
                key={currentSlide?.id}
                elements={currentSlide?.elements || []}
                selectedElementId={selectedElementId}
                background={currentSlide?.background || '#000'}
                currentTime={timelineTime}
                isPlaying={isTimelinePlaying}
                onSelectElement={setSelectedElementId}
                onUpdateElement={(id, updates) => updateElement(currentSlide.id, id, updates)}
                isPreview={mode === 'present'}
              />
            </AnimatePresence>
          </div>

          {/* Animation Timeline - only in edit mode */}
          {mode === 'edit' && (
            <AnimationTimelineV2
              elements={currentSlide?.elements || []}
              selectedElementId={selectedElementId}
              isPlaying={isTimelinePlaying}
              currentTime={timelineTime}
              totalDuration={totalDuration}
              onSelectElement={setSelectedElementId}
              onPlay={() => setIsTimelinePlaying(true)}
              onPause={() => setIsTimelinePlaying(false)}
              onSeek={setTimelineTime}
              onAddAnimation={handleAddAnimation}
            />
          )}
        </div>

        {/* Element Editor - only in edit mode */}
        {mode === 'edit' && (
          <ElementEditorV2
            elements={currentSlide?.elements || []}
            selectedElement={selectedElement}
            onAddElement={(type) => addElement(currentSlide.id, type)}
            onUpdateElement={(id, updates) => updateElement(currentSlide.id, id, updates)}
            onUpdateStyle={(id, style) => updateElementStyle(currentSlide.id, id, style)}
            onDeleteElement={(id) => deleteElement(currentSlide.id, id)}
            onDuplicateElement={(id) => duplicateElement(currentSlide.id, id)}
            onAddAnimation={(elementId, animation) => addAnimationToElement(currentSlide.id, elementId, animation)}
            onRemoveAnimation={(elementId, animationId) => removeAnimationFromElement(currentSlide.id, elementId, animationId)}
            onUpdateAnimation={(elementId, animationId, updates) => updateAnimation(currentSlide.id, elementId, animationId, updates)}
          />
        )}
      </div>

      {/* Template Gallery */}
      <AnimatePresence>
        {showTemplates && (
          <TemplateGallery
            onSelect={handleTemplateSelect}
            onClose={() => setShowTemplates(false)}
          />
        )}
      </AnimatePresence>

      {/* Presentation Mode */}
      <AnimatePresence>
        {mode === 'present' && (
          <PresentationMode
            slides={presentation.slides}
            currentIndex={currentSlideIndex}
            isPlaying={isPlaying}
            onClose={() => setMode('edit')}
            onNext={handleNext}
            onPrev={handlePrev}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onGoToSlide={handleGoToSlide}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App
