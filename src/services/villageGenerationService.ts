import { villageRuleset, WfcTile } from '../config/wfcRulesets/village';

// Assuming ndwfc is available globally via import map
declare const ndwfc: any;
declare const ndwfcTools: any;

export interface VillageGenerationOptions {
  type: 'farming' | 'fishing' | 'fortified';
  size: 'small' | 'medium' | 'large';
}

export interface VillageBuilding {
  id: string;
  type: string; // e.g., 'tavern', 'house', 'blacksmith'
  polygon: { x: number; y: number }[];
  entryPoint: { x: number; y: number };
}

export interface VillageRoad {
  id: string;
  pathPoints: { x: number; y: number }[];
}

export interface VillageWall {
  id: string;
  pathPoints: { x: number; y: number }[];
}

export interface VillageLayout {
  buildings: VillageBuilding[];
  roads: VillageRoad[];
  walls: VillageWall[];
  grid: string[][]; // For debugging
}

/**
 * Generates a 2D grid of tiles using the Wave Function Collapse algorithm.
 *
 * @param seed The seed for the random number generator.
 * @param options Configuration for the village type and size.
 * @returns A 2D array of WFC tile names.
 */
export function generateWfcGrid(seed: string, options: VillageGenerationOptions): string[][] {
  const { size } = options;
  const dimensions = {
    small: { width: 30, height: 20 },
    medium: { width: 50, height: 35 },
    large: { width: 70, height: 50 },
  };

  const { width, height } = dimensions[size];

  // 1. Create the WFC model from the ruleset
  const model = new ndwfc.Model(villageRuleset.tiles, 2, width, height, {
    seed,
    // Add any other WFC options here
  });

  // 2. Run the WFC algorithm
  const success = model.run();

  if (!success) {
    console.error("WFC failed to generate a valid grid.");
    // Fallback to a simple grid or throw an error
    return Array.from({ length: height }, () => Array(width).fill('grass'));
  }

  // 3. Get the output grid
  const outputGrid = model.getOutput();

  // 4. Map the tile indices back to tile names
  const tileNameGrid = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const tileIndex = outputGrid[y * width + x];
      return villageRuleset.tiles[tileIndex].name;
    })
  );

  return tileNameGrid;
}

/**
 * Transforms the raw WFC grid into a structured VillageLayout.
 *
 * @param grid The 2D array of WFC tile names.
 * @returns A VillageLayout object.
 */
export function transformGridToLayout(grid: string[][]): VillageLayout {
    const height = grid.length;
    const width = grid[0].length;
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    const buildings: VillageBuilding[] = [];
    const roads: VillageRoad[] = [];

    const getBuildingType = (cluster: {x: number, y: number}[]): string => {
        // Simple logic: the most common roof tile determines the building type.
        const roofTiles = cluster.map(({x, y}) => grid[y][x]);
        const counts = roofTiles.reduce((acc, tile) => {
            acc[tile] = (acc[tile] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);    
        const mainTile = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        if (mainTile.includes('door')) return 'House'; // Or more specific logic
        return 'Building';
    };

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (visited[y][x]) continue;

            const tile = grid[y][x];
            const cluster = floodFill(grid, x, y, tile, visited);

            if (cluster.length > 0) {
                if (tile.startsWith('building_roof')) {
                    const { minX, minY, maxX, maxY } = getBoundingBox(cluster);
                    const building: VillageBuilding = {
                        id: `bldg_${buildings.length + 1}`,
                        type: getBuildingType(cluster),
                        polygon: [
                            { x: minX, y: minY },
                            { x: maxX + 1, y: maxY + 1 },
                        ],
                        entryPoint: { x: minX, y: maxY + 1 }, // Placeholder
                    };
                    buildings.push(building);
                } else if (tile.startsWith('road')) {
                    const road: VillageRoad = {
                        id: `road_${roads.length + 1}`,
                        pathPoints: cluster,
                    };
                    roads.push(road);
                }
            }
        }
    }

    return {
        buildings,
        roads,
        walls: [], // Placeholder
        grid,
    };
}

function floodFill(grid: string[][], startX: number, startY: number, targetTile: string, visited: boolean[][]): {x: number, y: number}[] {
    const cluster: {x: number, y: number}[] = [];
    const stack = [{x: startX, y: startY}];
    const height = grid.length;
    const width = grid[0].length;

    while (stack.length > 0) {
        const { x, y } = stack.pop()!;

        if (x < 0 || x >= width || y < 0 || y >= height || visited[y][x] || !grid[y][x].startsWith(targetTile.split('_')[0])) {
            continue;
        }

        visited[y][x] = true;
        cluster.push({ x, y });

        stack.push({ x: x + 1, y });
        stack.push({ x: x - 1, y });
        stack.push({ x: x, y: y + 1 });
        stack.push({ x: x, y: y - 1 });
    }

    return cluster;
}

function getBoundingBox(cluster: {x: number, y: number}[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const { x, y } of cluster) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }
    return { minX, minY, maxX, maxY };
}