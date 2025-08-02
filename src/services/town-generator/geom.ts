// This file is a port of the geometric utility classes from the original Haxe project.
// It combines functionality from GeomUtils.hx and Polygon.hx.

import { Delaunay, Voronoi } from 'd3-delaunay';

export type Point = { x: number; y: number };
export type Polygon = Point[];
export type MultiPolygon = Polygon[];
export type Segment = { start: Point; end: Point };

// Constants
const DELTA = 0.000001;

// Point operations
export function distance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

export function add(p1: Point, p2: Point): Point {
    return { x: p1.x + p2.x, y: p1.y + p2.y };
}

export function subtract(p1: Point, p2: Point): Point {
    return { x: p1.x - p2.x, y: p1.y - p2.y };
}

export function scale(p: Point, s: number): Point {
    return { x: p.x * s, y: p.y * s };
}

export function normalize(p: Point, len = 1): Point {
    const d = Math.sqrt(p.x * p.x + p.y * p.y);
    return { x: p.x / d * len, y: p.y / d * len };
}

export function rotate(p: Point, angle: number): Point {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const vx = p.x * cosA - p.y * sinA;
    const vy = p.y * cosA + p.x * sinA;
    return { x: vx, y: vy };
}

export function rotate90(p: Point): Point {
    return { x: -p.y, y: p.x };
}

export function offset(polygon: Polygon, point: Point): Polygon {
    return polygon.map(p => add(p, point));
}


// Geometric utilities from GeomUtils.hx
export function intersectLines(p1: Point, v1: Point, p2: Point, v2: Point): Point | null {
    const d = v1.x * v2.y - v1.y * v2.x;
    if (Math.abs(d) < DELTA) return null;

    const t2 = (v1.y * (p2.x - p1.x) - v1.x * (p2.y - p1.y)) / d;
    const t1 = v1.x !== 0 ?
        (p2.x - p1.x + v2.x * t2) / v1.x :
        (p2.y - p1.y + v2.y * t2) / v1.y;

    return { x: t1, y: t2 };
}

export function interpolate(p1: Point, p2: Point, ratio = 0.5): Point {
    const d = subtract(p2, p1);
    return { x: p1.x + d.x * ratio, y: p1.y + d.y * ratio };
}

export function scalar(v1: Point, v2: Point): number {
    return v1.x * v2.x + v1.y * v2.y;
}

export function cross(v1: Point, v2: Point): number {
    return v1.x * v2.y - v1.y * v2.x;
}

export function distance2line(p: Point, p1: Point, p2: Point): number {
    const v = subtract(p2, p1);
    return (v.x * (p1.y - p.y) - v.y * (p1.x - p.x)) / Math.sqrt(v.x * v.x + v.y * v.y);
}

// Polygon operations from Polygon.hx
export function polygonArea(polygon: Polygon): number {
    let s = 0;
    forEdge(polygon, (v1, v2) => {
        s += cross(v1, v2);
    });
    return s * 0.5;
}

export function polygonPerimeter(polygon: Polygon): number {
    let len = 0.0;
    forEdge(polygon, (v0, v1) => {
        len += distance(v0, v1);
    });
    return len;
}

export function compactness(polygon: Polygon): number {
    const p = polygonPerimeter(polygon);
    if (p === 0) return 0;
    return 4 * Math.PI * polygonArea(polygon) / (p * p);
}

export function polygonCentroid(polygon: Polygon): Point {
    let x = 0.0;
    let y = 0.0;
    let a = 0.0;
    forEdge(polygon, (v0, v1) => {
        const f = cross(v0, v1);
        a += f;
        x += (v0.x + v1.x) * f;
        y += (v0.y + v1.y) * f;
    });
    const s6 = 1 / (3 * a);
    return { x: s6 * x, y: s6 * y };
}

export function forEdge(polygon: Polygon, f: (v0: Point, v1: Point) => void): void {
    if (!polygon || polygon.length === 0) return;
    let v1 = polygon[polygon.length - 1];
    for (const v2 of polygon) {
        f(v1, v2);
        v1 = v2;
    }
}

export function next(polygon: Polygon, v: Point): Point {
    return polygon[(polygon.indexOf(v) + 1) % polygon.length];
}

export function prev(polygon: Polygon, v: Point): Point {
    return polygon[(polygon.indexOf(v) + polygon.length - 1) % polygon.length];
}

export function vector(polygon: Polygon, v: Point): Point {
    return subtract(next(polygon, v), v);
}

