# Gemini Service (`src/services/geminiService.ts`)

## Purpose

The `geminiService.ts` module is responsible for all direct interactions with the Google Gemini API for text and image generation. It encapsulates the logic for constructing prompts, calling the API (via the shared `aiClient`), and processing responses.

## Core Functionality

The service exports several asynchronous functions, each tailored for a specific type of content generation. All text-generating functions return a `GenerateTextResult` object (`{ text: string, promptSent: string, rawResponse: string }`) for detailed logging.

### Key Text Generation Functions

*   `generateLocationDescription(...)`: Generates brief, atmospheric descriptions for game locations.
*   `generateNPCResponse(...)`: Generates NPC dialogue based on their personality and memory context.
*   `generateActionOutcome(...)`: Narrates the result of a player's action.
*   `generateOracleResponse(...)`: Generates cryptic, first-person responses from the Oracle. This now uses the `generateSocialCheckOutcome` structure.
*   `generateTileInspectionDetails(...)`: Generates immersive descriptions for submap tiles, with prompts designed to avoid game jargon.
*   `generateCustomActions(...)`: Suggests contextual actions for the player and returns them in a structured JSON format.
*   `generateEncounter(...)`: Uses Google Search grounding to suggest a themed combat encounter based on party strength.

### Structured JSON for Social Outcomes (Critical Change)

The service has been updated to handle complex social interactions and their consequences more reliably.

*   **`generateSocialCheckOutcome(...)`**:
    *   **Purpose**: To determine the narrative outcome, disposition change, and any goal progression resulting from a social skill check (e.g., Persuasion, Deception).
    *   **AI Prompting**: This function now explicitly instructs the Gemini API to return a **structured JSON object**, not just plain text.
    *   **JSON Payload (`SocialCheckOutcome`)**: The expected JSON object contains:
        *   `outcomeText: string`: The narrative description of what happens.
        *   `dispositionChange: number`: A numerical value representing the change in the NPC's opinion.
        *   `goalUpdate: GoalUpdatePayload | null`: An optional object. If the player's action directly completes or fails a known NPC goal, the AI populates this with the `npcId`, `goalId`, the `newStatus` ('Completed' or 'Failed'), and a `newFact` for the NPC's memory. Otherwise, it is `null`.
    *   **Parsing**: The function includes robust logic to parse this JSON string from the AI's response. It provides sensible defaults if parsing fails, ensuring the game does not crash.

*   **`generateOracleResponse` (Updated)**: This function was refactored to use the same `generateSocialCheckOutcome` structure. This powerfully connects lore discovery to game mechanics, as an Oracle's cryptic clue can now directly trigger a `goalUpdate` if it provides the information an NPC was seeking.

## Dependencies

*   `./aiClient`: For the shared `ai` client instance.
*   `../config`: For model name constants.
*   `../types`: For various game data types.
