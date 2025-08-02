import { Point } from './geom';

const EPSILON = 1e-6;
function pointEquals(p1: Point, p2: Point): boolean {
    return Math.abs(p1.x - p2.x) < EPSILON && Math.abs(p1.y - p2.y) < EPSILON;
}
import { Graph } from './graph';
import { Model } from './model';
import { Patch } from './patch';

class Node {
    public id: number;
    public links: Map<Node, number> = new Map();
    public g = 0;
    public h = 0;
    public f = 0;
    public parent: Node | null = null;

    constructor(id: number) {
        this.id = id;
    }

    public link(node: Node, weight: number): void {
        this.links.set(node, weight);
        node.links.set(this, weight);
    }
}

export class Topology {
    private model: Model;
    private graph: Graph;
    public pt2node: Map<Point, Node> = new Map();
    public node2pt: Map<Node, Point> = new Map();
    private blocked: Point[];
    public inner: Node[] = [];
    public outer: Node[] = [];

    constructor(model: Model) {
        this.model = model;
        this.graph = new Graph(this.node2pt);

        this.blocked = [];
        if (this.model.citadel) {
            this.blocked = this.blocked.concat(this.model.citadel.shape);
        }
        if (this.model.wall) {
            this.blocked = this.blocked.concat(this.model.wall.shape);
        }
        this.blocked = this.blocked.filter(p => 
            !this.model.gates.some(gate => pointEquals(gate, p)) &&
            !(this.model.plaza && this.model.plaza.shape.some(plazaPoint => pointEquals(plazaPoint, p))) &&
            !(this.model.center && pointEquals(this.model.center, p))
        );

        const border = this.model.border.shape;

        for (const p of this.model.patches) {
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
                    n0.link(n1, Math.sqrt(Math.pow(v0.x - v1.x, 2) + Math.pow(v0.y - v1.y, 2)));
                }
            }
        }
    }

    private findNodeByPoint(p: Point): Node | undefined {
        for (const [node, point] of this.node2pt.entries()) {
            if (pointEquals(point, p)) {
                return node;
            }
        }
        return undefined;
    }

    private processPoint(v: Point): Node | null {
        console.log(`processPoint: Processing point {x: ${v.x}, y: ${v.y}}`);
        let n: Node | undefined = this.findNodeByPoint(v);
        if (!n) {
            console.log(`processPoint: No existing node found for {x: ${v.x}, y: ${v.y}}. Creating new node.`);
            n = this.graph.add();
            this.pt2node.set(v, n);
            this.node2pt.set(n, v);
            (this.graph as any).node2pt.set(n, v);
        } else {
            console.log(`processPoint: Found existing node for {x: ${v.x}, y: ${v.y}}.`);
        }

        const isBlocked = this.blocked.some(blockedPoint => pointEquals(blockedPoint, v));
        console.log(`processPoint: Point {x: ${v.x}, y: ${v.y}} is ${isBlocked ? 'blocked' : 'not blocked'}.`);
        return isBlocked ? null : n;
    }

    public buildPath(from: Point, to: Point, exclude: Node[] = []): Point[] | null {
        console.log(`buildPath called: From {x: ${from.x}, y: ${from.y}}, To {x: ${to.x}, y: ${to.y}}`);
        let fromNode = this.findNodeByPoint(from);
        if (!fromNode) {
            console.warn(`buildPath: fromNode not found for {x: ${from.x}, y: ${from.y}}. Attempting to register point.`);
            fromNode = this.processPoint(from);
        }
        let toNode = this.findNodeByPoint(to);
        if (!toNode) {
            console.warn(`buildPath: toNode not found for {x: ${to.x}, y: ${to.y}}. Attempting to register point.`);
            toNode = this.processPoint(to);
        }
        if (!fromNode || !toNode) {
            console.warn(`buildPath: fromNode or toNode is still null after processing. From: ${fromNode ? 'valid' : 'null'}, To: ${toNode ? 'valid' : 'null'}`);
            return null;
        }

        return this.graph.aStar(fromNode, toNode, exclude);
    }
}