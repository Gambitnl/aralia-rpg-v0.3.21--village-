# Aralia RPG

Welcome to the Aralia RPG project! This document provides a high-level overview of the project, its core features, technology stack, and development practices.

For a complete index of all documentation, please see the [README Index](./docs/README_INDEX.md).

## 1. Core Features

*   **Dynamic Storytelling**: Utilizes the Google Gemini API to generate dynamic location descriptions, NPC dialogue, and action outcomes, creating a unique adventure every time.
*   **Text-Based RPG Core**: Classic text adventure gameplay loop focusing on exploration, interaction, and choice.
*   **Character Creation**: A multi-step process for players to create their unique D&D-style character, choosing from various races and classes.
*   **Inventory & Equipment System**: Players can find, collect, and manage items. (Full equipping mechanics are in development).
*   **Exploration-Focused Gameplay**: The game encourages exploration through a grid-based world map and detailed sub-maps for local areas.
*   **Tactical Battle Map**: A procedural, grid-based combat system featuring a D&D 5e-style action economy for tactical encounters.
*   **Developer Mode**: Includes a "dummy character" to bypass character creation for rapid testing and a developer menu for quick actions like save/load.
*   **Save/Load System**: Persists game state to the browser's Local Storage.

## 2. Technology Stack & Architecture

### Core Stack
*   **Framework**: **React** (v19) using modern features like hooks.
*   **Language**: **TypeScript** for type safety.
*   **Styling**: **Tailwind CSS** for utility-first styling, compiled with PostCSS via the `index.css` entry file.
*   **Modules**: The app uses native **ES6 Modules** with Vite for development and build. The `index.html` file contains a `<script type="importmap">` which defines how modules like `react`, `@google/genai`, etc., can be loaded directly from `esm.sh`.
*   **AI Integration**: The app uses the **`@google/genai`** SDK for all interactions with the Gemini models. This is a core, unchangeable requirement.

### Architectural Constraints (What I Can't Do)

Because this is a client-side, static application without a traditional build pipeline, there are some hard limitations:
*   **No Backend**: I cannot add a server, a database (like MySQL, MongoDB), or server-side languages (like Node.js, Python, PHP). All state must be managed on the client or saved to Local Storage.
*   **No New Top-Level Files**: I cannot add new files to the absolute root directory. New files should be placed in appropriate subdirectories (e.g., `src/components/`, `src/hooks/`).

### Architectural Possibilities (Thinking Outside the Box)

While we can't use a build system, we **can** introduce new client-side libraries via the import-map. This is where you can guide me to build more advanced features. For inspiration, refer to the `docs/POTENTIAL_TOOL_INTEGRATIONS.README.md` file.

**You could ask me to:**
*   "Integrate **Zustand** to manage our game state more effectively instead of passing props everywhere."
*   "Use **Headless UI** to build a new, fully accessible modal component."
*   "Refactor the Oracle query form to use **React Hook Form** for better state management and validation."
*   "Animate the appearance of the new quest log using **Framer Motion**."

Mentioning these possibilities helps me understand that you're open to evolving the tech stack within our constraints.

## 3. Project Structure

The project follows a component-based architecture with a clear separation of concerns.

*   **`index.html`**: The main entry point. Links the compiled Tailwind CSS, loads fonts, and the root React script. Contains the `importmap`.
*   **`index.tsx`**: Renders the `App` component into the DOM.
*   **`src/`**: The main source code directory.
    *   **`App.tsx`**: The root React component, managing overall game state and logic. See [`src/App.README.md`](./src/App.README.md).
    *   **`components/`**: Reusable React components that make up the UI.
        *   Each significant component has its own subdirectory and `[ComponentName].README.md`.
        *   **`CharacterCreator/`**: Contains all components related to the multi-step character creation process. See [`src/components/CharacterCreator/CharacterCreator.README.md`](./src/components/CharacterCreator/CharacterCreator.README.md).
    *   **`services/`**: Modules responsible for external interactions (e.g., Gemini API, Local Storage).
    *   **`hooks/`**: Custom React hooks for encapsulating complex, reusable logic (e.g., `useGameActions`, `useAudio`).
    *   **`data/`**: Static game data definitions (races, classes, items, etc.), decoupled from `constants.ts`.
    *   **`state/`**: Centralized state management logic (`appReducer`, `initialGameState`).
    *   **`utils/`**: General-purpose utility functions (e.g., character stat calculations).
    *   **`types.ts`**: Contains all core TypeScript type definitions and interfaces.
    *   **`constants.ts`**: Centralizes global constants and re-exports aggregated data from the `src/data/` modules.
*   **`docs/`**: All project documentation, including this overview, guides, and READMEs for different modules.
*   **`public/`**: Static assets like images or data files that need to be publicly accessible.
    *   **`public/data/glossary/`**: Contains the Markdown source files and generated JSON indexes for the in-game glossary.
*   **`scripts/`**: Build scripts, such as the one for generating the glossary index.

## 4. Key Development Practices

### Dummy Character for Development
*   The `USE_DUMMY_CHARACTER_FOR_DEV` flag in `src/constants.ts` can be set to `true`.
*   This bypasses the character creation screen and starts the game immediately with a predefined character, speeding up development and testing of game mechanics.

### Code Formatting
*   Code is formatted using Prettier with default settings to ensure consistency.

## 5. How to Add New Game Content

### Adding a New Race
Please follow the detailed guide: **[`docs/guides/RACE_ADDITION_GUIDE.md`](./docs/guides/RACE_ADDITION_GUIDE.md)**

### Adding a New Class
Please follow the detailed guide: **[`docs/guides/CLASS_ADDITION_GUIDE.md`](./docs/guides/CLASS_ADDITION_GUIDE.md)**
