import { Point, distance } from './geom';

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

export class Graph {
    private nodes: Node[] = [];
    private nextId = 0;

    public add(): Node {
        const node = new Node(this.nextId++);
        this.nodes.push(node);
        return node;
    }

    public aStar(start: Node, end: Node, exclude: Node[] = []): Point[] | null {
        const openSet: Node[] = [start];
        const closedSet: Node[] = [];

        for (const node of this.nodes) {
            node.g = 0;
            node.h = 0;
            node.f = 0;
            node.parent = null;
        }

        start.h = distance(this.node2pt.get(start)!, this.node2pt.get(end)!);
        start.f = start.h;

        while (openSet.length > 0) {
            let lowestFIndex = 0;
            for (let i = 0; i < openSet.length; i++) {
                if (openSet[i].f < openSet[lowestFIndex].f) {
                    lowestFIndex = i;
                }
            }

            let current = openSet[lowestFIndex];

            if (current === end) {
                const path: Point[] = [];
                let temp: Node | null = current;
                while (temp) {
                    path.push(this.node2pt.get(temp)!);
                    temp = temp.parent;
                }
                return path.reverse();
            }

            openSet.splice(lowestFIndex, 1);
            closedSet.push(current);

            for (const [neighbor, weight] of current.links.entries()) {
                if (closedSet.includes(neighbor) || exclude.includes(neighbor)) {
                    continue;
                }

                const gScore = current.g + weight;
                let gScoreIsBest = false;

                if (!openSet.includes(neighbor)) {
                    gScoreIsBest = true;
                    neighbor.h = distance(this.node2pt.get(neighbor)!, this.node2pt.get(end)!);
                    openSet.push(neighbor);
                } else if (gScore < neighbor.g) {
                    gScoreIsBest = true;
                }

                if (gScoreIsBest) {
                    neighbor.parent = current;
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;
                }
            }
        }

        return null;
    }

    public node2pt: Map<Node, Point> = new Map();
}