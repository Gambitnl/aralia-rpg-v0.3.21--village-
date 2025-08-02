/**
 * @file src/hooks/useGameActions.ts
 * Custom hook for managing game action processing.
 * This is the refactored version that orchestrates calls to specific action handlers.
 */
import { useCallback } from 'react';
import { GameState, Action, NPC, Location, MapTile, PlayerCharacter, GeminiLogEntry, EquipItemPayload, UnequipItemPayload, DropItemPayload, UseItemPayload, ShowEncounterModalPayload, StartBattleMapEncounterPayload, Monster, TempPartyMember, DiscoveryType, KnownFact, QuickTravelPayload, GamePhase } from '../types';
import { AppAction } from '../state/actionTypes';
import { ITEMS, BIOMES, LOCATIONS, NPCS } from '../constants';
import { DIRECTION_VECTORS, SUBMAP_DIMENSIONS } from '../config/mapConfig';
import * as GeminiService from '../services/geminiService';
import { AddMessageFn, PlayPcmAudioFn, GetCurrentLocationFn, GetCurrentNPCsFn, GetTileTooltipTextFn, AddGeminiLogFn, LogDiscoveryFn } from './actions/actionHandlerTypes';

// Import specific action handlers
import { handleMovement, handleQuickTravel } from './actions/handleMovement';
import { handleLookAround, handleInspectSubmapTile } from './actions/handleObservation';
import { handleTalk } from './actions/handleNpcInteraction';
import { handleTakeItem, handleEquipItem, handleUnequipItem, handleUseItem, handleDropItem } from './actions/handleItemInteraction';
import { handleOracle } from './actions/handleOracle';
import { handleGeminiCustom } from './actions/handleGeminiCustom';
import { handleGenerateEncounter, handleShowEncounterModal, handleHideEncounterModal, handleStartBattleMapEncounter, handleEndBattle } from './actions/handleEncounter';
import { handleCastSpell, handleUseLimitedAbility, handleTogglePreparedSpell, handleLongRest, handleShortRest } from './actions/handleResourceActions';
import { 
  handleSaveGame, 
  handleGoToMainMenu, 
  handleToggleMap, 
  handleToggleSubmap, 
  handleToggleDevMenu,
  handleToggleDiscoveryLog,
  handleToggleGlossary,
  handleTogglePartyEditor,
  handleTogglePartyOverlay,
  handleToggleNpcTestModal,
  handleToggleLogbook
} from './actions/handleSystemAndUi';
import { getDiegeticPlayerActionMessage } from '../utils/actionUtils';
import { getSubmapTileInfo } from '../utils/submapUtils';
import { generateTownMap } from '../services/mapService';


interface UseGameActionsProps {
  gameState: GameState;
  dispatch: React.Dispatch<AppAction>;
  addMessage: AddMessageFn;
  playPcmAudio: PlayPcmAudioFn;
  getCurrentLocation: GetCurrentLocationFn;
  getCurrentNPCs: GetCurrentNPCsFn;
  getTileTooltipText: GetTileTooltipTextFn;
}

