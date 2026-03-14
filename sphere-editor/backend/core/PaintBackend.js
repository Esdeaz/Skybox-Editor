import * as THREE from "three";

export class PaintBackend {
  constructor(options) {
    this.sphereRadius = options.sphereRadius;
    this.getImageData = options.getImageData;
    this.getWidth = options.getWidth;
    this.getHeight = options.getHeight;
    this.getStampAnchor = options.getStampAnchor;
    this.getStampSource = options.getStampSource;

    this.lonSinCache = null;
    this.lonCosCache = null;
    this.lonCacheWidth = 0;
    this.stampSrcScratch = null;
    this.stampDstTmp = new THREE.Vector3();
    this.stampSrcTmp = new THREE.Vector3();
  }

  wrapU(u) {
    return ((u % 1) + 1) % 1;
  }

  clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  uvToDir(uv) {
    const lon = uv.x * Math.PI * 2 - Math.PI;
    const lat = uv.y * Math.PI - Math.PI * 0.5;
    const cl = Math.cos(lat);
    return new THREE.Vector3(
      Math.cos(lon) * cl,
      Math.sin(lat),
      Math.sin(lon) * cl
    );
  }

  dirToUv(dir) {
    const d = dir.clone().normalize();
    const lon = Math.atan2(d.z, d.x);
    const lat = Math.asin(Math.max(-1, Math.min(1, d.y)));
    return {
      x: this.wrapU((lon + Math.PI) / (Math.PI * 2)),
      y: this.clamp01((lat + Math.PI * 0.5) / Math.PI)
    };
  }

  buildTangentBasis(centerDir) {
    const c = centerDir.clone().normalize();
    const ref = Math.abs(c.y) > 0.99 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const east = new THREE.Vector3().crossVectors(ref, c).normalize();
    const north = new THREE.Vector3().crossVectors(c, east).normalize();
    return { c, east, north };
  }

  offsetOnSphere(basis, tx, ty) {
    const tangent = basis.east.clone().multiplyScalar(tx).add(basis.north.clone().multiplyScalar(ty));
    const theta = tangent.length();
    if (theta < 1e-8) return basis.c.clone();
    return basis.c
      .clone()
      .multiplyScalar(Math.cos(theta))
      .add(tangent.multiplyScalar(Math.sin(theta) / theta))
      .normalize();
  }

  dirToUvXYZ(x, y, z) {
    const lon = Math.atan2(z, x);
    const lat = Math.asin(Math.max(-1, Math.min(1, y)));
    return {
      x: this.wrapU((lon + Math.PI) / (Math.PI * 2)),
      y: this.clamp01((lat + Math.PI * 0.5) / Math.PI)
    };
  }

  offsetOnSphereFast(basis, tx, ty, out) {
    const ex = basis.east.x;
    const ey = basis.east.y;
    const ez = basis.east.z;
    const nx = basis.north.x;
    const ny = basis.north.y;
    const nz = basis.north.z;
    const cx = basis.c.x;
    const cy = basis.c.y;
    const cz = basis.c.z;

    const tangentX = ex * tx + nx * ty;
    const tangentY = ey * tx + ny * ty;
    const tangentZ = ez * tx + nz * ty;
    const theta = Math.sqrt(tangentX * tangentX + tangentY * tangentY + tangentZ * tangentZ);

    if (theta < 1e-8) {
      out.set(cx, cy, cz);
      return out;
    }

    const cosT = Math.cos(theta);
    const sinT_over_t = Math.sin(theta) / theta;
    out.set(
      cx * cosT + tangentX * sinT_over_t,
      cy * cosT + tangentY * sinT_over_t,
      cz * cosT + tangentZ * sinT_over_t
    );
    return out.normalize();
  }

