
// src/config/wfcRulesets/village.ts

/**
 * Represents a single tile type in the Wave Function Collapse algorithm.
 */
export interface WfcTile {
  name: string;
  // Sockets define how tiles can connect to each other.
  // Each side of a tile has a socket type.
  // For a connection to be valid, the socket of a tile must match the inverse socket of its neighbor.
  // For example, a 'road_n' socket on one tile will connect to a 'road_s' socket on the tile below it.
  sockets: {
    north: string;
    south: string;
    east: string;
    west: string;
  };
  // Weight determines how frequently a tile is chosen during generation.
  // Higher weights mean the tile is more common.
  weight: number;
  // (Optional) Visual representation for debugging or rendering.
  // Can be a color, a character, or an asset ID.
  visual?: {
    char?: string;
    color?: string;
    backgroundColor?: string;
  };
}

/**
 * Defines the complete ruleset for a WFC generator, including the set of all possible tiles.
 */
export interface WfcRuleset {
  tiles: WfcTile[];
}

// Helper function to create a simple symmetrical tile
const createSymmetricTile = (name: string, socket: string, weight: number, visual?: WfcTile['visual']): WfcTile => ({
  name,
  sockets: { north: socket, south: socket, east: socket, west:socket },
  weight,
  visual,
});

// --- Socket Types ---
// Using descriptive names for sockets to make rules more intuitive.
const GRASS = 'GGG';
const DIRT = 'DDD';
const ROAD_H = 'RRH'; // Road Horizontal
const ROAD_V = 'RRV'; // Road Vertical
const ROAD_C = 'RRC'; // Road Crossing
const WALL_H = 'WHH'; // Wall Horizontal
const WALL_V = 'WVV'; // Wall Vertical
const DOOR_N = 'D_N';
const DOOR_S = 'D_S';
const DOOR_E = 'D_E';
const DOOR_W = 'D_W';
const ROOF_N = 'RF_N';
const ROOF_S = 'RF_S';
const ROOF_E = 'RF_E';
const ROOF_W = 'RF_W';
const ROOF_C = 'RFC'; // Roof Center

// --- Tile Definitions ---

const tiles: WfcTile[] = [
  // --- Ground Tiles ---
  createSymmetricTile('grass', GRASS, 10, { char: '.', color: '#3a5e3a' }),
  createSymmetricTile('dirt', DIRT, 5, { char: '░', color: '#6b4d3b' }),

  // --- Road Tiles ---
  { name: 'road_ns', sockets: { north: ROAD_V, south: ROAD_V, east: GRASS, west: GRASS }, weight: 5, visual: { char: '│', color: '#bca78f' } },
  { name: 'road_ew', sockets: { north: GRASS, south: GRASS, east: ROAD_H, west: ROAD_H }, weight: 5, visual: { char: '─', color: '#bca78f' } },
  { name: 'road_corner_ne', sockets: { north: ROAD_V, south: GRASS, east: ROAD_H, west: GRASS }, weight: 2, visual: { char: '└', color: '#bca78f' } },
  { name: 'road_corner_nw', sockets: { north: ROAD_V, south: GRASS, east: GRASS, west: ROAD_H }, weight: 2, visual: { char: '┘', color: '#bca78f' } },
  { name: 'road_corner_se', sockets: { north: GRASS, south: ROAD_V, east: ROAD_H, west: GRASS }, weight: 2, visual: { char: '┌', color: '#bca78f' } },
  { name: 'road_corner_sw', sockets: { north: GRASS, south: ROAD_V, east: GRASS, west: ROAD_H }, weight: 2, visual: { char: '┐', color: '#bca78f' } },
  { name: 'road_t_n', sockets: { north: ROAD_V, south: GRASS, east: ROAD_H, west: ROAD_H }, weight: 1, visual: { char: '┴', color: '#bca78f' } },
  { name: 'road_t_s', sockets: { north: GRASS, south: ROAD_V, east: ROAD_H, west: ROAD_H }, weight: 1, visual: { char: '┬', color: '#bca78f' } },
  { name: 'road_t_e', sockets: { north: ROAD_V, south: ROAD_V, east: ROAD_H, west: GRASS }, weight: 1, visual: { char: '├', color: '#bca78f' } },
  { name: 'road_t_w', sockets: { north: ROAD_V, south: ROAD_V, east: GRASS, west: ROAD_H }, weight: 1, visual: { char: '┤', color: '#bca78f' } },
  { name: 'road_cross', sockets: { north: ROAD_V, south: ROAD_V, east: ROAD_H, west: ROAD_H }, weight: 1, visual: { char: '┼', color: '#bca78f' } },


  // --- Building Tiles ---
  // Walls
  { name: 'building_wall_n', sockets: { north: ROOF_N, south: WALL_V, east: WALL_H, west: WALL_H }, weight: 3, visual: { char: '▀', color: '#7d7d7d' } },
  { name: 'building_wall_s', sockets: { north: WALL_V, south: DIRT, east: WALL_H, west: WALL_H }, weight: 3, visual: { char: '▄', color: '#7d7d7d' } },
  { name: 'building_wall_e', sockets: { north: WALL_V, south: WALL_V, east: ROOF_E, west: WALL_H }, weight: 3, visual: { char: '▌', color: '#7d7d7d' } },
  { name: 'building_wall_w', sockets: { north: WALL_V, south: WALL_V, east: WALL_H, west: ROOF_W }, weight: 3, visual: { char: '▐', color: '#7d7d7d' } },

  // Doors (must be next to a road)
  { name: 'building_door_n', sockets: { north: ROOF_N, south: WALL_V, east: WALL_H, west: WALL_H }, weight: 1, visual: { char: 'D', color: '#a0522d' } },
  { name: 'building_door_s', sockets: { north: WALL_V, south: ROAD_V, east: WALL_H, west: WALL_H }, weight: 1, visual: { char: 'D', color: '#a0522d' } },


  // Roof
  { name: 'building_roof_center', sockets: { north: ROOF_N, south: ROOF_S, east: ROOF_E, west: ROOF_W }, weight: 10, visual: { char: '#', color: '#a0522d' } },
  { name: 'building_roof_edge_n', sockets: { north: GRASS, south: ROOF_S, east: ROOF_E, west: ROOF_W }, weight: 2, visual: { char: '^', color: '#a0522d' } },
  { name: 'building_roof_edge_s', sockets: { north: ROOF_N, south: GRASS, east: ROOF_E, west: ROOF_W }, weight: 2, visual: { char: 'v', color: '#a0522d' } },
  { name: 'building_roof_edge_e', sockets: { north: ROOF_N, south: ROOF_S, east: GRASS, west: ROOF_W }, weight: 2, visual: { char: '>', color: '#a0522d' } },
  { name: 'building_roof_edge_w', sockets: { north: ROOF_N, south: ROOF_S, east: ROOF_E, west: GRASS }, weight: 2, visual: { char: '<', color: '#a0522d' } },


  // --- Town Features ---
  { name: 'well', sockets: { north: DIRT, south: DIRT, east: DIRT, west: DIRT }, weight: 0.5, visual: { char: 'O', color: '#4a4a4a' } },
  { name: 'market_stall', sockets: { north: DIRT, south: DIRT, east: DIRT, west: DIRT }, weight: 0.5, visual: { char: 'M', color: '#cdaa7d' } },
  { name: 'farmland', sockets: { north: DIRT, south: DIRT, east: DIRT, west: DIRT }, weight: 1, visual: { char: '≈', color: '#654321' } },

];

export const villageRuleset: WfcRuleset = {
  tiles,
};
