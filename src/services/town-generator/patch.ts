import { Polygon } from './geom';
import { Ward } from './wards';
import { Voronoi } from 'd3-delaunay';

export class Patch {
    public shape: Polygon;
    public ward: Ward | null = null;

    public withinWalls = false;
    public withinCity = false;

    constructor(vertices: Polygon) {
        this.shape = vertices;
    }

    public static fromRegion(region: number[][]): Patch {
        return new Patch(region.map(p => ({ x: p[0], y: p[1] })));
    }
}
