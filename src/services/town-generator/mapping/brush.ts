
import * as PIXI from 'pixi.js';
import { Palette } from './palette';

export class Brush {
    public static NORMAL_STROKE = 0.3;
    public static THICK_STROKE = 1.8;
    public static THIN_STROKE = 0.15;

    public strokeColor = 0x000000;
    public fillColor = 0xcccccc;
    public stroke = Brush.NORMAL_STROKE;

    private palette: Palette;

    constructor(palette: Palette) {
        this.palette = palette;
    }

    public setFill(g: PIXI.Graphics, color: number): void {
        this.fillColor = color;
        g.beginFill(color);
    }

    public setStroke(g: PIXI.Graphics, color: number, stroke = Brush.NORMAL_STROKE, miter = true): void {
        if (stroke === 0) {
            this.noStroke(g);
        } else {
            this.strokeColor = color;
            g.lineStyle(stroke, color === -1 ? this.fillColor : color, 1, 0.5, miter);
        }
    }

    public noStroke(g: PIXI.Graphics): void {
        g.lineStyle(0, 0, 0);
    }

    public setColor(g: PIXI.Graphics, fill: number, line = -1, stroke = Brush.NORMAL_STROKE, miter = true): void {
        this.setFill(g, fill);
        this.setStroke(g, line, stroke, miter);
    }
}
