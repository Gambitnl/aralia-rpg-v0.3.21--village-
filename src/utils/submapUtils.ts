/**
 * @file src/utils/submapUtils.ts
 * This file contains utility functions for procedural submap generation,
 * ensuring that both UI components and game logic can access the same
 * deterministic data.
 */
import { SeededFeatureConfig, PathDetails, BiomeVisuals } from '../types';
import { LOCATIONS, STARTING_LOCATION_ID, BIOMES } from '../constants';
import { biomeVisualsConfig, defaultBiomeVisuals } from '../config/submapVisualsConfig';

// --- Hashing ---
export const simpleHash = (
    worldSeed: number,
    worldX: number,
    worldY: number,
    biomeSeedText: string,
    submapX: number,
    submapY: number,
    seedSuffix: string
): number => {
    let h = 0;
    const str = `${worldSeed},${worldX},${worldY},${submapX},${submapY},${biomeSeedText},${seedSuffix}`;
    for (let i = 0; i < str.length; i++) {
        h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
};


// --- Feature Placement ---
const getActiveSeededFeatures = (
    parentWorldMapCoords: { x: number, y: number },
    currentWorldBiomeId: string,
    submapDimensions: { rows: number, cols: number },
    seededFeaturesConfig: SeededFeatureConfig[] | undefined,
    hashFn: (submapX: number, submapY: number, seedSuffix: string) => number
): Array<{ x: number; y: number; config: SeededFeatureConfig; actualSize: number }> => {
    const features: Array<{ x: number; y: number; config: SeededFeatureConfig; actualSize: number }> = [];
    if (!seededFeaturesConfig) return features;

    seededFeaturesConfig.forEach((featureConfig, index) => {
        const featureTypeSeed = hashFn(index, 0, `feature_type_${featureConfig.id}`);
        const numToPlace = featureTypeSeed % (featureConfig.numSeedsRange[1] - featureConfig.numSeedsRange[0] + 1) + featureConfig.numSeedsRange[0];

        for (let i = 0; i < numToPlace; i++) {
            const instanceSeedModifier = `instance_${i}`;
            const seedXHash = hashFn(index, i, `seedX_${featureConfig.id}_${instanceSeedModifier}`);
            const seedYHash = hashFn(index, i, `seedY_${featureConfig.id}_${instanceSeedModifier}`);
            const seedSizeHash = hashFn(index, i, `seedSize_${featureConfig.id}_${instanceSeedModifier}`);

            features.push({
                x: seedXHash % submapDimensions.cols,
                y: seedYHash % submapDimensions.rows,
                config: featureConfig,
                actualSize: seedSizeHash % (featureConfig.sizeRange[1] - featureConfig.sizeRange[0] + 1) + featureConfig.sizeRange[0],
            });
        }
    });
    return features;
};

// --- Path Generation ---
const getPathDetails = (
    parentWorldMapCoords: { x: number, y: number },
    currentWorldBiomeId: string,
    submapDimensions: { rows: number, cols: number },
    hashFn: (submapX: number, submapY: number, seedSuffix: string) => number
): PathDetails => {
    const mainPathCoords = new Set<string>();
    const pathAdjacencyCoords = new Set<string>();
    const { rows, cols } = submapDimensions;

    let pathChance = 70;
    if (currentWorldBiomeId === 'swamp') pathChance = 30;
    if (currentWorldBiomeId === 'ocean') pathChance = 0;

    const startingLocationData = LOCATIONS[STARTING_LOCATION_ID];
    const isStartingLocationSubmap =
        startingLocationData &&
        currentWorldBiomeId === startingLocationData.biomeId &&
        parentWorldMapCoords.x === startingLocationData.mapCoordinates.x &&
        parentWorldMapCoords.y === startingLocationData.mapCoordinates.y;

    if (isStartingLocationSubmap) {
        pathChance = 100;
    }

    if (hashFn(0, 0, 'mainPathExists_v4') % 100 < pathChance) {
        const isVertical = hashFn(1, 1, 'mainPathVertical_v4') % 2 === 0;
        let currentX, currentY;
        let pathPoints: { x: number, y: number }[] = [];

        if (isVertical) {
            currentX = Math.floor(cols / 2) + (hashFn(2, 2, 'mainPathStartCol_v4') % Math.floor(cols / 3) - Math.floor(cols / 6));
            currentX = Math.max(1, Math.min(cols - 2, currentX));

            for (let y = 0; y < rows; y++) {
                pathPoints.push({ x: currentX, y: y });
                if (y < rows - 1) {
                    const wobble = hashFn(currentX, y, 'wobble_v_v4') % 3 - 1;
                    currentX = Math.max(1, Math.min(cols - 2, currentX + wobble));
                }
            }
        } else {
            currentY = Math.floor(rows / 2) + (hashFn(3, 3, 'mainPathStartRow_v4') % Math.floor(rows / 3) - Math.floor(rows / 6));
            currentY = Math.max(1, Math.min(rows - 2, currentY));

            for (let x = 0; x < cols; x++) {
                pathPoints.push({ x: x, y: currentY });
                if (x < cols - 1) {
                    const wobble = hashFn(x, currentY, 'wobble_h_v4') % 3 - 1;
                    currentY = Math.max(1, Math.min(rows - 2, currentY + wobble));
                }
            }
        }
        pathPoints.forEach(p => mainPathCoords.add(`${p.x},${p.y}`));

        if (isStartingLocationSubmap) {
            const fixedStartX = Math.floor(submapDimensions.cols / 2);
            const fixedStartY = Math.floor(submapDimensions.rows / 2);
            mainPathCoords.add(`${fixedStartX},${fixedStartY}`);
        }
    }

    mainPathCoords.forEach(coordStr => {
        const [xStr, yStr] = coordStr.split(',');
        const x = parseInt(xStr);
        const y = parseInt(yStr);
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const adjX = x + dx;
                const adjY = y + dy;
                if (adjX >= 0 && adjX < cols && adjY >= 0 && adjY < rows) {
                    const adjCoordStr = `${adjX},${adjY}`;
                    if (!mainPathCoords.has(adjCoordStr)) {
                        pathAdjacencyCoords.add(adjCoordStr);
                    }
                }
            }
        }
    });

    return { mainPathCoords, pathAdjacencyCoords };
};


