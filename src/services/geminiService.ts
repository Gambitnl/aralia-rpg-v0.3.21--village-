/**
 * @file geminiService.ts
 * This service module handles all interactions with the Google Gemini API.
 * It provides functions to generate various types of text content for the RPG,
 * such as location descriptions, NPC responses, and action outcomes.
 * It uses the centralized AI client from aiClient.ts.
 */
import { GenerateContentResponse } from "@google/genai";
import { ai } from './aiClient'; // Import the shared AI client
import { Action, PlayerCharacter, InspectSubmapTilePayload, SeededFeatureConfig, Monster, GroundingChunk, TempPartyMember, GoalStatus, GoalUpdatePayload } from "../types"; 
import { SUBMAP_ICON_MEANINGS } from '../data/glossaryData'; 
import { XP_BY_CR } from '../data/dndData';
import { CLASSES_DATA } from '../data/classes';
import { MONSTERS_DATA } from '../constants';
import { GEMINI_TEXT_MODEL_FALLBACK_CHAIN } from '../config/geminiConfig';

const defaultSystemInstruction =
  "You are a storyteller for a text-based high fantasy RPG set in a world of dragons, ancient magic, and looming conflict (like Krynn). Your responses MUST be EXTREMELY BRIEF, MAXIMUM 1-2 sentences. Provide ONLY essential 'breadcrumb' details. Focus on atmosphere and key information. NO long descriptions. Be concise.";

export interface GenerateTextResult {
  text: string;
  promptSent: string;
  rawResponse: string;
  rateLimitHit?: boolean;
}
/**
 * Generic function to generate text content using the Gemini API.
 * It now includes a fallback mechanism to retry with different models on rate limit errors.
 * @param {string} promptContent - The prompt content to send to the model.
 * @param {string} [systemInstruction] - Optional system instruction to guide the model's behavior. Defaults to a general RPG storyteller instruction.
 * @param {boolean} [expectJson=false] - Whether to expect a JSON response and configure responseMimeType.
 * @param {string} [functionName='generateText'] - Name of the calling function for logging.
 * @returns {Promise<GenerateTextResult>} A promise that resolves to an object containing the generated text, the prompt sent, and the raw response.
 * @throws {Error} If the API call fails after all retries.
 */
async function generateText(
  promptContent: string,
  systemInstruction?: string,
  expectJson: boolean = false,
  functionName: string = 'generateText' // For logging context
): Promise<GenerateTextResult> {
  const fullPromptForLogging = `System Instruction: ${systemInstruction || defaultSystemInstruction}\nUser Prompt: ${promptContent}`;
  let lastError: any = null;
  let rateLimitHitInChain = false;

  for (const model of GEMINI_TEXT_MODEL_FALLBACK_CHAIN) {
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: promptContent,
        config: {
          systemInstruction: systemInstruction || defaultSystemInstruction,
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          responseMimeType: expectJson ? "application/json" : undefined,
        },
      });
      const responseText = response.text.trim();
      if (!responseText && !expectJson) {
        console.warn(`Gemini returned an empty response for function: ${functionName} with model: ${model}. Prompt: ${promptContent}`);
        return {
          text: "You notice nothing particularly remarkable.",
          promptSent: fullPromptForLogging,
          rawResponse: JSON.stringify(response),
          rateLimitHit: rateLimitHitInChain,
        };
      }
      return {
        text: responseText,
        promptSent: fullPromptForLogging,
        rawResponse: JSON.stringify(response),
        rateLimitHit: rateLimitHitInChain,
      };
    } catch (error) {
      lastError = error;
      const errorString = JSON.stringify(error, Object.getOwnPropertyNames(error));
      if (errorString.includes('"code":429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        rateLimitHitInChain = true;
        console.warn(`Gemini API rate limit error with model ${model}. Retrying with next model...`);
        continue;
      } else {
        break;
      }
    }
  }

  console.error(`Gemini API error in ${functionName} after all retries:`, lastError);
  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  return {
    text: `Error in ${functionName}: ${errorMessage}`,
    promptSent: fullPromptForLogging,
    rawResponse: JSON.stringify(lastError, Object.getOwnPropertyNames(lastError)),
    rateLimitHit: rateLimitHitInChain,
  };
}


