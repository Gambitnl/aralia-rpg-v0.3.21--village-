/**
 * @file src/hooks/actions/handleOracle.ts
 * Handles 'ask_oracle' actions.
 */
import { GameState, Action, GoalStatus, KnownFact } from '../../types';
import { AppAction } from '../../state/actionTypes';
import * as GeminiService from '../../services/geminiService';
import { synthesizeSpeech } from '../../services/ttsService';
import { AddMessageFn, AddGeminiLogFn, PlayPcmAudioFn } from './actionHandlerTypes';

interface HandleOracleProps {
  action: Action;
  gameState: GameState;
  dispatch: React.Dispatch<AppAction>;
  addMessage: AddMessageFn;
  addGeminiLog: AddGeminiLogFn;
  playPcmAudio: PlayPcmAudioFn;
  generalActionContext: string;
}

export async function handleOracle({
  action,
  gameState,
  dispatch,
  addMessage,
  addGeminiLog,
  playPcmAudio,
  generalActionContext,
}: HandleOracleProps): Promise<void> {
  if (action.payload?.query) {
    const playerQuery = action.payload.query as string;
    addMessage(`You approach the Oracle and ask: "${playerQuery}"`, 'player');
    dispatch({ type: 'ADVANCE_TIME', payload: { seconds: 3600 } });

    // The Oracle's response can now also trigger goal updates if the information
    // it provides is directly relevant to an NPC's objective.
    const oracleResponseResult = await GeminiService.generateSocialCheckOutcome(
        'divination', // Using a generic skill type for the Oracle interaction
        'The Oracle',
        true, // Assume the Oracle always provides a "successful" (i.e., useful) response
        generalActionContext, // This context includes NPC goals
    );

    addGeminiLog('generateSocialCheckOutcome (oracle)', oracleResponseResult.promptSent, oracleResponseResult.rawResponse);
    if (oracleResponseResult.rateLimitHit) {
      dispatch({ type: 'SET_RATE_LIMIT_ERROR_FLAG' });
    }
    
    if (oracleResponseResult.text && !oracleResponseResult.text.startsWith("Error in")) {
      addMessage(`Oracle: "${oracleResponseResult.text}"`, 'system');
      
      // NEW: Handle potential goal updates from the Oracle's wisdom.
      // This allows discovering lore to directly impact NPC relationships.
      if (oracleResponseResult.goalUpdate) {
        const { npcId, goalId, newStatus } = oracleResponseResult.goalUpdate;
        dispatch({ type: 'UPDATE_NPC_GOAL_STATUS', payload: { npcId, goalId, newStatus }});
        
        // Create a structured KnownFact for this significant event.
        const goalFact: KnownFact = {
            id: crypto.randomUUID(),
            text: oracleResponseResult.memoryFactText, // Use the fact from the main response
            source: 'direct', // The player learned it directly, even if the NPC didn't see it.
            isPublic: true,    // Discovering prophecy is a significant, potentially public event.
            timestamp: gameState.gameTime.getTime(),
            strength: 10,      // Completing a goal is highly significant.
            lifespan: 9999,
        };
        dispatch({ type: 'ADD_NPC_KNOWN_FACT', payload: { npcId, fact: goalFact } });

        // A significant event like completing a goal should have a major impact on disposition.
        const dispositionBoost = newStatus === GoalStatus.Completed ? 50 : -50;
        dispatch({ type: 'UPDATE_NPC_DISPOSITION', payload: { npcId, amount: dispositionBoost }});
        addMessage(`This information seems vital! An NPC's goal has been updated to: ${newStatus}. Their disposition towards you changes dramatically.`, 'system');
      }

      try {
        const ttsResult = await synthesizeSpeech(oracleResponseResult.text, 'Charon');
        if (ttsResult.rateLimitHit) {
          dispatch({ type: 'SET_RATE_LIMIT_ERROR_FLAG' });
        }
        if (ttsResult.audioData) {
          await playPcmAudio(ttsResult.audioData);
        } else if (ttsResult.error) {
          throw ttsResult.error;
        }
      } catch (ttsError: any) {
        addMessage(`(TTS Error: Could not synthesize speech for Oracle)`, 'system');
      }
    } else {
      addMessage("The Oracle remains silent, or an error prevented their response.", 'system');
    }
  } else {
    addMessage('You ponder, but ask nothing of the Oracle.', 'system');
  }
  dispatch({ type: 'SET_GEMINI_ACTIONS', payload: null });
  dispatch({ type: 'RESET_NPC_INTERACTION_CONTEXT' });
}