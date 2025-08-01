
import * as PIXI from 'pixi.js';
import { Model } from '../model';
import { Palette } from './palette';
import { Brush } from './brush';
import { PatchView } from './patch-view';
import { Polygon, Point } from '../geom';
import { Ward, Castle, Cathedral, Market, CraftsmenWard, MerchantWard, GateWard, Slum, AdministrationWard, MilitaryWard, PatriciateWard, Farm } from '../wards';
import { CurtainWall } from '../curtain-wall';

type Street = Polygon;

export class CityMap {
    public static palette = Palette.DEFAULT;
    private brush: Brush;

    constructor() {
        this.brush = new Brush(CityMap.palette);
    }

    public draw(graphics: PIXI.Graphics, model: Model): void {
        graphics.clear();

        // Draw roads
        for (const road of model.roads) {
            this.drawRoad(graphics, road);
        }

        // Draw patches
        for (const patch of model.patches) {
            const ward = patch.ward;
            if (!ward) continue;

            const patchView = new PatchView(patch);
            let patchDrawn = true;

            switch (ward.constructor) {
                case Castle:
                    this.drawBuilding(graphics, ward.geometry, CityMap.palette.light, CityMap.palette.dark, Brush.NORMAL_STROKE * 2);
                    break;
                case Cathedral:
                    this.drawBuilding(graphics, ward.geometry, CityMap.palette.light, CityMap.palette.dark, Brush.NORMAL_STROKE);
                    break;
                case Market:
                case CraftsmenWard:
                case MerchantWard:
                case GateWard:
                case Slum:
                case AdministrationWard:
                case MilitaryWard:
                case PatriciateWard:
                case Farm:
                    this.brush.setColor(graphics, CityMap.palette.light, CityMap.palette.dark);
                    for (const building of ward.geometry) {
                        graphics.drawPolygon(building);
                    }
                    break;
                case Park:
                    this.brush.setColor(graphics, CityMap.palette.medium);
                    for (const grove of ward.geometry) {
                        graphics.drawPolygon(grove);
                    }
                    break;
                default:
                    patchDrawn = false;
            }
        }

        // Draw walls
        if (model.wall) {
            this.drawWall(graphics, model.wall, false);
        }
        if (model.citadel) {
            this.drawWall(graphics, (model.citadel.ward as Castle).wall, true);
        }
    }

    private drawRoad(g: PIXI.Graphics, road: Street): void {
        g.lineStyle(Ward.MAIN_STREET + Brush.NORMAL_STROKE, CityMap.palette.medium);
        g.moveTo(road[0].x, road[0].y);
        for (let i = 1; i < road.length; i++) {
            g.lineTo(road[i].x, road[i].y);
        }

        g.lineStyle(Ward.MAIN_STREET - Brush.NORMAL_STROKE, CityMap.palette.paper);
        g.moveTo(road[0].x, road[0].y);
        for (let i = 1; i < road.length; i++) {
            g.lineTo(road[i].x, road[i].y);
        }
    }

    private drawWall(g: PIXI.Graphics, wall: CurtainWall, large: boolean): void {
        g.lineStyle(Brush.THICK_STROKE, CityMap.palette.dark);
        g.drawPolygon(wall.shape);

        for (const gate of wall.gates) {
            this.drawGate(g, wall.shape, gate);
        }

        for (const t of wall.towers) {
            this.drawTower(g, t, Brush.THICK_STROKE * (large ? 1.5 : 1));
        }
    }

    private drawTower(g: PIXI.Graphics, p: Point, r: number): void {
        g.lineStyle(0);
        g.beginFill(CityMap.palette.dark);
        g.drawCircle(p.x, p.y, r);
        g.endFill();
    }

    private drawGate(g: PIXI.Graphics, wall: Polygon, gate: Point): void {
        g.lineStyle(Brush.THICK_STROKE * 2, CityMap.palette.dark);

        const wallPoints = wall;
        const gateIndex = wallPoints.findIndex(p => p.x === gate.x && p.y === gate.y);
        if (gateIndex === -1) return;

        const p1 = wallPoints[(gateIndex + wallPoints.length - 1) % wallPoints.length];
        const p2 = wallPoints[(gateIndex + 1) % wallPoints.length];

        const dir = { x: p2.x - p1.x, y: p2.y - p1.y };
        const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
        dir.x /= len;
        dir.y /= len;

        const halfWidth = Brush.THICK_STROKE * 1.5;
        g.moveTo(gate.x - dir.y * halfWidth, gate.y + dir.x * halfWidth);
        g.lineTo(gate.x + dir.y * halfWidth, gate.y - dir.x * halfWidth);
    }

    private drawBuilding(g: PIXI.Graphics, blocks: Polygon[], fill: number, line: number, thickness: number): void {
        this.brush.setStroke(g, line, thickness * 2);
        for (const block of blocks) {
            g.drawPolygon(block);
        }

        this.brush.noStroke(g);
        this.brush.setFill(g, fill);
        for (const block of blocks) {
            g.drawPolygon(block);
        }
    }
}
