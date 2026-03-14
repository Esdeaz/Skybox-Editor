export class LayerStack {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.layers = [];
    this.activeLayerId = null;
    this.nextLayerId = 1;
  }

  cloneImageData(src) {
    return new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
  }

  createLayer(name, imageData, options = {}) {
    const layer = {
      id: this.nextLayerId++,
      name,
      visible: options.visible !== false,
      opacity: Math.max(0, Math.min(1, options.opacity == null ? 1 : options.opacity)),
      offsetU: Number(options.offsetU || 0),
      offsetV: Number(options.offsetV || 0),
      rotationRad: Number(options.rotationRad || 0),
      pivotU: options.pivotU == null ? 0.5 : Number(options.pivotU),
      pivotV: options.pivotV == null ? 0.5 : Number(options.pivotV),
      imageData,
      _transformCache: null
    };
    this.layers.push(layer);
    if (this.activeLayerId == null) this.activeLayerId = layer.id;
    return layer;
  }

  resetFromBaseImage(baseImageData) {
    this.width = baseImageData.width;
    this.height = baseImageData.height;
    this.layers = [];
    this.activeLayerId = null;
    this.nextLayerId = 1;
    const bg = this.createLayer("Background", this.cloneImageData(baseImageData), { visible: true, opacity: 1 });
    this.activeLayerId = bg.id;
    return bg;
  }

  createEmptyLayer(name = null) {
    const label = name || `Layer ${this.layers.length + 1}`;
    const data = new Uint8ClampedArray(this.width * this.height * 4);
    const imageData = new ImageData(data, this.width, this.height);
    const layer = this.createLayer(label, imageData, { visible: true, opacity: 1 });
    this.activeLayerId = layer.id;
    return layer;
  }

  duplicateLayer(layerId) {
    const src = this.getLayerById(layerId);
    if (!src) return null;
    const copy = this.createLayer(`${src.name} Copy`, this.cloneImageData(src.imageData), {
      visible: src.visible,
      opacity: src.opacity,
      offsetU: src.offsetU || 0,
      offsetV: src.offsetV || 0,
      rotationRad: src.rotationRad || 0,
      pivotU: src.pivotU == null ? 0.5 : src.pivotU,
      pivotV: src.pivotV == null ? 0.5 : src.pivotV
    });
    const srcIndex = this.layers.findIndex((l) => l.id === src.id);
    const copyIndex = this.layers.findIndex((l) => l.id === copy.id);
    this.layers.splice(copyIndex, 1);
    this.layers.splice(srcIndex + 1, 0, copy);
    this.activeLayerId = copy.id;
    return copy;
  }

  removeLayer(layerId) {
    if (this.layers.length <= 1) return false;
    const idx = this.layers.findIndex((l) => l.id === layerId);
    if (idx < 0) return false;
    this.layers.splice(idx, 1);
    if (this.activeLayerId === layerId) {
      const next = this.layers[Math.max(0, idx - 1)] || this.layers[0];
      this.activeLayerId = next ? next.id : null;
    }
    return true;
  }

  mergeLayerDown(layerId) {
    const visualLayers = [...this.layers].reverse();
    const upperVisualIndex = visualLayers.findIndex((l) => l.id === layerId);
    if (upperVisualIndex < 0) return null;
    const lowerVisualIndex = upperVisualIndex + 1;
    if (lowerVisualIndex >= visualLayers.length) return null;

    const upper = visualLayers[upperVisualIndex];
    const lower = visualLayers[lowerVisualIndex];
    const out = new ImageData(this.width, this.height);
    const outData = out.data;
    const sample = [0, 0, 0, 0];
    const pair = [lower, upper].map((layer) => ({
      layer,
      src: layer.imageData.data,
      transformed: this.hasLayerTransform(layer),
      cache: this.getOrBuildLayerTransformCache(layer)
    }));

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let ar = 0;
        let ag = 0;
        let ab = 0;
        let aa = 0;

        const p = y * this.width + x;
        const j = p * 4;
        for (let i = 0; i < pair.length; i++) {
          const entry = pair[i];
          const layer = entry.layer;
          const src = entry.src;
          if (!entry.transformed) {
            sample[0] = src[j + 0];
            sample[1] = src[j + 1];
            sample[2] = src[j + 2];
            sample[3] = src[j + 3];
          } else {
            const su = entry.cache.mapU[p] / 65535;
            const sv = entry.cache.mapV[p] / 65535;
            this.sampleLayerAtUv(layer, src, su, sv, sample);
          }
          const la = (sample[3] / 255) * layer.opacity;
          if (la <= 1e-6) continue;
          const sr = sample[0] / 255;
          const sg = sample[1] / 255;
          const sb = sample[2] / 255;
          ar = sr * la + ar * (1 - la);
          ag = sg * la + ag * (1 - la);
          ab = sb * la + ab * (1 - la);
          aa = la + aa * (1 - la);
        }

        if (aa > 1e-6) {
          outData[j + 0] = Math.round((ar / aa) * 255);
          outData[j + 1] = Math.round((ag / aa) * 255);
          outData[j + 2] = Math.round((ab / aa) * 255);
          outData[j + 3] = Math.round(aa * 255);
        } else {
          outData[j + 0] = 0;
          outData[j + 1] = 0;
          outData[j + 2] = 0;
          outData[j + 3] = 0;
        }
      }
    }

    lower.imageData = out;
    lower.opacity = 1;
    lower.name = upper.name;
    lower.visible = upper.visible || lower.visible;
    lower.offsetU = 0;
    lower.offsetV = 0;
    lower.rotationRad = 0;
    lower.pivotU = 0.5;
    lower.pivotV = 0.5;
    lower._transformCache = null;

    const upperActualIndex = this.layers.findIndex((l) => l.id === upper.id);
    if (upperActualIndex >= 0) {
      this.layers.splice(upperActualIndex, 1);
    }
    this.activeLayerId = lower.id;
    return lower;
  }

  moveLayer(layerId, direction) {
    const idx = this.layers.findIndex((l) => l.id === layerId);
    if (idx < 0) return false;
    const to = direction === "up" ? idx + 1 : idx - 1;
    if (to < 0 || to >= this.layers.length) return false;
    const [layer] = this.layers.splice(idx, 1);
    this.layers.splice(to, 0, layer);
    return true;
  }

  moveLayerToIndex(layerId, toIndex) {
    const from = this.layers.findIndex((l) => l.id === layerId);
    if (from < 0) return false;
    const target = Math.max(0, Math.min(this.layers.length - 1, toIndex));
    if (from === target) return false;
    const [layer] = this.layers.splice(from, 1);
    this.layers.splice(target, 0, layer);
    return true;
  }

  setActiveLayer(layerId) {
    if (!this.getLayerById(layerId)) return false;
    this.activeLayerId = layerId;
    return true;
  }

  setLayerVisibility(layerId, visible) {
    const layer = this.getLayerById(layerId);
    if (!layer) return false;
    layer.visible = !!visible;
    return true;
  }

  setLayerOpacity(layerId, opacity01) {
    const layer = this.getLayerById(layerId);
    if (!layer) return false;
    layer.opacity = Math.max(0, Math.min(1, opacity01));
    return true;
  }

  setLayerName(layerId, name) {
    const layer = this.getLayerById(layerId);
    if (!layer) return false;
    const next = (name || "").trim();
    if (!next) return false;
    layer.name = next;
    return true;
  }

  setLayerTransform(layerId, transform) {
    const layer = this.getLayerById(layerId);
    if (!layer) return false;
    if (transform.offsetU != null) layer.offsetU = Number(transform.offsetU) || 0;
    if (transform.offsetV != null) layer.offsetV = Number(transform.offsetV) || 0;
    if (transform.rotationRad != null) layer.rotationRad = Number(transform.rotationRad) || 0;
    if (transform.pivotU != null) layer.pivotU = this.wrapU(Number(transform.pivotU) || 0);
    if (transform.pivotV != null) layer.pivotV = this.clamp01(Number(transform.pivotV) || 0);
    layer._transformCache = null;
    return true;
  }

  bakeLayerTransform(layerId) {
    const layer = this.getLayerById(layerId);
    if (!layer) return false;
    if (!this.hasLayerTransform(layer)) return false;

    const cache = this.getOrBuildLayerTransformCache(layer);
    if (!cache) return false;

    const src = layer.imageData.data;
    const out = new ImageData(this.width, this.height);
    const outData = out.data;
    const sample = [0, 0, 0, 0];

    for (let i = 0; i < this.width * this.height; i++) {
      const su = cache.mapU[i] / 65535;
      const sv = cache.mapV[i] / 65535;
      this.sampleLayerAtUv(layer, src, su, sv, sample);
      const j = i * 4;
      outData[j + 0] = sample[0];
      outData[j + 1] = sample[1];
      outData[j + 2] = sample[2];
      outData[j + 3] = sample[3];
    }

    layer.imageData = out;
    layer.offsetU = 0;
    layer.offsetV = 0;
    layer.rotationRad = 0;
    layer.pivotU = 0.5;
    layer.pivotV = 0.5;
    layer._transformCache = null;
    return true;
  }

  getLayerById(layerId) {
    return this.layers.find((l) => l.id === layerId) || null;
  }

  getActiveLayer() {
    return this.getLayerById(this.activeLayerId);
  }

  wrapU(u) {
    return ((u % 1) + 1) % 1;
  }

  clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  sampleLayerAtUv(layer, src, su, sv, out) {
    const w = this.width;
    const h = this.height;
    const fx = this.wrapU(su) * w;
    const fy = (1 - this.clamp01(sv)) * h;
    const x0 = ((Math.floor(fx) % w) + w) % w;
    const y0 = Math.max(0, Math.min(h - 1, Math.floor(fy)));
    const x1 = (x0 + 1) % w;
    const y1 = Math.max(0, Math.min(h - 1, y0 + 1));
    const tx = fx - Math.floor(fx);
    const ty = fy - Math.floor(fy);
    const i00 = (y0 * w + x0) * 4;
    const i10 = (y0 * w + x1) * 4;
    const i01 = (y1 * w + x0) * 4;
    const i11 = (y1 * w + x1) * 4;
    const w00 = (1 - tx) * (1 - ty);
    const w10 = tx * (1 - ty);
    const w01 = (1 - tx) * ty;
    const w11 = tx * ty;
    out[0] = src[i00 + 0] * w00 + src[i10 + 0] * w10 + src[i01 + 0] * w01 + src[i11 + 0] * w11;
    out[1] = src[i00 + 1] * w00 + src[i10 + 1] * w10 + src[i01 + 1] * w01 + src[i11 + 1] * w11;
    out[2] = src[i00 + 2] * w00 + src[i10 + 2] * w10 + src[i01 + 2] * w01 + src[i11 + 2] * w11;
    out[3] = src[i00 + 3] * w00 + src[i10 + 3] * w10 + src[i01 + 3] * w01 + src[i11 + 3] * w11;
  }

  uvToDir(ux, vy) {
    const lon = ux * Math.PI * 2 - Math.PI;
    const lat = vy * Math.PI - Math.PI * 0.5;
    const cl = Math.cos(lat);
    return {
      x: Math.cos(lon) * cl,
      y: Math.sin(lat),
      z: Math.sin(lon) * cl
    };
  }

  dirToUvXYZ(x, y, z) {
    const lon = Math.atan2(z, x);
    const lat = Math.asin(Math.max(-1, Math.min(1, y)));
    return {
      x: this.wrapU((lon + Math.PI) / (Math.PI * 2)),
      y: this.clamp01((lat + Math.PI * 0.5) / Math.PI)
    };
  }

  rotateAroundAxis(v, axis, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const dot = v.x * axis.x + v.y * axis.y + v.z * axis.z;
    const cx = axis.y * v.z - axis.z * v.y;
    const cy = axis.z * v.x - axis.x * v.z;
    const cz = axis.x * v.y - axis.y * v.x;
    return {
      x: v.x * c + cx * s + axis.x * dot * (1 - c),
      y: v.y * c + cy * s + axis.y * dot * (1 - c),
      z: v.z * c + cz * s + axis.z * dot * (1 - c)
    };
  }

  rotateX(v, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return {
      x: v.x,
      y: v.y * c - v.z * s,
      z: v.y * s + v.z * c
    };
  }

  rotateY(v, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return {
      x: v.x * c + v.z * s,
      y: v.y,
      z: -v.x * s + v.z * c
    };
  }

  mapOutputUvToSourceUv(layer, outU, outV) {
    let dir = this.uvToDir(this.wrapU(outU), this.clamp01(outV));
    const offU = layer.offsetU || 0;
    const offV = layer.offsetV || 0;
    const rot = layer.rotationRad || 0;
    const hasMove = Math.abs(offU) > 1e-9 || Math.abs(offV) > 1e-9;
    const hasRot = Math.abs(rot) > 1e-9;

    if (hasRot) {
      const pivotU = layer.pivotU == null ? 0.5 : this.wrapU(layer.pivotU);
      const pivotV = layer.pivotV == null ? 0.5 : this.clamp01(layer.pivotV);
      const axis = this.uvToDir(pivotU, pivotV);
      dir = this.rotateAroundAxis(dir, axis, -rot);
    }
    if (hasMove) {
      const yaw = -(offU * Math.PI * 2);
      const pitch = -(offV * Math.PI);
      dir = this.rotateY(dir, yaw);
      dir = this.rotateX(dir, pitch);
    }
    return this.dirToUvXYZ(dir.x, dir.y, dir.z);
  }

  hasLayerTransform(layer) {
    const offU = layer.offsetU || 0;
    const offV = layer.offsetV || 0;
    const rot = layer.rotationRad || 0;
    return Math.abs(offU) >= 1e-9 || Math.abs(offV) >= 1e-9 || Math.abs(rot) >= 1e-9;
  }

  getLayerTransformSignature(layer) {
    return `${layer.offsetU || 0}|${layer.offsetV || 0}|${layer.rotationRad || 0}|${layer.pivotU == null ? 0.5 : layer.pivotU}|${layer.pivotV == null ? 0.5 : layer.pivotV}`;
  }

  getOrBuildLayerTransformCache(layer) {
    if (!this.hasLayerTransform(layer)) return null;
    const signature = this.getLayerTransformSignature(layer);
    const cached = layer._transformCache;
    if (cached && cached.width === this.width && cached.height === this.height && cached.signature === signature) {
      return cached;
    }
    const pixelCount = this.width * this.height;
    const mapU = new Uint16Array(pixelCount);
    const mapV = new Uint16Array(pixelCount);
    const q = 65535;
    for (let y = 0; y < this.height; y++) {
      const outV = 1 - (y + 0.5) / this.height;
      for (let x = 0; x < this.width; x++) {
        const i = y * this.width + x;
        const outU = (x + 0.5) / this.width;
        const mapped = this.mapOutputUvToSourceUv(layer, outU, outV);
        mapU[i] = Math.max(0, Math.min(q, Math.round(mapped.x * q)));
        mapV[i] = Math.max(0, Math.min(q, Math.round(mapped.y * q)));
      }
    }
    layer._transformCache = {
      width: this.width,
      height: this.height,
      signature,
      mapU,
      mapV
    };
    return layer._transformCache;
  }

  composite(targetImageData = null) {
    const out = targetImageData || new ImageData(this.width, this.height);
    const outData = out.data;
    const pixelCount = this.width * this.height;

    const visibleLayers = this.layers.filter((l) => l.visible && l.opacity > 0).map((layer) => ({
      layer,
      src: layer.imageData.data,
      transformed: this.hasLayerTransform(layer),
      cache: this.getOrBuildLayerTransformCache(layer)
    }));
    const sample = [0, 0, 0, 0];
    for (let i = 0; i < pixelCount; i++) {
      let ar = 0;
      let ag = 0;
      let ab = 0;
      let aa = 0;
      const j = i * 4;
      for (let li = 0; li < visibleLayers.length; li++) {
        const entry = visibleLayers[li];
        const layer = entry.layer;
        const src = entry.src;
        let sr;
        let sg;
        let sb;
        let saRaw;
        if (!entry.transformed) {
          sr = src[j + 0] / 255;
          sg = src[j + 1] / 255;
          sb = src[j + 2] / 255;
          saRaw = src[j + 3] / 255;
        } else {
          const su = entry.cache.mapU[i] / 65535;
          const sv = entry.cache.mapV[i] / 65535;
          this.sampleLayerAtUv(layer, src, su, sv, sample);
          sr = sample[0] / 255;
          sg = sample[1] / 255;
          sb = sample[2] / 255;
          saRaw = sample[3] / 255;
        }
        const la = saRaw * layer.opacity;
        if (la <= 1e-6) continue;
        ar = sr * la + ar * (1 - la);
        ag = sg * la + ag * (1 - la);
        ab = sb * la + ab * (1 - la);
        aa = la + aa * (1 - la);
      }

      if (aa > 1e-6) {
        outData[j + 0] = Math.round((ar / aa) * 255);
        outData[j + 1] = Math.round((ag / aa) * 255);
        outData[j + 2] = Math.round((ab / aa) * 255);
        outData[j + 3] = Math.round(aa * 255);
      } else {
        outData[j + 0] = 0;
        outData[j + 1] = 0;
        outData[j + 2] = 0;
        outData[j + 3] = 0;
      }
    }
    return out;
  }
}
