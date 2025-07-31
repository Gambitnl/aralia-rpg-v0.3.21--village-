/**
 * @file src/utils/spellUtils.ts
 * This file contains utility functions related to player character spellcasting.
 */
import { PlayerCharacter, Spell, SpellbookData } from '../types';
import { RACES_DATA, TIEFLING_LEGACIES } from '../constants';

interface CharacterSpells {
  cantrips: Spell[];
  spells: Spell[];
}

/**
 * Gets a character's complete list of known cantrips and spells from all sources.
 * This is the new single source of truth for spell aggregation.
 * @param {PlayerCharacter} character - The character object.
 * @param {Record<string, Spell>} allSpellsData - A map of all spells in the game.
 * @returns {CharacterSpells} An object containing arrays of final cantrips and spells.
 */
export function getCharacterSpells(character: PlayerCharacter, allSpellsData: Record<string, Spell>): CharacterSpells {
  const cantripSet = new Set<Spell>();
  const spellSet = new Set<Spell>();

  // 1. Get spells from class spellbook
  if (character.spellbook) {
    character.spellbook.cantrips.forEach(id => {
      const spell = allSpellsData[id];
      if (spell) cantripSet.add(spell);
    });
    // For simplicity, combine known and prepared spells for display
    const allClassSpellIds = [
      ...(character.spellbook.knownSpells || []),
      ...(character.spellbook.preparedSpells || []),
    ];
    [...new Set(allClassSpellIds)].forEach(id => {
      const spell = allSpellsData[id];
      if (spell) {
        if (spell.level === 0) cantripSet.add(spell);
        else spellSet.add(spell);
      }
    });
  }

  // 2. Get spells from racial traits
  const { race, racialSelections } = character;
  if (!race) return { cantrips: [], spells: [] };

  // Aasimar
  if (race.id === 'aasimar') {
    const lightCantrip = allSpellsData['light'];
    if (lightCantrip) cantripSet.add(lightCantrip);
  }

  // Elf Lineages
  const elvenLineageId = racialSelections?.['elf']?.choiceId;
  if (race.id === 'elf' && elvenLineageId) {
    const lineage = RACES_DATA['elf']?.elvenLineages?.find(l => l.id === elvenLineageId);
    lineage?.benefits.forEach(benefit => {
      if (benefit.cantripId) {
        const cantrip = allSpellsData[benefit.cantripId];
        if (cantrip) cantripSet.add(cantrip);
      }
      if (benefit.spellId) {
        const spell = allSpellsData[benefit.spellId];
        if (spell) spellSet.add(spell);
      }
    });
  }
  
  // Gnome Subraces
  const gnomeSubraceId = racialSelections?.['gnome']?.choiceId;
  if (race.id === 'gnome' && gnomeSubraceId) {
    const subrace = RACES_DATA['gnome']?.gnomeSubraces?.find(sr => sr.id === gnomeSubraceId);
    if(subrace?.grantedCantrip) {
      const cantrip = allSpellsData[subrace.grantedCantrip.id];
      if (cantrip) cantripSet.add(cantrip);
    }
    if(subrace?.grantedSpell) {
      const spell = allSpellsData[subrace.grantedSpell.id];
      if (spell) spellSet.add(spell);
    }
  }

  // Tiefling Legacies
  const fiendishLegacyId = racialSelections?.['tiefling']?.choiceId;
  if (race.id === 'tiefling' && fiendishLegacyId) {
    const legacy = TIEFLING_LEGACIES.find(fl => fl.id === fiendishLegacyId);
    if(legacy) {
      const cantrip = allSpellsData[legacy.level1Benefit.cantripId];
      if (cantrip) cantripSet.add(cantrip);
      const thaumaturgy = allSpellsData['thaumaturgy'];
      if(thaumaturgy) cantripSet.add(thaumaturgy);
      const spell3 = allSpellsData[legacy.level3SpellId];
      if(spell3) spellSet.add(spell3);
      const spell5 = allSpellsData[legacy.level5SpellId];
      if(spell5) spellSet.add(spell5);
    }
  }
  
  // Add other racial spell logic here as needed for Duergar, Deep Gnomes, Air Genasi, etc.
  // ...

  const finalCantrips = Array.from(cantripSet).sort((a, b) => a.name.localeCompare(b.name));
  const finalSpells = Array.from(spellSet).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  return { cantrips: finalCantrips, spells: finalSpells };
}