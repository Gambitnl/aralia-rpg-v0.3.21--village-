/**
 * @file src/hooks/actions/handleNpcInteraction.ts
 * Handles NPC interaction actions like 'talk'.
 */
import { GameState, Action, GoalStatus, KnownFact } from '../../types';
import { AppAction } from '../../state/actionTypes';
import * as GeminiService from '../../services/geminiService';
import { synthesizeSpeech } from '../../services/ttsService';
import { AddMessageFn, AddGeminiLogFn, PlayPcmAudioFn } from './actionHandlerTypes';
import { NPCS } from '../../constants';

interface HandleTalkProps {
  action: Action;
  gameState: GameState;
  dispatch: React.Dispatch<AppAction>;
  addMessage: AddMessageFn;
  addGeminiLog: AddGeminiLogFn;
  playPcmAudio: PlayPcmAudioFn;
  playerContext: string;
  generalActionContext: string;
}

export async function handleTalk({
  action,
  gameState,
  dispatch,
  addMessage,
  addGeminiLog,
  playPcmAudio,
  playerContext,
  generalActionContext,
}: HandleTalkProps): Promise<void> {
  if (!action.targetId) {
    addMessage("Invalid talk target.", "system");
    return;
  }
  const npc = NPCS[action.targetId];
  if (npc) {
    // Add NPC to met list on first successful interaction
    if (!gameState.metNpcIds.includes(npc.id)) {
        const metFact: KnownFact = {
            id: crypto.randomUUID(),
            text: `Met ${playerContext}.`,
            source: 'direct',
            isPublic: true,
            timestamp: gameState.gameTime.getTime(),
            strength: 3,
            lifespan: 999,
        };
        dispatch({ type: 'ADD_NPC_KNOWN_FACT', payload: { npcId: npc.id, fact: metFact } });
        dispatch({ type: 'ADD_MET_NPC', payload: { npcId: npc.id } });
    }
    
    // 1. Retrieve NPC memory from gameState
    const memory = gameState.npcMemory[npc.id];
    if (!memory) {
      addMessage(`Error: Could not retrieve memory for ${npc.name}.`, "system");
      return;
    }

    // 2. Construct Memory Context string, now including active goals and structured facts.
    // This provides Gemini with the NPC's current motivations for more relevant dialogue.
    let memoryContextString = `Disposition towards player: ${memory.disposition}.`;
    
    // Sort facts by timestamp (most recent first) and take the top 5 for brevity.
    const recentFacts = [...memory.knownFacts].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
    
    if (recentFacts.length > 0) {
      // Format facts based on their source for more nuanced context.
      const factStrings = recentFacts.map(fact => 
          fact.source === 'gossip'
              ? `(Heard from ${NPCS[fact.sourceNpcId!]?.name || 'a traveler'}): "${fact.text}"`
              : `(Witnessed Directly): "${fact.text}"`
      );
      memoryContextString += ` Recent memories: [${factStrings.join(', ')}]`;
    } else {
      memoryContextString += " No specific memories of this player.";
    }

    // Add active goals to the context string.
    const activeGoals = memory.goals?.filter(g => g.status === GoalStatus.Active);
    if (activeGoals && activeGoals.length > 0) {
        memoryContextString += ` Active Goals: ["${activeGoals.map(g => g.description).join('", "')}"]`;
    }


    // 3. Construct the full prompt
    const isFollowUp = npc.id === gameState.lastInteractedNpcId;
    let fullPrompt: string;
    if (isFollowUp) {
      fullPrompt = `Player interacts again. Your previous response was: "${gameState.lastNpcResponse || 'None'}".`;
    } else {
      fullPrompt = `Player (${playerContext}) approaches and wants to talk. General context: ${generalActionContext}.`;
    }
    fullPrompt = `Relevant Memories & Feelings about this player: ${memoryContextString}\n\n${fullPrompt}\n\nYour EXTREMELY BRIEF response (1-2 sentences MAX):`;

    // 4. Call the refactored geminiService function
    const npcResponseResult = await GeminiService.generateNPCResponse(
      npc.initialPersonalityPrompt,
      fullPrompt
    );
    addGeminiLog('generateNPCResponse', npcResponseResult.promptSent, npcResponseResult.rawResponse);
    if (npcResponseResult.rateLimitHit) {
      dispatch({ type: 'SET_RATE_LIMIT_ERROR_FLAG' });
    }

    if (npcResponseResult.text && !npcResponseResult.text.startsWith("Error in")) {
      addMessage(`${npc.name}: "${npcResponseResult.text}"`, 'npc');
      dispatch({ type: 'SET_LAST_NPC_INTERACTION', payload: { npcId: npc.id, response: npcResponseResult.text } });
      
      // Update the timestamp of the last interaction. This is crucial for the disposition drift mechanic.
      // DEPENDS ON: `gameState.gameTime` for the current timestamp.
      // DISPATCHES: `UPDATE_NPC_INTERACTION_TIMESTAMP` to `npcReducer.ts`.
      dispatch({ type: 'UPDATE_NPC_INTERACTION_TIMESTAMP', payload: { npcId: npc.id, timestamp: gameState.gameTime.getTime() } });

      // 5. Dispatch action to update memory (simple disposition increase for talking)
      dispatch({ type: 'UPDATE_NPC_DISPOSITION', payload: { npcId: npc.id, amount: 1 } });
      
      try {
        const ttsResult = await synthesizeSpeech(npcResponseResult.text, npc.voice?.name || 'Kore');
        if (ttsResult.rateLimitHit) {
          dispatch({ type: 'SET_RATE_LIMIT_ERROR_FLAG' });
        }
        if (ttsResult.audioData) {
          await playPcmAudio(ttsResult.audioData);
        } else if (ttsResult.error) {
          throw ttsResult.error;
        }
      } catch (ttsError: any) {
        addMessage(`(TTS Error: Could not synthesize speech for ${npc.name})`, 'system');
      }
    } else {
      addMessage(`${npc.name} seems unresponsive or an error occurred.`, 'system');
      dispatch({ type: 'RESET_NPC_INTERACTION_CONTEXT' });
    }
  } else {
    addMessage(`There is no one named ${action.targetId} to talk to here.`, 'system');
    dispatch({ type: 'RESET_NPC_INTERACTION_CONTEXT' });
  }
  dispatch({ type: 'SET_GEMINI_ACTIONS', payload: null });
}