export function useGameActions({
  gameState,
  dispatch,
  addMessage,
  playPcmAudio,
  getCurrentLocation,
  getCurrentNPCs,
  getTileTooltipText,
}: UseGameActionsProps) {

  const addGeminiLog = useCallback<AddGeminiLogFn>((functionName, prompt, response) => {
    const logEntry: GeminiLogEntry = {
      timestamp: new Date(),
      functionName,
      prompt,
      response,
    };
    dispatch({ type: 'ADD_GEMINI_LOG_ENTRY', payload: logEntry });
  }, [dispatch]);

  const logDiscovery = useCallback<LogDiscoveryFn>((newLocation: Location) => {
    const alreadyDiscovered = gameState.discoveryLog.some(entry =>
      entry.type === DiscoveryType.LOCATION_DISCOVERY &&
      entry.flags.some(f => f.key === 'locationId' && f.value === newLocation.id)
    );

    if (!alreadyDiscovered) {
      dispatch({ 
        type: 'ADD_DISCOVERY_ENTRY', 
        payload: {
            gameTime: gameState.gameTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
            type: DiscoveryType.LOCATION_DISCOVERY,
            title: `Location Discovered: ${newLocation.name}`,
            content: `You have discovered ${newLocation.name}. ${newLocation.baseDescription}`,
            source: { type: 'LOCATION', id: newLocation.id, name: newLocation.name },
            flags: [{ key: 'locationId', value: newLocation.id, label: newLocation.name }],
            isQuestRelated: false,
            associatedLocationId: newLocation.id,
            worldMapCoordinates: newLocation.mapCoordinates,
        }
      });
    }
  }, [gameState.discoveryLog, gameState.gameTime, dispatch]);

  const processAction = useCallback(
    async (action: Action) => {
      const isUiToggle = ['toggle_map', 'toggle_submap_visibility', 'toggle_dev_menu', 'toggle_gemini_log_viewer', 'TOGGLE_DISCOVERY_LOG', 'TOGGLE_GLOSSARY_VISIBILITY', 'HIDE_ENCOUNTER_MODAL', 'SHOW_ENCOUNTER_MODAL', 'toggle_party_editor', 'toggle_party_overlay', 'CLOSE_CHARACTER_SHEET', 'TOGGLE_NPC_TEST_MODAL', 'TOGGLE_LOGBOOK'].includes(action.type);
      if (!isUiToggle) {
        dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: "Processing action..." } });
      }
      
      dispatch({ type: 'SET_ERROR', payload: null });

      if (action.type !== 'talk' && action.type !== 'inspect_submap_tile') {
        if (gameState.lastInteractedNpcId !== null) {
            dispatch({ type: 'RESET_NPC_INTERACTION_CONTEXT' });
        }
      }
      
      const playerCharacter = gameState.party[0];

      const diegeticMessage = getDiegeticPlayerActionMessage(action, NPCS, LOCATIONS, playerCharacter);
      if (diegeticMessage) {
        addMessage(diegeticMessage, 'player');
      }

      let playerContext = 'An adventurer';
      if (playerCharacter) {
        playerContext = `${playerCharacter.name}, a ${playerCharacter.race.name} ${playerCharacter.class.name}`;
      }

      const currentLoc = getCurrentLocation(); 
      const npcsInLocation = getCurrentNPCs(); 
      const itemsInLocationNames = currentLoc.itemIds?.map((id) => ITEMS[id]?.name).filter(Boolean).join(', ') || 'nothing special';

      const submapTileInfo = gameState.subMapCoordinates ? getSubmapTileInfo(gameState.worldSeed, currentLoc.mapCoordinates, currentLoc.biomeId, SUBMAP_DIMENSIONS, gameState.subMapCoordinates) : null;
      
      const subMapCtx = submapTileInfo ? `You are standing on a '${submapTileInfo.effectiveTerrainType}' tile. ` : '';
      const detailedLocationContext = `${subMapCtx}The location is ${currentLoc.name}. Biome: ${BIOMES[currentLoc.biomeId]?.name || 'Unknown'}. Game Time: ${gameState.gameTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
      const generalActionContext = `Player context: ${playerContext}. Location context: ${detailedLocationContext}. NPCs present: ${npcsInLocation.map((n) => n.name).join(', ') || 'no one'}. Visible items: ${itemsInLocationNames}.`;

      try {
        switch (action.type) {
          case 'move':
            if (!playerCharacter) return;
            await handleMovement({ action, gameState, dispatch, addMessage, addGeminiLog, logDiscovery, getTileTooltipText, playerContext, playerCharacter });
            break;
          case 'QUICK_TRAVEL':
            await handleQuickTravel({ action, gameState, dispatch, addMessage });
            break;
          case 'ENTER_TOWN':
            {
              const newMapData = generateTownMap(50, 50, gameState.worldSeed);
              dispatch({ type: 'SET_MAP_DATA', payload: newMapData });
              dispatch({ type: 'SET_GAME_PHASE', payload: GamePhase.VILLAGE_VIEW });
            }
            break;
          case 'ENTER_VILLAGE':
            dispatch({ type: 'SET_GAME_PHASE', payload: GamePhase.VILLAGE_VIEW });
            break;
          case 'look_around':
            await handleLookAround({ gameState, dispatch, addMessage, addGeminiLog, generalActionContext, getTileTooltipText });
            break;
          case 'talk':
            await handleTalk({ action, gameState, dispatch, addMessage, addGeminiLog, playPcmAudio, playerContext, generalActionContext });
            break;
          case 'take_item':
            await handleTakeItem({ action, gameState, dispatch, addMessage });
            break;
          case 'EQUIP_ITEM':
            handleEquipItem(dispatch, action.payload as EquipItemPayload);
            break;
          case 'UNEQUIP_ITEM':
            handleUnequipItem(dispatch, action.payload as UnequipItemPayload);
            break;
          case 'use_item':
            handleUseItem(dispatch, action.payload as UseItemPayload);
            break;
          case 'DROP_ITEM':
            handleDropItem(dispatch, action.payload as DropItemPayload);
            break;
          case 'ask_oracle':
            await handleOracle({ action, gameState, dispatch, addMessage, addGeminiLog, playPcmAudio, generalActionContext });
            break;
          case 'gemini_custom_action':
            await handleGeminiCustom({ action, gameState, dispatch, addMessage, addGeminiLog, generalActionContext, getCurrentLocation, getCurrentNPCs });
            break;
          case 'inspect_submap_tile':
            await handleInspectSubmapTile({ action, gameState, dispatch, addMessage, addGeminiLog });
            break;
          case 'GENERATE_ENCOUNTER':
            await handleGenerateEncounter({ gameState, dispatch });
            break;
          case 'SHOW_ENCOUNTER_MODAL':
            handleShowEncounterModal(dispatch, action.payload?.encounterData as ShowEncounterModalPayload);
            return;
          case 'HIDE_ENCOUNTER_MODAL':
            handleHideEncounterModal(dispatch);
            return;
          case 'START_BATTLE_MAP_ENCOUNTER':
            handleStartBattleMapEncounter(dispatch, action.payload?.startBattleMapEncounterData as StartBattleMapEncounterPayload);
            return;
          case 'END_BATTLE':
            handleEndBattle(dispatch);
            return;
          case 'CAST_SPELL':
            handleCastSpell(dispatch, action.payload as { characterId: string; spellLevel: number });
            break;
          case 'USE_LIMITED_ABILITY':
            handleUseLimitedAbility(dispatch, action.payload as { characterId: string; abilityId: string });
            break;
          case 'TOGGLE_PREPARED_SPELL':
            handleTogglePreparedSpell(dispatch, action.payload as { characterId: string; spellId: string; });
            break;
          case 'LONG_REST':
            await handleLongRest({gameState, dispatch, addMessage, addGeminiLog});
            break;
          case 'SHORT_REST':
            handleShortRest({dispatch, addMessage});
            break;
          case 'save_game':
            await handleSaveGame({ gameState, dispatch, addMessage });
            return;
          case 'go_to_main_menu':
            await handleGoToMainMenu({ gameState, dispatch, addMessage });
            return;
          case 'toggle_map':
            handleToggleMap(dispatch);
            return;
          case 'toggle_submap_visibility':
            handleToggleSubmap(dispatch);
            return;
          case 'TOGGLE_DISCOVERY_LOG':
            handleToggleDiscoveryLog(dispatch);
            return;
          case 'TOGGLE_LOGBOOK':
            handleToggleLogbook(dispatch);
            return;
          case 'TOGGLE_GLOSSARY_VISIBILITY':
             handleToggleGlossary(dispatch, action.payload?.initialTermId);
             return;
          case 'toggle_dev_menu':
            handleToggleDevMenu(dispatch);
            return;
          case 'toggle_party_editor':
            handleTogglePartyEditor(dispatch);
            return;
          case 'toggle_party_overlay':
            handleTogglePartyOverlay(dispatch);
            return;
          case 'TOGGLE_NPC_TEST_MODAL':
            handleToggleNpcTestModal(dispatch);
            return;
          case 'ADD_MET_NPC':
             // This is handled directly by the reducer.
             if (action.payload?.npcId) {
                dispatch({ type: 'ADD_MET_NPC', payload: { npcId: action.payload.npcId } });
             }
             break;
          default:
            addMessage(`Action type ${(action as any).type} not recognized.`, 'system');
            dispatch({ type: 'SET_GEMINI_ACTIONS', payload: null });
            dispatch({ type: 'RESET_NPC_INTERACTION_CONTEXT' });
        }
      } catch (err: any) {
        addMessage(`Error processing action: ${err.message}`, 'system');
        dispatch({ type: 'SET_ERROR', payload: err.message });
        dispatch({ type: 'SET_GEMINI_ACTIONS', payload: null });
        dispatch({ type: 'RESET_NPC_INTERACTION_CONTEXT' });
      } finally {
        if (!isUiToggle && action.type !== 'save_game' && action.type !== 'GENERATE_ENCOUNTER') {
             dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
        }
      }
    },
    [
      gameState, dispatch, addMessage, playPcmAudio, getCurrentLocation, getCurrentNPCs, getTileTooltipText, addGeminiLog, logDiscovery
    ],
  );

  return { processAction };
}
