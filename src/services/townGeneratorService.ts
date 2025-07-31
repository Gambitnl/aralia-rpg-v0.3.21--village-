import { Model } from './town-generator/model';
import { MapData, MapTile } from '../types';
import { Polygon } from './town-generator/geom';

export function generateTown(nPatches = 15, seed = -1): Model {
    return new Model(nPatches, seed);
}

export function rasterize(model: Model, rows: number, cols: number): MapData {
    const tiles: MapTile[][] = [];
    for (let r = 0; r < rows; r++) {
        tiles[r] = [];
        for (let c = 0; c < cols; c++) {
            tiles[r][c] = {
                x: c,
                y: r,
                biomeId: 'field', // default biome
                discovered: false,
                isPlayerCurrent: false,
            };
        }
    }

    // This is a very basic rasterization. It just draws the polygons on the grid.
    // A more advanced implementation would handle streets, buildings, etc.
    for (const patch of model.patches) {
        if (patch.ward) {
            for (const building of patch.ward.geometry) {
                drawPolygon(tiles, building, 'building');
            }
        }
    }

    // a simple rasterization of the wall
    if (model.wall) {
        drawPolygon(tiles, model.wall.shape, 'wall');
    }


    return {
        gridSize: { rows, cols },
        tiles,
    };
}

function drawPolygon(tiles: MapTile[][], polygon: Polygon, biomeId: string) {
    if (!polygon || polygon.length === 0) return;

    const rows = tiles.length;
    const cols = tiles[0].length;

    // find bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of polygon) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
    }

    // a simple scaling to fit the grid
    const scaleX = cols / (maxX - minX);
    const scaleY = rows / (maxY - minY);
    const scale = Math.min(scaleX, scaleY) * 0.8;

    const scaledPolygon = polygon.map(p => ({
        x: (p.x - minX) * scale + cols * 0.1,
        y: (p.y - minY) * scale + rows * 0.1
    }));

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (isInside({x: c, y: r}, scaledPolygon)) {
                tiles[r][c].biomeId = biomeId;
            }
        }
    }
}

// Point in polygon test
function isInside(point: {x: number, y: number}, vs: {x: number, y: number}[]) {
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i].x, yi = vs[i].y;
        let xj = vs[j].x, yj = vs[j].y;
        let intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}
