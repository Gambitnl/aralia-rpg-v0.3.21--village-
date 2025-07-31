/**
 * @file src/hooks/actions/handleWorldEvents.ts
 * This file contains handlers for world-level events that occur outside of direct player actions,
 * such as the spread of gossip between NPCs during a rest.
 * It now also includes the logic for long-term memory maintenance (decay, pruning, drift).
 */
import { GameState, KnownFact, GossipUpdatePayload, DiscoveryType, NpcMemory } from '../../types';
import { AppAction } from '../../state/actionTypes';
import * as GeminiService from '../../services/geminiService';
import { AddGeminiLogFn } from './actionHandlerTypes';
import { NPCS, LOCATIONS } from '../../constants';
import * as NpcBehaviorConfig from '../../config/npcBehaviorConfig';

/**
 * Simulates the spread of information (gossip) between NPCs during a period of downtime (like a Long Rest).
 * This function is designed to be performance-conscious and operates in a single, batched update.
 * @param gameState - The current state of the game.
 * @param addGeminiLog - A function to log the AI interactions for debugging.
 * @param dispatch - The dispatch function to update the game state.
 */
export async function handleGossipEvent(
  gameState: GameState,
  addGeminiLog: AddGeminiLogFn,
  dispatch: React.Dispatch<AppAction>
): Promise<void> {
    const allNpcIds = Object.keys(NPCS);
    
    // 1. Group all NPCs by their current location (for simplicity, we assume static locations for now)
    // In a more dynamic game, this would check an NPC's current location from the state.
    const npcsByLocation: Record<string, string[]> = {};
    for (const location of Object.values(gameState.mapData?.tiles.flat() || [])) {
        if(location.locationId && LOCATIONS[location.locationId]?.npcIds) {
            npcsByLocation[location.locationId] = [
                ...(npcsByLocation[location.locationId] || []),
                ...LOCATIONS[location.locationId].npcIds!,
            ];
        }
    }
    // Also account for dynamic NPCs
    if (gameState.currentLocationActiveDynamicNpcIds) {
        npcsByLocation[gameState.currentLocationId] = [
            ...(npcsByLocation[gameState.currentLocationId] || []),
            ...gameState.currentLocationActiveDynamicNpcIds,
        ];
    }
    
    // 2. Identify all "spreadable" facts (public, directly witnessed, and not already gossip)
    const spreadableFacts: Array<{ npcId: string; fact: KnownFact }> = [];
    for (const npcId of allNpcIds) {
        const memory = gameState.npcMemory[npcId];
        if (memory) {
            memory.knownFacts.forEach(fact => {
                if (fact.isPublic && fact.source === 'direct') {
                    spreadableFacts.push({ npcId, fact });
                }
            });
        }
    }

    if (spreadableFacts.length === 0) return; // No new gossip to spread

    const gossipUpdatePayload: GossipUpdatePayload = {};
    let totalExchanges = 0;

    // 3. Perform a limited number of gossip exchanges
    for (const locationId in npcsByLocation) {
        const localNpcs = npcsByLocation[locationId];
        if (localNpcs.length < 2) continue; // Need at least two NPCs to gossip

        const exchangesInLocation = Math.min(NpcBehaviorConfig.MAX_GOSSIP_EXCHANGES_PER_LOCATION, Math.floor(localNpcs.length / 2));

        for (let i = 0; i < exchangesInLocation; i++) {
            if (totalExchanges >= NpcBehaviorConfig.MAX_TOTAL_GOSSIP_EXCHANGES) break;

            // Select a random "speaker" who has a spreadable fact
            const potentialSpeakers = localNpcs.filter(id => spreadableFacts.some(sf => sf.npcId === id));
            if (potentialSpeakers.length === 0) continue;
            const speakerId = potentialSpeakers[Math.floor(Math.random() * potentialSpeakers.length)];
            const speakerFacts = spreadableFacts.filter(sf => sf.npcId === speakerId);
            const factToSpread = speakerFacts[Math.floor(Math.random() * speakerFacts.length)];
            
            // Select a random "listener" who is not the speaker and doesn't already know the fact
            const potentialListeners = localNpcs.filter(id => id !== speakerId && !gameState.npcMemory[id]?.knownFacts.some(kf => kf.text === factToSpread.fact.text));
            if (potentialListeners.length === 0) continue;
            const listenerId = potentialListeners[Math.floor(Math.random() * potentialListeners.length)];

            const speaker = NPCS[speakerId];
            const listener = NPCS[listenerId];
            
            if (!speaker || !listener) continue;

            // 4. (Optional but immersive) Mutate the fact's text
            const rephraseResult = await GeminiService.rephraseFactForGossip(factToSpread.fact.text, speaker.initialPersonalityPrompt, listener.initialPersonalityPrompt);
            addGeminiLog('rephraseFactForGossip', rephraseResult.promptSent, rephraseResult.rawResponse);
            const rephrasedText = (rephraseResult.text && !rephraseResult.text.startsWith("Error")) ? rephraseResult.text : factToSpread.fact.text;

            const newGossipFact: KnownFact = {
                id: crypto.randomUUID(),
                text: rephrasedText,
                source: 'gossip',
                sourceNpcId: speakerId,
                isPublic: false, // Gossip is not re-spread in this simple model
                timestamp: gameState.gameTime.getTime(),
                strength: factToSpread.fact.strength - 1, // Gossip is slightly less impactful
                lifespan: 10, // Gossip fades more quickly
            };

            // 5. Prepare the batch update payload
            if (!gossipUpdatePayload[listenerId]) {
                gossipUpdatePayload[listenerId] = { newFacts: [], dispositionNudge: 0 };
            }
            gossipUpdatePayload[listenerId].newFacts.push(newGossipFact);
            // Small disposition nudge for hearing news (can be positive or negative based on fact)
            gossipUpdatePayload[listenerId].dispositionNudge += factToSpread.fact.text.includes('succeeded') ? 1 : -1;
            
            totalExchanges++;
        }
         if (totalExchanges >= NpcBehaviorConfig.MAX_TOTAL_GOSSIP_EXCHANGES) break;
    }
    
    // --- NEW: PHASE 2 - Cross-Location Gossip Propagation ---
    let crossLocationExchanges = 0;

    const locationsWithLinks = Object.values(LOCATIONS).filter(loc => loc.gossipLinks && loc.gossipLinks.length > 0);
    locationsWithLinks.sort(() => 0.5 - Math.random());

    for (const sourceLocation of locationsWithLinks) {
        if (totalExchanges >= NpcBehaviorConfig.MAX_TOTAL_GOSSIP_EXCHANGES || crossLocationExchanges >= NpcBehaviorConfig.MAX_CROSS_LOCATION_EXCHANGES) break;
        if (!sourceLocation.gossipLinks) continue;

        const destinationLocationId = sourceLocation.gossipLinks[Math.floor(Math.random() * sourceLocation.gossipLinks.length)];
        const destinationLocation = LOCATIONS[destinationLocationId];

        if (!destinationLocation) continue;

        const sourceNpcs = npcsByLocation[sourceLocation.id] || [];
        const destNpcs = npcsByLocation[destinationLocation.id] || [];
        
        if (sourceNpcs.length === 0 || destNpcs.length === 0) continue;

        const potentialSourceFacts = spreadableFacts.filter(sf => sourceNpcs.includes(sf.npcId));
        if (potentialSourceFacts.length === 0) continue;
        
        const factToSpread = potentialSourceFacts[Math.floor(Math.random() * potentialSourceFacts.length)];
        const speakerId = factToSpread.npcId;
        const speaker = NPCS[speakerId];
        if (!speaker) continue;

        const potentialListeners = destNpcs.filter(id => !gameState.npcMemory[id]?.knownFacts.some(kf => kf.text === factToSpread.fact.text));
        if (potentialListeners.length === 0) continue;
        
        const listenerId = potentialListeners[Math.floor(Math.random() * potentialListeners.length)];
        const listener = NPCS[listenerId];
        if (!listener) continue;

        const rephraseResult = await GeminiService.rephraseFactForGossip(factToSpread.fact.text, speaker.initialPersonalityPrompt, listener.initialPersonalityPrompt);
        addGeminiLog('rephraseFactForGossip (cross-location)', rephraseResult.promptSent, rephraseResult.rawResponse);
        const rephrasedText = (rephraseResult.text && !rephraseResult.text.startsWith("Error")) ? rephraseResult.text : factToSpread.fact.text;

        const newGossipFact: KnownFact = {
            id: crypto.randomUUID(),
            text: rephrasedText,
            source: 'gossip',
            sourceNpcId: speakerId,
            isPublic: false,
            timestamp: gameState.gameTime.getTime(),
            strength: factToSpread.fact.strength - 1,
            lifespan: 10,
        };

        if (!gossipUpdatePayload[listenerId]) {
            gossipUpdatePayload[listenerId] = { newFacts: [], dispositionNudge: 0 };
        }
        gossipUpdatePayload[listenerId].newFacts.push(newGossipFact);
        gossipUpdatePayload[listenerId].dispositionNudge += factToSpread.fact.text.includes('succeeded') ? 1 : -1;
        
        totalExchanges++;
        crossLocationExchanges++;
    }


    // 6. Dispatch a single action with all updates
    if (Object.keys(gossipUpdatePayload).length > 0) {
        dispatch({ type: 'PROCESS_Gossip_UPDATES', payload: gossipUpdatePayload });
    }
}

