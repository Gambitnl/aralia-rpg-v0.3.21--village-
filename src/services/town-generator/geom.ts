
import { Delaunay } from 'd3-delaunay';

export type Point = { x: number; y: number };
export type Polygon = Point[];
export type Segment = { start: Point; end: Point };

export function distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

export function polygonCentroid(polygon: Polygon): Point {
    let x = 0;
    let y = 0;
    for (const p of polygon) {
        x += p.x;
        y += p.y;
    }
    return { x: x / polygon.length, y: y / polygon.length };
}

export function polygonArea(polygon: Polygon): number {
    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        area += p1.x * p2.y - p2.x * p1.y;
    }
    return Math.abs(area / 2);
}

export function compactness(polygon: Polygon): number {
    const area = polygonArea(polygon);
    let perimeter = 0;
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        perimeter += distance(p1, p2);
    }
    return 4 * Math.PI * area / (perimeter * perimeter);
}

import { Voronoi } from 'd3-delaunay';

export function relax(points: Point[], voronoi: Voronoi<any>): Point[] {
    const newPoints: Point[] = [];
    for (let i = 0; i < points.length; i++) {
        const cell = voronoi.cellPolygon(i);
        if (cell) {
            let x = 0;
            let y = 0;
            for (const p of cell) {
                x += p[0];
                y += p[1];
            }
            newPoints.push({ x: x / cell.length, y: y / cell.length });
        } else {
            newPoints.push(points[i]);
        }
    }
    return newPoints;
}

export function smoothVertexEq(poly: Polygon, steps = 1): Polygon {
    const smoothed = [...poly];
    for (let i = 0; i < steps; i++) {
        for (let j = 0; j < smoothed.length; j++) {
            const p0 = smoothed[(j + smoothed.length - 1) % smoothed.length];
            const p1 = smoothed[j];
            const p2 = smoothed[(j + 1) % smoothed.length];
            smoothed[j] = { x: (p0.x + p1.x + p2.x) / 3, y: (p0.y + p1.y + p2.y) / 3 };
        }
    }
    return smoothed;
}

export function next(polygon: Polygon, vertex: Point): Point {
    const index = polygon.indexOf(vertex);
    if (index === -1) {
        return polygon[0];
    }
    return polygon[(index + 1) % polygon.length];
}

export function forEdge(polygon: Polygon, callback: (p1: Point, p2: Point) => void): void {
    for (let i = 0; i < polygon.length; i++) {
        callback(polygon[i], polygon[(i + 1) % polygon.length]);
    }
}

export function cut(polygon: Polygon, p1: Point, p2: Point): Polygon[] {
    // This is a simplified version of the Sutherland-Hodgman algorithm.
    // It only works for convex polygons.
    const result: Polygon[] = [];
    let currentPolygon: Polygon = [];
    let firstPoint: Point | null = null;
    let lastPoint: Point | null = null;

    for (let i = 0; i < polygon.length; i++) {
        const p = polygon[i];
        const nextP = polygon[(i + 1) % polygon.length];

        const isInsideP = (p2.x - p1.x) * (p.y - p1.y) - (p2.y - p1.y) * (p.x - p1.x) > 0;
        const isInsideNextP = (p2.x - p1.x) * (nextP.y - p1.y) - (p2.y - p1.y) * (nextP.x - p1.x) > 0;

        if (isInsideP) {
            if (!firstPoint) {
                firstPoint = p;
            }
            currentPolygon.push(p);
            lastPoint = p;
        }

        if (isInsideP !== isInsideNextP) {
            const intersection = intersect(p, nextP, p1, p2);
            if (intersection) {
                currentPolygon.push(intersection);
                if (lastPoint) {
                    result.push(currentPolygon);
                }
                currentPolygon = [intersection];
                firstPoint = intersection;
                lastPoint = intersection;
            }
        }
    }

    if (currentPolygon.length > 0) {
        result.push(currentPolygon);
    }

    return result;
}

function intersect(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
    const d = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (d === 0) {
        return null;
    }
    const t = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / d;
    const u = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / d;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
    }
    return null;
}

export function shrink(polygon: Polygon, distances: number[]): Polygon {
    const result: Polygon = [];
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[(i + polygon.length - 1) % polygon.length];
        const p2 = polygon[i];
        const p3 = polygon[(i + 1) % polygon.length];

        const d1 = distance(p1, p2);
        const d2 = distance(p2, p3);

        const v1 = { x: (p1.x - p2.x) / d1, y: (p1.y - p2.y) / d1 };
        const v2 = { x: (p3.x - p2.x) / d2, y: (p3.y - p2.y) / d2 };

        const bisector = { x: v1.x + v2.x, y: v1.y + v2.y };
        const bisectorLength = Math.sqrt(bisector.x * bisector.x + bisector.y * bisector.y);
        bisector.x /= bisectorLength;
        bisector.y /= bisectorLength;

        const angle = Math.acos(v1.x * v2.x + v1.y * v2.y);
        const shift = distances[i] / Math.sin(angle / 2);

        result.push({ x: p2.x + bisector.x * shift, y: p2.y + bisector.y * shift });
    }
    return result;
}

export function rect(width: number, height: number): Polygon {
    const w2 = width / 2;
    const h2 = height / 2;
    return [
        { x: -w2, y: -h2 },
        { x: w2, y: -h2 },
        { x: w2, y: h2 },
        { x: -w2, y: h2 },
    ];
}

export function rotate(polygon: Polygon, angle: number): Polygon {
    const center = polygonCentroid(polygon);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return polygon.map(p => {
        const px = p.x - center.x;
        const py = p.y - center.y;
        return {
            x: px * cos - py * sin + center.x,
            y: px * sin + py * cos + center.y,
        };
    });
}

export function offset(polygon: Polygon, point: Point): Polygon {
    return polygon.map(p => ({ x: p.x + point.x, y: p.y + point.y }));
}

export function add(p1: Point, p2: Point): Point {
    return { x: p1.x + p2.x, y: p1.y + p2.y };
}

export function subtract(p1: Point, p2: Point): Point {
    return { x: p1.x - p2.x, y: p1.y - p2.y };
}

export function rotate90(p: Point): Point {
    return { x: -p.y, y: p.x };
}

export function vector(polygon: Polygon, vertex: Point): Point {
    const nextVertex = next(polygon, vertex);
    return subtract(nextVertex, vertex);
}

export function findLongestEdge(polygon: Polygon): Point {
    let longestEdgeStart: Point | null = null;
    let maxLength = -1;

    forEdge(polygon, (p1, p2) => {
        const len = distance(p1, p2);
        if (len > maxLength) {
            maxLength = len;
            longestEdgeStart = p1;
        }
    });

    if (!longestEdgeStart) {
        // This should not happen for a valid polygon with at least one edge.
        // Return the first vertex as a fallback.
        return polygon[0];
    }

    return longestEdgeStart;
}

export function inverseDistanceWeighting(polygon: Polygon, point: Point): number[] {
    let sum = 0;
    const distances = polygon.map(v => {
        const d = 1 / distance(v, point);
        sum += d;
        return d;
    });

    return distances.map(d => d / sum);
}

export function findEdge(polygon: Polygon, p1: Point, p2: Point): number {
    for (let i = 0; i < polygon.length; i++) {
        if (polygon[i] === p1) {
            if (polygon[(i + 1) % polygon.length] === p2) {
                return i;
            }
        }
    }
    return -1;
}
