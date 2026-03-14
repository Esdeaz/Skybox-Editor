import { BaseTool } from "./BaseTool.js";

export class SeamTool extends BaseTool {
  constructor(ctx) {
    super(ctx);
    this.srcScratch = null;
  }

  apply() {
    const imageData = this.imageData;
    if (!imageData) return;

    const { widthPx, strength } = this.ctx.getSeamSettings();
    const w = this.width;
    const h = this.height;
    const useSelection = !!(this.ctx.hasActiveSelection && this.ctx.hasActiveSelection());
    const data = imageData.data;
    if (!this.srcScratch || this.srcScratch.length !== data.length) {
      this.srcScratch = new Uint8ClampedArray(data.length);
    }
    this.srcScratch.set(data);
    const src = this.srcScratch;

    for (let y = 0; y < h; y++) {
      const seamY = y * w * 4;
      for (let x = 0; x < widthPx; x++) {
        const leftX = x;
        const rightX = w - 1 - x;
        const t = (widthPx - x) / widthPx;
        const k = t * strength;

        const li = seamY + leftX * 4;
        const ri = seamY + rightX * 4;

        const lR = src[li + 0];
        const lG = src[li + 1];
        const lB = src[li + 2];
        const rR = src[ri + 0];
        const rG = src[ri + 1];
        const rB = src[ri + 2];

        const avgR = (lR + rR) * 0.5;
        const avgG = (lG + rG) * 0.5;
        const avgB = (lB + rB) * 0.5;

        if (!useSelection || !this.ctx.isPixelSelected || this.ctx.isPixelSelected(leftX, y)) {
          data[li + 0] = lR * (1 - k) + avgR * k;
          data[li + 1] = lG * (1 - k) + avgG * k;
          data[li + 2] = lB * (1 - k) + avgB * k;
        }

        if (!useSelection || !this.ctx.isPixelSelected || this.ctx.isPixelSelected(rightX, y)) {
          data[ri + 0] = rR * (1 - k) + avgR * k;
          data[ri + 1] = rG * (1 - k) + avgG * k;
          data[ri + 2] = rB * (1 - k) + avgB * k;
        }
      }
    }

    this.ctx.requestTextureUpload();
    this.ctx.setStatus(`Seam blend applied (width ${widthPx}px, strength ${(strength * 100).toFixed(0)}%).`);
  }
}
