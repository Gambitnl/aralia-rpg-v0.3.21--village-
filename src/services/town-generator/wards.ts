import { Point, Polygon, MultiPolygon, shrink, cut, forEdge, polygonArea, next, polygonCentroid, rect, rotate, offset, findLongestEdge, vector, add, rotate90, subtract, inverseDistanceWeighting, distance, circle } from './geom';
import { Patch } from './patch';
// import { Model } from './model'; // Removed to break circular dependency
import { scalar } from './utils';
import { bisect, ring } from './cutter';
import { SeededRandom } from '../../utils/seededRandom';
import { distance2line, interpolate } from './utils';
import { CurtainWall } from './curtain-wall';

// const random = new SeededRandom(0); // This will be replaced by model.random

export class Ward {
    public static MAIN_STREET = 2.0;
    public static REGULAR_STREET = 1.0;
    public static ALLEY = 0.6;

    public model: any; // Was Model
    public patch: Patch;
    public geometry: MultiPolygon = [];

    constructor(model: any, patch: Patch) { // Was Model
        this.model = model;
        this.patch = patch;
    }

    public createGeometry() {
        this.geometry = [];
    }

    public getCityBlock(): Polygon {
        const insetDist: number[] = [];
        const innerPatch = this.model.wall == null || this.patch.withinWalls;

        forEdge(this.patch.shape, (v0, v1) => {
            if (this.model.wall != null && this.model.wall.bordersBy(this.patch, v0, v1)) {
                insetDist.push(Ward.MAIN_STREET / 2);
            } else {
                let onStreet = innerPatch && this.model.plaza != null && this.model.plaza.shape.includes(v1) && this.model.plaza.shape.includes(v0);
                if (!onStreet) {
                    for (const street of this.model.arteries) {
                        if (street.includes(v0) && street.includes(v1)) {
                            onStreet = true;
                            break;
                        }
                    }
                }
                insetDist.push((onStreet ? Ward.MAIN_STREET : (innerPatch ? Ward.REGULAR_STREET : Ward.ALLEY)) / 2);
            }
        });

        // HACK: isConvex is not implemented, so we assume it's convex
        return shrink(this.patch.shape, insetDist);
    }

    protected filterOutskirts() {
        const populatedEdges: { x: number, y: number, dx: number, dy: number, d: number }[] = [];

        const addEdge = (v1: Point, v2: Point, factor = 1.0) => {
            const dx = v2.x - v1.x;
            const dy = v2.y - v1.y;
            const distances = new Map<Point, number>();

            let maxD = 0;
            for (const v of this.patch.shape) {
                const d = (v !== v1 && v !== v2 ? distance2line(v1.x, v1.y, dx, dy, v.x, v.y) : 0) * factor;
                distances.set(v, d);
                if (d > maxD) {
                    maxD = d;
                }
            }
            populatedEdges.push({ x: v1.x, y: v1.y, dx: dx, dy: dy, d: maxD });
        };

        forEdge(this.patch.shape, (v1, v2) => {
            let onRoad = false;
            for (const street of this.model.arteries) {
                if (street.includes(v1) && street.includes(v2)) {
                    onRoad = true;
                    break;
                }
            }

            if (onRoad) {
                addEdge(v1, v2, 1);
            } else {
                const n = this.model.getNeighbour(this.patch, v1);
                if (n && n.withinCity) {
                    addEdge(v1, v2, this.model.isEnclosed(n) ? 1 : 0.4);
                }
            }
        });

        const density = this.patch.shape.map(v => {
            if (this.model.gates.includes(v)) return 1;
            return this.model.patchByVertex(v).every(p => p.withinCity) ? 2 * this.model.random.next() : 0;
        });

        this.geometry = this.geometry.filter(building => {
            let minDist = 1.0;
            for (const edge of populatedEdges) {
                for (const v of building) {
                    const d = distance2line(edge.x, edge.y, edge.dx, edge.dy, v.x, v.y);
                    const dist = d / edge.d;
                    if (dist < minDist) {
                        minDist = dist;
                    }
                }
            }

            const c = polygonCentroid(building);
            const i = inverseDistanceWeighting(this.patch.shape, c);
            let p = 0.0;
            for (let j = 0; j < i.length; j++) {
                p += density[j] * i[j];
            }
            minDist /= p;

            return this.model.random.next() > minDist;
        });
    }

