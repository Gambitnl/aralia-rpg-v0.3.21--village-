# Aralia RPG - Documentation Index

This file serves as a central index for all README documentation within the Aralia RPG project. It helps in navigating and understanding the purpose of different documentation files.

## Root Level (Now in `docs/`)

*   **[`PROJECT_OVERVIEW.README.md`](./PROJECT_OVERVIEW.README.md)**: The main entry point for the project. Provides a high-level overview, core features, technology stack, setup instructions, project structure, and links to other key documents.
*   **[`DOCUMENTATION_GUIDE.md`](./DOCUMENTATION_GUIDE.md)**: Explains the project's documentation strategy, README structure guidelines, naming conventions, and how to maintain documentation.
*   **[`CHANGELOG.md`](./CHANGELOG.md)**: Tracks a high-level overview of notable changes to the application, linking to component-specific changelogs for details.
*   **[`README_INDEX.md`](./README_INDEX.md)**: This file. An index of all READMEs.
*   **[`FEATURES_TODO.md`](./FEATURES_TODO.md)**: A comprehensive list of planned features, enhancements, and tasks for future development.
*   **[`QOL_TODO.md`](./QOL_TODO.md)**: Lists Quality of Life improvements and general TODO items identified from code reviews and planning.
*   **[`POTENTIAL_TOOL_INTEGRATIONS.README.md`](./POTENTIAL_TOOL_INTEGRATIONS.README.md)**: Lists potential tools and libraries that could be integrated to enhance the application.

## Guides (`docs/guides/`)
*   **[`docs/guides/CLASS_ADDITION_GUIDE.md`](./guides/CLASS_ADDITION_GUIDE.md)**: A comprehensive guide on how to add a new character class to the Aralia RPG.
*   **[`docs/guides/RACE_ADDITION_GUIDE.md`](./guides/RACE_ADDITION_GUIDE.md)**: A guide on how to add a new character race.
*   **[`docs/guides/GLOSSARY_ENTRY_DESIGN_GUIDE.md`](./guides/GLOSSARY_ENTRY_DESIGN_GUIDE.md)**: Outlines the structure, content, and styling conventions for creating and updating glossary entries.
*   **[`docs/guides/SPELL_DATA_CREATION_GUIDE.md`](./guides/SPELL_DATA_CREATION_GUIDE.md)**: A guide for creating the structured JSON data files for spells.
*   **[`docs/guides/SPELL_ADDITION_WORKFLOW_GUIDE.md`](./guides/SPELL_ADDITION_WORKFLOW_GUIDE.md)**: A guide for using the `add_spell.js` script to streamline adding new spells.
*   **[`docs/guides/TABLE_CREATION_GUIDE.md`](./guides/TABLE_CREATION_GUIDE.md)**: A detailed guide on creating standard Markdown tables and custom HTML tables.
*   **[`docs/guides/NPC_MECHANICS_IMPLEMENTATION_GUIDE.md`](./guides/NPC_MECHANICS_IMPLEMENTATION_GUIDE.md)**: A comprehensive guide outlining the phased implementation plan for the 'Living NPC' and 'Plausibility & Suspicion' systems.
*   **[`docs/guides/NPC_GOSSIP_SYSTEM_GUIDE.md`](./guides/NPC_GOSSIP_SYSTEM_GUIDE.md)**: A detailed checklist for implementing the Gossip & Witness system.

## Changelogs (`docs/changelogs/`)
*   **[`docs/changelogs/BATTLEMAP_CHANGELOG.md`](./changelogs/BATTLEMAP_CHANGELOG.md)**: Details changes specifically related to the Battle Map feature.
*   **[`docs/changelogs/SPELLBOOK_CHANGELOG.md`](./changelogs/SPELLBOOK_CHANGELOG.md)**: Details changes to the spellbook UI and spellcasting data model.
*   **[`docs/changelogs/STATE_MANAGEMENT_CHANGELOG.md`](./changelogs/STATE_MANAGEMENT_CHANGELOG.md)**: Details changes related to the state management architecture refactor.
*   **[`docs/changelogs/CHARACTER_CREATOR_CHANGELOG.md`](./changelogs/CHARACTER_CREATOR_CHANGELOG.md)**: Details the major refactor and feature additions to the character creation system.
*   **[`docs/changelogs/LIVING_NPC_CHANGELOG.md`](./changelogs/LIVING_NPC_CHANGELOG.md)**: Details the implementation of the "Living NPC" system, including gossip and reputation.

## Source Code Documentation (`src/`)

### Core Application

