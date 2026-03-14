import { BaseTool } from "./BaseTool.js";

export class TexturePaintTool extends BaseTool {
  apply(uv) {
    const imageData = this.imageData;
    if (!imageData) return;

    const tex = this.ctx.getTexturePaint();
    if (!tex.data || !tex.width || !tex.height) {
      this.ctx.setStatus("Texture Painting: load PNG texture first.");
      return;
    }

    const { sizePx, opacity, softness, rotationRad, blendMode } = this.ctx.getTexturePaintSettings();
    const perf = this.ctx.getPerformanceSettings ? this.ctx.getPerformanceSettings() : null;
    const useSelection = !!(this.ctx.hasActiveSelection && this.ctx.hasActiveSelection());
    const rotCos = Math.cos(rotationRad);
    const rotSin = Math.sin(rotationRad);

    this.ctx.forEachProjectedBrushPixel(uv, sizePx, opacity, softness, ({ x, y, alpha, tx, ty, thetaRadius, xFrom, xTo }) => {
      const nx = tx / Math.max(thetaRadius, 1e-6);
      const ny = ty / Math.max(thetaRadius, 1e-6);
      const rx = nx * rotCos - ny * rotSin;
      const ry = nx * rotSin + ny * rotCos;
      const mu = rx * 0.5 + 0.5;
      const mv = ry * 0.5 + 0.5;
      if (mu < 0 || mu > 1 || mv < 0 || mv > 1) return;

      const t = this.ctx.sampleBilinearRGBA(tex.data, tex.width, tex.height, mu, mv);
      const texAlpha = t[3] / 255;
      if (texAlpha <= 0) return;

      const maskAlpha = blendMode === "replace" ? (texAlpha > 0.001 ? 1 : 0) : texAlpha;
      const a = Math.max(0, Math.min(1, alpha * maskAlpha));
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
        const sr = t[0] / 255;
        const sg = t[1] / 255;
        const sb = t[2] / 255;
        const sa = a;
        const oa = sa + da * (1 - sa);
        if (oa <= 1e-6) continue;
        const opr = sr * sa + dr * da * (1 - sa);
        const opg = sg * sa + dg * da * (1 - sa);
        const opb = sb * sa + db * da * (1 - sa);
        imageData.data[i + 0] = Math.round((opr / oa) * 255);
        imageData.data[i + 1] = Math.round((opg / oa) * 255);
        imageData.data[i + 2] = Math.round((opb / oa) * 255);
        imageData.data[i + 3] = Math.round(oa * 255);
      }
    }, perf);

    this.ctx.requestTextureUpload();
  }
}
