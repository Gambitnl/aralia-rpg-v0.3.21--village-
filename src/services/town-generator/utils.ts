import { Point } from './geom';

export function intersectLines(x1: number, y1: number, dx1: number, dy1: number, x2: number, y2: number, dx2: number, dy2: number): Point | null {
    const d = dx1 * dy2 - dy1 * dx2;
    if (d === 0) {
        return null;
    }

    const t2 = (dy1 * (x2 - x1) - dx1 * (y2 - y1)) / d;
    const t1 = dx1 !== 0 ?
        (x2 - x1 + dx2 * t2) / dx1 :
        (y2 - y1 + dy2 * t2) / dy1;

    return { x: t1, y: t2 };
}

export function interpolate(p1: Point, p2: Point, ratio = 0.5): Point {
    const d = { x: p2.x - p1.x, y: p2.y - p1.y };
    return { x: p1.x + d.x * ratio, y: p1.y + d.y * ratio };
}

export function scalar(x1: number, y1: number, x2: number, y2: number): number {
    return x1 * x2 + y1 * y2;
}

export function cross(x1: number, y1: number, x2: number, y2: number): number {
    return x1 * y2 - y1 * x2;
}

export function distance2line(x1: number, y1: number, dx1: number, dy1: number, x0: number, y0: number): number {
    return (dx1 * y0 - dy1 * x0 + (y1 + dy1) * x1 - (x1 + dx1) * y1) / Math.sqrt(dx1 * dx1 + dy1 * dy1);
}
