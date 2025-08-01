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

    public static fromRegion(region: Polygon): Patch {
        const points = region.map(p => ({ x: p[0], y: p[1] }));
        return new Patch(points);
    }

    public borders(other: Patch): boolean {
        for (let i = 0; i < this.shape.length; i++) {
            const p1 = this.shape[i];
            const p2 = this.shape[(i + 1) % this.shape.length];
            for (let j = 0; j < other.shape.length; j++) {
                const p3 = other.shape[j];
                const p4 = other.shape[(j + 1) % other.shape.length];
                if ((p1 === p3 && p2 === p4) || (p1 === p4 && p2 === p3)) {
                    return true;
                }
            }
        }
        return false;
    }
}
