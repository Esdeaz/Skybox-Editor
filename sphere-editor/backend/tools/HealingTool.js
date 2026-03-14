import { BaseTool } from "./BaseTool.js";

export class HealingTool extends BaseTool {
  apply(uv) {
    const imageData = this.imageData;
    if (!imageData) return;

    const source = this.ctx.getStampSource();
    if (!source) {
      this.ctx.setStatus("Healing: click 'pick source' first, then click on sphere.");
      return;
    }

    const { sizePx, strength, softness, smooth, triplanar, sharpSampling } = this.ctx.getHealingSettings();
    const perf = this.ctx.getPerformanceSettings ? this.ctx.getPerformanceSettings() : null;
    this.ctx.applyHealingProjected(uv, sizePx, strength, softness, smooth, triplanar, perf, sharpSampling);
    this.ctx.requestTextureUpload();
  }
}
