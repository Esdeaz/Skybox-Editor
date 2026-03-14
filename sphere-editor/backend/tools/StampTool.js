import { BaseTool } from "./BaseTool.js";

export class StampTool extends BaseTool {
  apply(uv) {
    const imageData = this.imageData;
    if (!imageData) return;

    const source = this.ctx.getStampSource();
    if (!source) {
      this.ctx.setStatus("Stamp: click 'pick source' first, then click on sphere.");
      return;
    }

    const { sizePx, strength, softness, smooth, triplanar, blendMode, sharpSampling } = this.ctx.getStampSettings();
    const perf = this.ctx.getPerformanceSettings ? this.ctx.getPerformanceSettings() : null;
    this.ctx.applyStampProjected(uv, sizePx, strength, softness, smooth, triplanar, perf, blendMode, sharpSampling);
    this.ctx.requestTextureUpload();
  }
}