export function isConvexVertex(polygon: Polygon, v1: Point): boolean {
    const v0 = prev(polygon, v1);
    const v2 = next(polygon, v1);
    return cross(subtract(v1, v0), subtract(v2, v1)) > 0;
}

export function smoothVertexEq(poly: Polygon, f = 1.0): Polygon {
    const len = poly.length;
    if (len < 3) return [...poly];
    let v1 = poly[len - 1];
    let v2 = poly[0];
    return poly.map((p, i) => {
        const v0 = v1; v1 = v2; v2 = poly[(i + 1) % len];
        return {
            x: (v0.x + v1.x * f + v2.x) / (2 + f),
            y: (v0.y + v1.y * f + v2.y) / (2 + f)
        };
    });
}

// A more robust shrink method ported from Polygon.hx -> shrink
export function shrink(polygon: Polygon, distances: number[]): Polygon {
    let q: Polygon = [...polygon];
    let i = 0;
    forEdge(polygon, (v1, v2) => {
        const dd = distances[i++];
        if (dd > 0) {
            const v = subtract(v2, v1);
            const n = normalize(rotate90(v), dd);
            const result = cut(q, add(v1, n), add(v2, n));
            if (result.length > 0) {
                q = result[0];
            }
        }
    });
    return q;
}

// Ported from Polygon.hx -> cut
export function cut(polygon: Polygon, p1: Point, p2: Point, gap = 0.0): Polygon[] {
    const v1 = subtract(p2, p1);
    const len = polygon.length;
    let edge1 = -1, ratio1 = 0.0;
    let edge2 = -1, ratio2 = 0.0;
    let count = 0;

    for (let i = 0; i < len; i++) {
        const v0 = polygon[i];
        const v_ = polygon[(i + 1) % len];
        const v2 = subtract(v_, v0);

        const t = intersectLines(p1, v1, v0, v2);
        if (t && t.y >= 0 && t.y <= 1) {
            if (count === 0) {
                edge1 = i; ratio1 = t.x;
            } else {
                edge2 = i; ratio2 = t.x;
            }
            count++;
        }
    }

    if (count === 2) {
        const point1 = interpolate(p1, p2, ratio1);
        const point2 = interpolate(p1, p2, ratio2);

        const half1: Polygon = [];
        for (let i = (edge1 + 1) % len; i !== (edge2 + 1) % len; i = (i + 1) % len) {
            half1.push(polygon[i]);
        }
        half1.unshift(point1);
        half1.push(point2);

        const half2: Polygon = [];
        for (let i = (edge2 + 1) % len; i !== (edge1 + 1) % len; i = (i + 1) % len) {
            half2.push(polygon[i]);
        }
        half2.unshift(point2);
        half2.push(point1);

        // Gap logic is simplified/omitted for now as it uses peel which is complex

        const v = vector(polygon, polygon[edge1]);
        return cross(v1, v) > 0 ? [half1, half2] : [half2, half1];
    } else {
        return [[...polygon]];
    }
}

export function findEdge(polygon: Polygon, a: Point, b: Point): number {
    const index = polygon.indexOf(a);
    return (index !== -1 && next(polygon, a) === b) ? index : -1;
}

// New utility functions that were missing
export function rect(w = 1.0, h = 1.0): Polygon {
    return [
        { x: -w / 2, y: -h / 2 },
        { x: w / 2, y: -h / 2 },
        { x: w / 2, y: h / 2 },
        { x: -w / 2, y: h / 2 }
    ];
}

export function regular(n = 8, r = 1.0): Polygon {
    const result: Polygon = [];
    for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2;
        result.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
    }
    return result;
}

export function circle(r = 1.0): Polygon {
    return regular(16, r);
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
    return longestEdgeStart || polygon[0];
}

export function inverseDistanceWeighting(polygon: Polygon, point: Point): number[] {
    let sum = 0;
    const distances = polygon.map(v => {
        const d = 1 / (distance(v, point) + DELTA); // Add DELTA to avoid division by zero
        sum += d;
        return d;
    });

    if (sum === 0) return polygon.map(() => 1 / polygon.length); // Avoid division by zero
    return distances.map(d => d / sum);
}


// Voronoi-related functions
export { Voronoi };

export function relax(points: Point[], voronoi: Voronoi<Point>): Point[] {
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
            if (cell.length > 0) {
                 newPoints.push({ x: x / cell.length, y: y / cell.length });
            } else {
                 newPoints.push(points[i]);
            }
        } else {
            newPoints.push(points[i]);
        }
    }
    return newPoints;
}
