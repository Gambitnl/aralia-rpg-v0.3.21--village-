# useGameInitialization Hook (`src/hooks/useGameInitialization.ts`)

## Purpose

The `useGameInitialization` custom React hook consolidates the logic related to initializing the game state for different scenarios in Aralia RPG. This includes:

1.  Starting a completely new game (which involves setting up the character creation phase).
2.  Skipping character creation and starting directly with a dummy character (for development).
3.  Loading a previously saved game.
4.  Finalizing character creation and starting the game (the `startGame` callback).
5.  Initializing the dummy player state if auto-starting in development mode.

This hook aims to make `App.tsx` cleaner by abstracting these setup flows.

## Interface

```typescript
interface UseGameInitializationProps {
  dispatch: React.Dispatch<AppAction>;
  addMessage: AddMessageFn;
  currentMapData: MapData | null;
}

interface UseGameInitializationOutput {
  handleNewGame: () => void;
  handleSkipCharacterCreator: () => void;
  handleLoadGameFlow: () => Promise<void>;
  startGame: (character: PlayerCharacter) => Promise<void>;
  initializeDummyPlayerState: () => void;
}

function useGameInitialization(props: UseGameInitializationProps): UseGameInitializationOutput;
```

*   **`dispatch: React.Dispatch<AppAction>`**: The dispatch function from `App.tsx`'s `useReducer` hook for updating the game state.
*   **`addMessage: AddMessageFn`**: Callback to add messages to the game log.
*   **`currentMapData: MapData | null`**: The current map data from `gameState.mapData`, used by `startGame` to avoid re-generating the map if one already exists (e.g., from `handleNewGame` setting up for character creation).

## Return Value

The hook returns an object containing several memoized callback functions:

*   **`handleNewGame: () => void`**:
    *   Generates initial dynamic item states and a new world map.
    *   Dispatches `START_NEW_GAME_SETUP` to transition the game to the `CHARACTER_CREATION` phase and set up initial map/item data.

*   **`handleSkipCharacterCreator: () => void`**:
    *   Generates initial dynamic item states and a new world map.
    *   Dispatches `START_GAME_FOR_DUMMY` to directly start the game with the `DUMMY_CHARACTER_FOR_DEV`.

*   **`handleLoadGameFlow: () => Promise<void>`**:
    *   Asynchronously loads game state using `SaveLoadService.loadGame()`.
    *   Dispatches `LOAD_GAME_SUCCESS` if successful, or handles failure by logging a message and setting the game phase to `MAIN_MENU`.
    *   Manages loading state via `dispatch`.

*   **`startGame: (character: PlayerCharacter) => Promise<void>`**:
    *   Intended to be called after character creation is complete.
    *   Takes the created `PlayerCharacter` object.
    *   Sets up initial dynamic items.
    *   Uses `currentMapData` if available, otherwise generates a new map.
    *   Dispatches `START_GAME_SUCCESS` with the new character, map data, and initial location details.

*   **`initializeDummyPlayerState: () => void`**:
    *   Specifically for the auto-start scenario with `DUMMY_CHARACTER_FOR_DEV`.
    *   Sets up map data and initial messages for the dummy character when `App.tsx`'s effect detects this scenario.
    *   Dispatches `INITIALIZE_DUMMY_PLAYER_STATE`.

## Usage

```typescript
// In App.tsx
import { useGameInitialization } from './hooks/useGameInitialization';
// ... other imports ...

const App: React.FC = () => {
  const [gameState, dispatch] = useReducer(appReducer, initialGameState);
  const addMessage = useCallback(/* ... */);

  const {
    handleNewGame,
    handleSkipCharacterCreator,
    handleLoadGameFlow,
    startGame,
    initializeDummyPlayerState,
  } = useGameInitialization({
    dispatch,
    addMessage,
    currentMapData: gameState.mapData,
  });

  // Used in MainMenu props
  // onNewGame={handleNewGame}
  // onSkipCharacterCreator={handleSkipCharacterCreator}
  // onLoadGame={handleLoadGameFlow}

  // Used in CharacterCreator props
  // onCharacterCreate={startGame}

  // Used in App.tsx's useEffect for dummy char auto-start
  // useEffect(() => { if (/* condition */) initializeDummyPlayerState(); }, [/* deps */]);

  // ... rest of App.tsx ...
};
```

## Benefits

*   **Abstraction**: Hides the detailed logic of different game start scenarios from `App.tsx`.
*   **Organization**: Groups related setup functions together.
*   **Clarity**: Improves the readability of `App.tsx` by reducing the number of top-level callback definitions.
*   **Memoization**: All returned handlers are memoized with `useCallback`, ensuring stable references if passed as props.

## Dependencies
*   `react`: For `useCallback`.
*   `../types`: For `GameState`, `GamePhase`, `PlayerCharacter`, `MapData`.
*   `../state/appState`: For `AppAction` type.
*   `../constants`: For `STARTING_LOCATION_ID`, `LOCATIONS`, `MAP_GRID_SIZE`, `BIOMES`, `SUBMAP_DIMENSIONS`.
*   `../services/mapService`: For `generateMap`.
*   `../services/saveLoadService`: For `loadGame`.
