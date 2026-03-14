import { BrushTool } from "./BrushTool.js";
import { BlurTool } from "./BlurTool.js";
import { StampTool } from "./StampTool.js";
import { HealingTool } from "./HealingTool.js";
import { TexturePaintTool } from "./TexturePaintTool.js";
import { SeamTool } from "./SeamTool.js";
import { PoleTool } from "./PoleTool.js";
import { FillTool } from "./FillTool.js";
import { EraserTool } from "./EraserTool.js";

export class ToolManager {
  constructor(ctx) {
    this.tools = {
      brush: new BrushTool(ctx),
      blur: new BlurTool(ctx),
      stamp: new StampTool(ctx),
      healing: new HealingTool(ctx),
      texture: new TexturePaintTool(ctx),
      eraser: new EraserTool(ctx),
      fill: new FillTool(ctx),
      seam: new SeamTool(ctx),
      pole: new PoleTool(ctx)
    };
  }

  apply(mode, uv) {
    const tool = this.tools[mode];
    if (!tool) return false;
    tool.apply(uv);
    return true;
  }

  applyGlobal(mode) {
    const tool = this.tools[mode];
    if (!tool) return false;
    tool.apply();
    return true;
  }
}
