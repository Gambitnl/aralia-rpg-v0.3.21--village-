/**
 * @file src/data/items/index.ts
 * Defines all item data (gear, consumables, etc.) for the Aralia RPG.
 */
import { Item } from '../../types';

export const WEAPONS_DATA: Record<string, Item> = {
  // --- Simple Melee Weapons ---
  'club': { id: 'club', name: 'Club', icon: '🪵', description: 'A simple wooden club.', type: 'weapon', category: 'Simple Melee', slot: 'MainHand', damageDice: '1d4', damageType: 'Bludgeoning', properties: ['Light'], weight: 2, cost: '1 SP', mastery: 'Slow' },
  'dagger': { id: 'dagger', name: 'Dagger', icon: '🗡️', description: 'A standard dagger.', type: 'weapon', category: 'Simple Melee', slot: 'MainHand', damageDice: '1d4', damageType: 'Piercing', properties: ['Finesse', 'Light', 'Thrown'], weight: 1, cost: '2 GP', mastery: 'Nick' },
  'greatclub': { id: 'greatclub', name: 'Greatclub', icon: '🪵', description: 'A heavy, two-handed club.', type: 'weapon', category: 'Simple Melee', slot: 'MainHand', damageDice: '1d8', damageType: 'Bludgeoning', properties: ['Two-Handed'], weight: 10, cost: '2 SP', mastery: 'Push' },
  'handaxe': { id: 'handaxe', name: 'Handaxe', icon: '🪓', description: 'A small axe that can be wielded with one hand or thrown.', type: 'weapon', category: 'Simple Melee', slot: 'MainHand', damageDice: '1d6', damageType: 'Slashing', properties: ['Light', 'Thrown'], weight: 2, cost: '5 GP', mastery: 'Vex' },
  'javelin': { id: 'javelin', name: 'Javelin', icon: '➹', description: 'A light spear designed to be thrown.', type: 'weapon', category: 'Simple Melee', slot: 'MainHand', damageDice: '1d6', damageType: 'Piercing', properties: ['Thrown'], weight: 2, cost: '5 SP', mastery: 'Slow' },
  'light_hammer': { id: 'light_hammer', name: 'Light Hammer', icon: '🔨', description: 'A small hammer that can be used as a melee weapon or thrown.', type: 'weapon', category: 'Simple Melee', slot: 'MainHand', damageDice: '1d4', damageType: 'Bludgeoning', properties: ['Light', 'Thrown'], weight: 2, cost: '2 GP', mastery: 'Nick' },
  'mace': { id: 'mace', name: 'Mace', icon: '🔨', description: 'A blunt weapon with a heavy head.', type: 'weapon', category: 'Simple Melee', slot: 'MainHand', damageDice: '1d6', damageType: 'Bludgeoning', properties: [], weight: 4, cost: '5 GP', mastery: 'Sap' },
  'quarterstaff': { id: 'quarterstaff', name: 'Quarterstaff', icon: ' Staff', description: 'A long staff of wood.', type: 'weapon', category: 'Simple Melee', slot: 'MainHand', damageDice: '1d6', damageType: 'Bludgeoning', properties: ['Versatile'], weight: 4, cost: '2 SP', mastery: 'Topple' },
  'sickle': { id: 'sickle', name: 'Sickle', icon: '낫', description: 'A curved blade used as a tool or weapon.', type: 'weapon', category: 'Simple Melee', slot: 'MainHand', damageDice: '1d4', damageType: 'Slashing', properties: ['Light'], weight: 2, cost: '1 GP', mastery: 'Nick' },
  'spear': { id: 'spear', name: 'Spear', icon: '⚰', description: 'A long weapon with a pointed tip.', type: 'weapon', category: 'Simple Melee', slot: 'MainHand', damageDice: '1d6', damageType: 'Piercing', properties: ['Thrown', 'Versatile'], weight: 3, cost: '1 GP', mastery: 'Sap' },
  
  // --- Simple Ranged Weapons ---
  'light_crossbow': { id: 'light_crossbow', name: 'Light Crossbow', icon: '🏹', description: 'A lighter, easier-to-load crossbow.', type: 'weapon', category: 'Simple Ranged', slot: 'MainHand', damageDice: '1d8', damageType: 'Piercing', properties: ['Ammunition', 'Loading', 'Two-Handed'], isMartial: false, weight: 5, cost: '25 GP', mastery: 'Slow' },
  'shortbow': { id: 'shortbow', name: 'Shortbow', icon: '🏹', description: 'A small bow.', type: 'weapon', category: 'Simple Ranged', slot: 'MainHand', damageDice: '1d6', damageType: 'Piercing', properties: ['Ammunition', 'Two-Handed'], isMartial: false, weight: 2, cost: '25 GP', mastery: 'Vex' },
  
  // --- Martial Melee Weapons ---
  'battleaxe': { id: 'battleaxe', name: 'Battleaxe', icon: '🪓', description: 'A versatile axe.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '1d8', damageType: 'Slashing', properties: ['Versatile'], isMartial: true, weight: 4, cost: '10 GP', mastery: 'Topple' },
  'flail': { id: 'flail', name: 'Flail', icon: '⛓️', description: 'A striking head attached to a handle by a flexible chain.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '1d8', damageType: 'Bludgeoning', properties: [], isMartial: true, weight: 2, cost: '10 GP', mastery: 'Sap' },
  'glaive': { id: 'glaive', name: 'Glaive', icon: '⚰', description: 'A long pole weapon with a blade on the end.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '1d10', damageType: 'Slashing', properties: ['Heavy', 'Reach', 'Two-Handed'], isMartial: true, weight: 6, cost: '20 GP', mastery: 'Graze' },
  'greataxe': { id: 'greataxe', name: 'Greataxe', icon: '🪓', description: 'A large, two-handed axe.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '1d12', damageType: 'Slashing', properties: ['Heavy', 'Two-Handed'], isMartial: true, weight: 7, cost: '30 GP', mastery: 'Cleave' },
  'greatsword': { id: 'greatsword', name: 'Greatsword', icon: '🗡️', description: 'A large, two-handed sword.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '2d6', damageType: 'Slashing', properties: ['Heavy', 'Two-Handed'], isMartial: true, weight: 6, cost: '50 GP', mastery: 'Graze' },
  'halberd': { id: 'halberd', name: 'Halberd', icon: '⚰', description: 'An axe blade topped with a spike mounted on a long shaft.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '1d10', damageType: 'Slashing', properties: ['Heavy', 'Reach', 'Two-Handed'], isMartial: true, weight: 6, cost: '20 GP', mastery: 'Cleave' },
  'lance': { id: 'lance', name: 'Lance', icon: '⚰', description: 'A long weapon for use on horseback.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '1d12', damageType: 'Piercing', properties: ['Reach', 'Special'], isMartial: true, weight: 6, cost: '10 GP', mastery: 'Topple' },
  'longsword': { id: 'longsword', name: 'Longsword', icon: '🗡️', description: 'A classic versatile sword.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '1d8', damageType: 'Slashing', properties: ['Versatile'], isMartial: true, weight: 3, cost: '15 GP', mastery: 'Sap' },
  'maul': { id: 'maul', name: 'Maul', icon: '🔨', description: 'A massive two-handed hammer.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '2d6', damageType: 'Bludgeoning', properties: ['Heavy', 'Two-Handed'], isMartial: true, weight: 10, cost: '10 GP', mastery: 'Topple' },
  'morningstar': { id: 'morningstar', name: 'Morningstar', icon: '⭐', description: 'A spiked club.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '1d8', damageType: 'Piercing', properties: [], isMartial: true, weight: 4, cost: '15 GP', mastery: 'Sap' },
  'pike': { id: 'pike', name: 'Pike', icon: '⚰', description: 'A very long spear.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '1d10', damageType: 'Piercing', properties: ['Heavy', 'Reach', 'Two-Handed'], isMartial: true, weight: 18, cost: '5 GP', mastery: 'Push' },
  'rapier': { id: 'rapier', name: 'Rapier', icon: '🗡️', description: 'A thin, sharp-pointed sword.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '1d8', damageType: 'Piercing', properties: ['Finesse'], isMartial: true, weight: 2, cost: '25 GP', mastery: 'Vex' },
  'scimitar': { id: 'scimitar', name: 'Scimitar', icon: '🗡️', description: 'A short, curved sword.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '1d6', damageType: 'Slashing', properties: ['Finesse', 'Light'], isMartial: true, weight: 3, cost: '25 GP', mastery: 'Nick' },
  'shortsword': { id: 'shortsword', name: 'Shortsword', icon: '🗡️', description: 'A light, double-edged sword.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '1d6', damageType: 'Piercing', properties: ['Finesse', 'Light'], isMartial: true, weight: 2, cost: '10 GP', mastery: 'Vex' },
  'trident': { id: 'trident', name: 'Trident', icon: '🔱', description: 'A three-pronged spear.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '1d6', damageType: 'Piercing', properties: ['Thrown', 'Versatile'], isMartial: true, weight: 4, cost: '5 GP', mastery: 'Topple' },
  'warhammer': { id: 'warhammer', name: 'Warhammer', icon: '🔨', description: 'A versatile war hammer.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '1d8', damageType: 'Bludgeoning', properties: ['Versatile'], isMartial: true, weight: 2, cost: '15 GP', mastery: 'Push' },
  'war_pick': { id: 'war_pick', name: 'War Pick', icon: '⛏️', description: 'A pointed weapon for piercing armor.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '1d8', damageType: 'Piercing', properties: [], isMartial: true, weight: 2, cost: '5 GP', mastery: 'Sap' },
  'whip': { id: 'whip', name: 'Whip', icon: '〰️', description: 'A long, flexible whip.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: '1d4', damageType: 'Slashing', properties: ['Finesse', 'Reach'], isMartial: true, weight: 3, cost: '2 GP', mastery: 'Slow' },

  // --- Martial Ranged Weapons ---
  'longbow': { id: 'longbow', name: 'Longbow', icon: '🏹', description: 'A large, powerful bow.', type: 'weapon', category: 'Martial Ranged', slot: 'MainHand', damageDice: '1d8', damageType: 'Piercing', properties: ['Ammunition', 'Heavy', 'Two-Handed'], isMartial: true, weight: 2, cost: '50 GP', mastery: 'Slow' },
  'hand_crossbow': { id: 'hand_crossbow', name: 'Hand Crossbow', icon: '🏹', description: 'A crossbow small enough to be used with one hand.', type: 'weapon', category: 'Martial Ranged', slot: 'MainHand', damageDice: '1d6', damageType: 'Piercing', properties: ['Ammunition', 'Light', 'Loading'], isMartial: true, weight: 3, cost: '75 GP', mastery: 'Vex' },
  'heavy_crossbow': { id: 'heavy_crossbow', name: 'Heavy Crossbow', icon: '🏹', description: 'A powerful, heavy crossbow.', type: 'weapon', category: 'Martial Ranged', slot: 'MainHand', damageDice: '1d10', damageType: 'Piercing', properties: ['Ammunition', 'Heavy', 'Loading', 'Two-Handed'], isMartial: true, weight: 18, cost: '50 GP', mastery: 'Push' },

  // --- Legacy "Rusty Sword" as a Scimitar for consistency ---
  'rusty_sword': {
    id: 'rusty_sword', name: 'Rusty Sword', icon: '🗡️', description: 'One-Handed. An old, pitted scimitar. It has seen better days.', type: 'weapon', category: 'Martial Melee', slot: 'MainHand', damageDice: "1d6", damageType: "Slashing", properties: ['Finesse', 'Light'], isMartial: true, weight: 3, cost: "25 GP", mastery: 'Nick'
  },
};

export const ITEMS: Record<string, Item> = {
  // --- Consumables & Other Items ---
  'healing_potion': {
    id: 'healing_potion', name: 'Healing Potion', icon: '🧪', description: 'A vial of glowing red liquid. Looks restorative.', type: 'consumable', effect: 'heal_25', weight: 0.5, cost: "50 GP"
  },
  'old_map_fragment': {
    id: 'old_map_fragment', name: 'Old Map Fragment', icon: '📜', description: 'A piece of parchment with faded markings. It seems to show a path leading east.', type: 'note', weight: 0.1,
  },
  'shiny_coin': {
    id: 'shiny_coin', name: 'Shiny Coin', icon: '🪙', description: 'A gold coin, surprisingly clean.', type: 'treasure', weight: 0.02, cost: "1 GP"
  },

  // --- Spell Components ---
  'lodestone_pair': { id: 'lodestone_pair', name: 'Lodestone Pair', icon: '🧲', description: 'Two small, naturally magnetic stones.', type: 'spell_component', weight: 0.2, cost: "1 SP" },
  'diamond_300gp': { id: 'diamond_300gp', name: 'Diamond (300 GP)', icon: '💎', description: 'A large, clear diamond.', type: 'spell_component', weight: 0.1, cost: "300 GP", costInGp: 300, isConsumed: true, substitutable: false },

  // Armor and Shield
  'padded_armor': { id: 'padded_armor', name: 'Padded Armor', icon: '🧥', description: 'Quilted layers of cloth and batting.', type: 'armor', slot: 'Torso', armorCategory: 'Light', baseArmorClass: 11, addsDexterityModifier: true, stealthDisadvantage: true, weight: 8, cost: '5 GP' },
  'leather_armor': { id: 'leather_armor', name: 'Leather Armor', icon: '👕', description: 'Stiffened leather plates.', type: 'armor', slot: 'Torso', armorCategory: 'Light', baseArmorClass: 11, addsDexterityModifier: true, weight: 10, cost: '10 GP' },
  'studded_leather_armor': { id: 'studded_leather_armor', name: 'Studded Leather Armor', icon: '👘', description: 'Leather reinforced with rivets.', type: 'armor', slot: 'Torso', armorCategory: 'Light', baseArmorClass: 12, addsDexterityModifier: true, weight: 13, cost: '45 GP' },
  'hide_armor': { id: 'hide_armor', name: 'Hide Armor', icon: '👚', description: 'Thick furs and pelts.', type: 'armor', slot: 'Torso', armorCategory: 'Medium', baseArmorClass: 12, addsDexterityModifier: true, maxDexterityBonus: 2, weight: 12, cost: '10 GP' },
  'chain_shirt': { id: 'chain_shirt', name: 'Chain Shirt', icon: '⛓️', description: 'Interlocking metal rings.', type: 'armor', slot: 'Torso', armorCategory: 'Medium', baseArmorClass: 13, addsDexterityModifier: true, maxDexterityBonus: 2, weight: 20, cost: '50 GP' },
  'scale_mail': { id: 'scale_mail', name: 'Scale Mail', icon: '🛡️', description: 'Overlapping metal scales.', type: 'armor', slot: 'Torso', armorCategory: 'Medium', baseArmorClass: 14, addsDexterityModifier: true, maxDexterityBonus: 2, stealthDisadvantage: true, weight: 45, cost: '50 GP' },
  'breastplate': { id: 'breastplate', name: 'Breastplate', icon: '🛡️', description: 'Fitted metal chest piece.', type: 'armor', slot: 'Torso', armorCategory: 'Medium', baseArmorClass: 14, addsDexterityModifier: true, maxDexterityBonus: 2, weight: 20, cost: '400 GP' },
  'half_plate_armor': { id: 'half_plate_armor', name: 'Half Plate Armor', icon: '🛡️', description: 'Shaped metal plates.', type: 'armor', slot: 'Torso', armorCategory: 'Medium', baseArmorClass: 15, addsDexterityModifier: true, maxDexterityBonus: 2, stealthDisadvantage: true, weight: 40, cost: '750 GP' },
  'ring_mail': { id: 'ring_mail', name: 'Ring Mail', icon: '🛡️', description: 'Leather with heavy rings sewn in.', type: 'armor', slot: 'Torso', armorCategory: 'Heavy', baseArmorClass: 14, addsDexterityModifier: false, stealthDisadvantage: true, weight: 40, cost: '30 GP' },
  'chain_mail': { id: 'chain_mail', name: 'Chain Mail', icon: '⛓️', description: 'Interlocking metal rings, full suit.', type: 'armor', slot: 'Torso', armorCategory: 'Heavy', baseArmorClass: 16, addsDexterityModifier: false, strengthRequirement: 13, stealthDisadvantage: true, weight: 55, cost: '75 GP' },
  'splint_armor': { id: 'splint_armor', name: 'Splint Armor', icon: '🛡️', description: 'Vertical metal strips.', type: 'armor', slot: 'Torso', armorCategory: 'Heavy', baseArmorClass: 17, addsDexterityModifier: false, strengthRequirement: 15, stealthDisadvantage: true, weight: 60, cost: '200 GP' },
  'plate_armor': { id: 'plate_armor', name: 'Plate Armor', icon: '🛡️', description: 'Full interlocking metal plates.', type: 'armor', slot: 'Torso', armorCategory: 'Heavy', baseArmorClass: 18, addsDexterityModifier: false, strengthRequirement: 15, stealthDisadvantage: true, weight: 65, cost: '1,500 GP' },
  'shield_std': { id: 'shield_std', name: 'Shield', icon: '🛡️', description: 'A standard shield.', type: 'armor', slot: 'OffHand', armorCategory: 'Shield', armorClassBonus: 2, weight: 6, cost: '10 GP' },
};
