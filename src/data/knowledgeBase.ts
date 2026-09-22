import { KnowledgeItem } from '../types';

export const OFFLINE_KNOWLEDGE_BASE: Record<string, string> = {
  "what is the smallest continent": "The smallest continent is Australia.",
  "who is the prime minister of india": "The Prime Minister of India is Narendra Modi.",
  "capital of france": "The capital of France is Paris.",
  "how many continents are there": "There are seven continents.",
  "largest ocean in the world": "The Pacific Ocean is the largest ocean.",
  "national animal of india": "The national animal of India is the Bengal Tiger.",
  "national bird of india": "The national bird of India is the Peacock.",
  "national flower of india": "The national flower of India is the Lotus.",
  "fastest land animal": "The fastest land animal is the cheetah.",
  "highest mountain peak": "Mount Everest is the highest mountain peak.",
  "currency of japan": "The currency of Japan is Yen.",
  "largest desert in the world": "The Sahara Desert is the largest hot desert.",
  "longest river in the world": "The Nile is the longest river in the world.",
  "how many states in india": "There are 28 states in India.",
  "who was mahatma gandhi": "Mahatma Gandhi was the leader of India's independence movement.",
  "capital of china": "The capital of China is Beijing.",
  "which planet is known as the red planet": "Mars is known as the red planet.",
  "largest country by area": "Russia is the largest country by area.",
  "national anthem of india": "The national anthem of India is Jana Gana Mana.",
  "who wrote the national anthem": "Rabindranath Tagore wrote the national anthem of India.",
  "who invented the telephone": "Alexander Graham Bell invented the telephone.",
  "first man to walk on the moon": "Neil Armstrong was the first man to walk on the moon.",
  "how many bones in human body": "There are 206 bones in the human body.",
  "who invented computer": "Charles Babbage is known as the father of the computer.",
  "largest mammal": "The blue whale is the largest mammal.",
  "who discovered america": "Christopher Columbus is credited with discovering America.",
  "which is the coldest place on earth": "Antarctica is the coldest place on Earth.",
  "how many players in cricket team": "There are 11 players in a cricket team.",
  "national sport of india": "The national sport of India is Hockey.",
  "which is the tallest building in the world": "Burj Khalifa is the tallest building in the world.",
  "what is the fastest family sedan in the world": "BMW M5 CS is the fastest family sedan on Earth.",
  "what is newton's first law": "An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force.",
  "what is newton's second law": "Force equals mass times acceleration.",
  "what is newton's third law": "For every action, there is an equal and opposite reaction.",
  "what is gravity": "Gravity is the force that attracts objects toward the center of the Earth.",
  "who discovered gravity": "Gravity was discovered by Isaac Newton.",
  "what is speed": "Speed is the distance traveled per unit of time.",
  "what is velocity": "Velocity is speed with direction.",
  "what is acceleration": "Acceleration is the rate of change of velocity.",
  "unit of force": "The unit of force is Newton.",
  "unit of energy": "The unit of energy is Joule.",
  "unit of power": "The unit of power is Watt.",
  "what is work": "Work is done when a force is applied to an object and it moves in the direction of the force.",
  "law of conservation of energy": "Energy cannot be created or destroyed, only transformed from one form to another.",
  "what is potential energy": "Potential energy is stored energy due to position.",
  "what is kinetic energy": "Kinetic energy is energy due to motion.",
  "what is friction": "Friction is the force that resists motion between two surfaces.",
  "what is pressure": "Pressure is force per unit area.",
  "unit of pressure": "The unit of pressure is Pascal.",
  "what is mass": "Mass is the amount of matter in an object.",
  "what is weight": "Weight is the force exerted by gravity on an object.",
  "unit of current": "The unit of electric current is Ampere.",
  "unit of resistance": "The unit of resistance is Ohm.",
  "unit of charge": "The unit of electric charge is Coulomb.",
  "what is conductor": "A conductor allows electricity to pass through it easily.",
  "what is insulator": "An insulator does not allow electricity to pass through it easily.",
  "example of conductor": "Copper is a good conductor of electricity.",
  "example of insulator": "Rubber is a good insulator.",
  "what is refraction": "Refraction is the bending of light as it passes from one medium to another.",
  "what is reflection": "Reflection is the bouncing of light from a surface.",
  "what is lens": "A lens is a transparent material that bends light to form images."
};

export const KNOWLEDGE_LIST: KnowledgeItem[] = Object.entries(OFFLINE_KNOWLEDGE_BASE).map(
  ([question, answer], index) => {
    let category: KnowledgeItem['category'] = 'gk';
    const qLower = question.toLowerCase();
    if (
      qLower.includes('newton') ||
      qLower.includes('gravity') ||
      qLower.includes('speed') ||
      qLower.includes('velocity') ||
      qLower.includes('acceleration') ||
      qLower.includes('force') ||
      qLower.includes('energy') ||
      qLower.includes('friction') ||
      qLower.includes('pressure') ||
      qLower.includes('mass') ||
      qLower.includes('weight') ||
      qLower.includes('current') ||
      qLower.includes('resistance') ||
      qLower.includes('charge') ||
      qLower.includes('conductor') ||
      qLower.includes('refraction') ||
      qLower.includes('reflection') ||
      qLower.includes('lens')
    ) {
      category = 'physics';
    } else if (qLower.includes('continent') || qLower.includes('ocean') || qLower.includes('mountain') || qLower.includes('river') || qLower.includes('desert') || qLower.includes('capital') || qLower.includes('country') || qLower.includes('planet')) {
      category = 'geography';
    } else if (qLower.includes('bones') || qLower.includes('mammal') || qLower.includes('animal') || qLower.includes('bird')) {
      category = 'science';
    }

    return {
      id: `kb-${index}`,
      question: question.charAt(0).toUpperCase() + question.slice(1),
      answer,
      category,
    };
  }
);

export function matchOfflineKnowledge(input: string): string | null {
  const normalized = input.toLowerCase().replace(/[?.,!]/g, '').trim();
  for (const [q, a] of Object.entries(OFFLINE_KNOWLEDGE_BASE)) {
    if (normalized.includes(q) || q.includes(normalized)) {
      return a;
    }
  }
  return null;
}
