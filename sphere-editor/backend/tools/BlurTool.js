import * as THREE from "three";
import { BaseTool } from "./BaseTool.js";

export class BlurTool extends BaseTool {
  constructor(ctx) {
    super(ctx);
    this.srcPixelsScratch = null;
    this.tmp = new THREE.Vector3();
  }

  apply(uv) {
    const imageData = this.imageData;
    if (!imageData) return;

    const { sizePx, strength, softness, quality } = this.ctx.getBlurSettings();
    const perf = this.ctx.getPerformanceSettings ? this.ctx.getPerformanceSettings() : null;
    const useSelection = !!(this.ctx.hasActiveSelection && this.ctx.hasActiveSelection());
    if (!this.srcPixelsScratch || this.srcPixelsScratch.length !== imageData.data.length) {
      this.srcPixelsScratch = new Uint8ClampedArray(imageData.data.length);
    }
    this.srcPixelsScratch.set(imageData.data);
    const srcPixels = this.srcPixelsScratch;
    const taps = quality === 1
      ? [[0, 0, 4], [-1, 0, 2], [1, 0, 2], [0, -1, 2], [0, 1, 2]]
      : quality === 3
        ? [[0, 0, 4], [-1, 0, 2], [1, 0, 2], [0, -1, 2], [0, 1, 2], [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1], [-2, 0, 1], [2, 0, 1], [0, -2, 1], [0, 2, 1]]
        : [[-1, -1, 1], [0, -1, 2], [1, -1, 1], [-1, 0, 2], [0, 0, 4], [1, 0, 2], [-1, 1, 1], [0, 1, 2], [1, 1, 1]];

    this.ctx.forEachProjectedBrushPixel(uv, sizePx, strength, softness, ({ y, alpha, tx, ty, thetaRadius, basis, xFrom, xTo }) => {
      const qScale = quality === 1 ? 0.85 : quality === 3 ? 1.2 : 1.0;
      const kernel = thetaRadius * (0.05 + softness * 0.10) * qScale;
      let tw = 0;
      let r = 0;
      let g = 0;
      let b = 0;

      for (const t of taps) {
        this.ctx.offsetOnSphereFast(basis, tx + t[0] * kernel, ty + t[1] * kernel, this.tmp);
        const suv = this.ctx.dirToUvXYZ(this.tmp.x, this.tmp.y, this.tmp.z);
        const c = this.ctx.sampleBilinearRGB(srcPixels, this.width, this.height, suv.x, suv.y);
        tw += t[2];
        r += c[0] * t[2];
        g += c[1] * t[2];
        b += c[2] * t[2];
      }

      if (tw <= 0) return;
      const nr = r / tw;
      const ng = g / tw;
      const nb = b / tw;
      for (let x = xFrom; x <= xTo; x++) {
        if (useSelection && this.ctx.isPixelSelected && !this.ctx.isPixelSelected(x, y)) continue;
        const i = (y * this.width + x) * 4;
        imageData.data[i + 0] = imageData.data[i + 0] * (1 - alpha) + nr * alpha;
        imageData.data[i + 1] = imageData.data[i + 1] * (1 - alpha) + ng * alpha;
        imageData.data[i + 2] = imageData.data[i + 2] * (1 - alpha) + nb * alpha;
      }
    }, perf);

    this.ctx.requestTextureUpload();
  }
}
