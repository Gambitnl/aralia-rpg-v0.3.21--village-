import { Point, Polygon, MultiPolygon, cut, shrink, polygonCentroid, forEdge, polygonArea } from './geom';
import { interpolate } from '../town-generator/utils';
import { next } from './geom';

export function bisect(polygon: Polygon, vertex: Point, ratio = 0.5, angle = 0.0, gap = 0.0): MultiPolygon {
    const nextVertex = next(polygon, vertex);
    const p1 = interpolate(vertex, nextVertex, ratio);
    const d = { x: nextVertex.x - vertex.x, y: nextVertex.y - vertex.y };

    const cosB = Math.cos(angle);
    const sinB = Math.sin(angle);
    const vx = d.x * cosB - d.y * sinB;
    const vy = d.y * cosB + d.x * sinB;
    const p2 = { x: p1.x - vy, y: p1.y + vx };

    // The gap logic is not directly implemented here, as the original `cut` with gap is complex.
    // We can simulate it by shrinking the resulting polygons.
    const halves = cut(polygon, p1, p2);
    if (gap > 0) {
        return halves.map(half => shrink(half, [gap / 2, gap / 2, gap / 2, gap / 2]));
    }
    return halves;
}

export function radial(polygon: Polygon, center?: Point, gap = 0.0): MultiPolygon {
    if (!center) {
        center = polygonCentroid(polygon);
    }

    const sectors: MultiPolygon = [];
    forEdge(polygon, (v0, v1) => {
        let sector: Polygon = [center!, v0, v1];
        if (gap > 0) {
            sector = shrink(sector, [gap / 2, 0, gap / 2]);
        }
        sectors.push(sector);
    });
    return sectors;
}

export function ring(polygon: Polygon, thickness: number): MultiPolygon {
    const slices: { p1: Point; p2: Point; len: number }[] = [];
    forEdge(polygon, (v1, v2) => {
        const v = { x: v2.x - v1.x, y: v2.y - v1.y };
        const vLength = Math.sqrt(v.x * v.x + v.y * v.y);
        const n = { x: -v.y / vLength, y: v.x / vLength };

        slices.push({
            p1: { x: v1.x + n.x * thickness, y: v1.y + n.y * thickness },
            p2: { x: v2.x + n.x * thickness, y: v2.y + n.y * thickness },
            len: vLength,
        });
    });

    slices.sort((a, b) => a.len - b.len);

    const peel: MultiPolygon = [];
    let p: Polygon = [...polygon];
    for (const slice of slices) {
        const halves = cut(p, slice.p1, slice.p2);
        if (halves.length > 0) {
            halves.sort((a, b) => polygonArea(b) - polygonArea(a));
            p = halves[0];
            if (halves.length > 1) {
                peel.push(halves[1]);
            }
        }
    }

    return peel;
}

export function semiRadial(polygon: Polygon, center?: Point, gap = 0.0): MultiPolygon {
    if (!center) {
        const centroid = polygonCentroid(polygon);
        // Find the vertex closest to the centroid
        let minDist = Infinity;
        for (const v of polygon) {
            const d = Math.sqrt(Math.pow(v.x - centroid.x, 2) + Math.pow(v.y - centroid.y, 2));
            if (d < minDist) {
                minDist = d;
                center = v;
            }
        }
    }

    gap /= 2;

    const sectors: MultiPolygon = [];
    forEdge(polygon, (v0, v1) => {
        if (v0 !== center && v1 !== center) {
            let sector: Polygon = [center!, v0, v1];
            if (gap > 0) {
                const d = [
                    polygon.includes(center!) ? 0 : gap,
                    0,
                    polygon.includes(center!) ? 0 : gap,
                ];
                sector = shrink(sector, d);
            }
            sectors.push(sector);
        }
    });
    return sectors;
}
