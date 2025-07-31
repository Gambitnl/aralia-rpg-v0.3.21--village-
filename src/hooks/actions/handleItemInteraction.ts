

/**
 * @file src/hooks/actions/handleItemInteraction.ts
 * Handles item interaction actions like 'take_item', 'EQUIP_ITEM', etc.
 */
import { GameState, Action, Item, EquipItemPayload, UnequipItemPayload, UseItemPayload, DropItemPayload } from '../../types';
import { AppAction } from '../../state/actionTypes';
import { AddMessageFn } from './actionHandlerTypes';
import { ITEMS } from '../../constants';

interface HandleTakeItemProps {
  action: Action;
  gameState: GameState;
  dispatch: React.Dispatch<AppAction>;
  addMessage: AddMessageFn;
}

export async function handleTakeItem({
  action,
  gameState,
  dispatch,
  addMessage,
}: HandleTakeItemProps): Promise<void> {
  if (!action.targetId) {
    addMessage("Invalid item target.", "system");
    dispatch({ type: 'SET_GEMINI_ACTIONS', payload: null });
    return;
  }
  const itemToTake = ITEMS[action.targetId];
  const currentLocId = gameState.currentLocationId;
  if (currentLocId.startsWith('coord_')) {
    addMessage(`There are no specific items to take in this wilderness area.`, 'system');
    dispatch({ type: 'SET_GEMINI_ACTIONS', payload: null });
    return;
  }
  const itemsCurrentlyInLoc = gameState.dynamicLocationItemIds[currentLocId] || [];
  if (itemToTake && itemsCurrentlyInLoc.includes(action.targetId)) {
    // The actual state update for inventory and dynamicLocationItemIds,
    // as well as adding the discovery entry, is handled by the reducer
    // for the 'TAKE_ITEM' action.
    // This handler mainly validates and prepares for that dispatch.
    dispatch({ type: 'TAKE_ITEM', payload: { item: itemToTake, locationId: currentLocId } });
    // The message like "You take the Rusty Sword." is now handled by the reducer via ADD_DISCOVERY_ENTRY
  } else {
    addMessage(`Cannot take ${ITEMS[action.targetId]?.name || action.targetId}. It's not here or doesn't exist.`, 'system');
  }
  dispatch({ type: 'SET_GEMINI_ACTIONS', payload: null });
  dispatch({ type: 'RESET_NPC_INTERACTION_CONTEXT' });
}

export function handleEquipItem(dispatch: React.Dispatch<AppAction>, payload: EquipItemPayload): void {
  dispatch({ type: 'EQUIP_ITEM', payload });
}

export function handleUnequipItem(dispatch: React.Dispatch<AppAction>, payload: UnequipItemPayload): void {
  dispatch({ type: 'UNEQUIP_ITEM', payload });
}

export function handleUseItem(dispatch: React.Dispatch<AppAction>, payload: UseItemPayload): void {
  dispatch({ type: 'USE_ITEM', payload });
}

export function handleDropItem(dispatch: React.Dispatch<AppAction>, payload: DropItemPayload): void {
  dispatch({ type: 'DROP_ITEM', payload });
}