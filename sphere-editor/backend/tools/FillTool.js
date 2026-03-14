import { BaseTool } from "./BaseTool.js";

export class FillTool extends BaseTool {
  apply(uv) {
    const imageData = this.imageData;
    if (!imageData || !uv) return;

    const { color, tolerance, opacity } = this.ctx.getFillSettings();
    const w = this.width;
    const h = this.height;
    const useSelection = !!(this.ctx.hasActiveSelection && this.ctx.hasActiveSelection());
    if (w <= 0 || h <= 0) return;

    const x0 = Math.max(0, Math.min(w - 1, Math.floor(this.ctx.wrapU(uv.x) * w)));
    const y0 = Math.max(0, Math.min(h - 1, Math.floor((1 - this.ctx.clamp01(uv.y)) * h)));
    if (useSelection && this.ctx.isPixelSelected && !this.ctx.isPixelSelected(x0, y0)) return;
    const startIndex = y0 * w + x0;

    const data = imageData.data;
    const src = new Uint8ClampedArray(data);
    const si = startIndex * 4;
    const tr = src[si + 0];
    const tg = src[si + 1];
    const tb = src[si + 2];
    const ta = src[si + 3];

    const sa = Math.max(0, Math.min(1, opacity));
    if (sa <= 0) return;

    const visited = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let qh = 0;
    let qt = 0;
    queue[qt++] = startIndex;
    visited[startIndex] = 1;

    while (qh < qt) {
      const idx = queue[qh++];
      const i4 = idx * 4;
      const cr = src[i4 + 0];
      const cg = src[i4 + 1];
      const cb = src[i4 + 2];
      const ca = src[i4 + 3];

      if (
        Math.abs(cr - tr) > tolerance ||
        Math.abs(cg - tg) > tolerance ||
        Math.abs(cb - tb) > tolerance ||
        Math.abs(ca - ta) > tolerance
      ) {
        continue;
      }

      const dr = data[i4 + 0] / 255;
      const dg = data[i4 + 1] / 255;
      const db = data[i4 + 2] / 255;
      const da = data[i4 + 3] / 255;
      const sr = color[0] / 255;
      const sg = color[1] / 255;
      const sb = color[2] / 255;
      const oa = sa + da * (1 - sa);
      if (oa > 1e-6) {
        const opr = sr * sa + dr * da * (1 - sa);
        const opg = sg * sa + dg * da * (1 - sa);
        const opb = sb * sa + db * da * (1 - sa);
        data[i4 + 0] = Math.round((opr / oa) * 255);
        data[i4 + 1] = Math.round((opg / oa) * 255);
        data[i4 + 2] = Math.round((opb / oa) * 255);
        data[i4 + 3] = Math.round(oa * 255);
      }

      const x = idx % w;
      const y = (idx / w) | 0;
      if (useSelection && this.ctx.isPixelSelected && !this.ctx.isPixelSelected(x, y)) continue;

      const leftX = x === 0 ? (w - 1) : (x - 1);
      const rightX = x === (w - 1) ? 0 : (x + 1);

      const n0 = y * w + leftX;
      if (!visited[n0]) {
        visited[n0] = 1;
        queue[qt++] = n0;
      }
      const n1 = y * w + rightX;
      if (!visited[n1]) {
        visited[n1] = 1;
        queue[qt++] = n1;
      }
      if (y > 0) {
        const n2 = (y - 1) * w + x;
        if (!visited[n2]) {
          visited[n2] = 1;
          queue[qt++] = n2;
        }
      }
      if (y < h - 1) {
        const n3 = (y + 1) * w + x;
        if (!visited[n3]) {
          visited[n3] = 1;
          queue[qt++] = n3;
        }
      }
    }

    this.ctx.requestTextureUpload();
  }
}
