import { Model } from './town-generator/model';
import { Point, Polygon } from './town-generator/geom';
import { PathDetails, SeededFeatureConfig, MapData, MapTile } from '../types';

interface RasterizationResult {
  mapData: MapData;
  activeSeededFeatures: Array<{ x: number; y: number; config: SeededFeatureConfig; actualSize: number }>;
  pathDetails: PathDetails;
}

// Helper function to draw a line on the grid
function drawLine(grid: string[][], x1: number, y1: number, x2: number, y2: number, biomeId: string) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = (x1 < x2) ? 1 : -1;
    const sy = (y1 < y2) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        if (x1 >= 0 && x1 < grid[0].length && y1 >= 0 && y1 < grid.length) {
            grid[y1][x1] = biomeId;
        }

        if ((x1 === x2) && (y1 === y2)) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x1 += sx; }
        if (e2 < dx) { err += dx; y1 += sy; }
    }
}

export function rasterizeTown(model: Model, rows: number, cols: number): RasterizationResult {
    console.log("Starting town rasterization...");

    const tileBiomeIds: string[][] = Array(rows).fill(null).map(() => Array(cols).fill('grass'));

    // 1. Calculate scaling and offset
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const patch of model.patches) {
        for (const p of patch.shape) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
    }

    const modelWidth = maxX - minX;
    const modelHeight = maxY - minY;
    const scaleX = (cols - 4) / modelWidth; // With padding
    const scaleY = (rows - 4) / modelHeight;
    const scale = Math.min(scaleX, scaleY);

    const transform = (p: Point): Point => ({
        x: Math.floor((p.x - minX) * scale) + 2,
        y: Math.floor((p.y - minY) * scale) + 2,
    });

    // 2. Rasterize streets and roads
    const mainPathCoords = new Set<string>();
    const allStreets = [...model.arteries, ...model.streets];
    for (const street of allStreets) {
        for (let i = 0; i < street.length - 1; i++) {
            const p1 = transform(street[i]);
            const p2 = transform(street[i + 1]);
            drawLine(tileBiomeIds, p1.x, p1.y, p2.x, p2.y, 'street');
        }
    }
    for (const road of model.roads) {
        for (let i = 0; i < road.length - 1; i++) {
            const p1 = transform(road[i]);
            const p2 = transform(road[i + 1]);
            drawLine(tileBiomeIds, p1.x, p1.y, p2.x, p2.y, 'road');
        }
    }

    // Populate pathDetails from the grid
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const id = tileBiomeIds[r][c];
            if (id === 'street' || id === 'road') {
                mainPathCoords.add(`${c},${r}`);
            }
        }
    }

    // 3. Rasterize walls, gates, and towers
    if (model.wall) {
        const wallPoly = model.wall.shape.map(transform);
        fillPolygon(tileBiomeIds, wallPoly, 'wall');
        for (const gate of model.wall.gates) {
            const g = transform(gate);
            if (g.x >= 0 && g.x < cols && g.y >= 0 && g.y < rows) {
                tileBiomeIds[g.y][g.x] = 'gate';
            }
        }
        for (const tower of model.wall.towers) {
            const t = transform(tower);
            if (t.x >= 0 && t.x < cols && t.y >= 0 && t.y < rows) {
                tileBiomeIds[t.y][t.x] = 'tower';
            }
        }
    }

    // 4. Rasterize buildings from wards
    for (const patch of model.patches) {
        if (patch.ward) {
            const wardLabel = patch.ward.getLabel()?.toLowerCase().replace(/ /g, '_') || 'common';
            const buildingBiome = `${wardLabel}_building`;
            for (const building of patch.ward.geometry) {
                const buildingPoly = building.map(transform);
                fillPolygon(tileBiomeIds, buildingPoly, buildingBiome);
            }
        }
    }

    // 5. Rasterize plaza
    if (model.plaza) {
        const plazaPoly = model.plaza.shape.map(transform);
        fillPolygon(tileBiomeIds, plazaPoly, 'plaza');
    }

    // 6. Convert rasterized data into features
    const features = convertGridToFeatures(tileBiomeIds);

    // 7. Convert biome grid into MapData tiles
    const tiles: MapTile[][] = tileBiomeIds.map((row, r) =>
        row.map((biomeId, c) => ({
            x: c,
            y: r,
            biomeId,
            discovered: false,
            isPlayerCurrent: false,
        }))
    );

    const mapData: MapData = {
        gridSize: { rows, cols },
        tiles,
    };

    const output: RasterizationResult = {
        mapData,
        activeSeededFeatures: features,
        pathDetails: { mainPathCoords, pathAdjacencyCoords: new Set() },
    };

    console.log("Finished town rasterization (features created).");
    return output;
}

function findConnectedComponents(grid: string[][]): { biomeId: string, cells: Point[] }[] {
    const rows = grid.length;
    const cols = grid[0].length;
    const visited: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false));
    const components: { biomeId: string, cells: Point[] }[] = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!visited[r][c]) {
                const biomeId = grid[r][c];
                if (biomeId === 'grass') continue; // Don't create features for grass

                const componentCells: Point[] = [];
                const queue: Point[] = [{ x: c, y: r }];
                visited[r][c] = true;

                while (queue.length > 0) {
                    const { x, y } = queue.shift()!;
                    componentCells.push({ x, y });

                    const neighbors = [{x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0}];
                    for (const n of neighbors) {
                        const nx = x + n.x;
                        const ny = y + n.y;

                        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !visited[ny][nx] && grid[ny][nx] === biomeId) {
                            visited[ny][nx] = true;
                            queue.push({ x: nx, y: ny });
                        }
                    }
                }
                components.push({ biomeId, cells: componentCells });
            }
        }
    }
    return components;
}

