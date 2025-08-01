import { Point, Polygon, Voronoi as MyVoronoi, distance, relax, smoothVertexEq, next, findEdge } from './geom';
import { Patch } from './patch';
import { Ward, CommonWard, Castle, Cathedral, Market, CraftsmenWard, MerchantWard, AdministrationWard, Slum, PatriciateWard, MilitaryWard, Park, Farm } from './wards';
import { CurtainWall } from './curtain-wall';
import { Topology } from './topology';
import { SeededRandom } from '../../utils/seededRandom';
import { Delaunay } from 'd3-delaunay';

type Street = Polygon;

export class Model {
    public static instance: Model;

    private nPatches: number;
    private plazaNeeded: boolean;
    private citadelNeeded: boolean;
    private wallsNeeded: boolean;

    public static WARDS: (typeof Ward)[] = [
        CraftsmenWard, CraftsmenWard, MerchantWard, CraftsmenWard, CraftsmenWard, Cathedral,
        CraftsmenWard, CraftsmenWard, CraftsmenWard, CraftsmenWard, CraftsmenWard,
        CraftsmenWard, CraftsmenWard, CraftsmenWard, AdministrationWard, CraftsmenWard,
        Slum, CraftsmenWard, Slum, PatriciateWard, Market,
        Slum, CraftsmenWard, CraftsmenWard, CraftsmenWard, Slum,
        CraftsmenWard, CraftsmenWard, CraftsmenWard, MilitaryWard, Slum,
        CraftsmenWard, Park, PatriciateWard, Market, MerchantWard];

    public topology: Topology;
    public patches: Patch[];
    public inner: Patch[];
    public citadel: Patch | null = null;
    public plaza: Patch | null = null;
    public center: Point;

    public border: CurtainWall;
    public wall: CurtainWall | null = null;
    public cityRadius: number;
    public gates: Point[];
    public arteries: Street[];
    public streets: Street[];
    public roads: Street[];

    private random: SeededRandom;

    constructor(nPatches = 15, seed = -1) {
        this.random = new SeededRandom(seed > 0 ? seed : Date.now());
        this.nPatches = nPatches;

        this.plazaNeeded = this.random.next() > 0.5;
        this.citadelNeeded = this.random.next() > 0.5;
        this.wallsNeeded = this.random.next() > 0.5;

        this.build();
        Model.instance = this;
    }

    private build(): void {
        this.streets = [];
        this.roads = [];

        this.buildPatches();
        this.optimizeJunctions();
        this.buildWalls();
        this.buildStreets();
        this.createWards();
        this.buildGeometry();
    }

    private buildPatches(): void {
        const sa = this.random.next() * 2 * Math.PI;
        const points: Point[] = [];
        for (let i = 0; i < this.nPatches * 8; i++) {
            const a = sa + Math.sqrt(i) * 5;
            const r = (i === 0 ? 0 : 10 + i * (2 + this.random.next()));
            points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
        }

        let delaunay = Delaunay.from(points.map(p => [p.x, p.y]));
        let voronoi = delaunay.voronoi([-1000, -1000, 1000, 1000]);

        for (let i = 0; i < 3; i++) {
            const relaxedPoints = relax(points, voronoi);
            delaunay = Delaunay.from(relaxedPoints.map(p => [p.x, p.y]));
            voronoi = delaunay.voronoi([-1000, -1000, 1000, 1000]);
        }

        const regions = Array.from(voronoi.cellPolygons());

        this.patches = [];
        this.inner = [];

        let count = 0;
        for (const region of regions) {
            const patch = Patch.fromRegion(region);
            this.patches.push(patch);

            if (count === 0) {
                this.center = patch.shape.reduce((a, b) => distance(a, {x:0, y:0}) < distance(b, {x:0, y:0}) ? a : b);
                if (this.plazaNeeded) this.plaza = patch;
            } else if (count === this.nPatches && this.citadelNeeded) {
                this.citadel = patch;
                patch.withinCity = true;
            }

            if (count < this.nPatches) {
                patch.withinCity = true;
                patch.withinWalls = this.wallsNeeded;
                this.inner.push(patch);
            }
            count++;
        }
    }

    private buildWalls(): void {
        const reserved = this.citadel ? this.citadel.shape : [];
        this.border = new CurtainWall(this.wallsNeeded, this, this.inner, reserved);
        if (this.wallsNeeded) {
            this.wall = this.border;
        }

        this.gates = this.border.gates;

        if (this.citadel) {
            const castle = new Castle(this, this.citadel);
            this.citadel.ward = castle;
            this.gates = this.gates.concat(castle.wall.gates);
        }
    }

    private buildStreets(): void {
        this.topology = new Topology(this);

        for (const gate of this.gates) {
            const end = this.plaza ? this.plaza.shape.reduce((a, b) => distance(a, gate) < distance(b, gate) ? a : b) : this.center;
            const street = this.topology.buildPath(gate, end, this.topology.outer);
            if (street) {
                this.streets.push(street);

                if (this.border.gates.includes(gate)) {
                    const dir = { x: gate.x * 1000, y: gate.y * 1000 };
                    let start: Point | null = null;
                    let dist = Infinity;
                    for (const p of Array.from(this.topology.node2pt.values())) {
                        const d = distance(p, dir);
                        if (d < dist) {
                            dist = d;
                            start = p;
                        }
                    }

                    if (start) {
                        const road = this.topology.buildPath(start, gate, this.topology.inner);
                        if (road) {
                            this.roads.push(road);
                        }
                    }
                }
            } else {
                console.error("Unable to build a street!");
            }
        }

        this.tidyUpRoads();

        for (const a of this.arteries) {
            const smoothed = smoothVertexEq(a, 3);
            for (let i = 1; i < a.length - 1; i++) {
                a[i] = smoothed[i];
            }
        }
    }

