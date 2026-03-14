function sampleRatioMapBilinear(ratioMap, mapW, mapH, fx, fy, out3) {
  let x0 = Math.floor(fx);
  let y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;

  x0 = ((x0 % mapW) + mapW) % mapW;
  y0 = Math.max(0, Math.min(mapH - 1, y0));

  const x1 = (x0 + 1) % mapW;
  const y1 = Math.max(0, Math.min(mapH - 1, y0 + 1));

  const i00 = (y0 * mapW + x0) * 3;
  const i10 = (y0 * mapW + x1) * 3;
  const i01 = (y1 * mapW + x0) * 3;
  const i11 = (y1 * mapW + x1) * 3;

  const w00 = (1 - tx) * (1 - ty);
  const w10 = tx * (1 - ty);
  const w01 = (1 - tx) * ty;
  const w11 = tx * ty;

  out3[0] = ratioMap[i00 + 0] * w00 + ratioMap[i10 + 0] * w10 + ratioMap[i01 + 0] * w01 + ratioMap[i11 + 0] * w11;
  out3[1] = ratioMap[i00 + 1] * w00 + ratioMap[i10 + 1] * w10 + ratioMap[i01 + 1] * w01 + ratioMap[i11 + 1] * w11;
  out3[2] = ratioMap[i00 + 2] * w00 + ratioMap[i10 + 2] * w10 + ratioMap[i01 + 2] * w01 + ratioMap[i11 + 2] * w11;
}

function sampleScalarMapBilinear(map, mapW, mapH, fx, fy) {
  let x0 = Math.floor(fx);
  let y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;

  x0 = ((x0 % mapW) + mapW) % mapW;
  y0 = Math.max(0, Math.min(mapH - 1, y0));

  const x1 = (x0 + 1) % mapW;
  const y1 = Math.max(0, Math.min(mapH - 1, y0 + 1));

  const i00 = y0 * mapW + x0;
  const i10 = y0 * mapW + x1;
  const i01 = y1 * mapW + x0;
  const i11 = y1 * mapW + x1;

  const w00 = (1 - tx) * (1 - ty);
  const w10 = tx * (1 - ty);
  const w01 = (1 - tx) * ty;
  const w11 = tx * ty;

  return map[i00] * w00 + map[i10] * w10 + map[i01] * w01 + map[i11] * w11;
}

function floatToRgbe(r, g, b, out4) {
  const v = Math.max(r, g, b);
  if (v < 1e-32 || !Number.isFinite(v)) {
    out4[0] = 0;
    out4[1] = 0;
    out4[2] = 0;
    out4[3] = 0;
    return;
  }

  const e = Math.floor(Math.log2(v)) + 1;
  const scale = 256 / Math.pow(2, e);
  out4[0] = Math.max(0, Math.min(255, Math.floor(r * scale)));
  out4[1] = Math.max(0, Math.min(255, Math.floor(g * scale)));
  out4[2] = Math.max(0, Math.min(255, Math.floor(b * scale)));
  out4[3] = Math.max(0, Math.min(255, e + 128));
}

function encodeRleChannel(channel, outBytes) {
  const n = channel.length;
  let i = 0;

  while (i < n) {
    let run = 1;
    while (i + run < n && run < 127 && channel[i + run] === channel[i]) run++;

    if (run >= 4) {
      outBytes.push(128 + run, channel[i]);
      i += run;
      continue;
    }

    const start = i;
    i += 1;

    while (i < n) {
      run = 1;
      while (i + run < n && run < 127 && channel[i + run] === channel[i]) run++;
      if (run >= 4) break;
      i += 1;
      if (i - start >= 128) break;
    }

    const len = i - start;
    outBytes.push(len);
    for (let k = start; k < i; k++) outBytes.push(channel[k]);
  }
}

function writeHdrRle(width, height, buildRowRgbe) {
  const enc = new TextEncoder();
  const header = `#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`;
  const parts = [enc.encode(header)];

  const row = new Uint8Array(width * 4);
  const cR = new Uint8Array(width);
  const cG = new Uint8Array(width);
  const cB = new Uint8Array(width);
  const cE = new Uint8Array(width);

  for (let y = 0; y < height; y++) {
    buildRowRgbe(y, row);

    for (let x = 0; x < width; x++) {
      const i4 = x * 4;
      cR[x] = row[i4 + 0];
      cG[x] = row[i4 + 1];
      cB[x] = row[i4 + 2];
      cE[x] = row[i4 + 3];
    }

    const bytes = [2, 2, (width >> 8) & 255, width & 255];
    encodeRleChannel(cR, bytes);
    encodeRleChannel(cG, bytes);
    encodeRleChannel(cB, bytes);
    encodeRleChannel(cE, bytes);
    parts.push(Uint8Array.from(bytes));
  }

  return new Blob(parts, { type: "application/octet-stream" });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function savePngFile({ editCanvas, baseName = "pano" }) {
  const fileName = `${baseName}_edited.png`;
  if (typeof editCanvas.toBlob === "function") {
    editCanvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, fileName);
    }, "image/png");
    return;
  }

  const a = document.createElement("a");
  a.href = editCanvas.toDataURL("image/png");
  a.download = fileName;
  a.click();
}

