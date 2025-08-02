# Gemini Project Overview: Aralia RPG

This document provides a high-level overview of the Aralia RPG project architecture to guide development and AI-assisted tasks.

## Core Architecture: React SPA

The application is a **Single-Page Application (SPA)** built with **React** and **TypeScript**. It follows a modern, component-based architecture designed to separate concerns and promote code reuse.

The key architectural patterns are:

1.  **Component-Based UI (`src/components/`):** The user interface is composed of modular and reusable React components. High-level components (e.g., `MapPane`, `WorldPane`) manage specific sections of the UI, while smaller components handle individual elements.

2.  **Service Layer (`src/services/`):** All complex business logic, external API interactions, and heavy-duty generation tasks are isolated within the service layer. This keeps the UI components clean and focused on rendering. Key services include:
    *   `aiClient.ts`: Handles interactions with AI models.
    *   `battleMapGenerator.ts`: Procedurally generates battle maps.
    *   `townGeneratorService.ts`: The entry point for the ongoing port of the Haxe-based town generator.

3.  **Centralized State Management (`appReducer.ts`, `actionTypes.ts`):** The application uses a Redux-like pattern for predictable state management.
    *   **Actions** are dispatched from UI components or hooks.
    *   The central **`appReducer`** updates the application state in response to these actions.
    *   **Components** subscribe to the state and automatically re-render when relevant data changes.

4.  **Custom Hooks (`src/hooks/`):** Custom hooks are used to encapsulate and reuse stateful logic across multiple components. They act as the glue between the UI components and the underlying services and state management system.

## Town Generator Port

A significant ongoing effort is the port of a Haxe-based town generator into this project. The ported code resides in `src/services/town-generator/` and is being integrated as a new service.

*   **Standalone Goal:** The ultimate goal is to have a "headless" procedural generation library in TypeScript that is completely decoupled from the React UI.
*   **Current Implementation:** The current implementation is partially integrated, with `townGeneratorService.ts` serving as the entry point and `townRasterizer.ts` handling the conversion of the generated data into a format suitable for rendering in the React application.

## Development Workflow

1.  **Code Changes:** When adding new features or fixing bugs, identify the appropriate layer of the architecture (UI, service, or state) to modify.
2.  **Dependencies:** Manage dependencies using `npm`.
3.  **Building:** Use `npm run build` to compile the application.