export async function generateLocationDescription(
  locationName: string,
  context: string,
): Promise<GenerateTextResult> {
  const systemInstruction =
    "Describe a new location in a high fantasy RPG (like Krynn). Response MUST be EXTREMELY BRIEF: 1-2 sentences MAX. Give ONLY key sights, sounds, or atmosphere. No fluff.";
  const prompt = `Player arrives at "${locationName}". Context: ${context}. Provide an EXTREMELY BRIEF description (1-2 sentences MAX) of the area's key features.`;
  return await generateText(prompt, systemInstruction, false, 'generateLocationDescription');
}

export async function generateWildernessLocationDescription(
  biomeName: string,
  worldMapCoords: {x: number, y: number},
  subMapCoords: {x: number, y: number},
  playerContext: string,
  worldMapTileTooltip?: string | null,
): Promise<GenerateTextResult> {
    const systemInstruction =
    "You are a concise storyteller describing a wilderness location in a fantasy RPG. Response MUST be 2-3 sentences. Focus on immediate sensory details (sights, sounds, smells) appropriate for the biome. No long descriptions.";
  const prompt = `Player (${playerContext}) has moved to a new spot.
  Location: A wilderness area at sub-tile (${subMapCoords.x},${subMapCoords.y}) within world sector (${worldMapCoords.x},${worldMapCoords.y}).
  Biome: ${biomeName}.
  Broader Context (from world map): ${worldMapTileTooltip || 'No additional context.'}
  
  Provide a brief, 2-3 sentence description of this specific spot.`;
  return await generateText(prompt, systemInstruction, false, 'generateWildernessLocationDescription');
}

export async function generateNPCResponse(
  personalityPrompt: string,
  fullPrompt: string
): Promise<GenerateTextResult> {
  return await generateText(fullPrompt, personalityPrompt, false, 'generateNPCResponse');
}

export async function generateActionOutcome(
  playerAction: string,
  context: string,
  isCustomGeminiAction: boolean = false,
  worldMapTileTooltip?: string | null,
): Promise<GenerateTextResult> {
  const systemInstruction = isCustomGeminiAction 
    ? "You are a Dungeon Master narrating the outcome of a player's specific, creative action. The response should be a brief, 2-3 sentence description of what happens next. Be direct and describe the result."
    : "You are a Dungeon Master narrating the outcome of a player's action. The response should be a brief, 2-3 sentence description of what the player character observes or the result of their action. Focus on sensory details and key information.";

  let prompt = `Player action: "${playerAction}"\nContext: ${context}`;
  if (playerAction.toLowerCase().includes("look around") && worldMapTileTooltip) {
      prompt += `\nBroader context for 'look around': ${worldMapTileTooltip}`;
  }

  return await generateText(prompt, systemInstruction, false, 'generateActionOutcome');
}

export async function generateDynamicEvent(
  currentLocationName: string,
  context: string,
): Promise<GenerateTextResult> {
  const systemInstruction =
    'You are a Dungeon Master creating a minor, unexpected event in a fantasy RPG. Response MUST be 1-2 sentences MAX. The event should be atmospheric, not a major plot point. Examples: a sudden gust of wind, a strange sound, a fleeting shadow.';
  const prompt = `Location: ${currentLocationName}. Context: ${context}. Create a brief, minor, unexpected event.`;
  return await generateText(prompt, systemInstruction, false, 'generateDynamicEvent');
}

export async function generateOracleResponse(
  playerQuery: string,
  context: string,
): Promise<GenerateTextResult> {
  const systemInstruction =
    "You are the Oracle, a mysterious, wise entity. Respond to the player's query. Your response MUST be enigmatic and brief (1-2 sentences MAX). Speak in the first person. Do NOT give a direct answer; provide a cryptic clue or a philosophical question in return.";
  const prompt = `A player asks me, the Oracle: "${playerQuery}"\nMy context: ${context}\nMy brief, cryptic, first-person response is:`;
  return await generateText(prompt, systemInstruction, false, 'generateOracleResponse');
}

