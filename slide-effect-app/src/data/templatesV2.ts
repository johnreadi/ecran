import type { Template, Slide, SlideElement } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

const createTextElement = (
  content: string,
  x: number,
  y: number,
  options: Partial<SlideElement> = {}
): SlideElement => ({
  id: generateId(),
  type: 'text',
  content,
  x,
  y,
  width: 60,
  height: 15,
  rotation: 0,
  scale: 1,
  opacity: 1,
  zIndex: 0,
  style: {
    fontSize: 48,
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
        startTime: 0,
        duration: 600,
        easing: 'easeOut',
      }
    ],
    totalDuration: 5000,
  },
  ...options,
});

const createSubtitleElement = (
  content: string,
  x: number,
  y: number,
  delay: number = 200,
  styleOverrides: Partial<SlideElement['style']> = {}
): SlideElement => ({
  id: generateId(),
  type: 'text',
  content,
  x,
  y,
  width: 50,
  height: 10,
  rotation: 0,
  scale: 1,
  opacity: 1,
  zIndex: 1,
  style: {
    fontSize: 24,
    fontWeight: 'normal',
    fontFamily: 'Inter',
    color: '#ffffff',
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    borderColor: '#000000',
    padding: 12,
    textAlign: 'center',
    ...styleOverrides,
  },
  timeline: {
    animations: [
      {
        id: generateId(),
        type: 'slide',
        startTime: delay,
        duration: 500,
        easing: 'easeOut',
      }
    ],
    totalDuration: 5000,
  },
});

const createSlide = (name: string, background: string, elements: SlideElement[], transition: string = 'fade'): Slide => ({
  id: generateId(),
  name,
  background,
  elements,
  transition: transition as any,
  duration: 5000,
});

