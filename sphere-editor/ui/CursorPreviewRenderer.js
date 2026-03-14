import * as THREE from "three";

export class CursorPreviewRenderer {
  constructor(options) {
    this.canvas = options.canvas;
    this.ctx = options.ctx;
    this.camera = options.camera;
    this.glCanvas = options.glCanvas;
    this.sphereRadius = options.sphereRadius;
    this.math = options.math;
    this.contourCos = null;
    this.contourSin = null;
    this.contourSteps = 192;
    this.ensureContourCache(this.contourSteps);
  }

  ensureContourCache(steps) {
    if (this.contourCos && this.contourSin && this.contourCos.length === steps + 1) return;
    this.contourCos = new Float32Array(steps + 1);
    this.contourSin = new Float32Array(steps + 1);
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      this.contourCos[i] = Math.cos(a);
      this.contourSin[i] = Math.sin(a);
    }
  }

  resize() {
    if (!this.canvas) return;
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
    const w = Math.max(1, Math.floor(this.glCanvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(this.glCanvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";
    }
  }

  clear() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  project(point) {
    const p = point.clone().project(this.camera);
    return {
      x: (p.x * 0.5 + 0.5) * this.canvas.width,
      y: (-p.y * 0.5 + 0.5) * this.canvas.height
    };
  }

  draw(hit, options) {
    this.clear();

    if (!this.ctx || !this.canvas) return;
    if (!options.previewEnabled) return;
    if (!options.imageLoaded) return;
    if (!hit || !hit.point || !hit.uv) return;
    if (!(options.activeToolMode === "brush" || options.activeToolMode === "eraser" || options.activeToolMode === "texture" || options.activeToolMode === "blur" || options.activeToolMode === "stamp" || options.activeToolMode === "healing")) return;

    const radiusPx = options.activeToolSizePx * 0.5;
    const thetaRadius = radiusPx / options.mapHeight * Math.PI;
    const hitDir = hit.point.clone().normalize();
    const basisPreview = this.math.buildTangentBasis(hitDir);
    const basisPaint = this.math.buildTangentBasis(this.math.uvToDir(hit.uv));

    const center3 = hitDir.clone().multiplyScalar(this.sphereRadius * 1.001);
    const east3 = this.math.offsetOnSphere(basisPreview, thetaRadius, 0).multiplyScalar(this.sphereRadius * 1.001);
    const north3 = this.math.offsetOnSphere(basisPreview, 0, thetaRadius).multiplyScalar(this.sphereRadius * 1.001);

    const center2 = this.project(center3);
    const east2 = this.project(east3);
    const north2 = this.project(north3);

    const vEast = { x: east2.x - center2.x, y: east2.y - center2.y };
    const vNorth = { x: north2.x - center2.x, y: north2.y - center2.y };
    const crossEN = new THREE.Vector3().crossVectors(basisPreview.east, basisPaint.east);
    const basisDelta = Math.atan2(crossEN.dot(hitDir), basisPreview.east.dot(basisPaint.east));
    const rot = options.rotationRad + basisDelta;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    const vX = {
      x: vEast.x * cosR - vNorth.x * sinR,
      y: vEast.y * cosR - vNorth.y * sinR
    };
    const vY = {
      x: vEast.x * sinR + vNorth.x * cosR,
      y: vEast.y * sinR + vNorth.y * cosR
    };

    const softness = options.activeToolMode === "texture"
      ? options.texSoftness
      : options.activeToolMode === "eraser"
        ? options.eraserSoftness
      : options.activeToolMode === "blur"
        ? options.blurSoftness
        : options.activeToolMode === "stamp"
          ? options.stampSoftness
          : options.activeToolMode === "healing"
            ? options.healingSoftness
          : options.brushSoftness;
    const opacity = options.activeToolMode === "texture"
      ? options.texOpacity
      : options.activeToolMode === "eraser"
        ? options.eraserStrength
      : options.activeToolMode === "blur"
        ? options.blurStrength
        : options.activeToolMode === "stamp"
          ? options.stampStrength
          : options.activeToolMode === "healing"
            ? options.healingStrength
          : options.brushStrength;

    const contourSteps = this.contourSteps;
    const contour2D = new Array(contourSteps + 1);
    for (let i = 0; i <= contourSteps; i++) {
      const p3 = this.math.offsetOnSphere(
        basisPreview,
        thetaRadius * this.contourCos[i],
        thetaRadius * this.contourSin[i]
      )
        .multiplyScalar(this.sphereRadius * 1.001);
      contour2D[i] = this.project(p3);
    }

    this.ctx.save();
    this.ctx.beginPath();
    for (let i = 0; i < contour2D.length; i++) {
      const p = contour2D[i];
      if (i === 0) this.ctx.moveTo(p.x, p.y);
      else this.ctx.lineTo(p.x, p.y);
    }
    this.ctx.closePath();
    this.ctx.clip();

    this.ctx.globalAlpha = Math.max(0.05, opacity);
    if (options.activeToolMode === "texture" && options.texturePaintPreviewCanvas) {
      this.ctx.transform(vX.x, vX.y, vY.x, vY.y, center2.x, center2.y);
      this.ctx.drawImage(options.texturePaintPreviewCanvas, -1, -1, 2, 2);
    } else if (options.activeToolMode === "eraser") {
      if (options.eraserMaskPreviewCanvas) {
        this.ctx.transform(vX.x, vX.y, vY.x, vY.y, center2.x, center2.y);
        this.ctx.drawImage(options.eraserMaskPreviewCanvas, -1, -1, 2, 2);
        this.ctx.globalCompositeOperation = "source-atop";
        this.ctx.fillStyle = "rgba(255,95,95,0.55)";
        this.ctx.fillRect(-1, -1, 2, 2);
        this.ctx.globalCompositeOperation = "source-over";
      } else {
        this.ctx.fillStyle = "rgba(255,95,95,0.18)";
        this.ctx.beginPath();
        for (let i = 0; i < contour2D.length; i++) {
          const p = contour2D[i];
          if (i === 0) this.ctx.moveTo(p.x, p.y);
          else this.ctx.lineTo(p.x, p.y);
        }
        this.ctx.closePath();
        this.ctx.fill();
      }
    } else if (options.activeToolMode === "brush") {
      const shape = options.brushShape;
      if (shape === "texture" && options.brushMaskPreviewCanvas) {
        this.ctx.transform(vX.x, vX.y, vY.x, vY.y, center2.x, center2.y);
        this.ctx.drawImage(options.brushMaskPreviewCanvas, -1, -1, 2, 2);
        this.ctx.globalCompositeOperation = "source-atop";
        this.ctx.fillStyle = options.brushColor;
        this.ctx.fillRect(-1, -1, 2, 2);
        this.ctx.globalCompositeOperation = "source-over";
      } else {
        this.ctx.fillStyle = options.brushColor;
        if (shape === "square") {
          this.ctx.transform(vX.x, vX.y, vY.x, vY.y, center2.x, center2.y);
          this.ctx.fillRect(-1, -1, 2, 2);
        } else {
          this.ctx.beginPath();
          for (let i = 0; i < contour2D.length; i++) {
            const p = contour2D[i];
            if (i === 0) this.ctx.moveTo(p.x, p.y);
            else this.ctx.lineTo(p.x, p.y);
          }
          this.ctx.closePath();
          this.ctx.fill();
        }
      }
    } else {
      this.ctx.fillStyle = "rgba(255,95,95,0.12)";
      this.ctx.beginPath();
      for (let i = 0; i < contour2D.length; i++) {
        const p = contour2D[i];
        if (i === 0) this.ctx.moveTo(p.x, p.y);
        else this.ctx.lineTo(p.x, p.y);
      }
      this.ctx.closePath();
      this.ctx.fill();
    }

    if (softness > 0.01) {
      const edgeInner = Math.max(0.01, softness);
      this.ctx.globalCompositeOperation = "destination-out";
      const radial = this.ctx.createRadialGradient(
        center2.x,
        center2.y,
        radiusPx * edgeInner,
        center2.x,
        center2.y,
        radiusPx
      );
      radial.addColorStop(0, "rgba(0,0,0,0)");
      radial.addColorStop(1, "rgba(0,0,0,0.82)");
      this.ctx.fillStyle = radial;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    this.ctx.restore();

    this.ctx.save();
    this.ctx.strokeStyle = "rgba(255,95,95,0.92)";
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    for (let i = 0; i < contour2D.length; i++) {
      const p = contour2D[i];
      if (i === 0) this.ctx.moveTo(p.x, p.y);
      else this.ctx.lineTo(p.x, p.y);
    }
    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.restore();
  }
}