/**
 * Simulates NPCs discovering evidence ("residue") left by the player.
 * This runs during a long rest to represent the passage of time.
 * @param gameState The current game state.
 * @param dispatch The dispatch function to update the game state.
 */
export async function handleResidueChecks(
  gameState: GameState,
  dispatch: React.Dispatch<AppAction>
): Promise<void> {
  for (const locationId in gameState.locationResidues) {
    const residue = gameState.locationResidues[locationId];
    if (residue) {
      // Simulate a Perception check for the designated NPC.
      // A simple probability model is used here instead of a full character sheet for the NPC.
      const discoveryChance = Math.max(0.05, (21 - residue.discoveryDc) / 20.0);

      if (Math.random() < discoveryChance) {
        const discovererNpc = NPCS[residue.discovererNpcId];
        const location = LOCATIONS[locationId];
        if (!discovererNpc || !location) continue;

        const discoveryEntryId = crypto.randomUUID();

        // 1. Create a new KnownFact for the NPC, linking it to the discovery entry ID.
        const newFact: KnownFact = {
          id: crypto.randomUUID(),
          text: residue.text,
          source: 'direct', // They discovered the evidence directly.
          isPublic: true,    // Discovering a crime is often public/spreadable info.
          timestamp: gameState.gameTime.getTime(),
          strength: 7,       // Discovering evidence is significant.
          lifespan: 999,
          sourceDiscoveryId: discoveryEntryId, // Link the fact to the discovery event
        };
        dispatch({ type: 'ADD_NPC_KNOWN_FACT', payload: { npcId: residue.discovererNpcId, fact: newFact }});

        // 2. Remove the residue from the world.
        dispatch({ type: 'REMOVE_LOCATION_RESIDUE', payload: { locationId } });

        // 3. Create a Discovery Journal entry to inform the player, using the pre-generated ID.
        dispatch({
          type: 'ADD_DISCOVERY_ENTRY',
          payload: {
            id: discoveryEntryId, // Pass the pre-generated ID to the reducer
            gameTime: new Date(gameState.gameTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: DiscoveryType.ACTION_DISCOVERED,
            title: 'Past Action Discovered',
            content: `While you were resting, ${discovererNpc.name} discovered the evidence you left at ${location.name}. They now know that "${residue.text}"`,
            source: { type: 'NPC', id: discovererNpc.id, name: discovererNpc.name },
            flags: [
              { key: 'npcId', value: discovererNpc.id, label: discovererNpc.name },
              { key: 'locationId', value: locationId, label: location.name },
            ],
          },
        });
      }
    }
  }
}


/**
 * Handles the immediate spread of gossip after a public, egregious act.
 * @param gameState The current game state.
 * @param dispatch The dispatch function.
 * @param addGeminiLog Function to log AI interactions.
 * @param witnesses An array of NPC IDs who witnessed the event.
 * @param factToSpread The KnownFact object representing the event.
 * @param originalTargetNpcId Optional ID of the direct target of the action.
 */
export async function handleImmediateGossip(
  gameState: GameState,
  dispatch: React.Dispatch<AppAction>,
  addGeminiLog: AddGeminiLogFn,
  witnesses: string[],
  factToSpread: KnownFact,
  originalTargetNpcId?: string | null
): Promise<void> {
  if (witnesses.length === 0) return;

  // If there was a direct target, they are the source. If not (e.g., vandalism),
  // pick a random witness to be the "first to speak up."
  const sourceNpcId = originalTargetNpcId || witnesses[Math.floor(Math.random() * witnesses.length)];
  const speaker = NPCS[sourceNpcId];
  if (!speaker) return;

  const gossipUpdatePayload: GossipUpdatePayload = {};
  
  // The listeners are all witnesses EXCEPT the chosen source.
  const listeners = witnesses.filter(id => id !== sourceNpcId);

  for (const listenerId of listeners) {
    const listener = NPCS[listenerId];
    if (!listener) continue;

    const rephraseResult = await GeminiService.rephraseFactForGossip(factToSpread.text, speaker.initialPersonalityPrompt, listener.initialPersonalityPrompt);
    addGeminiLog('rephraseFactForGossip (immediate)', rephraseResult.promptSent, rephraseResult.rawResponse);
    const rephrasedText = (rephraseResult.text && !rephraseResult.text.startsWith("Error")) ? rephraseResult.text : factToSpread.text;

    const newGossipFact: KnownFact = {
      id: crypto.randomUUID(),
      text: rephrasedText,
      source: 'gossip',
      sourceNpcId: sourceNpcId,
      isPublic: false, // Don't re-spread this immediate gossip in the next Long Rest event.
      timestamp: gameState.gameTime.getTime(),
      strength: factToSpread.strength, // Same significance
      lifespan: 10, // Fades relatively quickly
    };

    if (!gossipUpdatePayload[listenerId]) {
      gossipUpdatePayload[listenerId] = { newFacts: [], dispositionNudge: 0 };
    }
    gossipUpdatePayload[listenerId].newFacts.push(newGossipFact);
    // Egregious acts have a strong negative impact on disposition.
    gossipUpdatePayload[listenerId].dispositionNudge += -10;
  }

  if (Object.keys(gossipUpdatePayload).length > 0) {
    dispatch({ type: 'PROCESS_Gossip_UPDATES', payload: gossipUpdatePayload });
  }
}

/**
 * Calculates all "overnight" NPC memory changes: fact decay, memory pruning, and disposition drift.
 * This is a PURE function; it computes and returns the new state but does not dispatch any actions.
 * This is called by `handleLongRest` to create a single, batched update for maximum performance.
 *
 * DEPENDS ON: `gameState.npcMemory` for the current state of all NPCs. `gameState.gameTime` for the current time.
 * MODIFIES: Nothing directly. It returns a new object.
 * AFFECTS: The entire `npcMemory` state slice when its result is dispatched.
 *
 * @param gameState The current, complete game state.
 * @returns A new, updated `npcMemory` object reflecting all long-term changes.
 */
export function handleLongRestWorldEvents(gameState: GameState): GameState['npcMemory'] {
    const DRIFT_THRESHOLD_MS = NpcBehaviorConfig.DRIFT_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
    const currentTime = gameState.gameTime.getTime();

    // Create a deep copy to modify safely without affecting the original state.
    const newNpcMemory: Record<string, NpcMemory> = JSON.parse(JSON.stringify(gameState.npcMemory));

    for (const npcId in newNpcMemory) {
        const memory = newNpcMemory[npcId];
        
        // --- 1. Fact Decay & Pruning Logic ---
        
        // First, decay the lifespan of all facts that are not permanent.
        memory.knownFacts = memory.knownFacts.map((fact: KnownFact) => ({
            ...fact,
            // Permanent facts (lifespan 999+) are not decayed.
            lifespan: (fact.lifespan < 999) ? fact.lifespan - 1 : fact.lifespan,
        })).filter((fact: KnownFact) => fact.lifespan > 0); // Then, remove facts that have expired.

        // If, after decay, the NPC still knows too much, prune the least important facts.
        if (memory.knownFacts.length > NpcBehaviorConfig.MAX_FACTS_PER_NPC) {
            // Sort by lowest strength first, then oldest timestamp.
            memory.knownFacts.sort((a: KnownFact, b: KnownFact) => a.strength - b.strength || a.timestamp - b.timestamp);
            // Slice the array to keep only the most important/recent facts.
            memory.knownFacts = memory.knownFacts.slice(memory.knownFacts.length - NpcBehaviorConfig.MAX_FACTS_PER_NPC);
        }

        // --- 2. Disposition Drift Logic ---
        
        const timeSinceInteraction = currentTime - (memory.lastInteractionTimestamp || 0);

        // If it's been a while since the player talked to this NPC, their feelings (positive or negative) fade.
        if (timeSinceInteraction > DRIFT_THRESHOLD_MS && memory.disposition !== 0) {
           // Nudge disposition 5% closer to zero, rounding to the nearest integer.
           const newDisposition = Math.round(memory.disposition * 0.95);
           // If the drift is very small (e.g., from 1 to 0.95), just set it to 0 to prevent lingering decimals.
           memory.disposition = (Math.abs(newDisposition) < 1) ? 0 : newDisposition;
        }
    }
    return newNpcMemory;
}