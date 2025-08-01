
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

export function relax(points: Point[], delaunay: Delaunay<any>): Point[] {
    const newPoints: Point[] = [];
    for (let i = 0; i < points.length; i++) {
        const cell = delaunay.voronoi.cellPolygon(i);
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