function convertGridToFeatures(grid: string[][]): Array<{ x: number; y: number; config: SeededFeatureConfig; actualSize: number }> {
    const components = findConnectedComponents(grid);
    const features: Array<{ x: number; y: number; config: SeededFeatureConfig; actualSize: number }> = [];

    const biomeToFeatureConfig: Record<string, Partial<SeededFeatureConfig>> = {
        street: { name: 'Street', icon: '▫️', color: 'rgba(180, 180, 180, 0.5)' },
        road: { name: 'Road', icon: '▫️', color: 'rgba(160, 160, 160, 0.5)' },
        plaza: { name: 'Plaza', icon: '▫️', color: 'rgba(200, 200, 200, 0.6)' },
        wall: { name: 'Wall', icon: '#', color: 'rgba(100, 100, 100, 0.8)', zOffset: 1 },
        gate: { name: 'Gate', icon: '🚪', color: 'rgba(150, 150, 150, 0.9)', zOffset: 1 },
        tower: { name: 'Tower', icon: '🗼', color: 'rgba(170, 170, 170, 0.9)', zOffset: 1 },
        market_building: { name: 'Market', icon: '🛒', color: 'rgba(200, 150, 50, 0.8)', zOffset: 0.5 },
        administration_building: { name: 'Town Hall', icon: '🏛️', color: 'rgba(190, 170, 120, 0.8)', zOffset: 0.5 },
        merchant_building: { name: 'Shop', icon: '🏬', color: 'rgba(170, 130, 90, 0.8)', zOffset: 0.5 },
        cathedral_building: { name: 'Cathedral', icon: '⛪', color: 'rgba(220, 220, 220, 0.8)', zOffset: 0.5 },
        castle_building: { name: 'Castle', icon: '🏰', color: 'rgba(150, 150, 170, 0.8)', zOffset: 0.5 },
        slum_building: { name: 'Shacks', icon: '🏚️', color: 'rgba(120, 100, 80, 0.8)', zOffset: 0.5 },
        park_building: { name: 'Park', icon: '🌳', color: 'rgba(80, 180, 80, 0.7)', zOffset: 0.5 },
        farm_building: { name: 'Farm', icon: '🚜', color: 'rgba(180, 160, 80, 0.8)', zOffset: 0.5 },
        craftsmen_building: { name: 'Workshop', icon: '⚒️', color: 'rgba(160, 120, 80, 0.8)', zOffset: 0.5 },
        default_building: { name: 'Building', icon: 'B', color: 'rgba(150, 120, 100, 0.8)', zOffset: 0.5 },
    };

    for (const component of components) {
        const { biomeId, cells } = component;
        if (cells.length === 0) continue;

        const topLeft = cells.reduce((acc, cell) => ({
            x: Math.min(acc.x, cell.x),
            y: Math.min(acc.y, cell.y),
        }), { x: Infinity, y: Infinity });

        let baseConfig = biomeToFeatureConfig[biomeId] || biomeToFeatureConfig['default_building'];

        const feature: { x: number; y: number; config: SeededFeatureConfig; actualSize: number } = {
            x: topLeft.x,
            y: topLeft.y,
            config: {
                id: `${biomeId}_${topLeft.x}_${topLeft.y}`,
                name: baseConfig.name || 'Feature',
                icon: baseConfig.icon || '?',
                color: baseConfig.color || 'rgba(128,128,128,1)',
                sizeRange: [1, 1],
                numSeedsRange: [1, 1],
                zOffset: baseConfig.zOffset || 0,
                shapeType: 'custom', // Indicates it's from our rasterizer
                customShape: cells.map(cell => ({ x: cell.x - topLeft.x, y: cell.y - topLeft.y })),
            },
            actualSize: cells.length,
        };
        features.push(feature);
    }

    return features;
}

// Helper function to fill a polygon on the grid using scan-line algorithm
function fillPolygon(grid: string[][], polygon: Polygon, biomeId: string) {
    if (polygon.length === 0) return;

    let minY = Infinity, maxY = -Infinity;
    for (const p of polygon) {
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    }

    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
        const intersections: number[] = [];
        for (let i = 0; i < polygon.length; i++) {
            const p1 = polygon[i];
            const p2 = polygon[(i + 1) % polygon.length];

            if (p1.y !== p2.y) {
                if ((y >= p1.y && y < p2.y) || (y >= p2.y && y < p1.y)) {
                    const x = (y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x;
                    intersections.push(x);
                }
            }
        }

        intersections.sort((a, b) => a - b);

        for (let i = 0; i < intersections.length; i += 2) {
            if (i + 1 < intersections.length) {
                const startX = Math.ceil(intersections[i]);
                const endX = Math.floor(intersections[i + 1]);
                for (let x = startX; x <= endX; x++) {
                    if (x >= 0 && x < grid[0].length && y >= 0 && y < grid.length) {
                        grid[y][x] = biomeId;
                    }
                }
            }
        }
    }
}
