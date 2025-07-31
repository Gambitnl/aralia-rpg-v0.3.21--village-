/**
 * @file src/hooks/actions/handleMovement.ts
 * Handles 'move' actions for the game.
 */
import { GameState, Action, Location, MapData, PlayerCharacter } from '../../types';
import { AppAction } from '../../state/actionTypes';
import * as GeminiService from '../../services/geminiService';
import { AddMessageFn, AddGeminiLogFn, LogDiscoveryFn, GetTileTooltipTextFn } from './actionHandlerTypes';
import { LOCATIONS, BIOMES, STARTING_LOCATION_ID } from '../../constants';
import { DIRECTION_VECTORS, SUBMAP_DIMENSIONS } from '../../config/mapConfig';
import { determineActiveDynamicNpcsForLocation } from '../../utils/locationUtils';
import { handleGossipEvent } from './handleWorldEvents';
import { getSubmapTileInfo } from '../../utils/submapUtils';

interface HandleMovementProps {
  action: Action;
  gameState: GameState;
  dispatch: React.Dispatch<AppAction>;
  addMessage: AddMessageFn;
  addGeminiLog: AddGeminiLogFn;
  logDiscovery: LogDiscoveryFn;
  getTileTooltipText: GetTileTooltipTextFn;
  playerContext: string;
  playerCharacter: PlayerCharacter;
}

