/**
 * @file VillageScene.tsx
 * Renders an interactive, top-down village map using PixiJS.
 */
import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Action } from '../types';

import { MapData, Action, Biome } from '../types';
import { BIOMES } from '../constants';

interface VillageSceneProps {
  onAction: (action: Action) => void;
  mapData: MapData;
}

const TILE_SIZE = 32;

const VillageScene: React.FC<VillageSceneProps> = ({ onAction, mapData }) => {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    let isMounted = true;

    const setupPixi = async () => {
      if (pixiContainerRef.current && !pixiAppRef.current) {
        const app = new PIXI.Application();

        await app.init({
          width: mapData.gridSize.cols * TILE_SIZE,
          height: mapData.gridSize.rows * TILE_SIZE,
          backgroundColor: 0x1099bb,
        });

        if (!isMounted) {
          app.destroy(true, true);
          return;
        }
        
        pixiAppRef.current = app;
        pixiContainerRef.current.appendChild(app.canvas as HTMLCanvasElement);

        // --- Rendering Logic ---
        const graphics = new PIXI.Graphics();
        
        mapData.tiles.forEach((row, y) => {
          row.forEach((tile, x) => {
            const biome: Biome = BIOMES[tile.biomeId];
            let color = 0x228B22; // Default Green for Grass

            if (biome) {
                // Convert Tailwind color string to PixiJS hex color
                // This is a simplified conversion and might need a more robust solution
                // if you have complex Tailwind colors (e.g., with opacity)
                switch (biome.color) {
                    case 'bg-green-700': color = 0x228B22; break; // Example: Green
                    case 'bg-gray-500': color = 0x808080; break; // Example: Gray
                    case 'bg-yellow-700': color = 0xFFA500; break; // Example: Orange/Brown for path
                    case 'bg-red-700': color = 0x8B0000; break; // Example: Dark Red for special features
                    default: color = 0x228B22; // Fallback
                }
            }
            
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
          
          const clickedTile = mapData.tiles[tileY]?.[tileX];
          
          if (clickedTile) {
             // Example: If you want to make certain biomes interactive
             const biome = BIOMES[clickedTile.biomeId];
             if (biome && biome.name === 'Inn') { // Assuming you have an 'Inn' biome
                onAction({ type: 'move', label: 'Enter Inn', targetId: 'aralia_town_center' }); // Placeholder target
             } else {
                onAction({ type: 'inspect_submap_tile', label: `Inspect ${biome?.name || 'tile'}`, payload: { tileX, tileY, effectiveTerrainType: biome?.name || 'unknown', worldBiomeId: biome?.id || 'unknown', parentWorldMapCoords: { x: clickedTile.x, y: clickedTile.y } } });
             }
          }
        });
      }
    };

    (async () => {
      await setupPixi();
    })();

    // Cleanup function
    return () => {
      isMounted = false;
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, true);
        pixiAppRef.current = null;
      }
    };
  }, [onAction, mapData]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
      <h2 className="text-3xl font-cinzel text-amber-400 mb-4">Generated Town</h2>
      <div ref={pixiContainerRef} className="border-4 border-amber-600 rounded-lg" />
      <p className="text-sm text-gray-400 mt-4 italic">Click on tiles to interact.</p>
    </div>
  );
};


export default VillageScene;