// --- Main Exported Function ---

interface SubmapTileInfo {
    effectiveTerrainType: string;
    isImpassable: boolean;
}

/**
 * Calculates the deterministic terrain type and properties of a single submap tile.
 * This is the core logic shared between the renderer and action handlers.
 */
export function getSubmapTileInfo(
    worldSeed: number,
    parentWorldMapCoords: { x: number, y: number },
    currentWorldBiomeId: string,
    submapDimensions: { rows: number, cols: number },
    targetSubmapCoords: { x: number, y: number }
): SubmapTileInfo {

    const worldBiome = BIOMES[currentWorldBiomeId];
    const biomeSeedText = worldBiome ? worldBiome.id + worldBiome.name : 'default_seed';
    const visualsConfig = (worldBiome && biomeVisualsConfig[worldBiome.id]) || defaultBiomeVisuals;

    const hashFn = (submapX: number, submapY: number, seedSuffix: string) => 
        simpleHash(worldSeed, parentWorldMapCoords.x, parentWorldMapCoords.y, biomeSeedText, submapX, submapY, seedSuffix);

    const pathDetails = getPathDetails(parentWorldMapCoords, currentWorldBiomeId, submapDimensions, hashFn);
    const activeSeededFeatures = getActiveSeededFeatures(parentWorldMapCoords, currentWorldBiomeId, submapDimensions, visualsConfig.seededFeatures, hashFn);

    const { x: colIndex, y: rowIndex } = targetSubmapCoords;

    let effectiveTerrainType = 'default';
    let zIndex = 0;
    let isImpassable = false;

    const currentTileCoordString = `${colIndex},${rowIndex}`;

    if (pathDetails.mainPathCoords.has(currentTileCoordString)) {
        effectiveTerrainType = 'path';
        zIndex = 1;
    } else if (pathDetails.pathAdjacencyCoords.has(currentTileCoordString)) {
        effectiveTerrainType = 'path_adj';
        zIndex = 0.5;
    }

    for (const seeded of activeSeededFeatures) {
        let isWithinFeature = false;
        const dx = Math.abs(colIndex - seeded.x);
        const dy = Math.abs(rowIndex - seeded.y);

        if (seeded.config.shapeType === 'rectangular') {
            isWithinFeature = dx <= seeded.actualSize && dy <= seeded.actualSize;
        } else { // Default to circular
            const distance = Math.sqrt(Math.pow(colIndex - seeded.x, 2) + Math.pow(rowIndex - seeded.y, 2));
            isWithinFeature = distance <= seeded.actualSize;
        }
        
        if (isWithinFeature) {
            const featureZ = seeded.config.zOffset || 0.1;
            if (featureZ > zIndex) {
                zIndex = featureZ;
                effectiveTerrainType = seeded.config.generatesEffectiveTerrainType || seeded.config.id;
            }
        }
    }
    
    if (effectiveTerrainType === 'water') {
        isImpassable = true;
    }

    return { effectiveTerrainType, isImpassable };
}