export async function handleMovement({
  action,
  gameState,
  dispatch,
  addMessage,
  addGeminiLog,
  logDiscovery,
  getTileTooltipText,
  playerContext,
  playerCharacter,
}: HandleMovementProps): Promise<void> {
  if (!action.targetId || !gameState.subMapCoordinates || !gameState.mapData) {
    addMessage("Cannot determine movement destination.", "system");
    dispatch({ type: 'SET_GEMINI_ACTIONS', payload: null });
    return;
  }

  const directionKey = action.targetId as keyof typeof DIRECTION_VECTORS;
  
  const currentLocData = LOCATIONS[gameState.currentLocationId];
  const currentLoc = currentLocData || {
      id: gameState.currentLocationId,
      name: 'Wilderness',
      mapCoordinates: {
          x: parseInt(gameState.currentLocationId.split('_')[1], 10),
          y: parseInt(gameState.currentLocationId.split('_')[2], 10),
      },
      biomeId: gameState.mapData.tiles[parseInt(gameState.currentLocationId.split('_')[2], 10)][parseInt(gameState.currentLocationId.split('_')[1], 10)].biomeId,
      exits: {},
  };


  const currentWorldX = currentLoc.mapCoordinates.x;
  const currentWorldY = currentLoc.mapCoordinates.y;

  let newLocationId = gameState.currentLocationId;
  let newSubMapCoordinates = { ...gameState.subMapCoordinates };
  let newMapDataForDispatch: MapData | undefined = gameState.mapData ? { ...gameState.mapData, tiles: gameState.mapData.tiles.map(row => row.map(tile => ({...tile}))) } : undefined;
  let activeDynamicNpcIdsForNewLocation: string[] | null = null;
  let timeToAdvanceSeconds = 0;
  let movedToNewNamedLocation: Location | null = null;
  
  let descriptionGenerationFn: (() => Promise<GeminiService.GenerateTextResult>) | null = null;
  let geminiFunctionName = '';
  let baseDescriptionForFallback = "You arrive at the new location.";

  if (!DIRECTION_VECTORS[directionKey]) { // Moving to a named exit (or teleporting)
    const targetLocation = LOCATIONS[action.targetId];
    if (targetLocation) {
      newLocationId = action.targetId;
      newSubMapCoordinates = { x: Math.floor(SUBMAP_DIMENSIONS.cols / 2), y: Math.floor(SUBMAP_DIMENSIONS.rows / 2) };
      activeDynamicNpcIdsForNewLocation = determineActiveDynamicNpcsForLocation(newLocationId, LOCATIONS);
      timeToAdvanceSeconds = action.label.toLowerCase().includes('teleport') ? 0 : 3600;
      movedToNewNamedLocation = targetLocation;
      baseDescriptionForFallback = targetLocation.baseDescription;

      if (newMapDataForDispatch) {
        const newTiles = newMapDataForDispatch.tiles.map(row => row.map(t => ({ ...t, isPlayerCurrent: false })));
        if (newTiles[targetLocation.mapCoordinates.y]?.[targetLocation.mapCoordinates.x]) {
          newTiles[targetLocation.mapCoordinates.y][targetLocation.mapCoordinates.x].isPlayerCurrent = true;
          newTiles[targetLocation.mapCoordinates.y][targetLocation.mapCoordinates.x].discovered = true;
          for (let y_offset = -1; y_offset <= 1; y_offset++) {
            for (let x_offset = -1; x_offset <= 1; x_offset++) {
              const adjY = targetLocation.mapCoordinates.y + y_offset;
              const adjX = targetLocation.mapCoordinates.x + x_offset;
              if (adjY >= 0 && adjY < newMapDataForDispatch.gridSize.rows && adjX >= 0 && adjX < newMapDataForDispatch.gridSize.cols) {
                newTiles[adjY][adjX].discovered = true;
              }
            }
          }
        }
        newMapDataForDispatch.tiles = newTiles;
      }
      geminiFunctionName = 'generateLocationDescription';
      descriptionGenerationFn = () => GeminiService.generateLocationDescription(targetLocation.name, `Player (${playerContext}) enters ${targetLocation.name}.`);
    } else {
      addMessage(`Cannot move to ${action.targetId}. Location does not exist.`, 'system');
      dispatch({ type: 'SET_GEMINI_ACTIONS', payload: null });
      return;
    }
  } else { // Moving via compass direction
    const { dx, dy } = DIRECTION_VECTORS[directionKey];
    let nextSubMapX = gameState.subMapCoordinates.x + dx;
    let nextSubMapY = gameState.subMapCoordinates.y + dy;
    newSubMapCoordinates = { x: nextSubMapX, y: nextSubMapY };

    if (nextSubMapX >= 0 && nextSubMapX < SUBMAP_DIMENSIONS.cols && nextSubMapY >= 0 && nextSubMapY < SUBMAP_DIMENSIONS.rows) { // Moving within current submap
      newLocationId = gameState.currentLocationId;
      activeDynamicNpcIdsForNewLocation = gameState.currentLocationActiveDynamicNpcIds;
      
      const { effectiveTerrainType } = getSubmapTileInfo(
          gameState.worldSeed,
          currentLoc.mapCoordinates,
          currentLoc.biomeId,
          SUBMAP_DIMENSIONS,
          { x: nextSubMapX, y: nextSubMapY }
      );

      if (playerCharacter.transportMode === 'foot') {
          timeToAdvanceSeconds = effectiveTerrainType === 'path' ? 15 * 60 : 30 * 60;
      }
      
      const biome = BIOMES[currentLoc.biomeId];
      const currentWorldTile = gameState.mapData?.tiles[currentWorldY]?.[currentWorldX];
      const tooltip = currentWorldTile ? getTileTooltipText(currentWorldTile) : null;
      geminiFunctionName = 'generateWildernessLocationDescription';
      descriptionGenerationFn = () => GeminiService.generateWildernessLocationDescription(biome?.name || 'Unknown Biome', {x: currentWorldX, y: currentWorldY}, newSubMapCoordinates, playerContext, tooltip);
    } else { // Moving to a new world map tile
      const targetWorldMapX = currentWorldX + dx;
      const targetWorldMapY = currentWorldY + dy;

      if (!newMapDataForDispatch || targetWorldMapY < 0 || targetWorldMapY >= newMapDataForDispatch.gridSize.rows ||
          targetWorldMapX < 0 || targetWorldMapX >= newMapDataForDispatch.gridSize.cols) {
        addMessage("You can't go that way; it's the edge of the known world.", "system");
        dispatch({ type: 'SET_GEMINI_ACTIONS', payload: null });
        return;
      }

      const targetWorldTile = newMapDataForDispatch.tiles[targetWorldMapY][targetWorldMapX];
      const targetBiome = BIOMES[targetWorldTile.biomeId];

      if (!targetBiome?.passable) {
        addMessage(targetBiome.impassableReason || `You cannot enter the ${targetBiome.name}.`, "system");
        dispatch({ type: 'SET_GEMINI_ACTIONS', payload: null });
        return;
      }
      
      addMessage("As you travel, you get the sense that tales of your deeds precede you...", "system");
      await handleGossipEvent(gameState, addGeminiLog, dispatch);

      newLocationId = targetWorldTile.locationId || `coord_${targetWorldMapX}_${targetWorldMapY}`;
      activeDynamicNpcIdsForNewLocation = determineActiveDynamicNpcsForLocation(newLocationId, LOCATIONS);
      
      if (nextSubMapX < 0) newSubMapCoordinates.x = SUBMAP_DIMENSIONS.cols - 1;
      else if (nextSubMapX >= SUBMAP_DIMENSIONS.cols) newSubMapCoordinates.x = 0;
      
      if (nextSubMapY < 0) newSubMapCoordinates.y = SUBMAP_DIMENSIONS.rows - 1;
      else if (nextSubMapY >= SUBMAP_DIMENSIONS.rows) newSubMapCoordinates.y = 0;

      // When moving to a new world tile that has a predefined location, determine travel time based on the entry tile's terrain.
      const entryTileInfo = getSubmapTileInfo(
        gameState.worldSeed,
        { x: targetWorldMapX, y: targetWorldMapY },
        targetBiome.id,
        SUBMAP_DIMENSIONS,
        newSubMapCoordinates
      );

      if (playerCharacter.transportMode === 'foot') {
        timeToAdvanceSeconds = entryTileInfo.effectiveTerrainType === 'path' ? 15 * 60 : 30 * 60;
      } else {
        timeToAdvanceSeconds = 3600; // Fallback for other transport modes or wilderness-wilderness travel
      }
      
      const newTiles = newMapDataForDispatch.tiles.map(row => row.map(tile => ({ ...tile, isPlayerCurrent: false })));
      if (newTiles[targetWorldMapY]?.[targetWorldMapX]) {
        newTiles[targetWorldMapY][targetWorldMapX].isPlayerCurrent = true;
        newTiles[targetWorldMapY][targetWorldMapX].discovered = true;
        for (let y_offset = -1; y_offset <= 1; y_offset++) {
            for (let x_offset = -1; x_offset <= 1; x_offset++) {
                const adjY = targetWorldMapY + y_offset;
                const adjX = targetWorldMapX + x_offset;
                if (adjY >= 0 && adjY < newMapDataForDispatch.gridSize.rows && adjX >= 0 && adjX < newMapDataForDispatch.gridSize.cols) {
                    newTiles[adjY][adjX].discovered = true;
                }
            }
        }
      }
      newMapDataForDispatch.tiles = newTiles;

      if (LOCATIONS[newLocationId]) {
        const targetDefLocation = LOCATIONS[newLocationId];
        geminiFunctionName = 'generateLocationDescription (world move)';
        descriptionGenerationFn = () => GeminiService.generateLocationDescription(targetDefLocation.name, `Player (${playerContext}) enters ${targetDefLocation.name}.`);
        movedToNewNamedLocation = targetDefLocation;
        baseDescriptionForFallback = targetDefLocation.baseDescription;
      } else {
        geminiFunctionName = 'generateWildernessLocationDescription (world move)';
        descriptionGenerationFn = () => GeminiService.generateWildernessLocationDescription(targetBiome?.name || 'Unknown Biome', {x: targetWorldMapX, y: targetWorldMapY}, newSubMapCoordinates, playerContext, getTileTooltipText(targetWorldTile));
      }
    }
  }

  let newDescription = baseDescriptionForFallback;

  if (descriptionGenerationFn) {
    const newDescriptionResult = await descriptionGenerationFn();
    addGeminiLog(geminiFunctionName, newDescriptionResult.promptSent, newDescriptionResult.rawResponse);
    if (newDescriptionResult.rateLimitHit) {
      dispatch({ type: 'SET_RATE_LIMIT_ERROR_FLAG' });
    }

    if (newDescriptionResult.text && !newDescriptionResult.text.startsWith("Error in")) {
      newDescription = newDescriptionResult.text;
    } else if (newDescriptionResult.text.startsWith("Error in")) {
      addMessage("There was an issue describing your new surroundings.", 'system');
      console.error("Gemini Error during movement description:", newDescriptionResult.text);
    }
  }
  
  if (timeToAdvanceSeconds > 0) {
    dispatch({ type: 'ADVANCE_TIME', payload: { seconds: timeToAdvanceSeconds } });
  }

  dispatch({ type: 'MOVE_PLAYER', payload: { newLocationId, newSubMapCoordinates, mapData: newMapDataForDispatch, activeDynamicNpcIds: activeDynamicNpcIdsForNewLocation } });
  
  if (movedToNewNamedLocation) {
    logDiscovery(movedToNewNamedLocation);
  }
  
  dispatch({ type: 'SET_GEMINI_ACTIONS', payload: null });
  
  addMessage(newDescription, 'system');
}

interface HandleQuickTravelProps {
  action: Action;
  gameState: GameState;
  dispatch: React.Dispatch<AppAction>;
  addMessage: AddMessageFn;
}

export async function handleQuickTravel({
  action,
  gameState,
  dispatch,
  addMessage,
}: HandleQuickTravelProps): Promise<void> {
    if (!action.payload?.quickTravel) {
        addMessage("Invalid quick travel action.", "system");
        return;
    }
    const { destination, durationSeconds } = action.payload.quickTravel;

    dispatch({
        type: 'MOVE_PLAYER',
        payload: {
            newLocationId: gameState.currentLocationId,
            newSubMapCoordinates: destination,
            activeDynamicNpcIds: gameState.currentLocationActiveDynamicNpcIds,
        }
    });

    dispatch({ type: 'ADVANCE_TIME', payload: { seconds: durationSeconds } });
    
    const durationMinutes = Math.round(durationSeconds / 60);
    addMessage(`You travel to the new position. The journey takes about ${durationMinutes} minutes.`, 'system');

    dispatch({ type: 'SET_GEMINI_ACTIONS', payload: null });
    dispatch({ type: 'RESET_NPC_INTERACTION_CONTEXT' });
}