  ensureLongitudeCache(width) {
    if (this.lonCacheWidth === width && this.lonSinCache && this.lonCosCache) return;
    this.lonCacheWidth = width;
    this.lonSinCache = new Float32Array(width);
    this.lonCosCache = new Float32Array(width);
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width;
      const lon = u * Math.PI * 2 - Math.PI;
      this.lonSinCache[x] = Math.sin(lon);
      this.lonCosCache[x] = Math.cos(lon);
    }
  }

  sampleBilinearRGBA(data, w, h, u, v) {
    const fu = Math.max(0, Math.min(1, u));
    const fv = Math.max(0, Math.min(1, v));

    const fx = fu * (w - 1);
    const fy = fv * (h - 1);

    const x0 = Math.max(0, Math.min(w - 1, Math.floor(fx)));
    const y0 = Math.max(0, Math.min(h - 1, Math.floor(fy)));
    const x1 = Math.max(0, Math.min(w - 1, x0 + 1));
    const y1 = Math.max(0, Math.min(h - 1, y0 + 1));

    const tx = fx - x0;
    const ty = fy - y0;

    const i00 = (y0 * w + x0) * 4;
    const i10 = (y0 * w + x1) * 4;
    const i01 = (y1 * w + x0) * 4;
    const i11 = (y1 * w + x1) * 4;

    const w00 = (1 - tx) * (1 - ty);
    const w10 = tx * (1 - ty);
    const w01 = (1 - tx) * ty;
    const w11 = tx * ty;

    return [
      data[i00 + 0] * w00 + data[i10 + 0] * w10 + data[i01 + 0] * w01 + data[i11 + 0] * w11,
      data[i00 + 1] * w00 + data[i10 + 1] * w10 + data[i01 + 1] * w01 + data[i11 + 1] * w11,
      data[i00 + 2] * w00 + data[i10 + 2] * w10 + data[i01 + 2] * w01 + data[i11 + 2] * w11,
      data[i00 + 3] * w00 + data[i10 + 3] * w10 + data[i01 + 3] * w01 + data[i11 + 3] * w11
    ];
  }

  sampleBilinearRGB(data, w, h, u, v) {
    const fx = this.wrapU(u) * w;
    const fy = (1 - this.clamp01(v)) * h;

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

    return [
      data[i00 + 0] * w00 + data[i10 + 0] * w10 + data[i01 + 0] * w01 + data[i11 + 0] * w11,
      data[i00 + 1] * w00 + data[i10 + 1] * w10 + data[i01 + 1] * w01 + data[i11 + 1] * w11,
      data[i00 + 2] * w00 + data[i10 + 2] * w10 + data[i01 + 2] * w01 + data[i11 + 2] * w11
    ];
  }

  sampleNearestRGB(data, w, h, u, v) {
    const x = ((Math.floor(this.wrapU(u) * w) % w) + w) % w;
    const y = Math.max(0, Math.min(h - 1, Math.floor((1 - this.clamp01(v)) * h)));
    const i = (y * w + x) * 4;
    return [data[i + 0], data[i + 1], data[i + 2]];
  }

  sampleBilinearRGBAOnMap(data, w, h, u, v) {
    const fx = this.wrapU(u) * w;
    const fy = (1 - this.clamp01(v)) * h;

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

    return [
      data[i00 + 0] * w00 + data[i10 + 0] * w10 + data[i01 + 0] * w01 + data[i11 + 0] * w11,
      data[i00 + 1] * w00 + data[i10 + 1] * w10 + data[i01 + 1] * w01 + data[i11 + 1] * w11,
      data[i00 + 2] * w00 + data[i10 + 2] * w10 + data[i01 + 2] * w01 + data[i11 + 2] * w11,
      data[i00 + 3] * w00 + data[i10 + 3] * w10 + data[i01 + 3] * w01 + data[i11 + 3] * w11
    ];
  }

  sampleNearestRGBAOnMap(data, w, h, u, v) {
    const x = ((Math.floor(this.wrapU(u) * w) % w) + w) % w;
    const y = Math.max(0, Math.min(h - 1, Math.floor((1 - this.clamp01(v)) * h)));
    const i = (y * w + x) * 4;
    return [data[i + 0], data[i + 1], data[i + 2], data[i + 3]];
  }

  getPolarSamplingStep(cosLat, segLen, options) {
    if (!options || !options.polarSafeEnabled) return 1;
    const maxSamples = Math.max(16, options.polarRowSamples | 0);
    const absCos = Math.abs(cosLat);
    if (absCos >= 0.35) return 1;
    const poleT = (0.35 - absCos) / 0.35;
    const effectiveSamples = Math.max(16, Math.floor(maxSamples * (1 - poleT * 0.75)));
    return Math.max(1, Math.ceil(segLen / effectiveSamples));
  }

  forEachProjectedBrushPixel(uv, sizePx, strength, softness, callback, options = null) {
    const imageData = this.getImageData();
    if (!imageData) return;

    const w = this.getWidth();
    const h = this.getHeight();
    this.ensureLongitudeCache(w);

    const radius = sizePx * 0.5;
    const thetaRadius = Math.max(Math.PI / h, radius * (Math.PI / h));
    const cosRadius = Math.cos(thetaRadius);

    const centerDir = this.uvToDir(uv);
    const basis = this.buildTangentBasis(centerDir);

    const lat0 = uv.y * Math.PI - Math.PI * 0.5;
    const lon0 = uv.x * Math.PI * 2 - Math.PI;
    const sinLat0 = Math.sin(lat0);
    const cosLat0 = Math.cos(lat0);
    const latTop = Math.min(Math.PI * 0.5, lat0 + thetaRadius);
    const latBottom = Math.max(-Math.PI * 0.5, lat0 - thetaRadius);

    let yMin = Math.floor((1 - ((latTop + Math.PI * 0.5) / Math.PI)) * h) - 1;
    let yMax = Math.ceil((1 - ((latBottom + Math.PI * 0.5) / Math.PI)) * h) + 1;
    yMin = Math.max(0, Math.min(h - 1, yMin));
    yMax = Math.max(0, Math.min(h - 1, yMax));

    const falloffExp = Math.max(0.05, 2 - softness * 1.8);

    for (let y = yMin; y <= yMax; y++) {
      const v = 1 - (y + 0.5) / h;
      const lat = v * Math.PI - Math.PI * 0.5;
      const sinLat = Math.sin(lat);
      const cosLat = Math.cos(lat);

      let segments = [[0, w - 1]];
      const den = cosLat0 * cosLat;
      const num = cosRadius - sinLat0 * sinLat;

      if (Math.abs(den) <= 1e-8) {
        if (num > 0) continue;
      } else {
        const c = num / den;
        if (c >= 1) continue;
        if (c > -1) {
          const dlon = Math.acos(Math.max(-1, Math.min(1, c)));
          const uMin = this.wrapU((lon0 - dlon + Math.PI) / (Math.PI * 2));
          const uMax = this.wrapU((lon0 + dlon + Math.PI) / (Math.PI * 2));
          const xMin = Math.max(0, Math.min(w - 1, Math.floor(uMin * w)));
          const xMax = Math.max(0, Math.min(w - 1, Math.floor(uMax * w)));
          segments = uMin <= uMax ? [[xMin, xMax]] : [[0, xMax], [xMin, w - 1]];
        }
      }

      for (const seg of segments) {
        const segLen = seg[1] - seg[0] + 1;
        const xStep = this.getPolarSamplingStep(cosLat, segLen, options);
        for (let xFrom = seg[0]; xFrom <= seg[1]; xFrom += xStep) {
          const xTo = Math.min(seg[1], xFrom + xStep - 1);
          const xSample = (xFrom + xTo) >> 1;
          const dx = this.lonCosCache[xSample] * cosLat;
          const dy = sinLat;
          const dz = this.lonSinCache[xSample] * cosLat;

          const dot = dx * basis.c.x + dy * basis.c.y + dz * basis.c.z;
          if (dot < cosRadius) continue;

          const theta = Math.acos(Math.max(-1, Math.min(1, dot)));
          const dist = theta / thetaRadius;
          if (dist > 1) continue;

          const falloff = 1 - Math.pow(dist, falloffExp);
          const alpha = Math.max(0, Math.min(1, strength * falloff));
          if (alpha <= 0) continue;

          let tx = 0;
          let ty = 0;
          if (theta > 1e-8) {
            const px = dx - basis.c.x * dot;
            const py = dy - basis.c.y * dot;
            const pz = dz - basis.c.z * dot;
            const plen = Math.sqrt(px * px + py * py + pz * pz);
            if (plen > 1e-8) {
              const inv = 1 / plen;
              const ax = px * inv;
              const ay = py * inv;
              const az = pz * inv;
              tx = theta * (ax * basis.east.x + ay * basis.east.y + az * basis.east.z);
              ty = theta * (ax * basis.north.x + ay * basis.north.y + az * basis.north.z);
            }
          }

          callback({ x: xSample, y, alpha, tx, ty, thetaRadius, basis, xFrom, xTo });
        }
      }
    }
  }

  sampleStampTriplanarColor(dstDir, dstBasis, srcBasis, thetaRadius, srcPixels, sharpSampling = false) {
    const localX = dstDir.dot(dstBasis.east);
    const localY = dstDir.dot(dstBasis.north);
    const localZ = dstDir.dot(dstBasis.c);

    const wx = Math.pow(Math.abs(localX), 3.0);
    const wy = Math.pow(Math.abs(localY), 3.0);
    const wz = Math.pow(Math.abs(localZ), 3.0);
    if (wx + wy + wz < 1e-6) return null;

    const scale = 0.5 / Math.max(1e-6, Math.sin(thetaRadius));
    const uvx = { x: 0.5 + localZ * scale, y: 0.5 + localY * scale };
    const uvy = { x: 0.5 + localX * scale, y: 0.5 + localZ * scale };
    const uvz = { x: 0.5 + localX * scale, y: 0.5 + localY * scale };

    const samples = [];
    const weights = [];
    const pushPlane = (w, puv) => {
      if (w <= 0) return;
      if (puv.x < 0 || puv.x > 1 || puv.y < 0 || puv.y > 1) return;
      const tx = (puv.x - 0.5) * (thetaRadius * 2);
      const ty = (puv.y - 0.5) * (thetaRadius * 2);
      const sDir = this.offsetOnSphere(srcBasis, tx, ty);
      const sUv = this.dirToUv(sDir);
      const sample = sharpSampling
        ? this.sampleNearestRGB(srcPixels, this.getWidth(), this.getHeight(), sUv.x, sUv.y)
        : this.sampleBilinearRGB(srcPixels, this.getWidth(), this.getHeight(), sUv.x, sUv.y);
      samples.push(sample);
      weights.push(w);
    };

    pushPlane(wx, uvx);
    pushPlane(wy, uvy);
    pushPlane(wz, uvz);
    if (samples.length === 0) return null;

    let r = 0;
    let g = 0;
    let b = 0;
    let tw = 0;
    for (let i = 0; i < samples.length; i++) {
      const w = weights[i];
      tw += w;
      r += samples[i][0] * w;
      g += samples[i][1] * w;
      b += samples[i][2] * w;
    }
    if (tw < 1e-6) return null;
    return [r / tw, g / tw, b / tw];
  }

  sampleProjectedMapRGBA(data, w, h, uv, sharpSampling = false) {
    return sharpSampling
      ? this.sampleNearestRGBAOnMap(data, w, h, uv.x, uv.y)
      : this.sampleBilinearRGBAOnMap(data, w, h, uv.x, uv.y);
  }

  sampleLocalMeanAroundOffset(data, w, h, basis, tx, ty, thetaRadius, sharpSampling = false) {
    const r = Math.max(thetaRadius * 0.34, Math.PI / Math.max(2, h));
    const taps = [
      [0, 0],
      [r, 0],
      [-r, 0],
      [0, r],
      [0, -r],
      [r * 0.7, r * 0.7],
      [r * 0.7, -r * 0.7],
      [-r * 0.7, r * 0.7],
      [-r * 0.7, -r * 0.7]
    ];
    const tmp = this.stampSrcTmp;
    let rr = 0;
    let gg = 0;
    let bb = 0;
    let aa = 0;
    let count = 0;
    for (let i = 0; i < taps.length; i++) {
      this.offsetOnSphereFast(basis, tx + taps[i][0], ty + taps[i][1], tmp);
      const uv = this.dirToUvXYZ(tmp.x, tmp.y, tmp.z);
      const c = this.sampleProjectedMapRGBA(data, w, h, uv, sharpSampling);
      rr += c[0];
      gg += c[1];
      bb += c[2];
      aa += c[3];
      count++;
    }
    if (count <= 0) return [0, 0, 0, 0];
    return [rr / count, gg / count, bb / count, aa / count];
  }

  applyStampProjected(uv, sizePx, strength, softness, smooth01, useTriplanar = false, options = null, blendMode = "blend", sharpSampling = false) {
    const stampAnchor = this.getStampAnchor();
    const stampSource = this.getStampSource();
    const imageData = this.getImageData();
    if (!stampAnchor || !stampSource || !imageData) return;

    const w = this.getWidth();
    const h = this.getHeight();
    this.ensureLongitudeCache(w);

    const radius = sizePx * 0.5;
    const thetaRadius = Math.max(Math.PI / h, radius * (Math.PI / h));
    const cosRadius = Math.cos(thetaRadius);

    const dstCenterDir = this.uvToDir(uv);
    const anchorDir = this.uvToDir(stampAnchor);
    const sourceDir = this.uvToDir(stampSource);

    const rot = new THREE.Quaternion().setFromUnitVectors(anchorDir.clone().normalize(), dstCenterDir.clone().normalize());
    const srcCenterDir = sourceDir.clone().applyQuaternion(rot).normalize();

    const dstBasis = this.buildTangentBasis(dstCenterDir);
    const srcBasis = this.buildTangentBasis(srcCenterDir);

    const data = imageData.data;
    if (!this.stampSrcScratch || this.stampSrcScratch.length !== data.length) {
      this.stampSrcScratch = new Uint8ClampedArray(data.length);
    }
    this.stampSrcScratch.set(data);
    const srcPixels = this.stampSrcScratch;
    const dstTmp = this.stampDstTmp;
    const srcTmp = this.stampSrcTmp;

    const lat0 = uv.y * Math.PI - Math.PI * 0.5;
    const lon0 = uv.x * Math.PI * 2 - Math.PI;
    const sinLat0 = Math.sin(lat0);
    const cosLat0 = Math.cos(lat0);
    const latTop = Math.min(Math.PI * 0.5, lat0 + thetaRadius);
    const latBottom = Math.max(-Math.PI * 0.5, lat0 - thetaRadius);
    let yMin = Math.floor((1 - ((latTop + Math.PI * 0.5) / Math.PI)) * h) - 1;
    let yMax = Math.ceil((1 - ((latBottom + Math.PI * 0.5) / Math.PI)) * h) + 1;
    yMin = Math.max(0, Math.min(h - 1, yMin));
    yMax = Math.max(0, Math.min(h - 1, yMax));

    const falloffExp = Math.max(0.05, 2 - softness * 1.8);
    const smoothBlur = sharpSampling ? 0 : (smooth01 * (Math.PI / h) * 1.25);

    for (let y = yMin; y <= yMax; y++) {
      const v = 1 - (y + 0.5) / h;
      const lat = v * Math.PI - Math.PI * 0.5;
      const sinLat = Math.sin(lat);
      const cosLat = Math.cos(lat);

      let segments = [[0, w - 1]];
      const den = cosLat0 * cosLat;
      const num = cosRadius - sinLat0 * sinLat;
      if (Math.abs(den) <= 1e-8) {
        if (num > 0) continue;
      } else {
        const c = num / den;
        if (c >= 1) continue;
        if (c > -1) {
          const dlon = Math.acos(Math.max(-1, Math.min(1, c)));
          const uMin = this.wrapU((lon0 - dlon + Math.PI) / (Math.PI * 2));
          const uMax = this.wrapU((lon0 + dlon + Math.PI) / (Math.PI * 2));
          const xMin = Math.max(0, Math.min(w - 1, Math.floor(uMin * w)));
          const xMax = Math.max(0, Math.min(w - 1, Math.floor(uMax * w)));
          segments = uMin <= uMax ? [[xMin, xMax]] : [[0, xMax], [xMin, w - 1]];
        }
      }

      for (const seg of segments) {
        const segLen = seg[1] - seg[0] + 1;
        const xStep = this.getPolarSamplingStep(cosLat, segLen, options);
        for (let xFrom = seg[0]; xFrom <= seg[1]; xFrom += xStep) {
          const xTo = Math.min(seg[1], xFrom + xStep - 1);
          const xSample = (xFrom + xTo) >> 1;
          const dx = this.lonCosCache[xSample] * cosLat;
          const dy = sinLat;
          const dz = this.lonSinCache[xSample] * cosLat;

          const dot = dx * dstBasis.c.x + dy * dstBasis.c.y + dz * dstBasis.c.z;
          if (dot < cosRadius) continue;

          const theta = Math.acos(Math.max(-1, Math.min(1, dot)));
          const dist = theta / thetaRadius;
          if (dist > 1) continue;

          const falloff = 1 - Math.pow(dist, falloffExp);
          const alpha = Math.max(0, Math.min(1, strength * falloff));
          if (alpha <= 0) continue;

          dstTmp.set(dx, dy, dz);
          let sampled;
          let sampledA = 1;
          if (useTriplanar) {
            sampled = this.sampleStampTriplanarColor(dstTmp, dstBasis, srcBasis, thetaRadius, srcPixels, sharpSampling);
            if (!sampled) continue;
            sampledA = 1;
          } else {
            let tx = 0;
            let ty = 0;
            if (theta > 1e-8) {
              const px = dx - dstBasis.c.x * dot;
              const py = dy - dstBasis.c.y * dot;
              const pz = dz - dstBasis.c.z * dot;
              const plen = Math.sqrt(px * px + py * py + pz * pz);
              if (plen > 1e-8) {
                const inv = 1 / plen;
                const ax = px * inv;
                const ay = py * inv;
                const az = pz * inv;
                tx = theta * (ax * dstBasis.east.x + ay * dstBasis.east.y + az * dstBasis.east.z);
                ty = theta * (ax * dstBasis.north.x + ay * dstBasis.north.y + az * dstBasis.north.z);
              }
            }

            this.offsetOnSphereFast(srcBasis, tx, ty, srcTmp);
            const uv0 = this.dirToUvXYZ(srcTmp.x, srcTmp.y, srcTmp.z);
            let c0 = sharpSampling
              ? this.sampleNearestRGBAOnMap(srcPixels, w, h, uv0.x, uv0.y)
              : this.sampleBilinearRGBAOnMap(srcPixels, w, h, uv0.x, uv0.y);
            if (smoothBlur > 1e-7) {
              this.offsetOnSphereFast(srcBasis, tx + smoothBlur, ty, srcTmp);
              const uv1 = this.dirToUvXYZ(srcTmp.x, srcTmp.y, srcTmp.z);
              const c1 = this.sampleBilinearRGBAOnMap(srcPixels, w, h, uv1.x, uv1.y);

              this.offsetOnSphereFast(srcBasis, tx - smoothBlur, ty, srcTmp);
              const uv2 = this.dirToUvXYZ(srcTmp.x, srcTmp.y, srcTmp.z);
              const c2 = this.sampleBilinearRGBAOnMap(srcPixels, w, h, uv2.x, uv2.y);

              c0 = [
                (c0[0] + c1[0] + c2[0]) / 3,
                (c0[1] + c1[1] + c2[1]) / 3,
                (c0[2] + c1[2] + c2[2]) / 3,
                (c0[3] + c1[3] + c2[3]) / 3
              ];
            }
            sampled = c0;
            sampledA = (c0[3] || 0) / 255;
          }

          for (let xi = xFrom; xi <= xTo; xi++) {
            if (options && options.isPixelSelected && !options.isPixelSelected(xi, y)) continue;
            const i = (y * w + xi) * 4;
            const dr = data[i + 0] / 255;
            const dg = data[i + 1] / 255;
            const db = data[i + 2] / 255;
            const da = data[i + 3] / 255;
            const sr = sampled[0] / 255;
            const sg = sampled[1] / 255;
            const sb = sampled[2] / 255;
            const srcA = Math.max(0, Math.min(1, sampledA));
            if (blendMode === "replace") {
              const mix = Math.max(0, Math.min(1, alpha));
              const outA = da + (srcA - da) * mix;
              const outR = dr + (sr - dr) * mix;
              const outG = dg + (sg - dg) * mix;
              const outB = db + (sb - db) * mix;
              data[i + 0] = Math.round(outR * 255);
              data[i + 1] = Math.round(outG * 255);
              data[i + 2] = Math.round(outB * 255);
              data[i + 3] = Math.round(outA * 255);
              continue;
            }
            const sa = alpha * srcA;
            const oa = sa + da * (1 - sa);
            if (oa <= 1e-6) continue;
            const opr = sr * sa + dr * da * (1 - sa);
            const opg = sg * sa + dg * da * (1 - sa);
            const opb = sb * sa + db * da * (1 - sa);
            data[i + 0] = Math.round((opr / oa) * 255);
            data[i + 1] = Math.round((opg / oa) * 255);
            data[i + 2] = Math.round((opb / oa) * 255);
            data[i + 3] = Math.round(oa * 255);
          }
        }
      }
    }
  }

  applyHealingProjected(uv, sizePx, strength, softness, smooth01, useTriplanar = false, options = null, sharpSampling = false) {
    const stampAnchor = this.getStampAnchor();
    const stampSource = this.getStampSource();
    const imageData = this.getImageData();
    if (!stampAnchor || !stampSource || !imageData) return;

    const w = this.getWidth();
    const h = this.getHeight();
    this.ensureLongitudeCache(w);

    const radius = sizePx * 0.5;
    const thetaRadius = Math.max(Math.PI / h, radius * (Math.PI / h));
    const cosRadius = Math.cos(thetaRadius);

    const dstCenterDir = this.uvToDir(uv);
    const anchorDir = this.uvToDir(stampAnchor);
    const sourceDir = this.uvToDir(stampSource);

    const rot = new THREE.Quaternion().setFromUnitVectors(anchorDir.clone().normalize(), dstCenterDir.clone().normalize());
    const srcCenterDir = sourceDir.clone().applyQuaternion(rot).normalize();

    const dstBasis = this.buildTangentBasis(dstCenterDir);
    const srcBasis = this.buildTangentBasis(srcCenterDir);

    const data = imageData.data;
    if (!this.stampSrcScratch || this.stampSrcScratch.length !== data.length) {
      this.stampSrcScratch = new Uint8ClampedArray(data.length);
    }
    this.stampSrcScratch.set(data);
    const srcPixels = this.stampSrcScratch;
    const dstTmp = this.stampDstTmp;
    const srcTmp = this.stampSrcTmp;
    const lat0 = uv.y * Math.PI - Math.PI * 0.5;
    const lon0 = uv.x * Math.PI * 2 - Math.PI;
    const sinLat0 = Math.sin(lat0);
    const cosLat0 = Math.cos(lat0);
    const latTop = Math.min(Math.PI * 0.5, lat0 + thetaRadius);
    const latBottom = Math.max(-Math.PI * 0.5, lat0 - thetaRadius);
    let yMin = Math.floor((1 - ((latTop + Math.PI * 0.5) / Math.PI)) * h) - 1;
    let yMax = Math.ceil((1 - ((latBottom + Math.PI * 0.5) / Math.PI)) * h) + 1;
    yMin = Math.max(0, Math.min(h - 1, yMin));
    yMax = Math.max(0, Math.min(h - 1, yMax));

    const falloffExp = Math.max(0.05, 2 - softness * 1.8);
    const smoothBlur = sharpSampling ? 0 : (smooth01 * (Math.PI / h) * 1.25);

    for (let y = yMin; y <= yMax; y++) {
      const v = 1 - (y + 0.5) / h;
      const lat = v * Math.PI - Math.PI * 0.5;
      const sinLat = Math.sin(lat);
      const cosLat = Math.cos(lat);

      let segments = [[0, w - 1]];
      const den = cosLat0 * cosLat;
      const num = cosRadius - sinLat0 * sinLat;
      if (Math.abs(den) <= 1e-8) {
        if (num > 0) continue;
      } else {
        const c = num / den;
        if (c >= 1) continue;
        if (c > -1) {
          const dlon = Math.acos(Math.max(-1, Math.min(1, c)));
          const uMin = this.wrapU((lon0 - dlon + Math.PI) / (Math.PI * 2));
          const uMax = this.wrapU((lon0 + dlon + Math.PI) / (Math.PI * 2));
          const xMin = Math.max(0, Math.min(w - 1, Math.floor(uMin * w)));
          const xMax = Math.max(0, Math.min(w - 1, Math.floor(uMax * w)));
          segments = uMin <= uMax ? [[xMin, xMax]] : [[0, xMax], [xMin, w - 1]];
        }
      }

      for (const seg of segments) {
        const segLen = seg[1] - seg[0] + 1;
        const xStep = this.getPolarSamplingStep(cosLat, segLen, options);
        for (let xFrom = seg[0]; xFrom <= seg[1]; xFrom += xStep) {
          const xTo = Math.min(seg[1], xFrom + xStep - 1);
          const xSample = (xFrom + xTo) >> 1;
          const dx = this.lonCosCache[xSample] * cosLat;
          const dy = sinLat;
          const dz = this.lonSinCache[xSample] * cosLat;

          const dot = dx * dstBasis.c.x + dy * dstBasis.c.y + dz * dstBasis.c.z;
          if (dot < cosRadius) continue;

          const theta = Math.acos(Math.max(-1, Math.min(1, dot)));
          const dist = theta / thetaRadius;
          if (dist > 1) continue;

          const falloff = 1 - Math.pow(dist, falloffExp);
          const alpha = Math.max(0, Math.min(1, strength * falloff));
          if (alpha <= 0) continue;

          dstTmp.set(dx, dy, dz);
          let tx = 0;
          let ty = 0;
          if (theta > 1e-8) {
            const px = dx - dstBasis.c.x * dot;
            const py = dy - dstBasis.c.y * dot;
            const pz = dz - dstBasis.c.z * dot;
            const plen = Math.sqrt(px * px + py * py + pz * pz);
            if (plen > 1e-8) {
              const inv = 1 / plen;
              const ax = px * inv;
              const ay = py * inv;
              const az = pz * inv;
              tx = theta * (ax * dstBasis.east.x + ay * dstBasis.east.y + az * dstBasis.east.z);
              ty = theta * (ax * dstBasis.north.x + ay * dstBasis.north.y + az * dstBasis.north.z);
            }
          }
          let sampled;
          let sampledA = 1;
          if (useTriplanar) {
            sampled = this.sampleStampTriplanarColor(dstTmp, dstBasis, srcBasis, thetaRadius, srcPixels, sharpSampling);
            if (!sampled) continue;
            sampledA = 1;
          } else {
            this.offsetOnSphereFast(srcBasis, tx, ty, srcTmp);
            const uv0 = this.dirToUvXYZ(srcTmp.x, srcTmp.y, srcTmp.z);
            let c0 = this.sampleProjectedMapRGBA(srcPixels, w, h, uv0, sharpSampling);
            if (smoothBlur > 1e-7) {
              this.offsetOnSphereFast(srcBasis, tx + smoothBlur, ty, srcTmp);
              const uv1 = this.dirToUvXYZ(srcTmp.x, srcTmp.y, srcTmp.z);
              const c1 = this.sampleBilinearRGBAOnMap(srcPixels, w, h, uv1.x, uv1.y);

              this.offsetOnSphereFast(srcBasis, tx - smoothBlur, ty, srcTmp);
              const uv2 = this.dirToUvXYZ(srcTmp.x, srcTmp.y, srcTmp.z);
              const c2 = this.sampleBilinearRGBAOnMap(srcPixels, w, h, uv2.x, uv2.y);

              c0 = [
                (c0[0] + c1[0] + c2[0]) / 3,
                (c0[1] + c1[1] + c2[1]) / 3,
                (c0[2] + c1[2] + c2[2]) / 3,
                (c0[3] + c1[3] + c2[3]) / 3
              ];
            }
            sampled = c0;
            sampledA = (c0[3] || 0) / 255;
          }

          const srcMean = this.sampleLocalMeanAroundOffset(srcPixels, w, h, srcBasis, tx, ty, thetaRadius, sharpSampling);
          const dstMean = this.sampleLocalMeanAroundOffset(srcPixels, w, h, dstBasis, tx, ty, thetaRadius, sharpSampling);

          for (let xi = xFrom; xi <= xTo; xi++) {
            if (options && options.isPixelSelected && !options.isPixelSelected(xi, y)) continue;
            const i = (y * w + xi) * 4;
            const dr = data[i + 0] / 255;
            const dg = data[i + 1] / 255;
            const db = data[i + 2] / 255;
            const da = data[i + 3] / 255;
            const detailR = sampled[0] - srcMean[0];
            const detailG = sampled[1] - srcMean[1];
            const detailB = sampled[2] - srcMean[2];

            // Robust anti-speckle: cap negative/positive detail separately
            // and protect against pepper-noise dips below local destination tone.
            const baseR = dstMean[0];
            const baseG = dstMean[1];
            const baseB = dstMean[2];
            const curR = dr * 255;
            const curG = dg * 255;
            const curB = db * 255;

            const negCapR = Math.max(4, 6 + baseR * 0.10);
            const negCapG = Math.max(4, 6 + baseG * 0.10);
            const negCapB = Math.max(4, 6 + baseB * 0.10);
            const posCapR = Math.max(14, 10 + (255 - baseR) * 0.22);
            const posCapG = Math.max(14, 10 + (255 - baseG) * 0.22);
            const posCapB = Math.max(14, 10 + (255 - baseB) * 0.22);

            let dR = Math.max(-negCapR, Math.min(posCapR, detailR));
            let dG = Math.max(-negCapG, Math.min(posCapG, detailG));
            let dB = Math.max(-negCapB, Math.min(posCapB, detailB));
            // Keep only positive detail transfer for healing.
            // This avoids dark halos/pepper artifacts around bright stars.
            dR = Math.max(0, dR);
            dG = Math.max(0, dG);
            dB = Math.max(0, dB);

            let healR = baseR + dR;
            let healG = baseG + dG;
            let healB = baseB + dB;

            const floorR = Math.max(0, Math.min(baseR, curR) - 5);
            const floorG = Math.max(0, Math.min(baseG, curG) - 5);
            const floorB = Math.max(0, Math.min(baseB, curB) - 5);
            healR = Math.max(floorR, healR);
            healG = Math.max(floorG, healG);
            healB = Math.max(floorB, healB);

            // Extra guard for pepper noise in healing zones:
            // do not allow abrupt luminance drops far below both current
            // destination pixel and local destination neighborhood.
            const curL = curR * 0.2126 + curG * 0.7152 + curB * 0.0722;
            const baseL = baseR * 0.2126 + baseG * 0.7152 + baseB * 0.0722;
            const healL = healR * 0.2126 + healG * 0.7152 + healB * 0.0722;
            const minAllowedL = Math.max(2, Math.min(curL, baseL) * 0.84);
            if (healL < minAllowedL) {
              const scale = minAllowedL / Math.max(1e-5, healL);
              healR = Math.min(255, healR * scale);
              healG = Math.min(255, healG * scale);
              healB = Math.min(255, healB * scale);
            }

            const sr = Math.max(0, Math.min(1, healR / 255));
            const sg = Math.max(0, Math.min(1, healG / 255));
            const sb = Math.max(0, Math.min(1, healB / 255));
            const srcA = Math.max(0, Math.min(1, sampledA));
            const sa = alpha * srcA;
            const oa = sa + da * (1 - sa);
            if (oa <= 1e-6) continue;
            const opr = sr * sa + dr * da * (1 - sa);
            const opg = sg * sa + dg * da * (1 - sa);
            const opb = sb * sa + db * da * (1 - sa);
            data[i + 0] = Math.round((opr / oa) * 255);
            data[i + 1] = Math.round((opg / oa) * 255);
            data[i + 2] = Math.round((opb / oa) * 255);
            data[i + 3] = Math.round(oa * 255);
          }
        }
      }
    }
  }
}
