/**
 * @file src/data/biomes.ts
 * Defines biome data for the Aralia RPG map system.
 */
import { Biome } from '../types';

export const BIOMES: Record<string, Biome> = {
  'plains': { 
    id: 'plains', 
    name: 'Plains', 
    color: 'bg-yellow-500', // Tailwind class
    icon: '🌾', 
    description: 'Open grasslands with scattered trees, easy to traverse.', 
    passable: true 
  },
  'forest': { 
    id: 'forest', 
    name: 'Forest', 
    color: 'bg-green-700', 
    icon: '🌲', 
    description: 'Dense woodlands teeming with life and hidden paths.', 
    passable: true 
  },
  'mountain': { 
    id: 'mountain', 
    name: 'Mountains', 
    color: 'bg-gray-600', 
    icon: '⛰️', 
    description: 'Towering peaks, difficult to traverse without a pass.', 
    passable: true // Could be false for some mountain tiles, true for passes
  },
  'hills': {
    id: 'hills',
    name: 'Hills',
    color: 'bg-lime-600', // A lighter green than forest
    icon: '🌄',
    description: 'Rolling hills and meadows, offering good views.',
    passable: true,
  },
  'desert': { 
    id: 'desert', 
    name: 'Desert', 
    color: 'bg-yellow-300', 
    icon: '🏜️', 
    description: 'Arid wasteland, scarce in resources and water.', 
    passable: true 
  },
  'swamp': {
    id: 'swamp',
    name: 'Swamp',
    color: 'bg-teal-800', // Dark, murky green/blue
    icon: '🌿', // Using a generic plant, could find better
    description: 'Murky marshlands, difficult terrain, and hidden dangers.',
    passable: true,
  },
  'ocean': { 
    id: 'ocean', 
    name: 'Ocean', 
    color: 'bg-blue-700', 
    icon: '🌊', 
    description: 'Vast expanse of water, requires a vessel to cross.', 
    passable: false,
    impassableReason: "The vast ocean is too dangerous to cross without a sturdy vessel."
  },
  // Add more biomes as needed
  // 'tundra': { id: 'tundra', name: 'Tundra', color: 'bg-sky-200', icon: '❄️', description: 'Cold, treeless plains.', passable: true },
  // 'jungle': { id: 'jungle', name: 'Jungle', color: 'bg-emerald-600', icon: '🌴', description: 'Dense, tropical rainforest.', passable: true },
  // 'volcanic': { id: 'volcanic', name: 'Volcanic Wastes', color: 'bg-red-800', icon: '🌋', description: 'Ash-covered plains and lava flows.', passable: true },
  'building': {
    id: 'building',
    name: 'Building',
    color: 'bg-gray-400',
    icon: '🏠',
    description: 'A building in the city.',
    passable: false,
    impassableReason: "You cannot walk through buildings."
  },
  'wall': {
    id: 'wall',
    name: 'Wall',
    color: 'bg-gray-500',
    icon: '🧱',
    description: 'A city wall.',
    passable: false,
    impassableReason: "You cannot walk through walls."
  },
  'road': {
    id: 'road',
    name: 'Road',
    color: 'bg-gray-300',
    icon: '•',
    description: 'A road or street.',
    passable: true
  },
  'field': {
    id: 'field',
    name: 'Field',
    color: 'bg-green-200',
    icon: '🌳',
    description: 'An open field.',
    passable: true
  }
};