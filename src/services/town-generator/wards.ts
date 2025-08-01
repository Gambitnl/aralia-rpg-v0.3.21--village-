import { Point, Polygon, MultiPolygon, shrink, cut, forEdge, polygonArea, next, polygonCentroid, rect, rotate, offset, findLongestEdge, vector, add, rotate90, subtract, inverseDistanceWeighting } from './geom';
import { Patch } from './patch';
import { Model } from './model';
import { scalar } from './utils';
import { bisect, ring } from './cutter';
import { SeededRandom } from '../../utils/seededRandom';
import { distance2line, interpolate } from './utils';
import { CurtainWall } from './curtain-wall';

const random = new SeededRandom(0);

export class Ward {
    public static MAIN_STREET = 2.0;
    public static REGULAR_STREET = 1.0;
    public static ALLEY = 0.6;

    public model: Model;
    public patch: Patch;
    public geometry: MultiPolygon = [];

    constructor(model: Model, patch: Patch) {
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
            return this.model.patchByVertex(v).every(p => p.withinCity) ? 2 * random.next() : 0;
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

            return random.next() > minDist;
        });
    }

    public getLabel(): string | null {
        return null;
    }

    public static rateLocation(model: Model, patch: Patch): number {
        return 0;
    }

    public static createAlleys(p: Polygon, minSq: number, gridChaos: number, sizeChaos: number, emptyProb = 0.04, split = true): MultiPolygon {
        let v: Point | null = null;
        let length = -1.0;
        forEdge(p, (p0, p1) => {
            const len = Math.sqrt(Math.pow(p0.x - p1.x, 2) + Math.pow(p0.y - p1.y, 2));
            if (len > length) {
                length = len;
                v = p0;
            }
        });

        if (!v) {
            return []; // Return empty if no valid vertex found
        }

        const spread = 0.8 * gridChaos;
        const ratio = (1 - spread) / 2 + random.next() * spread;

        const angleSpread = Math.PI / 6 * gridChaos * (polygonArea(p) < minSq * 4 ? 0.0 : 1);
        const b = (random.next() - 0.5) * angleSpread;

        const halves = bisect(p, v, ratio, b, split ? Ward.ALLEY : 0.0);

        let buildings: MultiPolygon = [];
        for (const half of halves) {
            if (polygonArea(half) < minSq * Math.pow(2, 4 * sizeChaos * (random.next() - 0.5))) {
                if (random.next() > emptyProb) {
                    buildings.push(half);
                }
            } else {
                buildings = buildings.concat(Ward.createAlleys(half, minSq, gridChaos, sizeChaos, emptyProb, polygonArea(half) > minSq / (random.next() * random.next())));
            }
        }

        return buildings;
    }

    public static createOrthoBuilding(poly: Polygon, minBlockSq: number, fill: number): MultiPolygon {
        function slice(p: Polygon, c1: Point, c2: Point): MultiPolygon {
            const v0 = findLongestEdge(p);
            const v1 = next(p, v0);
            const v = subtract(v1, v0);

            const ratio = 0.4 + random.next() * 0.2;
            const p1 = interpolate(v0, v1, ratio);

            const c = Math.abs(scalar(v.x, v.y, c1.x, c1.y)) < Math.abs(scalar(v.x, v.y, c2.x, c2.y)) ? c1 : c2;

            const halves = cut(p, p1, add(p1, c));
            let buildings: MultiPolygon = [];
            for (const half of halves) {
                if (polygonArea(half) < minBlockSq * Math.pow(2, random.nextNormal() * 2 - 1)) {
                    if (random.next() < fill) {
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
            const c1 = vector(poly, findLongestEdge(poly));
            const c2 = rotate90(c1);
            while (true) {
                const blocks = slice(poly, c1, c2);
                if (blocks.length > 0) {
                    return blocks;
                }
            }
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
        if (block) {
            this.geometry = Ward.createAlleys(block, this.minSq, this.gridChaos, this.sizeChaos, this.emptyProb);
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
        const block = shrink(this.patch.shape, [Ward.MAIN_STREET * 2]);
        this.geometry = Ward.createOrthoBuilding(block, Math.sqrt(polygonArea(block)) * 4, 0.6);
    }

    public override getLabel() {
        return "Castle";
    }
}

export class Cathedral extends Ward {
    public override createGeometry() {
        if (random.next() < 0.4) {
            this.geometry = ring(this.getCityBlock(), 2 + random.next() * 4);
        } else {
            this.geometry = Ward.createOrthoBuilding(this.getCityBlock(), 50, 0.8);
        }
    }

    public static override rateLocation(model: Model, patch: Patch): number {
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
        this.geometry = Ward.createAlleys(this.getCityBlock(), 20, 0.7, 0.4, 0.02);
        if (!this.model.isEnclosed(this.patch)) {
            this.filterOutskirts();
        }
    }

    public static override rateLocation(model: Model, patch: Patch): number {
        return patch.shape.reduce((acc, p) => acc + p.y, 0) / patch.shape.length;
    }

    public override getLabel() {
        return "Craftsmen Ward";
    }
}

export class MerchantWard extends Ward {
    public override createGeometry() {
        this.geometry = Ward.createAlleys(this.getCityBlock(), 40, 0.3, 0.6);
        if (!this.model.isEnclosed(this.patch)) {
            this.filterOutskirts();
        }
    }

    public static override rateLocation(model: Model, patch: Patch): number {
        return -polygonArea(patch.shape);
    }
}

export class Market extends Ward {
    public override createGeometry() {
        const statue = random.next() < 0.6;
        const offset = statue || random.next() < 0.3;

        let v0: Point | null = null;
        let v1: Point | null = null;
        if (statue || offset) {
            let length = -1.0;
            forEdge(this.patch.shape, (p0, p1) => {
                const len = Math.sqrt(Math.pow(p0.x - p1.x, 2) + Math.pow(p0.y - p1.y, 2));
                if (len > length) {
                    length = len;
                    v0 = p0;
                    v1 = p1;
                }
            });
        }

        let object: Polygon;
        if (statue) {
            object = [{x: -0.5, y: -0.5}, {x: 0.5, y: -0.5}, {x: 0.5, y: 0.5}, {x: -0.5, y: 0.5}];
            // Polygon rotation is not implemented yet, so we skip it
        } else {
            object = [];
            for (let i = 0; i < 16; i++) {
                const a = i / 16 * Math.PI * 2;
                object.push({ x: Math.cos(a), y: Math.sin(a) });
            }
        }

        if (offset) {
            const gravity = interpolate(v0!, v1!);
            const center = polygonCentroid(this.patch.shape);
            const newCenter = interpolate(center, gravity, 0.2 + random.next() * 0.4);
            object = object.map(p => ({ x: p.x + newCenter.x, y: p.y + newCenter.y }));
        } else {
            const center = polygonCentroid(this.patch.shape);
            object = object.map(p => ({ x: p.x + center.x, y: p.y + center.y }));
        }

        this.geometry = [object];
    }

    public static override rateLocation(model: Model, patch: Patch): number {
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
        this.geometry = Ward.createAlleys(this.getCityBlock(), 10, 0.2, 0.3);
    }

    public override getLabel() {
        return "Gate Ward";
    }
}

export class Slum extends Ward {
    public override createGeometry() {
        this.geometry = Ward.createAlleys(this.getCityBlock(), 1, 0.8, 0.8, 0.1);
        if (!this.model.isEnclosed(this.patch)) {
            this.filterOutskirts();
        }
    }

    public static override rateLocation(model: Model, patch: Patch): number {
        return -(patch.shape.reduce((acc, p) => acc + p.y, 0) / patch.shape.length);
    }

    public override getLabel() {
        return "Slums";
    }
}

export class AdministrationWard extends Ward {
    public override createGeometry() {
        this.geometry = Ward.createOrthoBuilding(this.getCityBlock(), 40, 0.6);
    }

    public static override rateLocation(model: Model, patch: Patch): number {
        return model.wall ? -distance2line(polygonCentroid(patch.shape), model.wall.shape[0], model.wall.shape[model.wall.shape.length - 1]) : 0;
    }

    public override getLabel() {
        return "Administration Ward";
    }
}

export class MilitaryWard extends Ward {
    public override createGeometry() {
        this.geometry = Ward.createOrthoBuilding(this.getCityBlock(), 30, 0.7);
    }

    public static override rateLocation(model: Model, patch: Patch): number {
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
        this.geometry = Ward.createAlleys(this.getCityBlock(), 60, 0.1, 0.4, 0.2);
    }

    public static override rateLocation(model: Model, patch: Patch): number {
        return -patch.shape.reduce((d, p) => Math.min(d, p.y), Infinity);
    }

    public override getLabel() {
        return "Patriciate Ward";
    }
}

export class Park extends Ward {
    public override createGeometry() {
        this.geometry = Ward.createAlleys(this.getCityBlock(), 100, 0.9, 0.9, 0.9, false);
    }

    public static override rateLocation(model: Model, patch: Patch): number {
        return compactness(patch.shape) < 0.7 ? Infinity : 0;
    }

    public override getLabel() {
        return "Park";
    }
}

function randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(random.next() * arr.length)];
}

export class Farm extends Ward {
    public override createGeometry() {
        let housing = rect(4, 4);
        const pos = interpolate(randomFrom(this.patch.shape), polygonCentroid(this.patch.shape), 0.3 + random.next() * 0.4);
        housing = rotate(housing, random.next() * Math.PI);
        housing = offset(housing, pos);

        this.geometry = Ward.createOrthoBuilding(housing, 8, 0.5);
    }

    public override getLabel() {
        return "Farm";
    }
}