    public getLabel(): string | null {
        return null;
    }

    public static rateLocation(model: any, patch: Patch): number {
        return 0;
    }

    public static createAlleys(model: any, p: Polygon, minSq: number, gridChaos: number, sizeChaos: number, emptyProb = 0.04, split = true): MultiPolygon {
        let v: Point | null = null;
        let length = -1.0;
        forEdge(p, (p0, p1) => {
            const len = distance(p0, p1);
            if (len > length) {
                length = len;
                v = p0;
            }
        });

        if (!v) {
            return []; // Return empty if no valid vertex found
        }

        const spread = 0.8 * gridChaos;
        const ratio = (1 - spread) / 2 + model.random.next() * spread;

        const angleSpread = Math.PI / 6 * gridChaos * (polygonArea(p) < minSq * 4 ? 0.0 : 1);
        const b = (model.random.next() - 0.5) * angleSpread;

        const halves = bisect(p, v, ratio, b, split ? Ward.ALLEY : 0.0);

        let buildings: MultiPolygon = [];
        for (const half of halves) {
            if (polygonArea(half) < minSq * Math.pow(2, 4 * sizeChaos * (model.random.next() - 0.5))) {
                if (model.random.next() > emptyProb) {
                    buildings.push(half);
                }
            } else {
                buildings = buildings.concat(Ward.createAlleys(model, half, minSq, gridChaos, sizeChaos, emptyProb, polygonArea(half) > minSq / (model.random.next() * model.random.next())));
            }
        }

        return buildings;
    }

    public static createOrthoBuilding(model: any, poly: Polygon, minBlockSq: number, fill: number): MultiPolygon {
        function slice(p: Polygon, c1: Point, c2: Point): MultiPolygon {
            const v0 = findLongestEdge(p);
            const v1 = next(p, v0);
            const v = subtract(v1, v0);

            const ratio = 0.4 + model.random.next() * 0.2;
            const p1 = interpolate(v0, v1, ratio);

            const c = Math.abs(scalar(v, c1)) < Math.abs(scalar(v, c2)) ? c1 : c2;

            const halves = cut(p, p1, add(p1, c));

            // If the cut failed (returned the original polygon), stop the recursion for this branch.
            if (halves.length === 1 && halves[0].length === p.length) {
                let isSame = true;
                for(let i=0; i<p.length; i++) {
                    if(halves[0][i].x !== p[i].x || halves[0][i].y !== p[i].y) {
                        isSame = false;
                        break;
                    }
                }
                if (isSame) return [];
            }

            let buildings: MultiPolygon = [];
            for (const half of halves) {
                if (polygonArea(half) < minBlockSq * Math.pow(2, model.random.nextNormal() * 2 - 1)) {
                    if (model.random.next() < fill) {
                        buildings.push(half);
                    }
                } else {
                    buildings = buildings.concat(slice(half, c1, c2));
                }
            }
            return buildings;
        }

        if (polygonArea(poly) < minBlockSq) {
            return [poly];
        } else {
            const v = vector(poly, findLongestEdge(poly));
            const c1 = normalize(v);
            const c2 = rotate90(c1);

            for (let i = 0; i < 10; i++) { // Safety break after 10 attempts
                const blocks = slice(poly, c1, c2);
                if (blocks.length > 0) {
                    return blocks;
                }
            }

            // If we failed to create blocks after 10 tries,
            // just return the original polygon as a fallback.
            return [poly];
        }
    }
}

export class CommonWard extends Ward {
    private minSq: number;
    private gridChaos: number;
    private sizeChaos: number;
    private emptyProb: number;

    constructor(model: Model, patch: Patch, minSq: number, gridChaos: number, sizeChaos: number, emptyProb = 0.04) {
        super(model, patch);
        this.minSq = minSq;
        this.gridChaos = gridChaos;
        this.sizeChaos = sizeChaos;
        this.emptyProb = emptyProb;
    }

    public override createGeometry() {
        const block = this.getCityBlock();
        if (block && block.length > 2) {
            this.geometry = Ward.createAlleys(this.model, block, this.minSq, this.gridChaos, this.sizeChaos, this.emptyProb);
        }

        if (!this.model.isEnclosed(this.patch)) {
            this.filterOutskirts();
        }
    }
}

export class Castle extends Ward {
    public wall: CurtainWall;