export async function generateCharacterName(race: string, className: string, gender: string, setting: string): Promise<{name: string | null; rateLimitHit?: boolean}> {
    const prompt = `Generate a single, fitting, full character name (first and last) for a ${gender} ${race} ${className} in a ${setting}-style fantasy world. Return ONLY the name, nothing else.`;
    const result = await generateText(prompt, "You are a fantasy name generator.", false, 'generateCharacterName');
    return { name: result.text, rateLimitHit: result.rateLimitHit };
}

export async function generateTileInspectionDetails(
    tileDetails: InspectSubmapTilePayload,
    playerCharacter: PlayerCharacter,
    gameTime: string
): Promise<GenerateTextResult> {
  
  const systemInstruction = `You are a Dungeon Master describing what a player character observes when they carefully inspect a nearby area in a fantasy RPG.
  Your response must be an evocative, 2-3 sentence description from the character's perspective.
  CRITICAL: Do NOT use game jargon like 'tile', 'grid', 'coordinates', 'hex', 'icon', or 'procedural generation'. Instead, use immersive language like 'spot', 'area', 'patch of land', 'clearing', 'thicket', etc.
  Focus on sensory details, potential discoveries, or atmospheric elements.`;

  let featureContext = "no specific large feature.";
  if (tileDetails.activeFeatureConfig) {
      const feature = tileDetails.activeFeatureConfig;
      featureContext = `a notable feature: a ${feature.name || feature.id}. This feature is represented visually by the icon '${feature.icon}'.`;
      const iconMeaning = SUBMAP_ICON_MEANINGS[feature.icon];
      if (iconMeaning) {
          featureContext += ` (The icon '${feature.icon}' generally signifies: ${iconMeaning}).`;
      }
  }
  
  let terrainContext = tileDetails.effectiveTerrainType;
  if(terrainContext === 'path_adj') terrainContext = 'area immediately adjacent to a discernible path';
  if(terrainContext === 'path') terrainContext = 'a discernible path';

  const prompt = `Player Character (${playerCharacter.name}, a ${playerCharacter.race.name} ${playerCharacter.class.name}) is inspecting a specific spot of terrain near them.
  - Current Time: ${gameTime}
  - General Biome: ${tileDetails.worldBiomeId}
  - Terrain Type of the spot: ${terrainContext}
  - The spot contains: ${featureContext}
  
  Describe what the character sees, hears, or smells in this specific area in 2-3 sentences.`;

  return await generateText(prompt, systemInstruction, false, 'generateTileInspectionDetails');
}

