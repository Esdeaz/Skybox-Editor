import { BaseTool } from "./BaseTool.js";

export class EraserTool extends BaseTool {
  apply(uv) {
    const imageData = this.imageData;
    if (!imageData) return;

    const settings = this.ctx.getEraserSettings();
    const { sizePx, strength, softness } = settings;
    const perf = this.ctx.getPerformanceSettings ? this.ctx.getPerformanceSettings() : null;
    const useSelection = !!(this.ctx.hasActiveSelection && this.ctx.hasActiveSelection());

    const mask = this.ctx.getEraserMask();
    const hasTextureMask = !!(mask.data && mask.width && mask.height);

    this.ctx.forEachProjectedBrushPixel(uv, sizePx, strength, softness, ({ x, y, alpha, tx, ty, thetaRadius, xFrom, xTo }) => {
      const nx = tx / Math.max(thetaRadius, 1e-6);
      const ny = ty / Math.max(thetaRadius, 1e-6);

      let sampleMask = 1;
      if (hasTextureMask) {
        const mu = nx * 0.5 + 0.5;
        const mv = ny * 0.5 + 0.5;
        if (mu < 0 || mu > 1 || mv < 0 || mv > 1) return;
        const m = this.ctx.sampleBilinearRGBA(mask.data, mask.width, mask.height, mu, mv);
        sampleMask = m[3] / 255;
        if (sampleMask <= 0) return;
      } else {
        const d = Math.sqrt(nx * nx + ny * ny);
        if (d > 1) return;
        sampleMask = Math.max(0, 1 - d);
      }

      const a = Math.max(0, Math.min(1, alpha * sampleMask));
      if (a <= 0) return;

      const xStart = xFrom == null ? x : xFrom;
      const xEnd = xTo == null ? x : xTo;
      for (let xi = xStart; xi <= xEnd; xi++) {
        if (useSelection && this.ctx.isPixelSelected && !this.ctx.isPixelSelected(xi, y)) continue;
        const i = (y * this.width + xi) * 4;
        const dr = imageData.data[i + 0] / 255;
        const dg = imageData.data[i + 1] / 255;
        const db = imageData.data[i + 2] / 255;
        const da = imageData.data[i + 3] / 255;

        const sa = a;
        const oa = da * (1 - sa);
        if (oa > 1e-6) {
          const opr = dr * da * (1 - sa);
          const opg = dg * da * (1 - sa);
          const opb = db * da * (1 - sa);
          imageData.data[i + 0] = Math.round((opr / oa) * 255);
          imageData.data[i + 1] = Math.round((opg / oa) * 255);
          imageData.data[i + 2] = Math.round((opb / oa) * 255);
          imageData.data[i + 3] = Math.round(oa * 255);
        } else {
          imageData.data[i + 0] = 0;
          imageData.data[i + 1] = 0;
          imageData.data[i + 2] = 0;
          imageData.data[i + 3] = 0;
        }
      }
    }, perf);

    this.ctx.requestTextureUpload();
  }
}