    constructor(model: Model, patch: Patch) {
        super(model, patch);
        this.wall = new CurtainWall(true, model, [patch], []);
    }

    public override createGeometry() {
        const block = shrink(this.patch.shape, Array(this.patch.shape.length).fill(Ward.MAIN_STREET * 2));
        if (block && block.length > 2) {
            this.geometry = Ward.createOrthoBuilding(this.model, block, Math.sqrt(polygonArea(block)) * 4, 0.6);
        }
    }

    public override getLabel() {
        return "Castle";
    }
}

export class Cathedral extends Ward {
    public override createGeometry() {
        const block = this.getCityBlock();
        if (!block || block.length < 3) return;

        if (this.model.random.next() < 0.4) {
            this.geometry = ring(block, 2 + this.model.random.next() * 4);
        } else {
            this.geometry = Ward.createOrthoBuilding(this.model, block, 50, 0.8);
        }
    }

    public static override rateLocation(model: any, patch: Patch): number {
        if (model.plaza != null && model.plaza.shape.some(p => patch.shape.includes(p))) {
            return -1 / polygonArea(patch.shape);
        } else {
            const center = model.plaza != null ? polygonCentroid(model.plaza.shape) : { x: 0, y: 0 };
            const dist = Math.sqrt(Math.pow(polygonCentroid(patch.shape).x - center.x, 2) + Math.pow(polygonCentroid(patch.shape).y - center.y, 2));
            return dist * polygonArea(patch.shape);
        }
    }

    public override getLabel() {
        return "Temple";
    }
}

export class CraftsmenWard extends Ward {
    public override createGeometry() {
        const block = this.getCityBlock();
        if (block && block.length > 2) {
            this.geometry = Ward.createAlleys(this.model, block, 20, 0.7, 0.4, 0.02);
        }
        if (!this.model.isEnclosed(this.patch)) {
            this.filterOutskirts();
        }
    }

    public static override rateLocation(model: any, patch: Patch): number {
        return patch.shape.reduce((acc, p) => acc + p.y, 0) / patch.shape.length;
    }

    public override getLabel() {
        return "Craftsmen Ward";
    }
}

export class MerchantWard extends Ward {
    public override createGeometry() {
        const block = this.getCityBlock();
        if (block && block.length > 2) {
            this.geometry = Ward.createAlleys(this.model, block, 40, 0.3, 0.6);
        }
        if (!this.model.isEnclosed(this.patch)) {
            this.filterOutskirts();
        }
    }

    public static override rateLocation(model: any, patch: Patch): number {
        return -polygonArea(patch.shape);
    }
}

export class Market extends Ward {
    public override createGeometry() {
        // fountain or statue
        const statue = this.model['random'].next() < 0.6;
        // we always offset a statue and sometimes a fountain
        const useOffset = statue || this.model['random'].next() < 0.3;

        let v0: Point | null = null;
        let v1: Point | null = null;
        if (statue || useOffset) {
            // we need an edge both for rotating a statue and offsetting
            let length = -1.0;
            forEdge(this.patch.shape, (p0, p1) => {
                const len = distance(p0, p1);
                if (len > length) {
                    length = len;
                    v0 = p0;
                    v1 = p1;
                }
            });
        }

        let object: Polygon;
        if (statue) {
            object = rect(1 + this.model['random'].next(), 1 + this.model['random'].next());
            if (v0 && v1) {
                const angle = Math.atan2(v1.y - v0.y, v1.x - v0.x);
                // Custom rotation around origin, because geom.rotate rotates around centroid
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);
                object = object.map(p => ({
                    x: p.x * cosA - p.y * sinA,
                    y: p.y * cosA + p.x * sinA,
                }));
            }
        } else {
            object = circle(1 + this.model['random'].next());
        }

        let center: Point;
        if (useOffset && v0 && v1) {
            const gravity = interpolate(v0, v1);
            center = interpolate(polygonCentroid(this.patch.shape), gravity, 0.2 + this.model['random'].next() * 0.4);
        } else {
            center = polygonCentroid(this.patch.shape);
        }