export async function generateEncounter(xpBudget: number, themeTags: string[], party: TempPartyMember[]): Promise<{ encounter: Monster[], sources: GroundingChunk[], promptSent: string, rawResponse: string, rateLimitHit?: boolean }> {
  const partyComposition = party.map(p => `Level ${p.level} ${CLASSES_DATA[p.classId]?.name || 'Adventurer'}`).join(', ');
  const systemInstruction = `You are a D&D Dungeon Master creating a balanced combat encounter using Google Search for monster ideas.
  - The party's total XP budget for a medium encounter is ${xpBudget} XP.
  - You MUST suggest between 1 and 4 total monsters.
  - Find monsters that fit the themes: ${themeTags.join(', ')}.
  - The response MUST be a valid JSON array of objects. Each object represents a monster type and must have three keys: "name" (string, e.g., "Goblin"), "quantity" (number), "cr" (string, e.g., "1/4"), and "description" (a brief, 1-sentence flavor text).
  - Provide ONLY the JSON array.`;

  const prompt = `Create a medium-difficulty D&D 5e encounter for a party of ${party.length} adventurers (${partyComposition}) with an XP budget of ${xpBudget}. The encounter should fit these themes: ${themeTags.join(', ')}.`;
  const fullPromptForLogging = `System Instruction: ${systemInstruction}\nUser Prompt: ${prompt}`;
  let lastError: any = null;
  let rateLimitHitInChain = false;
  
  for (const model of GEMINI_TEXT_MODEL_FALLBACK_CHAIN) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          tools: [{googleSearch: {}}],
        },
      });
      
      const responseText = response.text.trim();
      
      let encounter: Monster[] = [];
      if (responseText) {
          try {
              const jsonString = responseText.replace(/```json\n|```/g, '').trim();
              encounter = JSON.parse(jsonString);
          } catch (e) {
              console.error(`Failed to parse JSON from generateEncounter with model ${model}:`, responseText, e);
              throw new Error("The AI returned a malformed encounter suggestion.");
          }
      }

      const groundingChunksFromApi = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      const sources: GroundingChunk[] = groundingChunksFromApi
        .map(chunk => {
          if (chunk.web && chunk.web.uri) {
            return {
              web: {
                uri: chunk.web.uri,
                title: chunk.web.title || chunk.web.uri,
              },
            };
          }
          return null;
        })
        .filter((chunk): chunk is GroundingChunk => chunk !== null);

      return {
          encounter,
          sources,
          promptSent: fullPromptForLogging,
          rawResponse: JSON.stringify(response),
          rateLimitHit: rateLimitHitInChain,
      };
    } catch (error) {
        lastError = error;
        const errorString = JSON.stringify(error, Object.getOwnPropertyNames(error));
        if (errorString.includes('"code":429') || errorString.includes('RESOURCE_EXHAUSTED')) {
            rateLimitHitInChain = true;
            console.warn(`Gemini API rate limit error with model ${model} in generateEncounter. Retrying with next model...`);
            continue;
        } else {
            break;
        }
    }
  }

  console.error(`Gemini API error in generateEncounter after all retries:`, lastError);
  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Failed to generate encounter from Gemini after all retries: ${errorMessage}`);
}

export interface CustomActionsResult extends GenerateTextResult {
  actions: Action[];
}

export async function generateCustomActions(
    sceneDescription: string,
    context: string,
): Promise<CustomActionsResult> {
    const systemInstruction = `You are a creative Dungeon Master suggesting actions for a fantasy RPG.
    Based on the scene, suggest up to 3 brief, non-navigational, context-aware actions.
    Format as a valid JSON array of objects. Each object MUST have a 'label' (short button text) and a 'geminiPrompt' (a 3rd-person description of the action, e.g., "Player examines the strange glyphs.").
    CRITICAL: If the context indicates the player is in a 'village_area', you MUST suggest an action with the label "Enter Village" and a 'type' of 'ENTER_VILLAGE'.
    If an action is a social skill check (like Persuasion, Deception, Intimidation) against a specific NPC, ALSO include 'check' (the lowercase skill name from this list: 'persuasion', 'deception', 'intimidation', 'performance', 'insight') and 'targetNpcId' (the NPC's ID from the context) in the object.
    CRITICAL: If the NPC's memory context includes facts learned via gossip (prefixed with 'Heard from...'), you MUST PRIORITIZE suggesting actions for the player to engage with these rumors. Examples include: 'Ask where they heard that rumor', 'Try to discredit the rumor (Deception check)', 'Confirm the rumor and explain (Persuasion check)'.
    If an action is destructive or leaves obvious physical evidence (like 'force open the chest' or 'smash the window'), also include an 'eventResidue' object in the JSON payload. This object must have a 'text' (a factual, third-person description of the evidence, e.g., 'The chest lock was broken') and a 'discoveryDc' (a number from 10 to 20 representing the difficulty to notice it).
    NEW: If an action is a flagrant, public, and negative act (e.g., "Attack the Town Guard," "Steal from the merchant's stall in plain sight"), also include \`"isEgregious": true\` in the JSON object.
    Provide ONLY the JSON array, nothing else.`;
    const prompt = `Scene: "${sceneDescription}"\nContext: ${context}`;
    
    const result = await generateText(prompt, systemInstruction, true, 'generateCustomActions');
    let actions: Action[] = [];

    if (result.text && !result.text.startsWith("Error in")) {
        try {
            const jsonString = result.text.replace(/```json\n|```/g, '').trim();
            const parsedActions: any[] = JSON.parse(jsonString);

            actions = parsedActions.map(a => ({
                type: a.type === 'ENTER_VILLAGE' ? 'ENTER_VILLAGE' : 'gemini_custom_action',
                label: a.label,
                payload: {
                    geminiPrompt: a.geminiPrompt,
                    check: a.check,
                    targetNpcId: a.targetNpcId,
                    eventResidue: a.eventResidue,
                    isEgregious: a.isEgregious,
                },
            }));
        } catch (e) {
            console.error("Failed to parse JSON from generateCustomActions:", result.text, e);
        }
    }
    
    return { ...result, actions };
}

