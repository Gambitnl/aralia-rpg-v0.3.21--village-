/**
 * @file src/state/appState.ts
 * Defines the state structure, initial state, actions, and the root reducer for the application.
 * The root reducer orchestrates calls to smaller "slice" reducers for better modularity.
 */
import { GameState, GamePhase, PlayerCharacter, Item, MapData, TempPartyMember, StartGameSuccessPayload, SuspicionLevel, KnownFact } from '../types';
import { AppAction } from './actionTypes';
import { STARTING_LOCATION_ID, DUMMY_PARTY_FOR_DEV, USE_DUMMY_CHARACTER_FOR_DEV, LOCATIONS, ITEMS, initialInventoryForDummyCharacter, CLASSES_DATA, NPCS } from '../constants';
import { SUBMAP_DIMENSIONS } from '../config/mapConfig';
import * as SaveLoadService from '../services/saveLoadService';
import { determineActiveDynamicNpcsForLocation } from '../utils/locationUtils';
import { createPlayerCharacterFromTemp } from '../utils/characterUtils';
import { createEnemyFromMonster } from '../utils/combatUtils';

// Import slice reducers
import { uiReducer } from './reducers/uiReducer';
import { characterReducer } from './reducers/characterReducer';
import { worldReducer } from './reducers/worldReducer';
import { logReducer } from './reducers/logReducer';
import { encounterReducer } from './reducers/encounterReducer';
import { npcReducer } from './reducers/npcReducer';


// Helper function to create a date at 07:00 AM on an arbitrary fixed date
const createInitialGameTime = (): Date => {
  const initialTime = new Date(351, 0, 1, 7, 0, 0, 0); 
  return initialTime;
};


export const initialGameState: GameState = {
  phase: USE_DUMMY_CHARACTER_FOR_DEV && DUMMY_PARTY_FOR_DEV && DUMMY_PARTY_FOR_DEV.length > 0 && !SaveLoadService.hasSaveGame() ? GamePhase.PLAYING : GamePhase.MAIN_MENU,
  party: USE_DUMMY_CHARACTER_FOR_DEV && !SaveLoadService.hasSaveGame() ? DUMMY_PARTY_FOR_DEV : [],
  tempParty: USE_DUMMY_CHARACTER_FOR_DEV && !SaveLoadService.hasSaveGame() ? DUMMY_PARTY_FOR_DEV.map(p => ({ id: p.id || crypto.randomUUID(), level: p.level || 1, classId: p.class.id })) : null,
  inventory: USE_DUMMY_CHARACTER_FOR_DEV && !SaveLoadService.hasSaveGame() ? [...initialInventoryForDummyCharacter] : [],
  currentLocationId: STARTING_LOCATION_ID,
  subMapCoordinates: USE_DUMMY_CHARACTER_FOR_DEV && !SaveLoadService.hasSaveGame() ? { x: Math.floor(SUBMAP_DIMENSIONS.cols / 2) , y: Math.floor(SUBMAP_DIMENSIONS.rows / 2) } : null,
  messages: [],
  isLoading: USE_DUMMY_CHARACTER_FOR_DEV && !!DUMMY_PARTY_FOR_DEV && DUMMY_PARTY_FOR_DEV.length > 0 && !SaveLoadService.hasSaveGame(),
  loadingMessage: USE_DUMMY_CHARACTER_FOR_DEV && !!DUMMY_PARTY_FOR_DEV && DUMMY_PARTY_FOR_DEV.length > 0 && !SaveLoadService.hasSaveGame() ? "Aralia is weaving fate..." : null,
  isImageLoading: false, 
  error: null,
  worldSeed: Date.now(), // Default seed, will be overwritten on new game
  mapData: null,
  isMapVisible: false,
  isSubmapVisible: false,
  isPartyOverlayVisible: false,
  isNpcTestModalVisible: false,
  isLogbookVisible: false,
  dynamicLocationItemIds: {},
  currentLocationActiveDynamicNpcIds: null,
  geminiGeneratedActions: null,
  characterSheetModal: { 
    isOpen: false,
    character: null,
  },
  gameTime: createInitialGameTime(),
  
  // Dev Mode specific state
  isDevMenuVisible: false,
  isPartyEditorVisible: false,
  isGeminiLogViewerVisible: false,
  geminiInteractionLog: [],
  hasNewRateLimitError: false,
  devModelOverride: null,

  // Encounter Modal State
  isEncounterModalVisible: false,
  generatedEncounter: null,
  encounterSources: null,
  encounterError: null,
  
  // Battle Map State
  currentEnemies: null,

  // Fields for save/load
  saveVersion: undefined,
  saveTimestamp: undefined,

  // NPC interaction context
  lastInteractedNpcId: null,
  lastNpcResponse: null,

  inspectedTileDescriptions: {}, 

  // Discovery Journal State
  discoveryLog: [],
  unreadDiscoveryCount: 0,
  isDiscoveryLogVisible: false,
  isGlossaryVisible: false, 
  selectedGlossaryTermForModal: undefined, 

  // NPC Memory
  // This initializes the memory for all NPCs defined in the static data.
  // It now includes logic to copy over any predefined goals from the NPC's static data,
  // ensuring they are part of the dynamic game state from the start.
  npcMemory: Object.keys(NPCS).reduce((acc, npcId) => {
    const npcData = NPCS[npcId];
    acc[npcId] = { 
        disposition: 0, 
        knownFacts: [], 
        suspicion: SuspicionLevel.Unaware,
        // If the static NPC data has goals, they are copied into the initial memory state.
        goals: npcData?.goals ? [...npcData.goals] : [], 
    };
    return acc;
  }, {} as GameState['npcMemory']),
  
  // World State
  locationResidues: {},
  
  // Character Logbook
  metNpcIds: [],
};