    private tidyUpRoads(): void {
        const segments: { start: Point; end: Point }[] = [];

        const cut2segments = (street: Street) => {
            let v0: Point | null = null;
            let v1: Point = street[0];
            for (let i = 1; i < street.length; i++) {
                v0 = v1;
                v1 = street[i];

                if (this.plaza && this.plaza.shape.some(p => p === v0) && this.plaza.shape.some(p => p === v1)) {
                    continue;
                }

                const exists = segments.some(seg => seg.start === v0 && seg.end === v1);
                if (!exists) {
                    segments.push({ start: v0, end: v1 });
                }
            }
        };

        for (const street of this.streets) {
            cut2segments(street);
        }
        for (const road of this.roads) {
            cut2segments(road);
        }

        this.arteries = [];
        while (segments.length > 0) {
            const seg = segments.pop()!;

            let attached = false;
            for (const a of this.arteries) {
                if (a[0] === seg.end) {
                    a.unshift(seg.start);
                    attached = true;
                    break;
                } else if (a[a.length - 1] === seg.start) {
                    a.push(seg.end);
                    attached = true;
                    break;
                }
            }

            if (!attached) {
                this.arteries.push([seg.start, seg.end]);
            }
        }
    }

    private optimizeJunctions(): void {
        const patchesToOptimize = this.citadel ? [...this.inner, this.citadel] : [...this.inner];

        const wards2clean: Patch[] = [];
        for (const w of patchesToOptimize) {
            let index = 0;
            while (index < w.shape.length) {
                const v0 = w.shape[index];
                const v1 = w.shape[(index + 1) % w.shape.length];

                if (v0 !== v1 && distance(v0, v1) < 8) {
                    for (const w1 of this.patchByVertex(v1)) {
                        if (w1 !== w) {
                            const v1Index = w1.shape.findIndex(p => p === v1);
                            if (v1Index !== -1) {
                                w1.shape[v1Index] = v0;
                                wards2clean.push(w1);
                            }
                        }
                    }

                    v0.x = (v0.x + v1.x) / 2;
                    v0.y = (v0.y + v1.y) / 2;

                    w.shape.splice((index + 1) % w.shape.length, 1);
                }
                index++;
            }
        }

        // Removing duplicate vertices
        for (const w of wards2clean) {
            for (let i = 0; i < w.shape.length; i++) {
                const v = w.shape[i];
                let dupIdx;
                while ((dupIdx = w.shape.findIndex((p, idx) => p === v && idx > i)) !== -1) {
                    w.shape.splice(dupIdx, 1);
                }
            }
        }
    }

    private createWards(): void {
        const unassigned = [...this.inner];
        if (this.plaza) {
            this.plaza.ward = new Market(this, this.plaza);
            unassigned.splice(unassigned.indexOf(this.plaza), 1);
        }

        // A simplified ward assignment logic
        for (const patch of unassigned) {
            if (!patch.ward) {
                const WardClass = Model.WARDS[Math.floor(this.random.next() * Model.WARDS.length)];
                patch.ward = new WardClass(this, patch, 10, 0.5, 0.5);
            }
        }
    }

    private buildGeometry(): void {
        for (const patch of this.patches) {
            if (patch.ward) {
                patch.ward.createGeometry();
            }
        }
    }

    public getNeighbours(patch: Patch): Patch[] {
        return this.patches.filter(p => p !== patch && patch.borders(p));
    }

    public isEnclosed(p: Patch): boolean {
        return p.withinCity && (p.withinWalls || this.getNeighbours(p).every(p => p.withinCity));
    }

    public getNeighbour(patch: Patch, v: Point): Patch | null {
        const nextV = next(patch.shape, v);
        for (const p of this.patches) {
            if (p !== patch && findEdge(p.shape, nextV, v) !== -1) {
                return p;
            }
        }
        return null;
    }

    public patchByVertex(p: Point): Patch[] {
        return this.patches.filter(patch => patch.shape.includes(p));
    }

    public static findCircumference(wards: Patch[]): Polygon {
        if (wards.length === 0) {
            return [];
        } else if (wards.length === 1) {
            return wards[0].shape.slice();
        }

        const A: Point[] = [];
        const B: Point[] = [];

        for (const w1 of wards) {
            for (let i = 0; i < w1.shape.length; i++) {
                const a = w1.shape[i];
                const b = w1.shape[(i + 1) % w1.shape.length];
                let outerEdge = true;
                for (const w2 of wards) {
                    if (w1 !== w2) {
                        for (let j = 0; j < w2.shape.length; j++) {
                            if (w2.shape[j] === b && w2.shape[(j + 1) % w2.shape.length] === a) {
                                outerEdge = false;
                                break;
                            }
                        }
                    }
                    if (!outerEdge) break;
                }
                if (outerEdge) {
                    A.push(a);
                    B.push(b);
                }
            }
        }

        if (A.length === 0) return [];

        const result: Polygon = [];
        let index = 0;
        do {
            result.push(A[index]);
            const nextB = B[index];
            index = A.findIndex(p => p === nextB);
        } while (index !== 0 && index !== -1);

        return result;
    }
}