export interface SocialCheckOutcome {
  outcomeText: string;
  dispositionChange: number;
  memoryFactText: string;
  goalUpdate?: GoalUpdatePayload | null;
}

export async function generateSocialCheckOutcome(
  skillName: string,
  npcName: string,
  wasSuccess: boolean,
  context: string
): Promise<{ text: string; dispositionChange: number; memoryFactText: string; goalUpdate: GoalUpdatePayload | null; promptSent: string; rawResponse: string; rateLimitHit?: boolean; }> {
    const systemInstruction = `You are a Dungeon Master narrating the outcome of a social skill check.
    Your response MUST be a valid JSON object with the following keys:
    1. "outcomeText": A brief, 1-2 sentence narrative of what happens next.
    2. "dispositionChange": A number from -15 to 15 representing how the NPC's opinion of the player changes. Positive for success, negative for failure. Be reasonable.
    3. "memoryFactText": A brief, factual, third-person summary of the event for the NPC's memory. Example: "The player persuaded them to reveal the location of the hidden grove." or "The player's attempt to lie about their past was unconvincing."
    4. "goalUpdate": An object with { "npcId", "goalId", "newStatus" } OR null. Only populate this if the player's action DIRECTLY AND UNEQUIVOCALLY completes or fails a stated NPC goal in the context. "newStatus" must be "Completed" or "Failed".
    Provide ONLY the JSON object.`;
    const prompt = `A player attempted a ${skillName} check against ${npcName} and ${wasSuccess ? 'SUCCEEDED' : 'FAILED'}.
    The context of the situation is: ${context}
    
    Narrate the outcome and determine the disposition change, memory fact, and any direct goal updates.`;

    const result = await generateText(prompt, systemInstruction, true, 'generateSocialCheckOutcome');
    
    try {
        const parsed: SocialCheckOutcome = JSON.parse(result.text.replace(/```json\n|```/g, '').trim());
        return {
          text: parsed.outcomeText || "The situation evolves...",
          dispositionChange: parsed.dispositionChange || (wasSuccess ? 1 : -1),
          memoryFactText: parsed.memoryFactText || `The player's ${skillName} check was ${wasSuccess ? 'successful' : 'unsuccessful'}.`,
          goalUpdate: parsed.goalUpdate || null,
          promptSent: result.promptSent,
          rawResponse: result.rawResponse,
          rateLimitHit: result.rateLimitHit,
        };
    } catch (e) {
        console.error("Failed to parse JSON from generateSocialCheckOutcome:", result.text, e);
        return {
          text: wasSuccess ? `${npcName} seems to consider your words.` : `${npcName} seems unconvinced.`,
          dispositionChange: wasSuccess ? 2 : -2,
          memoryFactText: `The player's ${skillName} check was ${wasSuccess ? 'successful' : 'unsuccessful'}.`,
          goalUpdate: null,
          promptSent: result.promptSent,
          rawResponse: result.rawResponse,
          rateLimitHit: result.rateLimitHit,
        };
    }
}


/**
 * Rephrases a fact from the perspective of a listener NPC for the gossip system.
 * @param factText The original fact text.
 * @param speakerPersonality The personality prompt of the NPC who knows the fact.
 * @param listenerPersonality The personality prompt of the NPC who is hearing the fact.
 * @returns A GenerateTextResult containing the rephrased fact.
 */
export async function rephraseFactForGossip(
  factText: string,
  speakerPersonality: string,
  listenerPersonality: string
): Promise<GenerateTextResult> {
  const systemInstruction = `You are an editor for an RPG. Your task is to rephrase a piece of information as if it were a rumor being passed from one character to another, reflecting the listener's personality. Your response MUST be ONLY the rephrased sentence. No extra text.`;
  const prompt = `A character with the personality "${listenerPersonality}" heard a rumor from a character with the personality "${speakerPersonality}".
The original fact is: "${factText}"

Rephrase this fact from the listener's perspective in one concise, natural-sounding sentence.`;
  return await generateText(prompt, systemInstruction, false, 'rephraseFactForGossip');
}
