import { Delaunay } from 'd3-delaunay';
import polygonClipping from 'polygon-clipping';

// Basic geometric types
export type Point = { x: number; y: number };
export type Polygon = Point[];
export type MultiPolygon = Polygon[];

// --- Point utilities ---

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// --- Polygon utilities ---

export function polygonArea(polygon: Polygon): number {
    let area = 0;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        area += (polygon[j].x + polygon[i].x) * (polygon[j].y - polygon[i].y);
    }
    return area / 2;
}

export function polygonCentroid(polygon: Polygon): Point {
    let x = 0;
    let y = 0;
    let area = 0;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const p1 = polygon[i];
        const p2 = polygon[j];
        const f = p1.x * p2.y - p2.x * p1.y;
        x += (p1.x + p2.x) * f;
        y += (p1.y + p2.y) * f;
        area += f;
    }

    area *= 3;
    return { x: x / area, y: y / area };
}

export function forEdge(polygon: Polygon, callback: (p1: Point, p2: Point) => void) {
    for (let i = 0; i < polygon.length; i++) {
        callback(polygon[i], polygon[(i + 1) % polygon.length]);
    }
}

export function next(polygon: Polygon, point: Point): Point {
    return polygon[(polygon.indexOf(point) + 1) % polygon.length];
}

export function cut(polygon: Polygon, p1: Point, p2: Point): MultiPolygon {
    const bigNum = 1e9;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    const cuttingPolygon: Polygon = [
        p1,
        p2,
        { x: p2.x - dy * bigNum, y: p2.y + dx * bigNum },
        { x: p1.x - dy * bigNum, y: p1.y + dx * bigNum },
    ];

    const intersectionResult = intersection(polygon, cuttingPolygon);
    const differenceResult = difference(polygon, cuttingPolygon);

    return [ ...intersectionResult, ...differenceResult ];
}

export function shrink(polygon: Polygon, distances: number[]): Polygon {
    let result: Polygon = [...polygon];
    let i = 0;
    forEdge(polygon, (p1, p2) => {
        const d = distances[i++];
        if (d > 0) {
            const v = { x: p2.x - p1.x, y: p2.y - p1.y };
            const n = { x: -v.y, y: v.x };
            const nLength = Math.sqrt(n.x * n.x + n.y * n.y);
            n.x /= nLength;
            n.y /= nLength;

            const p1_offset = { x: p1.x + n.x * d, y: p1.y + n.y * d };
            const p2_offset = { x: p2.x + n.x * d, y: p2.y + n.y * d };

            const cutResult = cut(result, p1_offset, p2_offset);

            if (cutResult.length > 0) {
              // a bit of a hack: we assume the largest resulting polygon is the one we want
              cutResult.sort((a, b) => polygonArea(b) - polygonArea(a));
              result = cutResult[0];
            }
        }
    });
    return result;
}


// --- Voronoi diagrams ---

export class Voronoi {
  private delaunay: Delaunay<Delaunay.Point>;
  public polygons: MultiPolygon = [];

  constructor(points: Point[]) {
    const d3Points: Delaunay.Point[] = points.map(p => [p.x, p.y]);
    this.delaunay = Delaunay.from(d3Points);
  }

  // In the original haxe code, the voronoi regions are polygons.
  // d3-delaunay provides a way to get the polygons directly.
  // We need to specify the bounds of the diagram.
  getPolygons(bounds: { x: number; y: number; width: number; height: number }): MultiPolygon {
      const voronoiPolygons = this.delaunay.voronoi([bounds.x, bounds.y, bounds.width, bounds.height]).cellPolygons();
      const result: MultiPolygon = [];
      for (const polygon of voronoiPolygons) {
          const newPolygon: Polygon = [];
          for (const point of polygon) {
              newPolygon.push({ x: point[0], y: point[1] });
          }
          result.push(newPolygon);
      }
      return result;
  }
}

// --- Polygon clipping ---

// Helper to convert from our Polygon format to the one used by polygon-clipping
function toClippingFormat(polygon: Polygon | MultiPolygon): polygonClipping.Polygon[] {
    if (Array.isArray(polygon[0]) && Array.isArray(polygon[0][0])) {
        // It's a MultiPolygon
        return (polygon as MultiPolygon).map(p => p.map(point => [point.x, point.y] as [number, number]));
    } else {
        // It's a single Polygon
        return [[(polygon as Polygon).map(point => [point.x, point.y] as [number, number])]];
    }
}

// Helper to convert from the format used by polygon-clipping to our Polygon format
function fromClippingFormat(multiPolygon: polygonClipping.MultiPolygon): MultiPolygon {
    return multiPolygon.map(polygon => polygon[0].map(p => ({ x: p[0], y: p[1] })));
}

export function union(poly1: Polygon | MultiPolygon, poly2: Polygon | MultiPolygon): MultiPolygon {
  const result = polygonClipping.union(toClippingFormat(poly1), toClippingFormat(poly2));
  return fromClippingFormat(result);
}

export function intersection(poly1: Polygon | MultiPolygon, poly2: Polygon | MultiPolygon): MultiPolygon {
  const result = polygonClipping.intersection(toClippingFormat(poly1), toClippingFormat(poly2));
  return fromClippingFormat(result);
}

export function difference(poly1: Polygon | MultiPolygon, poly2: Polygon | MultiPolygon): MultiPolygon {
  const result = polygonClipping.difference(toClippingFormat(poly1), toClippingFormat(poly2));
  return fromClippingFormat(result);
}

export function xor(poly1: Polygon | MultiPolygon, poly2: Polygon | MultiPolygon): MultiPolygon {
    const result = polygonClipping.xor(toClippingFormat(poly1), toClippingFormat(poly2));
    return fromClippingFormat(result);
}
