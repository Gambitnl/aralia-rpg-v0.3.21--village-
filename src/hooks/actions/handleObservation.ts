/**
 * @file src/hooks/actions/handleObservation.ts
 * Handles observation actions like 'look_around' and 'inspect_submap_tile'.
 */
import { GameState, Action, InspectSubmapTilePayload, UpdateInspectedTileDescriptionPayload } from '../../types';
import { AppAction } from '../../state/actionTypes';
import * as GeminiService from '../../services/geminiService';
import { AddMessageFn, AddGeminiLogFn, GetTileTooltipTextFn } from './actionHandlerTypes';
import { DIRECTION_VECTORS } from '../../config/mapConfig';

interface HandleLookAroundProps {
  gameState: GameState;
  dispatch: React.Dispatch<AppAction>;
  addMessage: AddMessageFn;
  addGeminiLog: AddGeminiLogFn;
  generalActionContext: string;
  getTileTooltipText: GetTileTooltipTextFn;
}

export async function handleLookAround({
  gameState,
  dispatch,
  addMessage,
  addGeminiLog,
  generalActionContext,
  getTileTooltipText,
}: HandleLookAroundProps): Promise<void> {
  let worldMapTileTooltipForGemini: string | null = null;
  if (gameState.mapData && gameState.currentLocationId.startsWith('coord_')) {
    const parts = gameState.currentLocationId.split('_');
    const worldX = parseInt(parts[1]);
    const worldY = parseInt(parts[2]);
    const tile = gameState.mapData.tiles[worldY]?.[worldX];
    if (tile) {
      worldMapTileTooltipForGemini = getTileTooltipText(tile);
    }
  }

  const lookDescResult = await GeminiService.generateActionOutcome('Player looks around the area.', generalActionContext, false, worldMapTileTooltipForGemini);
  addGeminiLog('generateActionOutcome (look_around)', lookDescResult.promptSent, lookDescResult.rawResponse);
  if (lookDescResult.rateLimitHit) {
    dispatch({ type: 'SET_RATE_LIMIT_ERROR_FLAG' });
  }

  if (lookDescResult.text && !lookDescResult.text.startsWith("Error in")) {
    addMessage(lookDescResult.text, 'system');
    const customActionsResult = await GeminiService.generateCustomActions(lookDescResult.text, generalActionContext);
    addGeminiLog('generateCustomActions', customActionsResult.promptSent, customActionsResult.rawResponse);
    if (customActionsResult.rateLimitHit) {
      dispatch({ type: 'SET_RATE_LIMIT_ERROR_FLAG' });
    }
    
    const existingCompassDirections = Object.keys(DIRECTION_VECTORS);
    const filteredActions = customActionsResult.actions.filter(action => {
        const labelLower = action.label.toLowerCase();
        const promptLower = action.payload?.geminiPrompt?.toLowerCase() || "";
        return !existingCompassDirections.some(dir =>
            labelLower.includes(dir.toLowerCase()) || promptLower.includes(dir.toLowerCase())
        );
    });
    dispatch({ type: 'SET_GEMINI_ACTIONS', payload: filteredActions.length > 0 ? filteredActions : null });

  } else {
    addMessage("You look around, but nothing new catches your eye.", "system");
    dispatch({ type: 'SET_GEMINI_ACTIONS', payload: null });
  }
  dispatch({ type: 'RESET_NPC_INTERACTION_CONTEXT' });
}

interface HandleInspectSubmapTileProps {
  action: Action;
  gameState: GameState;
  dispatch: React.Dispatch<AppAction>;
  addMessage: AddMessageFn;
  addGeminiLog: AddGeminiLogFn;
}

export async function handleInspectSubmapTile({
  action,
  gameState,
  dispatch,
  addMessage,
  addGeminiLog,
}: HandleInspectSubmapTileProps): Promise<void> {
  if (!action.payload?.inspectTileDetails || !gameState.party[0]) {
    addMessage("Cannot inspect tile: missing details or character information.", "system");
    return;
  }
  const { inspectTileDetails } = action.payload;
  const playerChar = gameState.party[0];
  const gameTimeStr = gameState.gameTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const inspectionResult = await GeminiService.generateTileInspectionDetails(
    inspectTileDetails as InspectSubmapTilePayload, // Cast as it's validated above
    playerChar,
    gameTimeStr,
  );
  addGeminiLog('generateTileInspectionDetails', inspectionResult.promptSent, inspectionResult.rawResponse);
  if (inspectionResult.rateLimitHit) {
    dispatch({ type: 'SET_RATE_LIMIT_ERROR_FLAG' });
  }

  if (inspectionResult.text && !inspectionResult.text.startsWith("Error in")) {
    addMessage(inspectionResult.text, "system");
    const tileKey = `${inspectTileDetails.parentWorldMapCoords.x}_${inspectTileDetails.parentWorldMapCoords.y}_${inspectTileDetails.tileX}_${inspectTileDetails.tileY}`;
    const updatePayload: UpdateInspectedTileDescriptionPayload = {
      tileKey,
      description: inspectionResult.text,
    };
    dispatch({ type: 'UPDATE_INSPECTED_TILE_DESCRIPTION', payload: updatePayload });
  } else {
    addMessage("Your inspection reveals nothing new or an error occurred.", "system");
  }

  dispatch({ type: 'ADVANCE_TIME', payload: { seconds: 300 } });
  dispatch({ type: 'SET_GEMINI_ACTIONS', payload: null });
  dispatch({ type: 'RESET_NPC_INTERACTION_CONTEXT' });
}