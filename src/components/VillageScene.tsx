/**
 * @file VillageScene.tsx
 * Renders an interactive, top-down village map using PixiJS.
 */
import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Action } from '../types';

interface VillageSceneProps {
  onAction: (action: Action) => void;
}

// Hardcoded map data for the initial village.
// In a full implementation, this would be loaded from a configuration file.
// 0 = Grass, 1 = Path, 2 = Inn Door (Interactive)
const villageMapLayout = [
    [0, 0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 1, 2, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 1, 0, 0, 0],
    [0, 1, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
];

const TILE_SIZE = 32;

const VillageScene: React.FC<VillageSceneProps> = ({ onAction }) => {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initPixi = () => {
      if (pixiContainerRef.current && !pixiAppRef.current) {
        // Initialize PixiJS Application using synchronous v7 constructor for better compatibility
        const app = new PIXI.Application({
          width: villageMapLayout[0].length * TILE_SIZE,
          height: villageMapLayout.length * TILE_SIZE,
          backgroundColor: 0x1099bb,
        });

        // If the component unmounted while Pixi was initializing, destroy the app.
        if (!isMounted) {
          app.destroy(true, true);
          return;
        }
        
        pixiAppRef.current = app;
        // Use app.view for PixiJS v7 compatibility instead of app.canvas (v8)
        pixiContainerRef.current.appendChild(app.view as HTMLCanvasElement);

        // --- Rendering Logic ---
        const graphics = new PIXI.Graphics();
        
        villageMapLayout.forEach((row, y) => {
          row.forEach((tileType, x) => {
            let color = 0x228B22; // Green for Grass
            if (tileType === 1) color = 0xD2B48C; // Tan for Path
            if (tileType === 2) color = 0x8B4513; // Brown for Inn Door
            
            graphics.fill(color);
            graphics.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          });
        });
        
        app.stage.addChild(graphics);

        // --- Interactivity ---
        app.stage.eventMode = 'static';
        app.stage.hitArea = app.screen;

        app.stage.on('pointerdown', (event) => {
          const pos = event.global;
          const tileX = Math.floor(pos.x / TILE_SIZE);
          const tileY = Math.floor(pos.y / TILE_SIZE);
          
          const tileType = villageMapLayout[tileY]?.[tileX];
          
          if (tileType === 2) { // Inn Door
             onAction({ type: 'move', label: 'Enter Inn', targetId: 'aralia_town_center' }); // Placeholder target
          }
        });
      }
    };

    initPixi();

    // Cleanup function
    return () => {
      isMounted = false;
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, true); // true to remove view from DOM, true to destroy textures
        pixiAppRef.current = null;
      }
    };
  }, [onAction]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
      <h2 className="text-3xl font-cinzel text-amber-400 mb-4">Aralia Town</h2>
      <div ref={pixiContainerRef} className="border-4 border-amber-600 rounded-lg" />
       <p className="text-sm text-gray-400 mt-4 italic">Click on the brown door to enter the inn.</p>
    </div>
  );
};

export default VillageScene;
