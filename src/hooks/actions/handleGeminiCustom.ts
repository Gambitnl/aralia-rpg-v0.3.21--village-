/**
 * @file src/hooks/actions/handleGeminiCustom.ts
 * Handles 'gemini_custom_action', including social skill checks.
 */
import { GameState, Action, SuspicionLevel, GoalStatus, KnownFact, Location, NPC } from '../../types';
import { AppAction } from '../../state/actionTypes';
import * as GeminiService from '../../services/geminiService';
import { AddMessageFn, AddGeminiLogFn, GetCurrentLocationFn, GetCurrentNPCsFn } from './actionHandlerTypes';
import { NPCS, SKILLS_DATA } from '../../constants';
import { getAbilityModifierValue } from '../../utils/characterUtils';
import { assessPlausibility } from '../../utils/socialUtils';
import { handleImmediateGossip } from './handleWorldEvents';

interface HandleGeminiCustomProps {
  action: Action;
  gameState: GameState;
  dispatch: React.Dispatch<AppAction>;
  addMessage: AddMessageFn;
  addGeminiLog: AddGeminiLogFn;
  generalActionContext: string;
  getCurrentLocation: GetCurrentLocationFn;
  getCurrentNPCs: GetCurrentNPCsFn;
}

export async function handleGeminiCustom({
  action,
  gameState,
  dispatch,
  addMessage,
  addGeminiLog,
  generalActionContext,
  getCurrentLocation,
  getCurrentNPCs,
}: HandleGeminiCustomProps): Promise<void> {
  const { payload } = action;
  let outcomeFact: KnownFact | null = null;
  const targetNpcIdForGossip = payload?.targetNpcId || null;
  
  // Check if it's a social skill check
  if (payload?.check && payload.targetNpcId) {
    const player = gameState.party[0];
    const npc = NPCS[payload.targetNpcId];
    if (!player || !npc) {
      addMessage("Invalid target for social check.", "system");
      return;
    }
    
    const skillId = Object.keys(SKILLS_DATA).find(key => SKILLS_DATA[key].name.toLowerCase() === payload.check.toLowerCase());
    const skill = skillId ? SKILLS_DATA[skillId] : null;

    if (!skill) {
      addMessage(`Unknown skill for check: ${payload.check}`, "system");
      return;
    }

    const npcMemory = gameState.npcMemory[npc.id];
    if (!npcMemory) {
        addMessage(`Error: Could not find memory for ${npc.name}.`, "system");
        return;
    }

    // 1. Calculate DC with plausibility modifier
    const baseDc = 12;
    const plausibilityModifier = assessPlausibility(action, player, npcMemory);
    const disposition = npcMemory.disposition;
    const dcModifier = Math.floor(-disposition / 10); // +50 disp -> -5 DC; -50 disp -> +5 DC
    const finalDc = baseDc + dcModifier + plausibilityModifier;

    // 2. Calculate Player Roll
    const abilityScoreValue = player.finalAbilityScores[skill.ability];
    const abilityModifier = getAbilityModifierValue(abilityScoreValue);
    const isProficient = player.skills.some(s => s.id === skill.id);
    const proficiencyBonus = isProficient ? (player.proficiencyBonus || 2) : 0;
    
    const d20Roll = Math.floor(Math.random() * 20) + 1;
    const totalRoll = d20Roll + abilityModifier + proficiencyBonus;
    const wasSuccess = totalRoll >= finalDc;

    addMessage(`(DC ${finalDc}) You attempt to ${skill.name}... Rolled ${totalRoll} (${d20Roll} + ${abilityModifier} + ${proficiencyBonus})`, "system");

    // 3. Get Outcome from Gemini, now expecting a structured response
    const outcomeResult = await GeminiService.generateSocialCheckOutcome(
      skill.name,
      npc.name,
      wasSuccess,
      generalActionContext
    );
    addGeminiLog('generateSocialCheckOutcome', outcomeResult.promptSent, outcomeResult.rawResponse);
    if (outcomeResult.rateLimitHit) {
      dispatch({ type: 'SET_RATE_LIMIT_ERROR_FLAG' });
    }

    // 4. Apply Narrative and Disposition Outcome
    if (outcomeResult.text) {
      addMessage(outcomeResult.text, "system");
    }
    dispatch({ type: 'UPDATE_NPC_DISPOSITION', payload: { npcId: npc.id, amount: outcomeResult.dispositionChange } });
    
    outcomeFact = {
        id: crypto.randomUUID(),
        text: outcomeResult.memoryFactText, // Using the new descriptive fact from AI
        source: 'direct',
        isPublic: true,
        timestamp: gameState.gameTime.getTime(),
        strength: wasSuccess ? 7 : 4, // Successful/important social checks are more memorable
        lifespan: 999,
    };
    dispatch({ type: 'ADD_NPC_KNOWN_FACT', payload: { npcId: npc.id, fact: outcomeFact } });

    // 5. Handle Goal Updates from Gemini's response
    if (outcomeResult.goalUpdate) {
        const { npcId, goalId, newStatus } = outcomeResult.goalUpdate;
        dispatch({ type: 'UPDATE_NPC_GOAL_STATUS', payload: { npcId, goalId, newStatus }});
        
        const dispositionBoost = newStatus === GoalStatus.Completed ? 50 : -50;
        dispatch({ type: 'UPDATE_NPC_DISPOSITION', payload: { npcId, amount: dispositionBoost }});
        addMessage(`${npc.name}'s goal has been updated to: ${newStatus}. Their disposition towards you changes dramatically.`, 'system');
    }


    // 6. Update Suspicion Level on failure of certain checks
    if (!wasSuccess && ['deception', 'intimidation', 'persuasion'].includes(skill.name.toLowerCase())) {
        let newSuspicion = npcMemory.suspicion;
        if (npcMemory.suspicion === SuspicionLevel.Unaware) {
            newSuspicion = SuspicionLevel.Suspicious;
        } else if (npcMemory.suspicion === SuspicionLevel.Suspicious) {
            newSuspicion = SuspicionLevel.Alert;
        }
        
        if (newSuspicion !== npcMemory.suspicion) {
            dispatch({ type: 'UPDATE_NPC_SUSPICION', payload: { npcId: npc.id, newLevel: newSuspicion } });
            addMessage(`${npc.name} seems more suspicious of you now.`, "system");
        }
    }

  } else if (payload?.geminiPrompt) {
    // Original logic for non-skill-check custom actions
    const outcomeResult = await GeminiService.generateActionOutcome(payload.geminiPrompt as string, generalActionContext, true, undefined);
    addGeminiLog('generateActionOutcome (custom)', outcomeResult.promptSent, outcomeResult.rawResponse);
    if (outcomeResult.rateLimitHit) {
      dispatch({ type: 'SET_RATE_LIMIT_ERROR_FLAG' });
    }

    if (outcomeResult.text && !outcomeResult.text.startsWith("Error in")) {
      addMessage(outcomeResult.text, 'system');
       outcomeFact = {
            id: crypto.randomUUID(),
            text: outcomeResult.text, // The narrative outcome becomes the fact.
            source: 'direct',
            isPublic: true,
            timestamp: gameState.gameTime.getTime(),
            strength: 8, // Egregious acts are very memorable
            lifespan: 9999,
        };
        // If there was a target, add the fact to their memory.
        if (targetNpcIdForGossip) {
            dispatch({ type: 'ADD_NPC_KNOWN_FACT', payload: { npcId: targetNpcIdForGossip, fact: outcomeFact } });
        }

    } else {
      addMessage("You attempt the action, but the outcome is unclear or an error occurred.", "system");
    }
  } else {
    addMessage('Invalid custom action.', 'system');
  }
  
  // After any custom action, check if it left residue and dispatch an action if so.
  if (payload?.eventResidue) {
      const { text, discoveryDc } = payload.eventResidue;
      const location = getCurrentLocation();
      const residentNpcId = location.npcIds?.[0];

      if (residentNpcId && text && discoveryDc) {
          dispatch({
              type: 'ADD_LOCATION_RESIDUE',
              payload: {
                  locationId: location.id,
                  residue: {
                      text,
                      discoveryDc,
                      discovererNpcId: residentNpcId
                  }
              }
          });
          addMessage("You get the feeling you may have left some evidence behind.", "system");
      }
  }

  // After all outcomes are processed, check for gossip trigger.
  if (payload?.isEgregious && outcomeFact) {
    const allNpcsInLocation = getCurrentNPCs();
    const witnesses = allNpcsInLocation
      .map(n => n.id)
      .filter(id => id !== targetNpcIdForGossip); // Everyone except the direct target (if any) are witnesses.

    if (witnesses.length > 0) {
      addMessage(`Your actions have been witnessed by others in the area.`, 'system');
      await handleImmediateGossip(gameState, dispatch, addGeminiLog, witnesses, outcomeFact, targetNpcIdForGossip);
    }
  }


  // Clear all custom actions after one is taken
  dispatch({ type: 'SET_GEMINI_ACTIONS', payload: null });
  dispatch({ type: 'RESET_NPC_INTERACTION_CONTEXT' });
}