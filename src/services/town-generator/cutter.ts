import { Point, Polygon, MultiPolygon, cut, shrink, polygonCentroid, forEdge, next, subtract, add, rotate90, normalize, distance, findEdge } from './geom';
import { interpolate } from './utils';

/**
 * Creates two polygons by cutting a polygon with a line
 * @param poly A polygon to be cut
 * @param vertex A vertex of the polygon's edge to be used as a reference
 * @param ratio A position on the edge (0 to 1)
 * @param angle An angle of the cutting line relative to the edge
 * @param gap A gap between two resulting polygons
 */
export function bisect(poly: Polygon, vertex: Point, ratio = 0.5, angle = 0.0, gap = 0.0): Polygon[] {
    const nextVertex = next(poly, vertex);
    const p1 = interpolate(vertex, nextVertex, ratio);
    const d = subtract(nextVertex, vertex);

    const cosB = Math.cos(angle);
    const sinB = Math.sin(angle);
    const vx = d.x * cosB - d.y * sinB;
    const vy = d.y * cosB + d.x * sinB;
    const p2 = { x: p1.x - vy, y: p1.y + vx };

    return cut(poly, p1, p2, gap);
}

/**
 * Creates a "ring" of polygons inside a polygon
 */
export function ring(poly: Polygon, thickness: number): Polygon[] {
    const slices: { p1: Point; p2: Point; len: number }[] = [];
    forEdge(poly, (v1, v2) => {
        const v = subtract(v2, v1);
        const n = normalize(rotate90(v), thickness);
        slices.push({ p1: add(v1, n), p2: add(v2, n), len: distance(v1, v2) });
    });

    // Short sides should be sliced first
    slices.sort((s1, s2) => s1.len - s2.len);

    const peel: Polygon[] = [];
    let p: Polygon = [...poly];
    for (const slice of slices) {
        const halves = cut(p, slice.p1, slice.p2);
        if (halves.length > 0) {
             // The largest part is the one with the same winding order
            const a1 = polyArea(halves[0]);
            const a2 = halves.length > 1 ? polyArea(halves[1]) : 0;
            const polyAreaSign = Math.sign(polyArea(p));

            if (halves.length === 1) {
                p = halves[0];
            } else if (Math.sign(a1) === polyAreaSign) {
                p = halves[0];
                peel.push(halves[1]);
            } else if (Math.sign(a2) === polyAreaSign) {
                p = halves[1];
                peel.push(halves[0]);
            }
        }
    }

    return peel;
}

/**
 * Creates a set of polygons by cutting a polygon with lines coming from a center
 */
export function radial(poly: Polygon, center: Point | null = null, gap = 0.0): Polygon[] {
    if (center === null) center = polygonCentroid(poly);

    const sectors: Polygon[] = [];
    forEdge(poly, (v0, v1) => {
        let sector = [center!, v0, v1];
        if (gap > 0) {
            sector = shrink(sector, [gap / 2, 0, gap / 2]);
        }
        sectors.push(sector);
    });
    return sectors;
}

/**
 * Creates a set of polygons by cutting a polygon with lines coming from one of its vertices
 */
export function semiRadial(poly: Polygon, center: Point | null = null, gap = 0.0): Polygon[] {
    if (center === null) {
        const centroid = polygonCentroid(poly);
        let minDistance = Infinity;
        for (const v of poly) {
            const d = distance(v, centroid);
            if (d < minDistance) {
                minDistance = d;
                center = v;
            }
        }
    }

    if (center === null) return []; // Should not happen on a valid polygon

    gap /= 2;

    const sectors: Polygon[] = [];
    forEdge(poly, (v0, v1) => {
        if (v0 !== center && v1 !== center) {
            let sector = [center!, v0, v1];
            if (gap > 0) {
                const d = [findEdge(poly, center!, v0) === -1 ? gap : 0, 0, findEdge(poly, v1, center!) === -1 ? gap : 0];
                sector = shrink(sector, d);
            }
            sectors.push(sector);
        }
    });
    return sectors;
}
