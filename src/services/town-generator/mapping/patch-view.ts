
import * as PIXI from 'pixi.js';
import { Patch } from '../patch';

export class PatchView {
    private static lastPatch: Patch | null = null;

    public patch: Patch;
    public hotArea: PIXI.Sprite;

    constructor(patch: Patch) {
        this.patch = patch;

        this.hotArea = new PIXI.Sprite();
        (this.hotArea as any).hitArea = new PIXI.Polygon(patch.shape.flatMap(p => [p.x, p.y]));
        this.hotArea.interactive = true;

        this.hotArea.on('mouseover', this.onRollOver.bind(this));
    }

    private onRollOver(e: PIXI.InteractionEvent): void {
        if (this.patch !== PatchView.lastPatch) {
            PatchView.lastPatch = this.patch;
            // Tooltip logic will be handled by the React application
            console.log(this.patch.ward?.getLabel());
        }
    }
}
