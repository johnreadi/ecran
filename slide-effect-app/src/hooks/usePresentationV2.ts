import { useState, useCallback } from 'react';
import type { Presentation, Slide, SlideElement, ElementType, AnimationConfig, TransitionType } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

const createDefaultElement = (type: ElementType, index: number): SlideElement => ({
  id: generateId(),
  type,
  content: type === 'text' ? `Texte ${index + 1}` : type === 'image' ? 'https://via.placeholder.com/300' : '',
  x: 50,
  y: 50,
  width: type === 'text' ? 40 : 30,
  height: type === 'text' ? 15 : 30,
  rotation: 0,
  scale: 1,
  opacity: 1,
  zIndex: index,
  style: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    color: '#ffffff',
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    borderColor: '#000000',
    padding: 16,
    textAlign: 'center',
  },
  timeline: {
    animations: [
      {
        id: generateId(),
        type: 'fade',
        startTime: index * 200,
        duration: 600,
        easing: 'easeOut',
      }
    ],
    totalDuration: 5000,
  },
});

const createDefaultSlide = (index: number): Slide => ({
  id: generateId(),
  name: `Slide ${index + 1}`,
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  elements: [
    createDefaultElement('text', 0),
  ],
  transition: 'fade',
  duration: 5000,
});

const createDefaultPresentation = (): Presentation => ({
  id: generateId(),
  name: 'Nouvelle Présentation',
  slides: [createDefaultSlide(0)],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const usePresentationV2 = () => {
  const [presentation, setPresentation] = useState<Presentation>(createDefaultPresentation());
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const currentSlide = presentation.slides[currentSlideIndex];

  // Slide operations
  const addSlide = useCallback((index?: number) => {
    const newSlide = createDefaultSlide(presentation.slides.length);
    setPresentation(prev => {
      const slides = [...prev.slides];
      const insertIndex = index !== undefined ? index : slides.length;
      slides.splice(insertIndex, 0, newSlide);
      return { ...prev, slides, updatedAt: new Date() };
    });
    setCurrentSlideIndex(index !== undefined ? index : presentation.slides.length);
    setSelectedElementId(null);
  }, [presentation.slides.length]);

  const duplicateSlide = useCallback((index: number) => {
    const slideToDuplicate = presentation.slides[index];
    if (!slideToDuplicate) return;
    
    const duplicatedSlide = {
      ...slideToDuplicate,
      id: generateId(),
      elements: slideToDuplicate.elements.map(el => ({
        ...el,
        id: generateId(),
        timeline: {
          animations: el.timeline.animations.map(a => ({ ...a, id: generateId() })),
          totalDuration: el.timeline.totalDuration,
        },
      })),
    };
    
    setPresentation(prev => {
      const slides = [...prev.slides];
      slides.splice(index + 1, 0, duplicatedSlide);
      return { ...prev, slides, updatedAt: new Date() };
    });
    setCurrentSlideIndex(index + 1);
    setSelectedElementId(null);
  }, [presentation.slides]);

  const deleteSlide = useCallback((index: number) => {
    setPresentation(prev => {
      const slides = prev.slides.filter((_, i) => i !== index);
      if (slides.length === 0) {
        slides.push(createDefaultSlide(0));
      }
      return { ...prev, slides, updatedAt: new Date() };
    });
    setCurrentSlideIndex(prev => Math.min(prev, presentation.slides.length - 2));
    setSelectedElementId(null);
  }, [presentation.slides.length]);

  const updateSlide = useCallback((slideId: string, updates: Partial<Slide>) => {
    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.map(slide =>
        slide.id === slideId ? { ...slide, ...updates } : slide
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const reorderSlides = useCallback((startIndex: number, endIndex: number) => {
    setPresentation(prev => {
      const slides = [...prev.slides];
      const [removed] = slides.splice(startIndex, 1);
      slides.splice(endIndex, 0, removed);
      return { ...prev, slides, updatedAt: new Date() };
    });
    setCurrentSlideIndex(endIndex);
  }, []);

  // Element operations
  const addElement = useCallback((slideId: string, type: ElementType) => {
    const slide = presentation.slides.find(s => s.id === slideId);
    if (!slide) return;

    const newElement: SlideElement = {
      id: generateId(),
      type,
      content: type === 'text' ? 'Nouveau texte' : type === 'image' ? 'https://via.placeholder.com/300' : '',
      x: 50,
      y: 50,
      width: type === 'text' ? 30 : 20,
      height: type === 'text' ? 10 : 20,
      rotation: 0,
      scale: 1,
      opacity: 1,
      zIndex: slide.elements.length,
      style: {
        fontSize: 24,
        fontWeight: 'normal',
        fontFamily: 'Inter',
        color: '#ffffff',
        backgroundColor: 'transparent',
        borderRadius: 0,
        borderWidth: 0,
        borderColor: '#000000',
        padding: 16,
        textAlign: 'center',
      },
      timeline: {
        animations: [
          {
            id: generateId(),
            type: 'fade',
            startTime: slide.elements.length * 100,
            duration: 500,
            easing: 'easeOut',
          }
        ],
        totalDuration: 5000,
      },
    };

    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.map(s =>
        s.id === slideId
          ? { ...s, elements: [...s.elements, newElement] }
          : s
      ),
      updatedAt: new Date(),
    }));
    setSelectedElementId(newElement.id);
  }, [presentation.slides]);

  const updateElement = useCallback((slideId: string, elementId: string, updates: Partial<SlideElement>) => {
    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.map(slide =>
        slide.id === slideId
          ? {
              ...slide,
              elements: slide.elements.map(el =>
                el.id === elementId ? { ...el, ...updates } : el
              ),
            }
          : slide
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const updateElementStyle = useCallback((slideId: string, elementId: string, styleUpdates: Partial<SlideElement['style']>) => {
    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.map(slide =>
        slide.id === slideId
          ? {
              ...slide,
              elements: slide.elements.map(el =>
                el.id === elementId
                  ? { ...el, style: { ...el.style, ...styleUpdates } }
                  : el
              ),
            }
          : slide
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const updateElementTimeline = useCallback((slideId: string, elementId: string, timelineUpdates: Partial<SlideElement['timeline']>) => {
    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.map(slide =>
        slide.id === slideId
          ? {
              ...slide,
              elements: slide.elements.map(el =>
                el.id === elementId
                  ? { ...el, timeline: { ...el.timeline, ...timelineUpdates } }
                  : el
              ),
            }
          : slide
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const addAnimationToElement = useCallback((slideId: string, elementId: string, animation: AnimationConfig) => {
    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.map(slide =>
        slide.id === slideId
          ? {
              ...slide,
              elements: slide.elements.map(el =>
                el.id === elementId
                  ? { ...el, timeline: { ...el.timeline, animations: [...el.timeline.animations, animation] } }
                  : el
              ),
            }
          : slide
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const removeAnimationFromElement = useCallback((slideId: string, elementId: string, animationId: string) => {
    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.map(slide =>
        slide.id === slideId
          ? {
              ...slide,
              elements: slide.elements.map(el =>
                el.id === elementId
                  ? { ...el, timeline: { ...el.timeline, animations: el.timeline.animations.filter(a => a.id !== animationId) } }
                  : el
              ),
            }
          : slide
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const updateAnimation = useCallback((slideId: string, elementId: string, animationId: string, updates: Partial<AnimationConfig>) => {
    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.map(slide =>
        slide.id === slideId
          ? {
              ...slide,
              elements: slide.elements.map(el =>
                el.id === elementId
                  ? { 
                      ...el, 
                      timeline: { 
                        ...el.timeline, 
                        animations: el.timeline.animations.map(a => a.id === animationId ? { ...a, ...updates } : a) 
                      } 
                    }
                  : el
              ),
            }
          : slide
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const deleteElement = useCallback((slideId: string, elementId: string) => {
    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.map(slide =>
        slide.id === slideId
          ? { ...slide, elements: slide.elements.filter(el => el.id !== elementId) }
          : slide
      ),
      updatedAt: new Date(),
    }));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  }, [selectedElementId]);

  const duplicateElement = useCallback((slideId: string, elementId: string) => {
    const slide = presentation.slides.find(s => s.id === slideId);
    const element = slide?.elements.find(el => el.id === elementId);
    if (!slide || !element) return;

    const duplicated: SlideElement = {
      ...element,
      id: generateId(),
      x: element.x + 5,
      y: element.y + 5,
      zIndex: slide.elements.length,
      timeline: {
        animations: element.timeline.animations.map(a => ({ ...a, id: generateId() })),
        totalDuration: element.timeline.totalDuration,
      },
    };

    setPresentation(prev => ({
      ...prev,
      slides: prev.slides.map(s =>
        s.id === slideId
          ? { ...s, elements: [...s.elements, duplicated] }
          : s
      ),
      updatedAt: new Date(),
    }));
    setSelectedElementId(duplicated.id);
  }, [presentation.slides]);

  // Navigation
  const nextSlide = useCallback(() => {
    setCurrentSlideIndex(prev =>
      prev < presentation.slides.length - 1 ? prev + 1 : prev
    );
    setSelectedElementId(null);
  }, [presentation.slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlideIndex(prev => prev > 0 ? prev - 1 : prev);
    setSelectedElementId(null);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlideIndex(Math.max(0, Math.min(index, presentation.slides.length - 1)));
    setSelectedElementId(null);
  }, [presentation.slides.length]);

  const updatePresentationName = useCallback((name: string) => {
    setPresentation(prev => ({ ...prev, name, updatedAt: new Date() }));
  }, []);

  const setTransition = useCallback((slideId: string, transition: TransitionType) => {
    updateSlide(slideId, { transition });
  }, [updateSlide]);

  const loadPresentation = useCallback((newPresentation: Presentation) => {
    setPresentation(newPresentation);
    setCurrentSlideIndex(0);
    setSelectedElementId(null);
  }, []);

  const selectedElement = currentSlide?.elements.find(el => el.id === selectedElementId) || null;

  return {
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
    updateSlide,
    reorderSlides,
    addElement,
    updateElement,
    updateElementStyle,
    updateElementTimeline,
    addAnimationToElement,
    removeAnimationFromElement,
    updateAnimation,
    deleteElement,
    duplicateElement,
    nextSlide,
    prevSlide,
    goToSlide,
    updatePresentationName,
    setTransition,
    loadPresentation,
  };
};
