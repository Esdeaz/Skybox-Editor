export class BaseTool {
  constructor(ctx) {
    this.ctx = ctx;
  }

  apply(_uv) {
    throw new Error("Tool.apply must be implemented in subclass");
  }

  get imageData() {
    return this.ctx.getImageData();
  }

  get width() {
    return this.ctx.getWidth();
  }

  get height() {
    return this.ctx.getHeight();
  }
}
