import { Point } from './geom';
import { Graph, Node } from './graph';
import { Model } from './model';
import { Patch } from './patch';
import { distance } from './geom';

export class Topology {
    private model: Model;
    private graph: Graph;
    public pt2node: Map<Point, Node>;
    public node2pt: Map<Node, Point>;
    private blocked: Point[];
    public inner: Node[];
    public outer: Node[];

    constructor(model: Model) {
        this.model = model;
        this.graph = new Graph();
        this.pt2node = new Map();
        this.node2pt = new Map();
        this.inner = [];
        this.outer = [];

        this.blocked = [];
        if (model.wall) {
            this.blocked = this.blocked.concat(model.wall.shape);
        }
        this.blocked = this.blocked.filter(p => !model.gates.includes(p));

        const border = model.border ? model.border.shape : [];

        for (const p of model.patches) {
            const withinCity = p.withinCity;
            let v1 = p.shape[p.shape.length - 1];
            let n1 = this.processPoint(v1);

            for (let i = 0; i < p.shape.length; i++) {
                const v0 = v1;
                v1 = p.shape[i];
                const n0 = n1;
                n1 = this.processPoint(v1);

                if (n0 && !border.includes(v0)) {
                    if (withinCity) {
                        if (!this.inner.includes(n0)) this.inner.push(n0);
                    } else {
                        if (!this.outer.includes(n0)) this.outer.push(n0);
                    }
                }
                if (n1 && !border.includes(v1)) {
                    if (withinCity) {
                        if (!this.inner.includes(n1)) this.inner.push(n1);
                    } else {
                        if (!this.outer.includes(n1)) this.outer.push(n1);
                    }
                }

                if (n0 && n1) {
                    n0.link(n1, distance(v0, v1));
                }
            }
        }
    }

    private processPoint(v: Point): Node | null {
        let n: Node;
        if (this.pt2node.has(v)) {
            n = this.pt2node.get(v)!;
        } else {
            n = this.graph.add();
            this.pt2node.set(v, n);
            this.node2pt.set(n, v);
        }
        return this.blocked.includes(v) ? null : n;
    }

    public buildPath(from: Point, to: Point, exclude: Node[] = []): Point[] | null {
        const startNode = this.pt2node.get(from);
        const goalNode = this.pt2node.get(to);

        if (!startNode || !goalNode) {
            return null;
        }

        const path = this.graph.aStar(startNode, goalNode, exclude);
        return path ? path.map(n => this.node2pt.get(n)!) : null;
    }
}
