/**
 * @file gnome.ts
 * Defines the data for the Gnome race in the Aralia RPG.
 * This includes base Gnome traits and specific Gnome Subraces: Forest Gnome and Rock Gnome.
 */
import { Race, GnomeSubrace } from '../../types'; // Path relative to src/data/races/

const GNOME_SUBRACES_DATA: GnomeSubrace[] = [
  {
    id: 'forest_gnome',
    name: 'Forest Gnome',
    description:
      "As a forest gnome, you have a natural knack for illusion and inherent quickness. Forest gnomes are secretive and shy, dwelling in wooded burrows. They are friendly with good-spirited creatures and dangerous foes to those who threaten them.",
    traits: [
      'Illusion Savant: You learn the Minor Illusion cantrip. Your spellcasting ability for this spell will be chosen during character creation (Intelligence, Wisdom, or Charisma).',
      'Natural Illusionist: You have advantage on saving throws against illusions and to disbelieve them.',
      'Forest Gnome Magic: You learn the Speak with Animals spell. You can cast this spell a number of times equal to your proficiency bonus per long rest. Your spellcasting ability for this spell will be chosen during character creation.',
    ],
    grantedCantrip: {
      id: 'minor_illusion',
      spellcastingAbilitySource: 'subrace_choice',
    },
    grantedSpell: {
      id: 'speak_with_animals',
      spellcastingAbilitySource: 'subrace_choice',
      usesDescription: 'Proficiency Bonus times per long rest',
      level: 1,
    },
  },
  {
    id: 'rock_gnome',
    name: 'Rock Gnome',
    description:
      "As a rock gnome, you have a natural inventiveness and hardiness. Rock gnomes are the most common type of gnome, known as inventors and tinkerers. They are friendly, boisterous, and aren't afraid to experiment.",
    traits: [
      "Artificer's Lore: Whenever you make an Intelligence (History) check related to magic items, alchemical objects, or technological devices, you can add twice your proficiency bonus, instead of any proficiency bonus you normally apply. (Trait for flavor/future mechanics).",
      "Tinker: You have proficiency with artisan's tools (tinker's tools). Using those tools, you can spend 1 hour and 10 gp worth of materials to construct a Tiny clockwork device (AC 5, 1 hp). The device ceases to function after 24 hours (unless repaired), or when you dismantle it. You can have up to three such devices. Options: Clockwork Toy, Fire Starter, Music Box. (Trait for flavor/future mechanics).",
    ],
    // No specific spells granted directly by data here, Tinker is a complex ability.
  },
];

export const GNOME_DATA: Race = {
  id: 'gnome',
  name: 'Gnome',
  description:
    'Gnomes are small, energetic folk known for their inventive nature, curiosity, positive energy, and friendliness, with a love for puns and pranks.',
  // Gnomes (like 2024 Elves) do not get direct ability score increases from their base race in this implementation.
  // ASIs are typically handled by background or other choices, or via the flexible ASI text described in subraces (descriptive here).
  traits: [
    'Creature Type: Humanoid',
    'Size: Small',
    'Speed: 30 feet',
    'Darkvision: You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You discern colors in that darkness only as shades of gray.',
    'Gnomish Cunning: You have advantage on Intelligence, Wisdom, and Charisma saving throws against magic.',
    'Speak with Small Beasts: Through sounds and gestures, you can communicate simple ideas with Small or smaller beasts.',
    'Gnome Subrace: Choose a Forest or Rock Gnome subrace, granting specific benefits.',
  ],
  gnomeSubraces: GNOME_SUBRACES_DATA,
  imageUrl: 'https://i.ibb.co/93BfZpSY/Gnome.png',
};