*   **[`src/App.README.md`](../src/App.README.md)**: Documents the root React component `App.tsx`.

### State Management (`src/state/`)
*   **[`src/state/appState.README.md`](../src/state/appState.README.md)**: Details the `appState.ts` root reducer module.
*   **[`src/state/actionTypes.README.md`](../src/state/actionTypes.README.md)**: Explains the purpose of the `actionTypes.ts` file.
*   **`src/state/reducers/uiReducer.README.md`**: Documents the UI slice reducer.
*   **`src/state/reducers/characterReducer.README.md`**: Documents the character slice reducer.
*   **`src/state/reducers/worldReducer.README.md`**: Documents the world slice reducer.
*   **`src/state/reducers/logReducer.README.md`**: Documents the log slice reducer.
*   **`src/state/reducers/encounterReducer.README.md`**: Documents the encounter slice reducer.
*   **`src/state/reducers/npcReducer.README.md`**: Documents the NPC memory slice reducer.

### Config (`src/config/`)
*   **[`src/config/mapConfig.README.md`](../src/config/mapConfig.README.md)**: Documents the `mapConfig.ts` module.
*   **[`src/config/characterCreationConfig.README.md`](../src/config/characterCreationConfig.README.md)**: Documents the `characterCreationConfig.ts` module.
*   **[`src/config/npcBehaviorConfig.README.md`](../src/config/npcBehaviorConfig.README.md)**: Documents the `npcBehaviorConfig.ts` module.
*   **[`src/config/submapVisualsConfig.README.md`](../src/config/submapVisualsConfig.README.md)**: Documents the `submapVisualsConfig.ts` module.

### Custom Hooks (`src/hooks/`)
*   **[`src/hooks/useAudio.README.md`](../src/hooks/useAudio.README.md)**: Explains the `useAudio.ts` custom hook.
*   **[`src/hooks/useGameActions.README.md`](../src/hooks/useGameActions.README.md)**: Documents the `useGameActions.ts` custom hook.
*   **[`src/hooks/useGameInitialization.README.md`](../src/hooks/useGameInitialization.README.md)**: Details the `useGameInitialization.ts` custom hook.
*   **[`src/hooks/useSubmapProceduralData.README.md`](../src/hooks/useSubmapProceduralData.README.md)**: Details the `useSubmapProceduralData.ts` custom hook.

### Action Handlers (`src/hooks/actions/`)
*   **[`src/hooks/actions/actionHandlerTypes.README.md`](../src/hooks/actions/actionHandlerTypes.README.md)**: Documents the shared types for action handlers.
*   **[`src/hooks/actions/handleMovement.README.md`](../src/hooks/actions/handleMovement.README.md)**: Documents the movement action handler.
*   **[`src/hooks/actions/handleObservation.README.md`](../src/hooks/actions/handleObservation.README.md)**: Documents the observation action handlers.
*   **[`src/hooks/actions/handleNpcInteraction.README.md`](../src/hooks/actions/handleNpcInteraction.README.md)**: Documents the NPC interaction handler.
*   **[`src/hooks/actions/handleItemInteraction.README.md`](../src/hooks/actions/handleItemInteraction.README.md)**: Documents the item interaction handlers.
*   **[`src/hooks/actions/handleOracle.README.md`](../src/hooks/actions/handleOracle.README.md)**: Documents the Oracle query handler.
*   **[`src/hooks/actions/handleGeminiCustom.README.md`](../src/hooks/actions/handleGeminiCustom.README.md)**: Documents the custom Gemini action handler.
*   **[`src/hooks/actions/handleEncounter.README.md`](../src/hooks/actions/handleEncounter.README.md)**: Documents the encounter-related action handlers.
*   **[`src/hooks/actions/handleResourceActions.README.md`](../src/hooks/actions/handleResourceActions.md)**: Documents resource management action handlers.
*   **[`src/hooks/actions/handleSystemAndUi.README.md`](../src/hooks/actions/handleSystemAndUi.README.md)**: Documents system and UI action handlers.

### Components (`src/components/`)

