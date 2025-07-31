# Aralia RPG - Feature TODO List

This file tracks planned features, enhancements, and tasks for the Aralia RPG project.

## Core Gameplay Systems

*   **Saving and Loading Games**:
    *   **[DONE]** Implement functionality to save game progress (player state, inventory, world state including `mapData`, `subMapCoordinates`, game log, dynamic item states, `saveVersion`, `saveTimestamp`).
    *   **[DONE]** Implement functionality to load saved games from a default slot, including version checking and resetting transient UI states.
    *   **[DONE]** Add a "Continue Game" option on the main menu to load the most recent save.
    *   **[DONE]** Provide "Save Game" button in `ActionPane`.
    *   **[DONE]** Allow "Main Menu" button to save game before exiting (if not in dev dummy mode).
    *   **[TODO]** Implement save slots.
    *   See `../src/services/saveLoad.README.md` for design considerations.
*   **Character Sheet & Equipment**:
    *   **[DONE]** Display a Character Sheet modal when a party member is clicked.
    *   **[DONE]** Implement a visual Equipment Mannequin UI with slots.
    *   **[DONE]** Implement logic for equipping and unequipping items.
    *   **[DONE]** Update character stats (AC, etc.) based on equipped items.
*   **Combat System**:
    *   **[v1 Done]** Develop a turn-based tactical combat system on a procedural map.
    *   **[DONE]** Refactored combat system to use a D&D 5e-style action economy (Action, Bonus Action, Reaction, Movement) instead of Action Points.
    *   **[TODO]** Implement a full range of abilities and spells with targeting, area of effect, and status effects.
    *   **[TODO]** Implement enemy AI for combat decisions.
    *   **[TODO]** Integrate damage, healing, and status effect application from `useAbilitySystem` with visual feedback (damage numbers, effect icons).
*   **Quest System**:
    *   **[TODO]** Implement a robust quest system with objectives, tracking, and rewards.
    *   **[TODO]** Allow quests to be given by NPCs or discovered in the world.
*   **Character Progression**:
    *   **[TODO]** Leveling up system.
    *   **[TODO]** Gaining new abilities/spells upon level-up.
    *   **[TODO]** Improving stats or choosing feats.
*   **Feat System**:
    *   **[TODO]** Integrate feats as part of character creation and progression.
    *   *(Note: The 'Versatile' trait for Humans is currently descriptive; no mechanical feat system is implemented yet.)*
*   **Economy System**:
    *   **[TODO]** Introduce currency, shops, and trading.
*   **Rest Mechanics**:
    *   **[DONE]** Implement Short Rest and Long Rest mechanics for recovery of HP, spell slots, and feature uses.
*   **Secure Dice Roll Handling**:
    *   **[TODO]** Implement server-side or secure client-side dice rolls that are not vulnerable to client-side manipulation. User should be able to trigger rolls via a button.
*   **Party Members**:
    *   **[DONE]** System supports multiple party members in state and combat.
    *   **[TODO]** Implement in-game mechanics for NPCs to join or leave the party.
    *   **[TODO]** Basic AI and combat capabilities for party members.
*   **Character Age in Creation**:
    *   **[TODO]** Add Age selection to Character Creation.
    *   **[TODO]** Define and display logical age ranges for each race (e.g., in `src/data/races/`).
    *   **[TODO]** Store and display character age.

## World & Exploration

*   **Advanced World Map Features**:
    *   **[TODO]** Implement more sophisticated procedural generation algorithms for biome zones (e.g., Perlin noise, cellular automata).
    *   **[TODO]** Allow procedural generation of actual `Location` data for unkeyed map tiles, making the world truly dynamic.
    *   **[TODO]** Add map markers for various points of interest, discovered locations, current quests, etc.
    *   **[TODO]** Implement map panning and zooming.
    *   **[TODO]** Explore different grid types (e.g., hexagonal).
*   **Enhanced Submap Tile Descriptiveness**:
    *   **[DONE]** Enhance procedural visual diversity of submap tiles (more icons, colors, feature types).
    *   **[DONE]** Improve pre-inspection tooltip detail for submap tiles, making non-adjacent tiles more informative based on procedural data.
*   **Points of Interest (POI) System**:
    *   **[TODO]** Define a list/data structure for various Points of Interest (e.g., shrines, hidden caves, unique landmarks, minor encounters).
    *   **[TODO]** Implement logic to sparsely distribute these POIs across map tiles, potentially during map generation or as discoverable elements.
    *   **[TODO]** POIs should be distinct from major, predefined `Location` objects and offer minor interactions or flavor.
*   **Towns & Cities**:
    *   **[TODO]** Develop more complex urban environments with unique NPCs, quests, and services.
