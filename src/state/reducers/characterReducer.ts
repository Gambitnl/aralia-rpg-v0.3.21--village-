
/**
 * @file src/state/reducers/characterReducer.ts
 * A slice reducer that handles character-related state changes (party, inventory, actions).
 */
import { GameState, LimitedUseAbility, SpellSlots, DiscoveryType } from '../../types';
import { AppAction } from '../actionTypes';
import { calculateArmorClass, createPlayerCharacterFromTemp } from '../../utils/characterUtils';
import { LOCATIONS } from '../../constants';

// Helper for resetting limited uses
const resolveMaxValue = (char: GameState['party'][0], ability: LimitedUseAbility): number => {
    if (typeof ability.max === 'number') return ability.max;
    // This is a simplified version. A full implementation would check specific ability modifiers.
    if (ability.max === 'proficiency_bonus') return char.proficiencyBonus || 2;
    return 1; // Fallback
};

export function characterReducer(state: GameState, action: AppAction): Partial<GameState> {
  switch (action.type) {
    case 'SET_PARTY_COMPOSITION':
      return {
        party: action.payload.map(tempMember => createPlayerCharacterFromTemp(tempMember)),
        tempParty: action.payload,
      };

    case 'EQUIP_ITEM': {
        const { itemId, characterId } = action.payload;
        const charIndex = state.party.findIndex(c => c.id === characterId);
        if (charIndex === -1) return {};

        const charToUpdate = { ...state.party[charIndex] };
        const itemToEquip = state.inventory.find(item => item.id === itemId);
        if (!itemToEquip) return {};

        const isOneHandedWeapon = itemToEquip.type === 'weapon' && !itemToEquip.properties?.includes('Two-Handed');
        let targetSlot = isOneHandedWeapon
            ? (!charToUpdate.equippedItems.MainHand ? 'MainHand' : !charToUpdate.equippedItems.OffHand ? 'OffHand' : 'MainHand')
            : itemToEquip.slot || null;

        if (!targetSlot) return {};

        const newEquippedItems = { ...charToUpdate.equippedItems };
        const newInventory = [...state.inventory];
        const itemInSlot = newEquippedItems[targetSlot];

        if (itemInSlot) newInventory.push(itemInSlot);

        newEquippedItems[targetSlot] = itemToEquip;
        const itemIndexInInventory = newInventory.findIndex(item => item.id === itemId);
        if (itemIndexInInventory > -1) newInventory.splice(itemIndexInInventory, 1);
        
        const updatedPlayerCharacter = { ...charToUpdate, equippedItems: newEquippedItems };
        updatedPlayerCharacter.armorClass = calculateArmorClass(updatedPlayerCharacter);

        const newParty = [...state.party];
        newParty[charIndex] = updatedPlayerCharacter;

        const newCharacterSheetModalState = state.characterSheetModal.isOpen && state.characterSheetModal.character?.id === updatedPlayerCharacter.id
            ? { ...state.characterSheetModal, character: updatedPlayerCharacter }
            : state.characterSheetModal;

        return { party: newParty, inventory: newInventory, characterSheetModal: newCharacterSheetModalState };
    }

    case 'UNEQUIP_ITEM': {
        const { slot, characterId } = action.payload;
        const charIndex = state.party.findIndex(c => c.id === characterId);
        if (charIndex === -1) return {};

        const charToUpdate = { ...state.party[charIndex] };
        const itemToUnequip = charToUpdate.equippedItems[slot];
        if (!itemToUnequip) return {};

        const newEquippedItems = { ...charToUpdate.equippedItems };
        delete newEquippedItems[slot];
        
        const updatedPlayerCharacter = { ...charToUpdate, equippedItems: newEquippedItems };
        updatedPlayerCharacter.armorClass = calculateArmorClass(updatedPlayerCharacter);

        const newParty = [...state.party];
        newParty[charIndex] = updatedPlayerCharacter;
        
        const newCharacterSheetModalState = state.characterSheetModal.isOpen && state.characterSheetModal.character?.id === updatedPlayerCharacter.id
            ? { ...state.characterSheetModal, character: updatedPlayerCharacter }
            : state.characterSheetModal;

        return {
            party: newParty,
            inventory: [...state.inventory, itemToUnequip],
            characterSheetModal: newCharacterSheetModalState
        };
    }
    
    case 'DROP_ITEM': {
        const { itemId, characterId } = action.payload;
        const itemToDrop = state.inventory.find(item => item.id === itemId);
        if (!itemToDrop) return {};

        const newDynamicItems = { ...state.dynamicLocationItemIds };
        if (!state.currentLocationId.startsWith('coord_')) { 
            newDynamicItems[state.currentLocationId] = [...(newDynamicItems[state.currentLocationId] || []), itemToDrop.id];
        }
        
        return {
            inventory: state.inventory.filter(item => item.id !== itemId),
            dynamicLocationItemIds: newDynamicItems,
        };
    }
    
    case 'USE_ITEM': {
        const { itemId, characterId } = action.payload;
        const charIndex = state.party.findIndex(c => c.id === characterId);
        if (charIndex === -1) return {};

        const charToUpdate = { ...state.party[charIndex] };
        const itemToUse = state.inventory.find(item => item.id === itemId);
        if (!itemToUse || itemToUse.type !== 'consumable' || !itemToUse.effect) return {};

        let playerAfterEffect = { ...charToUpdate };
        if (itemToUse.effect.startsWith('heal_')) {
            const healAmount = parseInt(itemToUse.effect.split('_')[1]);
            if (!isNaN(healAmount)) {
                playerAfterEffect.hp = Math.min(playerAfterEffect.maxHp, playerAfterEffect.hp + healAmount);
            }
        }
        
        const newParty = [...state.party];
        newParty[charIndex] = playerAfterEffect;
        
         const newCharacterSheetModalState = state.characterSheetModal.isOpen && state.characterSheetModal.character?.id === playerAfterEffect.id
            ? { ...state.characterSheetModal, character: playerAfterEffect }
            : state.characterSheetModal;
            
        return {
            party: newParty,
            inventory: state.inventory.filter(item => item.id !== itemId),
            characterSheetModal: newCharacterSheetModalState,
        };
    }
    
    case 'TOGGLE_PREPARED_SPELL': {
        const { characterId, spellId } = action.payload;
        const charIndex = state.party.findIndex(c => c.id === characterId);
        if (charIndex === -1) return {};

        const charToUpdate = { ...state.party[charIndex] };
        if (!charToUpdate.spellbook) return {};

        const spellbook = { ...charToUpdate.spellbook };
        const preparedSpells = new Set(spellbook.preparedSpells);
        
        if (preparedSpells.has(spellId)) preparedSpells.delete(spellId);
        else preparedSpells.add(spellId);
        
        spellbook.preparedSpells = Array.from(preparedSpells);
        const updatedCharacter = { ...charToUpdate, spellbook };
        
        const newParty = [...state.party];
        newParty[charIndex] = updatedCharacter;
        
        const newCharacterSheetModalState = state.characterSheetModal.isOpen && state.characterSheetModal.character?.id === updatedCharacter.id
            ? { ...state.characterSheetModal, character: updatedCharacter }
            : state.characterSheetModal;

        return { party: newParty, characterSheetModal: newCharacterSheetModalState };
    }

    case 'CAST_SPELL': {
        const { characterId, spellLevel } = action.payload;
        if (spellLevel === 0) return {};
  
        const slotKey = `level_${spellLevel}` as const;
        const newParty = state.party.map(char => {
            if (char.id === characterId && char.spellSlots?.[slotKey] && char.spellSlots[slotKey].current > 0) {
              return { ...char, spellSlots: { ...char.spellSlots, [slotKey]: { ...char.spellSlots[slotKey], current: char.spellSlots[slotKey].current - 1 }}};
            }
            return char;
        });
        return { party: newParty };
    }
    
    case 'USE_LIMITED_ABILITY': {
        const { characterId, abilityId } = action.payload;
        const newParty = state.party.map(char => {
            if (char.id === characterId && char.limitedUses?.[abilityId] && char.limitedUses[abilityId].current > 0) {
              return { ...char, limitedUses: { ...char.limitedUses, [abilityId]: { ...char.limitedUses[abilityId], current: char.limitedUses[abilityId].current - 1 }}};
            }
            return char;
        });
        return { party: newParty };
    }

    case 'SHORT_REST': {
        const newParty = state.party.map(char => {
            const restoredUses = { ...char.limitedUses };
            let usesChanged = false;
            for (const id in restoredUses) {
                if (restoredUses[id].resetOn === 'short_rest') {
                    restoredUses[id] = { ...restoredUses[id], current: resolveMaxValue(char, restoredUses[id]) };
                    usesChanged = true;
                }
            }
            return usesChanged ? { ...char, limitedUses: restoredUses } : char;
        });
        return { party: newParty };
    }

    case 'LONG_REST': {
        const newParty = state.party.map(char => {
            const charCopy = { ...char };
            let hasChanged = true; // Assume change for simplicity

            // Restore Spell Slots
            if (charCopy.spellSlots) {
                const restoredSlots: SpellSlots = { ...charCopy.spellSlots };
                Object.keys(restoredSlots).forEach(key => {
                    const slotKey = key as keyof SpellSlots;
                    restoredSlots[slotKey] = { ...restoredSlots[slotKey], current: restoredSlots[slotKey].max };
                });
                charCopy.spellSlots = restoredSlots;
            }
            
            // Restore Limited Use Abilities
            if (charCopy.limitedUses) {
                const restoredUses = { ...charCopy.limitedUses };
                Object.keys(restoredUses).forEach(id => {
                    const ability = restoredUses[id];
                    if (ability.resetOn === 'long_rest' || ability.resetOn === 'short_rest' || ability.resetOn === 'daily') {
                        restoredUses[id] = { ...ability, current: resolveMaxValue(char, ability) };
                    }
                });
                charCopy.limitedUses = restoredUses;
            }
            
            // Restore HP
            charCopy.hp = charCopy.maxHp;

            return charCopy;
        });
        return { party: newParty };
    }

    default:
      return {};
  }
}