export const templates: Template[] = [
  {
    id: 'minimal-dark',
    name: 'Minimal Dark',
    thumbnail: '#0f0f23',
    category: 'minimal',
    slides: [
      createSlide(
        'Titre',
        '#0f0f23',
        [
          createTextElement('Titre Principal', 50, 40),
          createSubtitleElement('Sous-titre élégant', 50, 55, 200),
          createSubtitleElement('Une présentation minimaliste', 50, 65, 400),
        ],
        'fade'
      ),
      createSlide(
        'Vision',
        '#1a1a2e',
        [
          createTextElement('Notre Vision', 50, 35, { style: { fontSize: 42 } }),
          createSubtitleElement('Simplicité et élégance dans chaque détail', 50, 50, 200),
        ],
        'slide'
      ),
      createSlide(
        'Merci',
        '#0f0f23',
        [
          createTextElement('Merci', 50, 45, { style: { fontSize: 72 } }),
          createSubtitleElement('Contactez-nous pour en savoir plus', 50, 60, 300),
        ],
        'scale'
      ),
    ],
  },
  {
    id: 'gradient-vibrant',
    name: 'Gradient Vibrant',
    thumbnail: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    category: 'colorful',
    slides: [
      createSlide(
        'Bienvenue',
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        [
          createTextElement('Bienvenue', 50, 35),
          createSubtitleElement('Une expérience visuelle unique', 50, 50, 200),
          createSubtitleElement('Découvrez nos solutions innovantes', 50, 60, 400),
        ],
        'zoom'
      ),
      createSlide(
        'Services',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        [
          createTextElement('Nos Services', 50, 25, { style: { fontSize: 42 } }),
          createSubtitleElement('• Design créatif', 50, 40, 200),
          createSubtitleElement('• Développement web', 50, 50, 300),
          createSubtitleElement('• Marketing digital', 50, 60, 400),
          createSubtitleElement('• Consulting', 50, 70, 500),
        ],
        'rotate'
      ),
      createSlide(
        'Pourquoi Nous',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        [
          createTextElement('Pourquoi Nous ?', 50, 40),
          createSubtitleElement('Expertise, créativité et résultats garantis', 50, 55, 200),
        ],
        'cube'
      ),
      createSlide(
        'Contact',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        [
          createTextElement('Commençons', 50, 35),
          createSubtitleElement('Votre succès commence ici', 50, 50, 200),
          createSubtitleElement('contact@exemple.com', 50, 65, 400),
        ],
        'morph'
      ),
    ],
  },
  {
    id: 'business-pro',
    name: 'Business Pro',
    thumbnail: '#1e3a8a',
    category: 'business',
    slides: [
      createSlide(
        'Rapport',
        'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        [
          createTextElement('Rapport Annuel', 50, 35),
          createSubtitleElement('Exercice 2024', 50, 50, 200),
          createSubtitleElement('Présentation des résultats', 50, 60, 400),
        ],
        'fade'
      ),
      createSlide(
        'Sommaire',
        '#ffffff',
        [
          createTextElement('Sommaire', 50, 20),
          createSubtitleElement('1. Résultats financiers', 50, 35, 200),
          createSubtitleElement('2. Croissance du marché', 50, 45, 300),
          createSubtitleElement('3. Projets en cours', 50, 55, 400),
          createSubtitleElement('4. Objectifs futurs', 50, 65, 500),
        ],
        'slide'
      ),
      createSlide(
        'Chiffres',
        '#f8fafc',
        [
          createTextElement('Chiffres Clés', 50, 25),
          createSubtitleElement('+25% de croissance', 50, 40, 200),
          createSubtitleElement('1M+ de clients', 50, 55, 400),
          createSubtitleElement('50+ pays', 50, 70, 600),
        ],
        'scale'
      ),
    ],
  },
  {
    id: 'creative-studio',
    name: 'Creative Studio',
    thumbnail: '#2d1b4e',
    category: 'creative',
    slides: [
      createSlide(
        'Studio',
        'linear-gradient(135deg, #2d1b4e 0%, #1a1a2e 100%)',
        [
          createTextElement('Studio Créatif', 50, 35),
          createSubtitleElement('Design • Art • Innovation', 50, 50, 200),
          createSubtitleElement('Nous donnons vie à vos idées', 50, 60, 400),
        ],
        'glitch'
      ),
      createSlide(
        'Approche',
        '#2d1b4e',
        [
          createTextElement('Notre Approche', 50, 25, { style: { fontSize: 42 } }),
          createSubtitleElement('Créativité sans limites', 50, 40, 200),
          createSubtitleElement('Design thinking', 50, 50, 350),
          createSubtitleElement('Itérations rapides', 50, 60, 500),
        ],
        'wipe'
      ),
      createSlide(
        'Contact',
        '#1a1a2e',
        [
          createTextElement('Travaillons Ensemble', 50, 40),
          createSubtitleElement('Votre projet mérite le meilleur', 50, 55, 200),
          createSubtitleElement('hello@creative.studio', 50, 70, 400),
        ],
        'morph'
      ),
    ],
  },
  {
    id: 'tech-startup',
    name: 'Tech Startup',
    thumbnail: '#000000',
    category: 'dark',
    slides: [
      createSlide(
        'TechVision',
        'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)',
        [
          createTextElement('TechVision', 50, 35),
          createSubtitleElement('The Future of Innovation', 50, 50, 200),
          createSubtitleElement('Building tomorrow\'s technology today', 50, 60, 400),
        ],
        'glitch'
      ),
      createSlide(
        'Problem',
        '#0a0a0a',
        [
          createTextElement('The Problem', 50, 40, { style: { color: '#00d4ff' } }),
          createSubtitleElement('Complex solutions for simple problems', 50, 55, 200),
        ],
        'fade'
      ),
      createSlide(
        'Solution',
        'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)',
        [
          createTextElement('Our Solution', 50, 30, { style: { color: '#00d4ff' } }),
          createSubtitleElement('AI-powered simplicity', 50, 45, 200),
          createSubtitleElement('Seamless integration', 50, 55, 350),
          createSubtitleElement('Infinite scalability', 50, 65, 500),
        ],
        'cube'
      ),
    ],
  },
  {
    id: 'nature-zen',
    name: 'Nature Zen',
    thumbnail: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    category: 'creative',
    slides: [
      createSlide(
        'Bien-être',
        'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
        [
          createTextElement('Nature & Bien-être', 50, 35),
          createSubtitleElement('Retrouvez votre équilibre', 50, 50, 200),
          createSubtitleElement('Une approche holistique de la santé', 50, 60, 400),
        ],
        'fade'
      ),
      createSlide(
        'Ateliers',
        '#ecfdf5',
        [
          createTextElement('Nos Ateliers', 50, 25),
          createSubtitleElement('Méditation guidée', 50, 40, 200),
          createSubtitleElement('Yoga en plein air', 50, 50, 300),
          createSubtitleElement('Nutrition naturelle', 50, 60, 400),
        ],
        'slide'
      ),
      createSlide(
        'Contact',
        'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
        [
          createTextElement('Réservez Votre Séjour', 50, 40),
          createSubtitleElement('Le bien-être vous attend', 50, 55, 200),
          createSubtitleElement('contact@naturezen.fr', 50, 70, 400),
        ],
        'morph'
      ),
    ],
  },
];