export function appReducer(state: GameState, action: AppAction): GameState {
    // 1. Handle actions with cross-cutting concerns first
    switch (action.type) {
        case 'SET_GAME_PHASE':
            let additionalUpdates: Partial<GameState> = { loadingMessage: null }; 
            if (action.payload === GamePhase.MAIN_MENU || action.payload === GamePhase.CHARACTER_CREATION) {
                // Reset a wide range of UI and game context state when returning to menu or starting creation
                additionalUpdates = {
                    ...additionalUpdates,
                    geminiGeneratedActions: null,
                    isMapVisible: false,
                    isSubmapVisible: false,
                    error: null,
                    characterSheetModal: { isOpen: false, character: null }, 
                    lastInteractedNpcId: null,
                    lastNpcResponse: null,
                    currentLocationActiveDynamicNpcIds: null,
                    isDevMenuVisible: false, 
                    isGeminiLogViewerVisible: false,
                    isDiscoveryLogVisible: false, 
                    isGlossaryVisible: false, 
                    selectedGlossaryTermForModal: undefined,
                    isPartyOverlayVisible: false,
                    isNpcTestModalVisible: false,
                    isLogbookVisible: false,
                };
                if (action.payload === GamePhase.CHARACTER_CREATION) {
                    // Full reset for a new game
                     additionalUpdates = {
                        ...additionalUpdates,
                        gameTime: createInitialGameTime(), 
                        discoveryLog: [], 
                        unreadDiscoveryCount: 0,
                        inventory: [], 
                        tempParty: null,
                        metNpcIds: [],
                     }
                }
            }
            return { ...state, phase: action.payload, ...additionalUpdates };

        case 'START_NEW_GAME_SETUP':
            return {
                ...initialGameState, 
                phase: GamePhase.CHARACTER_CREATION,
                worldSeed: action.payload.worldSeed,
                mapData: action.payload.mapData,
                dynamicLocationItemIds: action.payload.dynamicLocationItemIds,
                inventory: [], 
                currentLocationActiveDynamicNpcIds: determineActiveDynamicNpcsForLocation(STARTING_LOCATION_ID, LOCATIONS),
                gameTime: createInitialGameTime(),
                isLoading: false, 
                loadingMessage: null,
            };

        case 'START_GAME_FOR_DUMMY': {
            const { mapData, dynamicLocationItemIds, generatedParty, worldSeed } = action.payload;
            if (!generatedParty || generatedParty.length === 0) return { ...state, error: "Dummy character data not available.", phase: GamePhase.MAIN_MENU, isLoading: false, loadingMessage: null };
            const initialDummyLocation = LOCATIONS[STARTING_LOCATION_ID];
            return {
                ...initialGameState, 
                phase: GamePhase.PLAYING,
                worldSeed: worldSeed,
                party: generatedParty,
                tempParty: generatedParty.map(p => ({ id: p.id || crypto.randomUUID(), level: p.level || 1, classId: p.class.id })),
                inventory: [...initialInventoryForDummyCharacter], 
                currentLocationId: STARTING_LOCATION_ID,
                subMapCoordinates: { x: Math.floor(SUBMAP_DIMENSIONS.cols / 2), y: Math.floor(SUBMAP_DIMENSIONS.rows / 2) },
                messages: [
                    { id: Date.now(), text: `Welcome, ${generatedParty[0].name} and party! Your adventure begins (Dev Mode).`, sender: 'system', timestamp: new Date() },
                    { id: Date.now() + 1, text: initialDummyLocation.baseDescription, sender: 'system', timestamp: new Date() }
                ],
                mapData: mapData,
                dynamicLocationItemIds: dynamicLocationItemIds,
                currentLocationActiveDynamicNpcIds: determineActiveDynamicNpcsForLocation(STARTING_LOCATION_ID, LOCATIONS),
                isLoading: false, 
                loadingMessage: null,
            };
        }

        case 'START_GAME_SUCCESS': {
            const { startingInventory, ...restOfPayload } = action.payload;
            return {
                ...initialGameState,
                phase: GamePhase.PLAYING,
                worldSeed: state.worldSeed, // Carry over the seed from the new game setup
                party: [{ ...restOfPayload.character, equippedItems: restOfPayload.character.equippedItems || {} }],
                inventory: startingInventory,
                messages: [
                    { id: Date.now() + Math.random(), text: `Welcome, ${restOfPayload.character.name} the ${restOfPayload.character.race.name} ${restOfPayload.character.class.name}! Your adventure begins.`, sender: 'system', timestamp: new Date() },
                    { id: Date.now() + Math.random() + 1, text: restOfPayload.initialLocationDescription, sender: 'system', timestamp: new Date() }
                ],
                currentLocationId: STARTING_LOCATION_ID,
                subMapCoordinates: restOfPayload.initialSubMapCoordinates,
                mapData: restOfPayload.mapData,
                dynamicLocationItemIds: restOfPayload.dynamicLocationItemIds,
                currentLocationActiveDynamicNpcIds: restOfPayload.initialActiveDynamicNpcIds,
                isLoading: false, 
                loadingMessage: null,
            };
        }

        case 'LOAD_GAME_SUCCESS': {
            const loadedState = action.payload;
            const gameTimeFromLoad = typeof loadedState.gameTime === 'string' ? new Date(loadedState.gameTime) : loadedState.gameTime;
            const partyFromLoad = (loadedState.party && loadedState.party.length > 0) ? loadedState.party : (((loadedState as any).playerCharacter) ? [(loadedState as any).playerCharacter] : []);
            
            // This is the data migration logic for the new KnownFact structure.
            // It checks if `knownFacts` is still an array of strings (from an old save)
            // and seamlessly upgrades it to the new `KnownFact[]` object structure.
            for (const npcId in loadedState.npcMemory) {
                const memory = loadedState.npcMemory[npcId];
                if (memory.knownFacts.length > 0 && typeof memory.knownFacts[0] === 'string') {
                    console.log(`Migrating knownFacts for NPC: ${npcId}`);
                    const oldStringFacts = memory.knownFacts as unknown as string[];
                    memory.knownFacts = oldStringFacts.map((factText): KnownFact => ({
                        id: crypto.randomUUID(),
                        text: factText,
                        source: 'direct', // Assume old facts were directly witnessed
                        isPublic: true,    // Assume old facts were public knowledge
                        timestamp: gameTimeFromLoad.getTime(), // Assign a reasonable timestamp
                        strength: 5,       // Assign a default medium strength
                        lifespan: 999,     // Make old facts effectively permanent
                    }));
                }
            }


            return {
                ...loadedState, 
                phase: GamePhase.PLAYING, 
                isLoading: false, loadingMessage: null, isImageLoading: false, error: null,
                isMapVisible: false, isSubmapVisible: false, isDevMenuVisible: false, isPartyEditorVisible: false,
                isPartyOverlayVisible: false, isGeminiLogViewerVisible: false, isDiscoveryLogVisible: false, 
                isGlossaryVisible: false, selectedGlossaryTermForModal: undefined, isLogbookVisible: false,
                geminiGeneratedActions: null,
                party: partyFromLoad.map(p => ({ ...(p as PlayerCharacter), equippedItems: (p as PlayerCharacter).equippedItems || {} })),
                inventory: loadedState.inventory || [], 
                currentLocationActiveDynamicNpcIds: determineActiveDynamicNpcsForLocation(loadedState.currentLocationId, LOCATIONS),
                characterSheetModal: loadedState.characterSheetModal || { isOpen: false, character: null },
                gameTime: gameTimeFromLoad,
                geminiInteractionLog: loadedState.geminiInteractionLog || [], 
                inspectedTileDescriptions: loadedState.inspectedTileDescriptions || {},
                discoveryLog: loadedState.discoveryLog || [], 
                unreadDiscoveryCount: loadedState.unreadDiscoveryCount || 0, 
                metNpcIds: loadedState.metNpcIds || [],
                locationResidues: loadedState.locationResidues || {},
            };
        }

        case 'MOVE_PLAYER': {
            return {
                ...state,
                currentLocationId: action.payload.newLocationId,
                subMapCoordinates: action.payload.newSubMapCoordinates,
                mapData: action.payload.mapData || state.mapData,
                currentLocationActiveDynamicNpcIds: action.payload.activeDynamicNpcIds,
                geminiGeneratedActions: null,
                lastInteractedNpcId: null, 
                lastNpcResponse: null,
            };
        }
        
         case 'INITIALIZE_DUMMY_PLAYER_STATE':
            return {
                ...state,
                messages: [
                    { id: Date.now() + Math.random(), text: `Welcome, ${state.party[0]!.name} and party! Your adventure begins (Dev Mode - Auto Start).`, sender: 'system', timestamp: new Date() },
                    { id: Date.now() + Math.random() + 1, text: action.payload.initialLocationDescription, sender: 'system', timestamp: new Date() }
                ],
                subMapCoordinates: action.payload.initialSubMapCoordinates,
                isLoading: false, loadingMessage: null, isImageLoading: false,
                mapData: action.payload.mapData,
                isSubmapVisible: false,
                dynamicLocationItemIds: action.payload.dynamicLocationItemIds,
                inventory: [...initialInventoryForDummyCharacter], 
                currentLocationActiveDynamicNpcIds: action.payload.initialActiveDynamicNpcIds,
                gameTime: createInitialGameTime(),
            };

        case 'TAKE_ITEM': {
            const { item: itemToAdd, locationId } = action.payload;
            const newLogEntry: any = {
                gameTime: state.gameTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                type: 'Item Acquired',
                title: `Item Acquired: ${itemToAdd.name}`,
                content: `You found and picked up ${itemToAdd.name}. ${itemToAdd.description}`,
                source: { type: 'LOCATION', id: locationId, name: LOCATIONS[locationId]?.name },
                flags: [{key: 'itemId', value: itemToAdd.id, label: itemToAdd.name}],
            };

            const stateAfterTaking = {
                ...state,
                inventory: [...state.inventory, itemToAdd],
                dynamicLocationItemIds: {
                    ...state.dynamicLocationItemIds,
                    [locationId]: state.dynamicLocationItemIds[locationId]?.filter(id => id !== itemToAdd.id) || [],
                },
                geminiGeneratedActions: null,
                lastInteractedNpcId: null,
                lastNpcResponse: null,
            };
            // Now apply the logging reducer logic and merge the changes
            const loggingChanges = logReducer(stateAfterTaking, {type: 'ADD_DISCOVERY_ENTRY', payload: newLogEntry });
            return { ...stateAfterTaking, ...loggingChanges };
        }
        
        case 'SETUP_BATTLE_MAP_DEMO': {
            const playerParty = state.party;
            if (!playerParty || playerParty.length === 0) {
                return { ...state, error: "Cannot start battle demo without a party. Please start or load a game first." };
            }
            // Logic for creating combatants will be in combatUtils, called by the action handler.
            // This case just sets the phase and resets UI.
            return {
                ...state,
                phase: GamePhase.BATTLE_MAP_DEMO,
                isMapVisible: false, isSubmapVisible: false, isDiscoveryLogVisible: false, isGlossaryVisible: false,
            };
        }
        
        case 'START_BATTLE_MAP_ENCOUNTER': {
             const combatants = action.payload.monsters.flatMap((monster, monsterIndex) => 
                Array.from({ length: monster.quantity }, (_, i) => createEnemyFromMonster(monster, i))
             );
             return {
                ...state,
                phase: GamePhase.BATTLE_MAP_DEMO,
                currentEnemies: combatants,
                isEncounterModalVisible: false,
                isMapVisible: false, isSubmapVisible: false, isDiscoveryLogVisible: false, isGlossaryVisible: false,
            };
        }

        // 2. Delegate to slice reducers for single-domain actions
        default: {
            // Combine all partial state changes from slice reducers.
            const changes = {
                ...uiReducer(state, action),
                ...characterReducer(state, action),
                ...worldReducer(state, action),
                ...logReducer(state, action),
                ...encounterReducer(state, action),
                ...npcReducer(state, action),
            };

            // If no slice reducer handled the action, return the original state.
            if (Object.keys(changes).length === 0) {
                return state;
            }

            // Apply the combined changes to the current state.
            return {
                ...state,
                ...changes,
            };
        }
    }
}
