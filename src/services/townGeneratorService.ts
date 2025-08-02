import { Model } from './town-generator/model';

export function generateTown(nPatches = 15, seed = -1): Model {
    return new Model(nPatches, seed);
}