*   **`src/components/CharacterCreator/CharacterCreator.README.md`**: Details the main `CharacterCreator.tsx` component.
*   **`src/components/CharacterCreator/Race/RaceSelection.README.md`**: Explains the `RaceSelection.tsx` component.
*   **`src/components/CharacterCreator/Race/RaceDetailModal.README.md`**: Documents the extracted `RaceDetailModal.tsx` component.
*   **`src/components/CharacterCreator/AbilityScoreAllocation.README.md`**: Covers `AbilityScoreAllocation.tsx`.
*   **`src/components/CharacterCreator/SkillSelection.README.md`**: Documents `SkillSelection.tsx`.
*   **`src/components/CharacterCreator/NameAndReview.README.md`**: Documents `NameAndReview.tsx`.
*   **`src/components/CompassPane.README.md`**: Details the compass navigation UI.
*   **`src/components/ActionPane.README.md`**: Documents the action button UI.
*   **`src/components/BattleMap/BattleMap.README.md`**: Details the Battle Map feature.
*   **`src/components/MapPane.README.md`**: Documents the `MapPane.tsx` component.
*   **`src/components/SubmapPane.README.md`**: Documents the `SubmapPane.tsx` component.
*   **`src/components/Tooltip.README.md`**: Explains the reusable `Tooltip.tsx` component.
*   **`src/components/GlossaryTooltip.README.md`**: Explains the `GlossaryTooltip.tsx` component.
*   **`src/components/PartyPane.README.md`**: Details the `PartyPane.tsx` component.
*   **`src/components/PartyOverlay.README.md`**: Details the `PartyOverlay.tsx` component.
*   **`src/components/CharacterSheetModal.README.md`**: Documents the `CharacterSheetModal.tsx` component.
*   **`src/components/EquipmentMannequin.README.md`**: Explains the `EquipmentMannequin.tsx` component.
*   **`src/components/InventoryList.README.md`**: Explains the component for displaying the character's inventory.
*   **`src/components/ErrorBoundary.README.md`**: Documents the `ErrorBoundary.tsx` component.
*   **`src/components/Glossary.README.md`**: Details the `Glossary.tsx` component.
*   **`src/components/GlossaryDisplay.README.md`**: Details the `GlossaryDisplay.tsx` component.
*   **`src/components/DevMenu.README.md`**: Explains the `DevMenu.tsx` component.
*   **`src/components/GeminiLogViewer.README.md`**: Documents the `GeminiLogViewer.tsx` component.
*   **`src/components/DiscoveryLogPane.README.md`**: Details the `DiscoveryLogPane.tsx` component.
*   **`src/components/SpellbookOverlay.README.md`**: Documents the new `SpellbookOverlay.tsx` component.


### Services (`src/services/`)

*   **`src/services/aiClient.README.md`**: Details `aiClient.ts`.
*   **`src/services/mapService.README.md`**: Documents `mapService.ts`.
*   **`src/services/saveLoad.README.md`**: Details `saveLoadService.ts`.
*   **`src/services/geminiService.README.md`**: Documents `geminiService.ts`.
*   **`src/services/ttsService.README.md`**: Documents `ttsService.ts`.


### Utilities (`src/utils/`)

*   **[`src/utils/README.md`](../src/utils/README.md)**: Describes the purpose of the `src/utils/` directory.
*   **[`src/utils/characterUtils.README.md`](../src/utils/characterUtils.README.md)**: Documents the utility functions in `characterUtils.ts`.
*   **[`src/utils/actionUtils.README.md`](../src/utils/actionUtils.README.md)**: Documents the diegetic action message generator.
*   **[`src/utils/encounterUtils.README.md`](../src/utils/encounterUtils.README.md)**: Documents the encounter calculation and validation utilities.
*   **[`src/utils/spellUtils.README.md`](../src/utils/spellUtils.README.md)**: Documents the centralized spell aggregation logic.


### Data Definitions (`src/data/`)

*   **`src/data/biomes.README.md`**: Explains the structure of `src/data/biomes.ts`.
*   **`src/data/classes/CLASSES.README.md`**: Documents `src/data/classes/index.ts`.
*   **`src/data/items/ITEMS.README.md`**: Explains the structure of `src/data/items/index.ts`.
*   **`src/data/skills/SKILLS.README.md`**: Documents `src/data/skills/index.ts`.
*   **`src/data/spells/SPELLS.README.md`**: Explains the structure of `src/data/spells/index.ts`.
*   **`src/data/world/LOCATIONS.README.md`**: Details the structure of `src/data/world/locations.ts`.
*   **`src/data/world/NPCS.README.md`**: Details the structure of `src/data/world/npcs.ts`.
*   **`src/data/settings/TTS_OPTIONS.README.md`**: Details the structure of `src/data/settings/ttsOptions.ts`.
*   **`src/data/dev/DUMMY_CHARACTER.README.md`**: Explains `src/data/dev/dummyCharacter.ts`.

---
*This index should be updated whenever a new README is added or an existing one is significantly modified.*