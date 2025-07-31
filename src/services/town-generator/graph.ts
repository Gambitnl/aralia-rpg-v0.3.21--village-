// A simple graph implementation with a Node class and a Graph class.
// The Graph class has an aStar method for pathfinding.

export class Node {
    public links: Map<Node, number> = new Map();

    public link(node: Node, price = 1, symmetrical = true) {
        this.links.set(node, price);
        if (symmetrical) {
            node.links.set(this, price);
        }
    }

    public unlink(node: Node, symmetrical = true) {
        this.links.delete(node);
        if (symmetrical) {
            node.links.delete(this);
        }
    }

    public unlinkAll() {
        for (const node of this.links.keys()) {
            this.unlink(node);
        }
    }
}

export class Graph {
    public nodes: Node[] = [];

    public add(node: Node | null = null): Node {
        if (node === null) {
            node = new Node();
        }
        this.nodes.push(node);
        return node;
    }

    public remove(node: Node) {
        node.unlinkAll();
        const index = this.nodes.indexOf(node);
        if (index > -1) {
            this.nodes.splice(index, 1);
        }
    }

    public aStar(start: Node, goal: Node, exclude: Node[] = []): Node[] | null {
        const closedSet: Node[] = [...exclude];
        const openSet: Node[] = [start];
        const cameFrom: Map<Node, Node> = new Map();

        const gScore: Map<Node, number> = new Map();
        gScore.set(start, 0);

        while (openSet.length > 0) {
            openSet.sort((a, b) => (gScore.get(a) ?? Infinity) - (gScore.get(b) ?? Infinity));
            const current = openSet.shift()!;

            if (current === goal) {
                return this.buildPath(cameFrom, current);
            }

            closedSet.push(current);

            const currentScore = gScore.get(current) ?? Infinity;
            for (const [neighbour, price] of current.links.entries()) {
                if (closedSet.includes(neighbour)) {
                    continue;
                }

                const score = currentScore + price;
                if (!openSet.includes(neighbour)) {
                    openSet.push(neighbour);
                } else if (score >= (gScore.get(neighbour) ?? Infinity)) {
                    continue;
                }

                cameFrom.set(neighbour, current);
                gScore.set(neighbour, score);
            }
        }

        return null;
    }

    private buildPath(cameFrom: Map<Node, Node>, current: Node): Node[] {
        const path: Node[] = [current];
        while (cameFrom.has(current)) {
            current = cameFrom.get(current)!;
            path.unshift(current);
        }
        return path;
    }

    public calculatePrice(path: Node[]): number {
        if (path.length < 2) {
            return 0;
        }

        let price = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const current = path[i];
            const next = path[i + 1];
            if (current.links.has(next)) {
                price += current.links.get(next)!;
            } else {
                return NaN;
            }
        }
        return price;
    }
}
