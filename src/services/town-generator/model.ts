import { Point, Polygon, Voronoi as MyVoronoi, distance } from './geom';
import { Patch } from './patch';
import { Ward, CommonWard, Castle, Cathedral, Market } from './wards';
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
        CommonWard, CommonWard, Market, CommonWard, CommonWard, Cathedral,
        // ... more wards to be added here
    ];

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

        // Relaxing central wards is complex, skipping for now.

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
                // Road building logic is complex, skipping for now
            }
        }
        this.tidyUpRoads();
    }

    private tidyUpRoads(): void {
        // This method is complex, skipping for now
        this.arteries = this.streets;
    }

    private optimizeJunctions(): void {
        // This method is complex, skipping for now
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

    public isEnclosed(p: Patch): boolean {
        // TODO: implement this method
        return false;
    }

    public getNeighbour(p: Patch, p1: Point): Patch | null {
        // TODO: implement this method
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
