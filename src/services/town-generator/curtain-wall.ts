import { Point, Polygon, forEdge, next } from './geom';
import { Patch } from './patch';
import { Model } from './model';
import { SeededRandom } from '../../utils/seededRandom';

const random = new SeededRandom(0);

export class CurtainWall {
    public shape: Polygon;
    public segments: boolean[];
    public gates: Point[];
    public towers: Point[];

    private real: boolean;
    private patches: Patch[];

    constructor(real: boolean, model: Model, patches: Patch[], reserved: Point[]) {
        this.real = real;
        this.patches = patches;

        if (patches.length === 1) {
            this.shape = patches[0].shape;
        } else {
            this.shape = Model.findCircumference(patches);

            if (real) {
                const smoothFactor = Math.min(1, 40 / patches.length);
                this.shape = this.shape.map(v =>
                    reserved.includes(v) ? v : this.smoothVertex(v, smoothFactor)
                );
            }
        }

        this.segments = this.shape.map(() => true);
        this.buildGates(real, model, reserved);
        this.buildTowers();
    }

    private buildGates(real: boolean, model: Model, reserved: Point[]): void {
        this.gates = [];

        let entrances: Point[] = [];
        if (this.patches.length > 1) {
            entrances = this.shape.filter(v =>
                !reserved.includes(v) && this.patches.filter(p => p.shape.includes(v)).length > 1
            );
        } else {
            entrances = this.shape.filter(v => !reserved.includes(v));
        }

        if (entrances.length === 0) {
            throw new Error("Bad walled area shape!");
        }

        do {
            const index = Math.floor(random.next() * entrances.length);
            const gate = entrances[index];
            this.gates.push(gate);

            if (real) {
                const outerWards = model.patchByVertex(gate).filter(w => !this.patches.includes(w));
                if (outerWards.length === 1) {
                    const outer = outerWards[0];
                    if (outer.shape.length > 3) {
                        const wallVector = {
                            x: next(this.shape, gate).x - this.shape[(this.shape.indexOf(gate) + this.shape.length - 1) % this.shape.length].x,
                            y: next(this.shape, gate).y - this.shape[(this.shape.indexOf(gate) + this.shape.length - 1) % this.shape.length].y
                        };
                        const out = { x: wallVector.y, y: -wallVector.x };

                        let farthest: Point | null = null;
                        let maxDot = -Infinity;

                        for (const v of outer.shape) {
                            if (this.shape.includes(v) || reserved.includes(v)) continue;
                            const dir = { x: v.x - gate.x, y: v.y - gate.y };
                            const dot = (dir.x * out.x + dir.y * out.y) / Math.sqrt(dir.x * dir.x + dir.y * dir.y);
                            if (dot > maxDot) {
                                maxDot = dot;
                                farthest = v;
                            }
                        }

                        if (farthest) {
                            // This part of the logic is complex and modifies the model's patches.
                            // I will skip it for now, as it requires a more complete Model implementation.
                        }
                    }
                }
            }

            if (index === 0) {
                entrances.splice(0, 2);
                entrances.pop();
            } else if (index === entrances.length - 1) {
                entrances.splice(index - 1, 2);
                entrances.shift();
            } else {
                entrances.splice(index - 1, 3);
            }
        } while (entrances.length >= 3);

        if (this.gates.length === 0) {
            throw new Error("Bad walled area shape!");
        }

        if (real) {
            this.gates = this.gates.map(gate => this.smoothVertex(gate));
        }
    }

    private buildTowers() {
        this.towers = [];
        if (this.real) {
            const len = this.shape.length;
            for (let i = 0; i < len; i++) {
                const t = this.shape[i];
                if (!this.gates.includes(t) && (this.segments[(i + len - 1) % len] || this.segments[i])) {
                    this.towers.push(t);
                }
            }
        }
    }

    public getRadius(): number {
        let radius = 0;
        for (const v of this.shape) {
            radius = Math.max(radius, Math.sqrt(v.x * v.x + v.y * v.y));
        }
        return radius;
    }

    public bordersBy(p: Patch, v0: Point, v1: Point): boolean {
        const index = this.patches.includes(p) ?
            this.shape.findIndex((v, i) => v === v0 && this.shape[(i + 1) % this.shape.length] === v1) :
            this.shape.findIndex((v, i) => v === v1 && this.shape[(i + 1) % this.shape.length] === v0);

        if (index !== -1 && this.segments[index]) {
            return true;
        }
        return false;
    }

    private smoothVertex(v: Point, f = 1.0): Point {
        const prev = this.shape[(this.shape.indexOf(v) + this.shape.length - 1) % this.shape.length];
        const next = this.shape[(this.shape.indexOf(v) + 1) % this.shape.length];
        return {
            x: (prev.x + v.x * f + next.x) / (2 + f),
            y: (prev.y + v.y * f + next.y) / (2 + f),
        };
    }
}
