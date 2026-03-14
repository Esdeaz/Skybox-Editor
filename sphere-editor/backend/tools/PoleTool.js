import { BaseTool } from "./BaseTool.js";

export class PoleTool extends BaseTool {
  constructor(ctx) {
    super(ctx);
    this.srcScratch = null;
    this.meanScratch = new Float32Array(3);
  }

  sampleRowMeanData(data4, y, out, samples = 64) {
    const w = this.width;
    const xStep = w / samples;
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;

    for (let i = 0; i < samples; i++) {
      const x = Math.floor((i + 0.5) * xStep) % w;
      const di = (y * w + x) * 4;
      r += data4[di + 0];
      g += data4[di + 1];
      b += data4[di + 2];
      n++;
    }

    if (n === 0) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      return;
    }
    out[0] = r / n;
    out[1] = g / n;
    out[2] = b / n;
  }

  blendPoleRow(y, k, src, data) {
    const w = this.width;
    const useSelection = !!(this.ctx.hasActiveSelection && this.ctx.hasActiveSelection());
    const mean = this.meanScratch;
    this.sampleRowMeanData(src, y, mean, 64);
    const meanR = mean[0];
    const meanG = mean[1];
    const meanB = mean[2];

    for (let x = 0; x < w; x++) {
      if (useSelection && this.ctx.isPixelSelected && !this.ctx.isPixelSelected(x, y)) continue;
      const i = (y * w + x) * 4;
      data[i + 0] = src[i + 0] * (1 - k) + meanR * k;
      data[i + 1] = src[i + 1] * (1 - k) + meanG * k;
      data[i + 2] = src[i + 2] * (1 - k) + meanB * k;
    }
  }

  apply() {
    const imageData = this.imageData;
    if (!imageData) return;

    const { widthPx, strength } = this.ctx.getPoleSettings();
    const h = this.height;
    const data = imageData.data;
    if (!this.srcScratch || this.srcScratch.length !== data.length) {
      this.srcScratch = new Uint8ClampedArray(data.length);
    }
    const src = this.srcScratch;
    src.set(data);
    const band = Math.max(2, widthPx | 0);

    for (let y = 0; y < band; y++) {
      const t = (band - y) / band;
      const k = t * strength;
      this.blendPoleRow(y, k, src, data);
    }

    for (let y = h - band; y < h; y++) {
      const d = h - 1 - y;
      const t = (band - d) / band;
      const k = t * strength;
      this.blendPoleRow(y, k, src, data);
    }

    this.ctx.requestTextureUpload();
    this.ctx.setStatus(`Pole blend applied (width ${band}px, strength ${(strength * 100).toFixed(0)}%).`);
  }
}