        this.geometry = [offset(object, center)];
    }

    public static override rateLocation(model: any, patch: Patch): number {
        // One market should not touch another
        for (const p of model.patches) {
            if (p.ward instanceof Market && p.shape.some(point => patch.shape.includes(point))) {
                return Infinity;
            }
        }

        // Market shouldn't be much larger than the plaza
        if (model.plaza != null) {
            return polygonArea(patch.shape) / polygonArea(model.plaza.shape);
        } else {
            const center = { x: 0, y: 0 };
            const dist = Math.sqrt(Math.pow(polygonCentroid(patch.shape).x - center.x, 2) + Math.pow(polygonCentroid(patch.shape).y - center.y, 2));
            return dist;
        }
    }

    public override getLabel() {
        return "Market";
    }
}

export class GateWard extends Ward {
    public override createGeometry() {
        const block = this.getCityBlock();
        if (block && block.length > 2) {
            this.geometry = Ward.createAlleys(this.model, block, 10, 0.2, 0.3);
        }
    }

    public override getLabel() {
        return "Gate Ward";
    }
}

export class Slum extends Ward {
    public override createGeometry() {
        const block = this.getCityBlock();
        if (block && block.length > 2) {
            this.geometry = Ward.createAlleys(this.model, block, 1, 0.8, 0.8, 0.1);
        }
        if (!this.model.isEnclosed(this.patch)) {
            this.filterOutskirts();
        }
    }

    public static override rateLocation(model: any, patch: Patch): number {
        return -(patch.shape.reduce((acc, p) => acc + p.y, 0) / patch.shape.length);
    }

    public override getLabel() {
        return "Slums";
    }
}

export class AdministrationWard extends Ward {
    public override createGeometry() {
        const block = this.getCityBlock();
        if (block && block.length > 2) {
            this.geometry = Ward.createOrthoBuilding(this.model, block, 40, 0.6);
        }
    }

    public static override rateLocation(model: any, patch: Patch): number {
        return model.wall ? -distance2line(polygonCentroid(patch.shape), model.wall.shape[0], model.wall.shape[model.wall.shape.length - 1]) : 0;
    }

    public override getLabel() {
        return "Administration Ward";
    }
}

export class MilitaryWard extends Ward {
    public override createGeometry() {
        const block = this.getCityBlock();
        if (block && block.length > 2) {
            this.geometry = Ward.createOrthoBuilding(this.model, block, 30, 0.7);
        }
    }

    public static override rateLocation(model: any, patch: Patch): number {
        if (model.citadel) {
            return -patch.shape.reduce((d, p) => Math.min(d, distance2line(p, model.citadel.shape[0], model.citadel.shape[1])), Infinity);
        }
        return 0;
    }

    public override getLabel() {
        return "Military Ward";
    }
}

export class PatriciateWard extends Ward {
    public override createGeometry() {
        const block = this.getCityBlock();
        if (block && block.length > 2) {
            this.geometry = Ward.createAlleys(this.model, block, 60, 0.1, 0.4, 0.2);
        }
    }

    public static override rateLocation(model: any, patch: Patch): number {
        return -patch.shape.reduce((d, p) => Math.min(d, p.y), Infinity);
    }

    public override getLabel() {
        return "Patriciate Ward";
    }
}

export class Park extends Ward {
    public override createGeometry() {
        const block = this.getCityBlock();
        if (block && block.length > 2) {
            this.geometry = Ward.createAlleys(this.model, block, 100, 0.9, 0.9, 0.9, false);
        }
    }

    public static override rateLocation(model: any, patch: Patch): number {
        return compactness(patch.shape) < 0.7 ? Infinity : 0;
    }

    public override getLabel() {
        return "Park";
    }
}

function randomFrom<T>(arr: T[], random: SeededRandom): T {
    return arr[Math.floor(random.next() * arr.length)];
}

export class Farm extends Ward {
    public override createGeometry() {
        let housing = rect(4, 4);
        const pos = interpolate(randomFrom(this.patch.shape, this.model.random), polygonCentroid(this.patch.shape), 0.3 + this.model.random.next() * 0.4);

        // geom.rotate rotates around centroid, we need to rotate around origin for the initial placement
        const angle = this.model.random.next() * Math.PI;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        housing = housing.map(p => ({
            x: p.x * cosA - p.y * sinA,
            y: p.y * cosA + p.x * sinA,
        }));

        housing = offset(housing, pos);

        this.geometry = Ward.createOrthoBuilding(this.model, housing, 8, 0.5);
    }

    public override getLabel() {
        return "Farm";
    }
}
