/**
 * @file tiefling.ts
 * Defines the data for the Tiefling race in the Aralia RPG, based on Player's Handbook pg. 197.
 * This includes their ID, name, description, traits, and Fiendish Legacy choices.
 */
import { Race, FiendishLegacy, FiendishLegacyType } from '../../types'; // Path relative to src/data/races/

export const FIENDISH_LEGACIES_DATA: FiendishLegacy[] = [
  {
    id: 'abyssal',
    name: 'Abyssal Legacy',
    description: "The entropy of the Abyss, the chaos of Pandemonium, and the despair of Carceri call to tieflings who have the abyssal legacy. Horns, fur, tusks, and peculiar scents are common physical features of such tieflings, most of whom have the blood of demons coursing through their veins.",
    level1Benefit: { resistanceType: 'Poison', cantripId: 'poison_spray' },
    level3SpellId: 'ray_of_sickness',
    level5SpellId: 'hold_person',
  },
  {
    id: 'chthonic',
    name: 'Chthonic Legacy',
    description: "Tieflings who have the chthonic legacy feel not only the tug of Carceri but also the greed of Gehenna and the gloom of Hades. Some of these tieflings look cadaverous. Others possess the unearthly beauty of a succubus, or they have physical features in common, with a night hag, a yugoloth, or some other Neutral Evil fiendish ancestor.",
    level1Benefit: { resistanceType: 'Necrotic', cantripId: 'chill_touch' },
    level3SpellId: 'false_life',
    level5SpellId: 'ray_of_enfeeblement',
  },
  {
    id: 'infernal',
    name: 'Infernal Legacy',
    description: "The infernal legacy connects tieflings not only to Gehenna but also the Nine Hells and the raging battlefields of Acheron. Horns, spines, tails, golden eyes, and a faint odor of sulfur or smoke are common physical features of such tieflings, most of who trace their ancestry to devils.",
    level1Benefit: { resistanceType: 'Fire', cantripId: 'fire_bolt' },
    level3SpellId: 'hellish_rebuke',
    level5SpellId: 'darkness',
  },
];

export const TIEFLING_DATA: Race = {
  id: 'tiefling',
  name: 'Tiefling',
  description:
    'Tieflings are either born in the Lower Planes or have fiendish ancestors who originated there. Linked by blood to a Fiend, this connection is their fiendish legacy, promising power but not dictating morality. Tieflings choose to embrace or lament this legacy.',
  abilityBonuses: [], // As per 2024 PHB style.
  traits: [
    'Creature Type: Humanoid',
    'Size: Medium (about 4–7 feet tall) or Small (about 3–4 feet tall), chosen when you select this species (defaults to Medium for now).',
    'Speed: 30 feet',
    'Darkvision: You have Darkvision with a range of 60 feet.',
    'Fiendish Legacy: You are the recipient of a legacy that grants you supernatural abilities. Choose a legacy (Abyssal, Chthonic, or Infernal). You gain benefits at levels 1, 3, and 5. Spells learned this way can be cast once per Long Rest without a spell slot, or using spell slots. Your spellcasting ability for these spells (Intelligence, Wisdom, or Charisma) is chosen when you select your legacy.',
    'Otherworldly Presence: You know the Thaumaturgy cantrip. It uses the same spellcasting ability chosen for your Fiendish Legacy.',
  ],
  fiendishLegacies: FIENDISH_LEGACIES_DATA,
};