export async function saveHdrOriginalSizeFile(options) {
  const {
    loadedFromHdr,
    hdrOriginalFloat,
    baseImageData,
    imageData,
    mapWidth,
    mapHeight,
    hdrOriginalWidth,
    hdrOriginalHeight,
    baseName = "pano",
    srgbToLinear,
    setStatus
  } = options;

  if (!loadedFromHdr || !hdrOriginalFloat || !baseImageData || !imageData) {
    setStatus("HDR export unavailable: load an HDR source first.");
    return false;
  }

  setStatus("Preparing HDR export... this can take some time.");
  await new Promise((r) => setTimeout(r, 0));

  const ratioMap = new Float32Array(mapWidth * mapHeight * 3);
  const editedLinMap = new Float32Array(mapWidth * mapHeight * 3);
  const overrideMaskMap = new Float32Array(mapWidth * mapHeight);
  const eps = 1e-4;

  for (let i = 0, j = 0; i < mapWidth * mapHeight; i++, j += 4) {
    const bR = srgbToLinear(baseImageData[j + 0] / 255);
    const bG = srgbToLinear(baseImageData[j + 1] / 255);
    const bB = srgbToLinear(baseImageData[j + 2] / 255);

    const eR = srgbToLinear(imageData.data[j + 0] / 255);
    const eG = srgbToLinear(imageData.data[j + 1] / 255);
    const eB = srgbToLinear(imageData.data[j + 2] / 255);

    editedLinMap[i * 3 + 0] = eR;
    editedLinMap[i * 3 + 1] = eG;
    editedLinMap[i * 3 + 2] = eB;

    ratioMap[i * 3 + 0] = Math.max(0.02, Math.min(50, (eR + eps) / (bR + eps)));
    ratioMap[i * 3 + 1] = Math.max(0.02, Math.min(50, (eG + eps) / (bG + eps)));
    ratioMap[i * 3 + 2] = Math.max(0.02, Math.min(50, (eB + eps) / (bB + eps)));

    const d = Math.max(Math.abs(eR - bR), Math.abs(eG - bG), Math.abs(eB - bB));
    let m = 0;
    if (d >= 0.06) m = 1;
    else if (d > 0.02) m = (d - 0.02) / 0.04;
    overrideMaskMap[i] = m;
  }

  const tmp = [1, 1, 1];
  const editedTmp = [0, 0, 0];
  const rgbeTmp = new Uint8Array(4);
  const ow = hdrOriginalWidth;
  const oh = hdrOriginalHeight;

  const blob = writeHdrRle(ow, oh, (y, rowOut) => {
    const fy = ((y + 0.5) / oh) * mapHeight - 0.5;
    for (let x = 0; x < ow; x++) {
      const fx = ((x + 0.5) / ow) * mapWidth - 0.5;
      sampleRatioMapBilinear(ratioMap, mapWidth, mapHeight, fx, fy, tmp);
      sampleRatioMapBilinear(editedLinMap, mapWidth, mapHeight, fx, fy, editedTmp);
      const overrideMask = sampleScalarMapBilinear(overrideMaskMap, mapWidth, mapHeight, fx, fy);

      const oi = (y * ow + x) * 3;
      const ratioR = Math.max(0, hdrOriginalFloat[oi + 0] * tmp[0]);
      const ratioG = Math.max(0, hdrOriginalFloat[oi + 1] * tmp[1]);
      const ratioB = Math.max(0, hdrOriginalFloat[oi + 2] * tmp[2]);
      const k = Math.max(0, Math.min(1, overrideMask));
      const r = ratioR * (1 - k) + editedTmp[0] * k;
      const g = ratioG * (1 - k) + editedTmp[1] * k;
      const b = ratioB * (1 - k) + editedTmp[2] * k;

      floatToRgbe(r, g, b, rgbeTmp);
      const di = x * 4;
      rowOut[di + 0] = rgbeTmp[0];
      rowOut[di + 1] = rgbeTmp[1];
      rowOut[di + 2] = rgbeTmp[2];
      rowOut[di + 3] = rgbeTmp[3];
    }
  });

  const fileName = `${baseName}_edited.hdr`;
  downloadBlob(blob, fileName);
  setStatus(`Saved HDR: ${fileName} (${ow}x${oh})`);
  return true;
}