*   **Enhanced NPCs & Factions**:
    *   **[TODO]** Develop NPCs with more depth, including routines, relationships, and affiliations with factions.
    *   **[TODO]** Dynamic NPC reactions based on player actions and reputation.
*   **In-Game Day/Date/Season**:
    *   **[DONE]** Display current in-game time (HH:MM:SS) in the UI.
    *   **[TODO]** Implement game mechanics or events tied to specific in-game days/dates/seasons.


## AI & Storytelling (Gemini Integration)

*   **DM (Storyteller) Consistency**:
    *   **[TODO]** Improve the consistency of the Gemini-powered storyteller/DM, potentially through better prompting, memory management, or fine-tuning.
*   **Logbook-Fueled Gemini Inference**:
    *   **[TODO]** Utilize the game log/player history to provide Gemini with more context, enabling more consistent and evolving NPC personas, backstories, and potentially emergent side quests based on player actions.
*   **Gemini-Generated Custom Actions**:
    *   **[DONE]** After "Look Around", Gemini suggests 3 custom, non-directional actions.
    *   **[DONE]** These actions are displayed in `ActionPane` and can be selected by the player.
*   **Enrich Tile Inspection Prompt**:
    *   **[DONE]** `generateTileInspectionDetails` prompt now includes rich context (biome, feature names, icon meanings) to improve immersion and reduce game jargon in the response.

## UI/UX Enhancements

*   **Minimap**:
    *   **[TODO]** Implement a small, always-visible (or toggleable) version of the main map.
    *   **[TODO]** Shows the immediate surroundings of the player.
    *   **[TODO]** Could display nearby points of interest or quest indicators.
*   **Map Tile Tooltips**:
    *   **[DONE]** On hover over a tile on the main map: displays biome, coordinates, and location name if present.
    *   **[TODO]** Add POI or quest info to tooltips when those systems are implemented.
*   **Quest Indicators on Map**:
    *   **[TODO]** Display visual indicators (icons) on map tiles that are relevant to active quests (e.g., quest objective location, quest giver).
*   **Inventory Management**:
    *   **[DONE]** Equipping items from inventory.
    *   **[DONE]** Displaying total inventory weight.
    *   **[TODO]** Implement item containers (bags, etc.) and item comparison UI.
*   **Sound Effects and Music**:
    *   **[TODO]** Add ambient sounds for different biomes and locations.
    *   **[TODO]** Implement background music with contextual changes.
*   **Accessibility Improvements**:
    *   **[PARTIALLY DONE]** Current ARIA implementations, keyboard navigation for map, tooltips.
    *   **[TODO]** Continue to enhance accessibility (e.g., full keyboard navigation for all interactive elements, screen reader compatibility testing).
*   **Scene Visuals**:
    *   **[TODO]** Re-integrate the `ImagePane` into the main game UI and test the `generateImageForScene` functionality. (Currently disabled in the active UI to manage API quotas during development).
*   **Tooltips for Keywords**:
    *   **[DONE]** Implemented `Tooltip.tsx` and `GlossaryTooltip.tsx` components.
    *   **[DONE]** Integrated into `WorldPane.tsx` for game messages.
    *   **[DONE]** Integrated into `RaceSelection.tsx` (RaceDetailModal) for D&D terms.
*   **Submap Display**:
    *   **[DONE]** Created `SubmapPane.tsx` for detailed local view.
    *   **[DONE]** Integrated toggle button in `CompassPane`.
*   **Map & Submap Glossary/Legend**:
    *   **[DONE]** Implemented `GlossaryDisplay.tsx`.
    *   **[DONE]** Integrated into `MapPane.tsx` and `SubmapPane.tsx`.

## Technical & System

*   **Comprehensive Documentation**:
    *   **[ONGOING]** Continue to create and update uniquely named READMEs for new components, services, and data structures as per [DOCUMENTATION_GUIDE.md](./DOCUMENTATION_GUIDE.md).
    *   **[ONGOING]** Ensure [README_INDEX.md](./README_INDEX.md) is kept meticulously up-to-date.
*   **Error Handling**:
    *   **[DONE]** Implemented `ErrorBoundary.tsx` and wrapped key UI sections.
*   **Code Quality & Refactoring**:
    *   **[PARTIALLY DONE]** Address items from `QOL_TODO.md`.
    *   **[DONE]** Decoupled data definitions from `constants.ts`.
    *   **[DONE]** Centralized AI client initialization in `aiClient.ts`.
    *   **[DONE]** Refactored `CharacterCreator.tsx` to use `useReducer`.
    *   **[DONE]** Centralized utility functions (e.g., `characterUtils.ts`).
    *   **[DONE]** `App.tsx` state management refactored to `useReducer`.
    *   **[DONE]** `App.tsx` action processing refactored into modular hooks and sub-handlers.