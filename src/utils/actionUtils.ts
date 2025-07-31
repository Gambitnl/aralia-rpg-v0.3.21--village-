

/**
 * @file src/utils/actionUtils.ts
 * This file contains utility functions related to player actions,
 * such as generating diegetic messages for the game log.
 */

import { Action, NPC, Location, PlayerCharacter } from '../types';
import { ITEMS } from '../constants';
import { DIRECTION_VECTORS } from '../config/mapConfig';

export function getDiegeticPlayerActionMessage(
  action: Action,
  gameNpcs: Record<string, NPC>,
  gameLocations: Record<string, Location>,
  playerCharacter: PlayerCharacter | undefined
): string | null {
  switch (action.type) {
    case 'move':
      if (action.targetId) {
        if (DIRECTION_VECTORS[action.targetId as keyof typeof DIRECTION_VECTORS]) {
          return `You head ${action.targetId}.`;
        }
        const targetLocation = gameLocations[action.targetId];
        if (targetLocation) {
          return `You decide to travel to ${targetLocation.name}.`;
        }
      }
      return `You decide to move.`;
    case 'look_around':
      return "You take a moment to survey your surroundings.";
    case 'talk':
      if (action.targetId) {
        const npc = gameNpcs[action.targetId];
        if (npc) {
          return `You approach ${npc.name} to speak.`;
        }
      }
      return `You attempt to speak to someone nearby.`;
    case 'take_item':
      if (action.targetId) {
        const item = ITEMS[action.targetId];
        if (item) {
          return `You attempt to take the ${item.name}.`;
        }
      }
      return `You try to pick something up.`;
    case 'inspect_submap_tile':
      return `You carefully examine the terrain nearby.`;
    case 'gemini_custom_action':
      if (action.label) {
        return `You decide to: ${action.label}.`;
      }
      return `You decide to try something specific.`;
    case 'EQUIP_ITEM':
        if(action.payload?.itemId && ITEMS[action.payload.itemId]) {
            return `You attempt to equip the ${ITEMS[action.payload.itemId].name}.`;
        }
        return `You attempt to equip an item.`;
    case 'UNEQUIP_ITEM':
        if(action.payload?.slot && playerCharacter?.equippedItems[action.payload.slot]) {
            return `You attempt to unequip the ${playerCharacter.equippedItems[action.payload.slot]!.name}.`;
        }
        return `You attempt to unequip an item.`;
    case 'use_item':
        if(action.payload?.itemId && ITEMS[action.payload.itemId]) {
            return `You use the ${ITEMS[action.payload.itemId].name}.`;
        }
        return `You use an item.`;
    case 'DROP_ITEM':
        if(action.payload?.itemId && ITEMS[action.payload.itemId]) {
            return `You drop the ${ITEMS[action.payload.itemId].name}.`;
        }
        return `You drop an item.`;
    case 'TOGGLE_PREPARED_SPELL':
        return 'You adjust your magical preparations.';
    case 'LONG_REST':
    case 'SHORT_REST':
        return null; // The reducer adds a system message for this.
    case 'ask_oracle':
    case 'toggle_map':
    case 'toggle_submap_visibility':
    case 'save_game':
    case 'go_to_main_menu':
    case 'toggle_dev_menu':
    case 'UPDATE_INSPECTED_TILE_DESCRIPTION':
    case 'TOGGLE_DISCOVERY_LOG':
    case 'TOGGLE_GLOSSARY_VISIBILITY':
    case 'GENERATE_ENCOUNTER':
    case 'SHOW_ENCOUNTER_MODAL':
    case 'HIDE_ENCOUNTER_MODAL':
    case 'START_BATTLE_MAP_ENCOUNTER':
    case 'END_BATTLE':
    case 'toggle_party_editor':
    case 'toggle_party_overlay':
    case 'CAST_SPELL':
    case 'USE_LIMITED_ABILITY':
      return null;
    default:
      if (action.label && !action.type.startsWith('SET_') && !action.type.startsWith('TOGGLE_')) {
         return `> ${action.label}`;
      }
      return null;
  }
}
