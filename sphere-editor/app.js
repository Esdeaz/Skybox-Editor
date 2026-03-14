import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ToolManager } from "./backend/tools/ToolManager.js";
import { PaintBackend } from "./backend/core/PaintBackend.js";
import { LayerStack } from "./backend/core/LayerStack.js";
import { savePngFile, saveHdrOriginalSizeFile } from "./backend/io/ExportService.js";
import { CursorPreviewRenderer } from "./ui/CursorPreviewRenderer.js";

const WORK_MAX_WIDTH = 3072;
const CREATE_MAX_DIM = 32768;
const SPHERE_RADIUS = 10;

const fileInput = document.getElementById("fileInput");
const loadHdrBtn = document.getElementById("loadHdrBtn");
const createNewBtn = document.getElementById("createNewBtn");
const filesWindow = document.getElementById("filesWindow");
const toolsWindow = document.getElementById("toolsWindow");
const toolSettingsPanel = document.getElementById("toolSettingsPanel");

const toolSelect = document.getElementById("toolSelect");
const toolBtnBrush = document.getElementById("toolBtnBrush");
const toolBtnEraser = document.getElementById("toolBtnEraser");
const toolBtnBlur = document.getElementById("toolBtnBlur");
const toolBtnStamp = document.getElementById("toolBtnStamp");
const toolBtnHealing = document.getElementById("toolBtnHealing");
const toolBtnLasso = document.getElementById("toolBtnLasso");
const toolBtnMoveLayer = document.getElementById("toolBtnMoveLayer");
const toolBtnRotateLayer = document.getElementById("toolBtnRotateLayer");
const toolBtnTexture = document.getElementById("toolBtnTexture");
const toolBtnFill = document.getElementById("toolBtnFill");
const toolBtnSeam = document.getElementById("toolBtnSeam");
const toolBtnPole = document.getElementById("toolBtnPole");

const toolSettingsTitle = document.getElementById("toolSettingsTitle");
const actionsWindow = document.getElementById("actionsWindow");
const filtersWindow = document.getElementById("filtersWindow");
const viewportWindow = document.getElementById("viewportWindow");
const performanceWindow = document.getElementById("performanceWindow");
const settingsBrush = document.getElementById("settingsBrush");
const settingsEraser = document.getElementById("settingsEraser");
const settingsBlur = document.getElementById("settingsBlur");
const settingsStamp = document.getElementById("settingsStamp");
const settingsHealing = document.getElementById("settingsHealing");
const settingsLasso = document.getElementById("settingsLasso");
const settingsMoveLayer = document.getElementById("settingsMoveLayer");
const settingsRotateLayer = document.getElementById("settingsRotateLayer");
const settingsTexture = document.getElementById("settingsTexture");
const settingsFill = document.getElementById("settingsFill");
const settingsSeam = document.getElementById("settingsSeam");
const settingsPole = document.getElementById("settingsPole");

const viewModeSelect = document.getElementById("viewModeSelect");
const exposureSlider = document.getElementById("exposureSlider");
const exposureOut = document.getElementById("exposureOut");
const viewportBg = document.getElementById("viewportBg");

const brushSize = document.getElementById("brushSize");
const brushStrength = document.getElementById("brushStrength");
const brushSoftness = document.getElementById("brushSoftness");
const brushColor = document.getElementById("brushColor");
const brushShape = document.getElementById("brushShape");
const brushTextureInput = document.getElementById("brushTextureInput");
const brushRotation = document.getElementById("brushRotation");
const brushRotationOut = document.getElementById("brushRotationOut");
const eraserSize = document.getElementById("eraserSize");
const eraserStrength = document.getElementById("eraserStrength");
const eraserSoftness = document.getElementById("eraserSoftness");
const eraserTextureInput = document.getElementById("eraserTextureInput");
const eraserSizeOut = document.getElementById("eraserSizeOut");
const eraserStrengthOut = document.getElementById("eraserStrengthOut");
const eraserSoftnessOut = document.getElementById("eraserSoftnessOut");
const previewToggle = document.getElementById("previewToggle");
const perfAdaptiveToggle = document.getElementById("perfAdaptiveToggle");
const perfTargetFps = document.getElementById("perfTargetFps");
const perfTargetFpsOut = document.getElementById("perfTargetFpsOut");
const perfMinFps = document.getElementById("perfMinFps");
const perfMinFpsOut = document.getElementById("perfMinFpsOut");
const perfMaxSpacingBoost = document.getElementById("perfMaxSpacingBoost");
const perfMaxSpacingBoostOut = document.getElementById("perfMaxSpacingBoostOut");
const perfPolarSafeToggle = document.getElementById("perfPolarSafeToggle");
const perfPolarRowSamples = document.getElementById("perfPolarRowSamples");
const perfPolarRowSamplesOut = document.getElementById("perfPolarRowSamplesOut");
const brushSizeOut = document.getElementById("brushSizeOut");
const brushStrengthOut = document.getElementById("brushStrengthOut");
const brushSoftnessOut = document.getElementById("brushSoftnessOut");

const blurSize = document.getElementById("blurSize");
const blurStrength = document.getElementById("blurStrength");
const blurSoftness = document.getElementById("blurSoftness");
const blurQuality = document.getElementById("blurQuality");
const blurSizeOut = document.getElementById("blurSizeOut");
const blurStrengthOut = document.getElementById("blurStrengthOut");
const blurSoftnessOut = document.getElementById("blurSoftnessOut");
const blurQualityOut = document.getElementById("blurQualityOut");

const stampSize = document.getElementById("stampSize");
const stampStrength = document.getElementById("stampStrength");
const stampSoftness = document.getElementById("stampSoftness");
const stampSmooth = document.getElementById("stampSmooth");
const stampTriplanar = document.getElementById("stampTriplanar");
const stampBlendMode = document.getElementById("stampBlendMode");
const stampSharpSampling = document.getElementById("stampSharpSampling");
const stampSizeOut = document.getElementById("stampSizeOut");
const stampStrengthOut = document.getElementById("stampStrengthOut");
const stampSoftnessOut = document.getElementById("stampSoftnessOut");
const stampSmoothOut = document.getElementById("stampSmoothOut");
const healingSize = document.getElementById("healingSize");
const healingStrength = document.getElementById("healingStrength");
const healingSoftness = document.getElementById("healingSoftness");
const healingSmooth = document.getElementById("healingSmooth");
const healingTriplanar = document.getElementById("healingTriplanar");
const healingSharpSampling = document.getElementById("healingSharpSampling");
const healingSizeOut = document.getElementById("healingSizeOut");
const healingStrengthOut = document.getElementById("healingStrengthOut");
const healingSoftnessOut = document.getElementById("healingSoftnessOut");
const healingSmoothOut = document.getElementById("healingSmoothOut");

const texPaintSize = document.getElementById("texPaintSize");
const texPaintSoftness = document.getElementById("texPaintSoftness");
const texPaintOpacity = document.getElementById("texPaintOpacity");
const texPaintInput = document.getElementById("texPaintInput");
const texPaintRotation = document.getElementById("texPaintRotation");
const texPaintBlendMode = document.getElementById("texPaintBlendMode");
const texPaintHint = document.getElementById("texPaintHint");
const texPaintSizeOut = document.getElementById("texPaintSizeOut");
const texPaintSoftnessOut = document.getElementById("texPaintSoftnessOut");
const texPaintOpacityOut = document.getElementById("texPaintOpacityOut");
const texPaintRotationOut = document.getElementById("texPaintRotationOut");

const fillColor = document.getElementById("fillColor");
const fillTolerance = document.getElementById("fillTolerance");
const fillOpacity = document.getElementById("fillOpacity");
const fillToleranceOut = document.getElementById("fillToleranceOut");
const fillOpacityOut = document.getElementById("fillOpacityOut");

const seamWidth = document.getElementById("seamWidth");
const seamStrength = document.getElementById("seamStrength");
const seamWidthOut = document.getElementById("seamWidthOut");
const seamStrengthOut = document.getElementById("seamStrengthOut");
const applySeamBlendBtn = document.getElementById("applySeamBlendBtn");

const poleWidth = document.getElementById("poleWidth");
const poleStrength = document.getElementById("poleStrength");
const poleWidthOut = document.getElementById("poleWidthOut");
const poleStrengthOut = document.getElementById("poleStrengthOut");
const applyPoleBlendBtn = document.getElementById("applyPoleBlendBtn");

const setStampSourceBtn = document.getElementById("setStampSourceBtn");
const stampHint = document.getElementById("stampHint");
const setHealingSourceBtn = document.getElementById("setHealingSourceBtn");
const healingHint = document.getElementById("healingHint");
const lassoClearBtn = document.getElementById("lassoClearBtn");
const lassoInvertBtn = document.getElementById("lassoInvertBtn");
const lassoCopyBtn = document.getElementById("lassoCopyBtn");
const lassoPasteBtn = document.getElementById("lassoPasteBtn");
const lassoHint = document.getElementById("lassoHint");
const moveLayerX = document.getElementById("moveLayerX");
const moveLayerY = document.getElementById("moveLayerY");
const rotateLayerAngle = document.getElementById("rotateLayerAngle");
const rotateLayerPivotU = document.getElementById("rotateLayerPivotU");
const rotateLayerPivotV = document.getElementById("rotateLayerPivotV");
const rotateLayerPickPivotBtn = document.getElementById("rotateLayerPickPivotBtn");
const undoBtn = document.getElementById("undoBtn");
const saveBtn = document.getElementById("saveBtn");
const saveHdrBtn = document.getElementById("saveHdrBtn");
const gaussRadius = document.getElementById("gaussRadius");
const gaussRadiusOut = document.getElementById("gaussRadiusOut");
const gaussPreviewToggle = document.getElementById("gaussPreviewToggle");
const gaussApplyBtn = document.getElementById("gaussApplyBtn");
const ccBrightness = document.getElementById("ccBrightness");
const ccBrightnessOut = document.getElementById("ccBrightnessOut");
const ccContrast = document.getElementById("ccContrast");
const ccContrastOut = document.getElementById("ccContrastOut");
const ccSaturation = document.getElementById("ccSaturation");
const ccSaturationOut = document.getElementById("ccSaturationOut");
const ccPreviewToggle = document.getElementById("ccPreviewToggle");
const ccApplyBtn = document.getElementById("ccApplyBtn");
const toneRangeShadows = document.getElementById("toneRangeShadows");
const toneRangeMidtones = document.getElementById("toneRangeMidtones");
const toneRangeHighlights = document.getElementById("toneRangeHighlights");
const toneCyanRed = document.getElementById("toneCyanRed");
const toneCyanRedOut = document.getElementById("toneCyanRedOut");
const toneMagentaGreen = document.getElementById("toneMagentaGreen");
const toneMagentaGreenOut = document.getElementById("toneMagentaGreenOut");
const toneYellowBlue = document.getElementById("toneYellowBlue");
const toneYellowBlueOut = document.getElementById("toneYellowBlueOut");
const tonePreserveLum = document.getElementById("tonePreserveLum");
const tonePreviewToggle = document.getElementById("tonePreviewToggle");
const toneApplyBtn = document.getElementById("toneApplyBtn");
const filtersClearPreviewBtn = document.getElementById("filtersClearPreviewBtn");
const statusEl = document.getElementById("status");
const glCanvas = document.getElementById("glCanvas");
const cursorPreviewCanvas = document.getElementById("cursorPreviewCanvas");
const orientationCanvas = document.getElementById("orientationCanvas");
const orientationWindow = document.querySelector(".orientation-window");
const layersWindow = document.getElementById("layersWindow");
const layerList = document.getElementById("layerList");
const layerAddBtn = document.getElementById("layerAddBtn");
const layerDuplicateBtn = document.getElementById("layerDuplicateBtn");
const layerMergeDownBtn = document.getElementById("layerMergeDownBtn");
const layerDeleteBtn = document.getElementById("layerDeleteBtn");
const createCanvasModal = document.getElementById("createCanvasModal");
const createCanvasWidth = document.getElementById("createCanvasWidth");
const createCanvasOrientation = document.getElementById("createCanvasOrientation");
const createCanvasHeight = document.getElementById("createCanvasHeight");
const createCanvasColor = document.getElementById("createCanvasColor");
const createCanvasAlpha = document.getElementById("createCanvasAlpha");
const createCanvasAlphaOut = document.getElementById("createCanvasAlphaOut");
const createCanvasWorkingOut = document.getElementById("createCanvasWorkingOut");
const createCanvasApplyBtn = document.getElementById("createCanvasApplyBtn");
const createCanvasCancelBtn = document.getElementById("createCanvasCancelBtn");

const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(glCanvas.clientWidth, glCanvas.clientHeight, false);
renderer.setClearColor(0x444b55, 1);

const orientationCtx = orientationCanvas ? orientationCanvas.getContext("2d") : null;
const cursorPreviewCtx = cursorPreviewCanvas ? cursorPreviewCanvas.getContext("2d") : null;
const orientQuatInv = new THREE.Quaternion();
const orientVec = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1)
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 1000);
camera.position.set(0, 0, 22);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = false;
controls.rotateSpeed = -0.28;
controls.zoomSpeed = 0.9;
controls.minDistance = 0.01;
controls.maxDistance = 60;
controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
controls.mouseButtons.RIGHT = null;

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(SPHERE_RADIUS, 96, 64),
  new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
);
scene.add(sphere);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const editCanvas = document.createElement("canvas");
const editCtx = editCanvas.getContext("2d", { willReadFrequently: true });
let imageData = null;
let compositedImageData = null;
let compositeDirty = false;
let texture = null;
let loadedFromHdr = false;
let textureDirty = false;
let hdrOriginalFloat = null;
let hdrOriginalWidth = 0;
let hdrOriginalHeight = 0;
let baseImageData = null;
let currentBaseName = "pano";

let isPainting = false;
let lastUV = null;
let pendingStampSource = false;
let stampSource = null;
let stampAnchor = null;
let undoStack = [];
let lastPushTs = 0;
let activeToolMode = "brush";
let toolSettingsOpen = false;

let brushMaskData = null;
let brushMaskW = 0;
let brushMaskH = 0;
let eraserMaskData = null;
let eraserMaskW = 0;
let eraserMaskH = 0;
let texturePaintData = null;
let texturePaintW = 0;
let texturePaintH = 0;
let brushMaskPreviewCanvas = null;
let eraserMaskPreviewCanvas = null;
let texturePaintPreviewCanvas = null;
let lastPreviewHit = null;
let previewRafId = 0;
let pendingPreviewHit = null;
let textureUploadBatchDepth = 0;
let textureUploadPending = false;
let pendingStrokeUV = null;
let lastBufferedPaintTs = 0;
let bufferedPaintIntervalMs = 1000 / 45;
let averageFrameMs = 16.67;
let lastAnimationTs = performance.now();
let adaptiveSpacingMultiplier = 1;
let layoutObserver = null;
let paintBackend = null;
let cursorPreviewRenderer = null;
let layerStack = null;
let draggingLayerId = null;
let filterPreview = null;
let lassoPointsUV = [];
let lassoClosed = false;
let lassoClipboardImageData = null;
let lassoSelectionMask = null;
let lassoSelectionInverted = false;
let lassoSelectionRevision = 0;
const layerSelectionMaskCache = {
  revision: -1,
  layerId: -1,
  offsetU: 0,
  offsetV: 0,
  rotationRad: 0,
  pivotU: 0.5,
  pivotV: 0.5,
  width: 0,
  height: 0,
  mask: null
};
let layerTransformDrag = null;
let pendingRotatePivotPick = false;

function getBrushSettings() {
  return {
    sizePx: Math.max(2, Number(brushSize.value)),
    strength: Number(brushStrength.value) / 100,
    softness: Number(brushSoftness.value) / 100,
    shape: brushShape ? brushShape.value : "circle",
    color: hexToRgb(brushColor ? brushColor.value : "#ffffff"),
    rotationRad: (Number(brushRotation ? brushRotation.value : 0) * Math.PI) / 180
  };
}

function getEraserSettings() {
  return {
    sizePx: Math.max(2, Number(eraserSize ? eraserSize.value : brushSize.value)),
    strength: Number(eraserStrength ? eraserStrength.value : brushStrength.value) / 100,
    softness: Number(eraserSoftness ? eraserSoftness.value : brushSoftness.value) / 100
  };
}

function getBlurSettings() {
  return {
    sizePx: Math.max(2, Number(blurSize.value)),
    strength: Number(blurStrength.value) / 100,
    softness: Number(blurSoftness.value) / 100,
    quality: Math.max(1, Math.min(3, Number(blurQuality ? blurQuality.value : 2)))
  };
}

function getStampSettings() {
  return {
    sizePx: Math.max(2, Number(stampSize.value)),
    strength: Number(stampStrength.value) / 100,
    softness: Number(stampSoftness.value) / 100,
    smooth: Number(stampSmooth.value) / 100,
    triplanar: !!(stampTriplanar && stampTriplanar.checked),
    blendMode: stampBlendMode ? stampBlendMode.value : "blend",
    sharpSampling: !!(stampSharpSampling && stampSharpSampling.checked)
  };
}

function getHealingSettings() {
  return {
    sizePx: Math.max(2, Number(healingSize ? healingSize.value : stampSize.value)),
    strength: Number(healingStrength ? healingStrength.value : stampStrength.value) / 100,
    softness: Number(healingSoftness ? healingSoftness.value : stampSoftness.value) / 100,
    smooth: Number(healingSmooth ? healingSmooth.value : stampSmooth.value) / 100,
    triplanar: !!(healingTriplanar && healingTriplanar.checked),
    sharpSampling: !!(healingSharpSampling && healingSharpSampling.checked)
  };
}

function getTexturePaintSettings() {
  return {
    sizePx: Math.max(2, Number(texPaintSize.value)),
    opacity: Number(texPaintOpacity.value) / 100,
    softness: Number(texPaintSoftness.value) / 100,
    rotationRad: (Number(texPaintRotation ? texPaintRotation.value : 0) * Math.PI) / 180,
    blendMode: texPaintBlendMode ? texPaintBlendMode.value : "blend"
  };
}

function getFillSettings() {
  return {
    color: hexToRgb(fillColor ? fillColor.value : "#ffffff"),
    tolerance: Math.max(0, Math.min(255, Number(fillTolerance ? fillTolerance.value : 12) | 0)),
    opacity: Math.max(0, Math.min(1, Number(fillOpacity ? fillOpacity.value : 100) / 100))
  };
}

function getSeamSettings() {
  return {
    widthPx: Math.max(1, Number(seamWidth.value) | 0),
    strength: Number(seamStrength.value) / 100
  };
}

function getPoleSettings() {
  return {
    widthPx: Math.max(2, Number(poleWidth.value) | 0),
    strength: Number(poleStrength.value) / 100
  };
}

function markCompositeDirty() {
  compositeDirty = true;
}

function getWorkingImageData() {
  return compositedImageData || imageData;
}

function syncActiveLayerImageData() {
  if (!layerStack) {
    imageData = null;
    invalidateLayerSelectionMaskCache();
    return;
  }
  const active = layerStack.getActiveLayer();
  imageData = active ? active.imageData : null;
  invalidateLayerSelectionMaskCache();
}

function flushCompositeNow() {
  if (!layerStack || !compositedImageData) return;
  if (!compositeDirty && !textureDirty) return;
  if (filterPreview && filterPreview.imageData) {
    const composite = compositeWithLayerOverride(filterPreview.layerId, filterPreview.imageData);
    if (composite) {
      editCtx.putImageData(composite, 0, 0);
    } else {
      layerStack.composite(compositedImageData);
      editCtx.putImageData(compositedImageData, 0, 0);
    }
  } else {
    layerStack.composite(compositedImageData);
    editCtx.putImageData(compositedImageData, 0, 0);
  }
  if (texture) texture.needsUpdate = true;
  compositeDirty = false;
  textureDirty = false;
}

function cloneImageData(src) {
  return new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
}

function buildGaussianKernel1D(radius) {
  const r = Math.max(0, Math.floor(radius));
  if (r <= 0) return { radius: 0, weights: [1] };
  const sigma = Math.max(0.1, r * 0.5);
  const weights = new Array(r * 2 + 1);
  let sum = 0;
  for (let i = -r; i <= r; i++) {
    const w = Math.exp(-(i * i) / (2 * sigma * sigma));
    weights[i + r] = w;
    sum += w;
  }
  for (let i = 0; i < weights.length; i++) weights[i] /= sum;
  return { radius: r, weights };
}

function applyGaussianBlurToImageData(srcImageData, radius) {
  const { width: w, height: h } = srcImageData;
  const src = srcImageData.data;
  const out = new Uint8ClampedArray(src.length);
  const tmp = new Float32Array(src.length);
  const kernel = buildGaussianKernel1D(radius);
  const r = kernel.radius;
  if (r <= 0) return cloneImageData(srcImageData);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let rr = 0;
      let gg = 0;
      let bb = 0;
      let aa = 0;
      for (let k = -r; k <= r; k++) {
        const sx = ((x + k) % w + w) % w;
        const i = (y * w + sx) * 4;
        const kw = kernel.weights[k + r];
        rr += src[i + 0] * kw;
        gg += src[i + 1] * kw;
        bb += src[i + 2] * kw;
        aa += src[i + 3] * kw;
      }
      const o = (y * w + x) * 4;
      tmp[o + 0] = rr;
      tmp[o + 1] = gg;
      tmp[o + 2] = bb;
      tmp[o + 3] = aa;
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let rr = 0;
      let gg = 0;
      let bb = 0;
      let aa = 0;
      for (let k = -r; k <= r; k++) {
        const sy = Math.max(0, Math.min(h - 1, y + k));
        const i = (sy * w + x) * 4;
        const kw = kernel.weights[k + r];
        rr += tmp[i + 0] * kw;
        gg += tmp[i + 1] * kw;
        bb += tmp[i + 2] * kw;
        aa += tmp[i + 3] * kw;
      }
      const o = (y * w + x) * 4;
      out[o + 0] = Math.round(rr);
      out[o + 1] = Math.round(gg);
      out[o + 2] = Math.round(bb);
      out[o + 3] = Math.round(aa);
    }
  }

  return new ImageData(out, w, h);
}

function applyColorCorrectionToImageData(srcImageData, brightness, contrast, saturation) {
  const out = new Uint8ClampedArray(srcImageData.data.length);
  const src = srcImageData.data;
  const b = Math.max(-1, Math.min(1, brightness / 100));
  const c = Math.max(0, 1 + contrast / 100);
  const s = Math.max(0, saturation / 100);

  for (let i = 0; i < src.length; i += 4) {
    let r = src[i + 0] / 255;
    let g = src[i + 1] / 255;
    let bl = src[i + 2] / 255;

    r += b;
    g += b;
    bl += b;

    r = (r - 0.5) * c + 0.5;
    g = (g - 0.5) * c + 0.5;
    bl = (bl - 0.5) * c + 0.5;

    const luma = r * 0.2126 + g * 0.7152 + bl * 0.0722;
    r = luma + (r - luma) * s;
    g = luma + (g - luma) * s;
    bl = luma + (bl - luma) * s;

    out[i + 0] = Math.round(Math.max(0, Math.min(1, r)) * 255);
    out[i + 1] = Math.round(Math.max(0, Math.min(1, g)) * 255);
    out[i + 2] = Math.round(Math.max(0, Math.min(1, bl)) * 255);
    out[i + 3] = src[i + 3];
  }

  return new ImageData(out, srcImageData.width, srcImageData.height);
}

function getToneRangeMode() {
  if (toneRangeShadows && toneRangeShadows.checked) return "shadows";
  if (toneRangeHighlights && toneRangeHighlights.checked) return "highlights";
  return "midtones";
}

function getToneWeight(range, luma) {
  const x = Math.max(0, Math.min(1, luma));
  if (range === "shadows") return Math.pow(1 - x, 1.35);
  if (range === "highlights") return Math.pow(x, 1.35);
  return Math.pow(1 - Math.min(1, Math.abs(x - 0.5) * 2), 1.1);
}

function applyToneColorToImageData(srcImageData, range, cyanRed, magentaGreen, yellowBlue, preserveLuminosity) {
  const out = new Uint8ClampedArray(srcImageData.data.length);
  const src = srcImageData.data;
  const cr = Math.max(-100, Math.min(100, cyanRed)) / 100;
  const mg = Math.max(-100, Math.min(100, magentaGreen)) / 100;
  const yb = Math.max(-100, Math.min(100, yellowBlue)) / 100;

  for (let i = 0; i < src.length; i += 4) {
    const a = src[i + 3];
    if (a <= 0) {
      out[i + 0] = src[i + 0];
      out[i + 1] = src[i + 1];
      out[i + 2] = src[i + 2];
      out[i + 3] = a;
      continue;
    }

    const r0 = src[i + 0] / 255;
    const g0 = src[i + 1] / 255;
    const b0 = src[i + 2] / 255;
    const l0 = r0 * 0.2126 + g0 * 0.7152 + b0 * 0.0722;
    const w = getToneWeight(range, l0);

    let r = r0 + cr * w;
    let g = g0 + mg * w;
    let b = b0 + yb * w;

    if (preserveLuminosity) {
      const l1 = r * 0.2126 + g * 0.7152 + b * 0.0722;
      const d = l0 - l1;
      r += d;
      g += d;
      b += d;
    }

    out[i + 0] = Math.round(Math.max(0, Math.min(1, r)) * 255);
    out[i + 1] = Math.round(Math.max(0, Math.min(1, g)) * 255);
    out[i + 2] = Math.round(Math.max(0, Math.min(1, b)) * 255);
    out[i + 3] = a;
  }

  return new ImageData(out, srcImageData.width, srcImageData.height);
}

function wrapU(u) {
  return ((u % 1) + 1) % 1;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function invalidateLayerSelectionMaskCache() {
  layerSelectionMaskCache.mask = null;
  layerSelectionMaskCache.revision = -1;
}

function bumpLassoSelectionRevision() {
  lassoSelectionRevision++;
  invalidateLayerSelectionMaskCache();
}

function uvToDir(ux, vy) {
  const lon = ux * Math.PI * 2 - Math.PI;
  const lat = vy * Math.PI - Math.PI * 0.5;
  const cl = Math.cos(lat);
  return {
    x: Math.cos(lon) * cl,
    y: Math.sin(lat),
    z: Math.sin(lon) * cl
  };
}

function dirToUvXYZ(x, y, z) {
  const lon = Math.atan2(z, x);
  const lat = Math.asin(Math.max(-1, Math.min(1, y)));
  return {
    x: wrapU((lon + Math.PI) / (Math.PI * 2)),
    y: clamp01((lat + Math.PI * 0.5) / Math.PI)
  };
}

function rotateAroundAxis(v, axis, angle) {
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

function rotateX(v, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
}

function rotateY(v, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}

function sampleLayerDataAtUv(src, su, sv, w, h, out) {
  const fx = wrapU(su) * w;
  const fy = (1 - clamp01(sv)) * h;
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

function sampleLayerPixel(layer, src, x, y, w, h, out) {
  const offU = layer.offsetU || 0;
  const offV = layer.offsetV || 0;
  const rot = layer.rotationRad || 0;
  if (Math.abs(offU) < 1e-9 && Math.abs(offV) < 1e-9 && Math.abs(rot) < 1e-9) {
    const i = (y * w + x) * 4;
    out[0] = src[i + 0];
    out[1] = src[i + 1];
    out[2] = src[i + 2];
    out[3] = src[i + 3];
    return;
  }
  const outU = (x + 0.5) / w;
  const outV = 1 - (y + 0.5) / h;
  let dir = uvToDir(wrapU(outU), clamp01(outV));
  if (Math.abs(rot) > 1e-9) {
    const pivotU = layer.pivotU == null ? 0.5 : wrapU(layer.pivotU);
    const pivotV = layer.pivotV == null ? 0.5 : clamp01(layer.pivotV);
    const axis = uvToDir(pivotU, pivotV);
    dir = rotateAroundAxis(dir, axis, -rot);
  }
  if (Math.abs(offU) > 1e-9 || Math.abs(offV) > 1e-9) {
    const yaw = -(offU * Math.PI * 2);
    const pitch = -(offV * Math.PI);
    dir = rotateY(dir, yaw);
    dir = rotateX(dir, pitch);
  }
  const mapped = dirToUvXYZ(dir.x, dir.y, dir.z);
  const su = mapped.x;
  const sv = mapped.y;
  sampleLayerDataAtUv(src, su, sv, w, h, out);
}

function compositeWithLayerOverride(overrideLayerId, overrideImageData) {
  if (!layerStack) return null;
  const out = new ImageData(editCanvas.width, editCanvas.height);
  const outData = out.data;
  const w = editCanvas.width;
  const h = editCanvas.height;
  const pixelCount = w * h;
  const visibleLayers = layerStack.layers.filter((l) => l.visible && l.opacity > 0);
  const sample = [0, 0, 0, 0];

  for (let i = 0; i < pixelCount; i++) {
    let ar = 0;
    let ag = 0;
    let ab = 0;
    let aa = 0;
    const j = i * 4;
    for (let li = 0; li < visibleLayers.length; li++) {
      const layer = visibleLayers[li];
      const src = layer.id === overrideLayerId ? overrideImageData.data : layer.imageData.data;
      const x = i % w;
      const y = (i / w) | 0;
      sampleLayerPixel(layer, src, x, y, w, h, sample);
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
    }
  }
  return out;
}

function clearFilterPreview() {
  filterPreview = null;
  if (gaussPreviewToggle) gaussPreviewToggle.checked = false;
  if (ccPreviewToggle) ccPreviewToggle.checked = false;
  if (tonePreviewToggle) tonePreviewToggle.checked = false;
  markCompositeDirty();
  textureDirty = true;
}

function getActiveLayerForFilter() {
  if (!layerStack) return null;
  const active = layerStack.getActiveLayer();
  if (!active) return null;
  return active;
}

function buildGaussianPreviewImage() {
  const active = getActiveLayerForFilter();
  if (!active) return null;
  const radius = Math.max(0, Number(gaussRadius ? gaussRadius.value : 0) | 0);
  return applyGaussianBlurToImageData(active.imageData, radius);
}

function buildColorCorrectionPreviewImage() {
  const active = getActiveLayerForFilter();
  if (!active) return null;
  const b = Number(ccBrightness ? ccBrightness.value : 0);
  const c = Number(ccContrast ? ccContrast.value : 0);
  const s = Number(ccSaturation ? ccSaturation.value : 100);
  return applyColorCorrectionToImageData(active.imageData, b, c, s);
}

function buildToneColorPreviewImage() {
  const active = getActiveLayerForFilter();
  if (!active) return null;
  const range = getToneRangeMode();
  const cr = Number(toneCyanRed ? toneCyanRed.value : 0);
  const mg = Number(toneMagentaGreen ? toneMagentaGreen.value : 0);
  const yb = Number(toneYellowBlue ? toneYellowBlue.value : 0);
  const preserve = !!(tonePreserveLum && tonePreserveLum.checked);
  return applyToneColorToImageData(active.imageData, range, cr, mg, yb, preserve);
}

function renderFilterPreview(type) {
  const active = getActiveLayerForFilter();
  if (!active) return;
  const base = cloneImageData(active.imageData);
  let processed = null;
  if (type === "gaussian") processed = buildGaussianPreviewImage();
  else if (type === "cc") processed = buildColorCorrectionPreviewImage();
  else if (type === "tone") processed = buildToneColorPreviewImage();
  if (!processed) return;
  const selectedProcessed = applySelectionToProcessedImage(base, processed);
  const composite = compositeWithLayerOverride(active.id, selectedProcessed);
  if (!composite) return;
  filterPreview = { type, layerId: active.id, imageData: selectedProcessed };
  editCtx.putImageData(composite, 0, 0);
  if (texture) texture.needsUpdate = true;
}

function applyFilterToActiveLayer(type) {
  const active = getActiveLayerForFilter();
  if (!active) {
    setStatus("No active layer for filter.");
    return;
  }
  const base = cloneImageData(active.imageData);
  let processed = null;
  if (type === "gaussian") processed = buildGaussianPreviewImage();
  else if (type === "cc") processed = buildColorCorrectionPreviewImage();
  else if (type === "tone") processed = buildToneColorPreviewImage();
  if (!processed) return;
  processed = applySelectionToProcessedImage(base, processed);
  pushUndo();
  active.imageData.data.set(processed.data);
  if (layerStack.activeLayerId === active.id) {
    imageData = active.imageData;
  }
  clearFilterPreview();
  markCompositeDirty();
  textureDirty = true;
  refreshCursorPreview();
  if (type === "gaussian") setStatus("Gaussian blur applied.");
  else if (type === "cc") setStatus("Color correction applied.");
  else if (type === "tone") setStatus("Tone/Color applied.");
}

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function getLassoPolygonPixels() {
  if (!lassoClosed || lassoPointsUV.length < 3 || !imageData) return null;
  const w = editCanvas.width;
  const h = editCanvas.height;
  const poly = [];
  let uPrev = lassoPointsUV[0].x;
  poly.push([uPrev * w, (1 - lassoPointsUV[0].y) * h]);
  for (let i = 1; i < lassoPointsUV.length; i++) {
    const u = lassoPointsUV[i].x;
    let best = u;
    let bestDiff = Math.abs(best - uPrev);
    const c1 = u + 1;
    const c2 = u - 1;
    const d1 = Math.abs(c1 - uPrev);
    const d2 = Math.abs(c2 - uPrev);
    if (d1 < bestDiff) {
      best = c1;
      bestDiff = d1;
    }
    if (d2 < bestDiff) {
      best = c2;
    }
    uPrev = best;
    poly.push([best * w, (1 - lassoPointsUV[i].y) * h]);
  }
  return poly;
}

function getLassoSeedUv() {
  if (!lassoPointsUV || lassoPointsUV.length === 0) return { x: 0.5, y: 0.5 };
  let sx = 0;
  let sy = 0;
  let sz = 0;
  for (let i = 0; i < lassoPointsUV.length; i++) {
    const d = uvToDir(wrapU(lassoPointsUV[i].x), clamp01(lassoPointsUV[i].y));
    sx += d.x;
    sy += d.y;
    sz += d.z;
  }
  const len = Math.hypot(sx, sy, sz);
  if (len > 1e-9) {
    return dirToUvXYZ(sx / len, sy / len, sz / len);
  }
  return { x: wrapU(lassoPointsUV[0].x), y: clamp01(lassoPointsUV[0].y) };
}

function extractConnectedLassoComponent(mask, w, h) {
  if (!mask || !w || !h) return mask;
  const seedUv = getLassoSeedUv();
  const sx = Math.max(0, Math.min(w - 1, Math.floor(wrapU(seedUv.x) * w)));
  const sy = Math.max(0, Math.min(h - 1, Math.floor((1 - clamp01(seedUv.y)) * h)));

  let seedIndex = sy * w + sx;
  if (!mask[seedIndex]) {
    let bestIndex = -1;
    let bestDist = Infinity;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      const dy = y - sy;
      for (let x = 0; x < w; x++) {
        const idx = row + x;
        if (!mask[idx]) continue;
        const dxRaw = Math.abs(x - sx);
        const dx = Math.min(dxRaw, w - dxRaw);
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = idx;
        }
      }
    }
    if (bestIndex < 0) return mask;
    seedIndex = bestIndex;
  }

  const out = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  queue[tail++] = seedIndex;
  out[seedIndex] = 1;

  while (head < tail) {
    const idx = queue[head++];
    const y = (idx / w) | 0;
    const x = idx - y * w;

    const xl = x === 0 ? (w - 1) : (x - 1);
    const xr = x === (w - 1) ? 0 : (x + 1);
    const left = y * w + xl;
    const right = y * w + xr;
    if (mask[left] && !out[left]) {
      out[left] = 1;
      queue[tail++] = left;
    }
    if (mask[right] && !out[right]) {
      out[right] = 1;
      queue[tail++] = right;
    }

    if (y > 0) {
      const up = (y - 1) * w + x;
      if (mask[up] && !out[up]) {
        out[up] = 1;
        queue[tail++] = up;
      }
    }
    if (y < h - 1) {
      const down = (y + 1) * w + x;
      if (mask[down] && !out[down]) {
        out[down] = 1;
        queue[tail++] = down;
      }
    }
  }

  return out;
}

function rebuildLassoSelectionMask() {
  const w = editCanvas.width;
  const h = editCanvas.height;
  lassoSelectionMask = null;
  bumpLassoSelectionRevision();
  if (!lassoClosed || lassoPointsUV.length < 3 || w <= 0 || h <= 0) return;

  const verts = lassoPointsUV.map((uv) => uvToDir(wrapU(uv.x), clamp01(uv.y)));
  const n = verts.length;
  if (n < 3) return;

  const lonSin = new Float64Array(w);
  const lonCos = new Float64Array(w);
  for (let x = 0; x < w; x++) {
    const u = (x + 0.5) / w;
    const lon = u * Math.PI * 2 - Math.PI;
    lonSin[x] = Math.sin(lon);
    lonCos[x] = Math.cos(lon);
  }

  let mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const v = 1 - (y + 0.5) / h;
    const lat = v * Math.PI - Math.PI * 0.5;
    const py = Math.sin(lat);
    const pr = Math.cos(lat);
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const px = lonCos[x] * pr;
      const pz = lonSin[x] * pr;

      let sum = 0;
      let onEdge = false;
      for (let i = 0; i < n; i++) {
        const a = verts[i];
        const b = verts[(i + 1) % n];

        const ad = a.x * px + a.y * py + a.z * pz;
        const bd = b.x * px + b.y * py + b.z * pz;

        let ax = a.x - ad * px;
        let ay = a.y - ad * py;
        let az = a.z - ad * pz;
        let bx = b.x - bd * px;
        let by = b.y - bd * py;
        let bz = b.z - bd * pz;

        const al = Math.hypot(ax, ay, az);
        const bl = Math.hypot(bx, by, bz);
        if (al < 1e-8 || bl < 1e-8) {
          onEdge = true;
          break;
        }
        ax /= al; ay /= al; az /= al;
        bx /= bl; by /= bl; bz /= bl;

        const cx = ay * bz - az * by;
        const cy = az * bx - ax * bz;
        const cz = ax * by - ay * bx;
        const num = px * cx + py * cy + pz * cz;
        const den = Math.max(-1, Math.min(1, ax * bx + ay * by + az * bz));
        sum += Math.atan2(num, den);
      }
      if (onEdge || Math.abs(sum) > Math.PI) {
        mask[row + x] = 1;
      }
    }
  }
  mask = extractConnectedLassoComponent(mask, w, h);
  lassoSelectionMask = mask;
  bumpLassoSelectionRevision();
}

function hasActiveSelection() {
  return !!(lassoClosed && lassoSelectionMask && lassoSelectionMask.length > 0);
}

function isPixelSelected(x, y) {
  if (!hasActiveSelection()) return true;
  const w = editCanvas.width;
  const h = editCanvas.height;
  const xi = ((x % w) + w) % w;
  const yi = Math.max(0, Math.min(h - 1, y));
  const inside = !!lassoSelectionMask[yi * w + xi];
  return lassoSelectionInverted ? !inside : inside;
}

function applySelectionToProcessedImage(baseImageData, processedImageData) {
  if (!hasActiveSelection()) return processedImageData;
  const out = cloneImageData(baseImageData);
  const base = baseImageData.data;
  const processed = processedImageData.data;
  const dst = out.data;
  const w = editCanvas.width;
  const h = editCanvas.height;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      if (!isPixelSelected(x, y)) continue;
      const i = (row + x) * 4;
      dst[i + 0] = processed[i + 0];
      dst[i + 1] = processed[i + 1];
      dst[i + 2] = processed[i + 2];
      dst[i + 3] = processed[i + 3];
    }
  }
  return out;
}

function clearLassoSelection() {
  lassoPointsUV = [];
  lassoClosed = false;
  lassoSelectionMask = null;
  lassoSelectionInverted = false;
  bumpLassoSelectionRevision();
  refreshCursorPreview();
}

function closeLassoSelection() {
  if (lassoPointsUV.length < 3) {
    setStatus("Lasso: at least 3 points needed.");
    return false;
  }
  lassoClosed = true;
  rebuildLassoSelectionMask();
  setStatus("Lasso closed. Copy selection or press Ctrl+C.");
  refreshCursorPreview();
  return true;
}

function invertLassoSelection() {
  if (!hasActiveSelection()) {
    setStatus("Lasso: nothing to invert.");
    return false;
  }
  lassoSelectionInverted = !lassoSelectionInverted;
  bumpLassoSelectionRevision();
  if (lassoHint) {
    lassoHint.textContent = lassoSelectionInverted
      ? "Selection inverted. Effects apply outside polygon."
      : "Selection normal. Effects apply inside polygon.";
  }
  setStatus(lassoSelectionInverted ? "Lasso selection inverted." : "Lasso selection inversion disabled.");
  refreshCursorPreview();
  return true;
}

function copyLassoSelectionToClipboard() {
  if (!layerStack || !imageData) return false;
  if (!hasActiveSelection()) {
    setStatus("Lasso: close selection first.");
    return false;
  }
  const activeLayer = layerStack.getActiveLayer();
  if (!activeLayer) return false;

  const w = editCanvas.width;
  const h = editCanvas.height;
  const tmpOut = [0, 0, 0, 0];
  const out = new ImageData(w, h);
  const outData = out.data;
  const src = activeLayer.imageData.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!isPixelSelected(x, y)) continue;
      sampleLayerPixel(activeLayer, src, x, y, w, h, tmpOut);
      const i = (y * w + x) * 4;
      outData[i + 0] = Math.round(tmpOut[0]);
      outData[i + 1] = Math.round(tmpOut[1]);
      outData[i + 2] = Math.round(tmpOut[2]);
      outData[i + 3] = Math.round(tmpOut[3]);
    }
  }

  lassoClipboardImageData = out;
  setStatus("Lasso copied from active layer. Paste with Ctrl+V or button.");
  return true;
}

function pasteLassoClipboardAsLayer() {
  if (!layerStack || !lassoClipboardImageData) {
    setStatus("Lasso clipboard is empty.");
    return false;
  }
  if (filterPreview) clearFilterPreview();
  const pasted = layerStack.createLayer("Lasso Paste", cloneImageData(lassoClipboardImageData), {
    visible: true,
    opacity: 1
  });
  layerStack.activeLayerId = pasted.id;
  syncActiveLayerImageData();
  renderLayerList();
  syncLayerTransformControls();
  markCompositeDirty();
  textureDirty = true;
  setStatus("Pasted lasso selection as a new top layer.");
  return true;
}

function drawLassoOverlay(hit, append = false) {
  if (!cursorPreviewCtx || !cursorPreviewCanvas) return;
  if (!append) clearCursorPreview();
  const points = [...lassoPointsUV];
  if (hit && hit.uv && !lassoClosed) points.push(hit.uv);
  if (points.length === 0) return;

  cursorPreviewCtx.save();
  cursorPreviewCtx.lineWidth = 1.4;
  cursorPreviewCtx.strokeStyle = "rgba(255, 95, 95, 0.95)";
  cursorPreviewCtx.fillStyle = "rgba(255, 95, 95, 0.14)";
  cursorPreviewCtx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const dir = paintBackend.uvToDir(points[i]).multiplyScalar(SPHERE_RADIUS * 1.001);
    const p = dir.project(camera);
    const sx = (p.x * 0.5 + 0.5) * cursorPreviewCanvas.width;
    const sy = (-p.y * 0.5 + 0.5) * cursorPreviewCanvas.height;
    if (i === 0) cursorPreviewCtx.moveTo(sx, sy);
    else cursorPreviewCtx.lineTo(sx, sy);
  }
  const canFill = lassoClosed && lassoPointsUV.length >= 3;
  if (canFill) cursorPreviewCtx.closePath();
  if (canFill) {
    if (lassoSelectionInverted) {
      const sphereCenter = new THREE.Vector3(0, 0, 0).project(camera);
      const cx = (sphereCenter.x * 0.5 + 0.5) * cursorPreviewCanvas.width;
      const cy = (-sphereCenter.y * 0.5 + 0.5) * cursorPreviewCanvas.height;

      const d = camera.position.length();
      let cr = Math.max(cursorPreviewCanvas.width, cursorPreviewCanvas.height);
      if (d > SPHERE_RADIUS + 1e-6) {
        const alpha = Math.asin(Math.min(0.999999, SPHERE_RADIUS / d));
        const fovY = (camera.fov * Math.PI) / 180;
        const ndcRadiusY = Math.tan(alpha) / Math.tan(fovY * 0.5);
        cr = Math.abs(ndcRadiusY) * 0.5 * cursorPreviewCanvas.height;
      }

      cursorPreviewCtx.beginPath();
      cursorPreviewCtx.arc(cx, cy, cr, 0, Math.PI * 2);
      for (let i = 0; i < lassoPointsUV.length; i++) {
        const dir = paintBackend.uvToDir(lassoPointsUV[i]).multiplyScalar(SPHERE_RADIUS * 1.001);
        const p = dir.project(camera);
        const sx = (p.x * 0.5 + 0.5) * cursorPreviewCanvas.width;
        const sy = (-p.y * 0.5 + 0.5) * cursorPreviewCanvas.height;
        if (i === 0) cursorPreviewCtx.moveTo(sx, sy);
        else cursorPreviewCtx.lineTo(sx, sy);
      }
      cursorPreviewCtx.closePath();
      cursorPreviewCtx.fill("evenodd");
    } else {
      cursorPreviewCtx.fill();
    }
  }
  cursorPreviewCtx.stroke();
  if (lassoPointsUV.length > 0) {
    const dir0 = paintBackend.uvToDir(lassoPointsUV[0]).multiplyScalar(SPHERE_RADIUS * 1.001);
    const p0 = dir0.project(camera);
    const sx0 = (p0.x * 0.5 + 0.5) * cursorPreviewCanvas.width;
    const sy0 = (-p0.y * 0.5 + 0.5) * cursorPreviewCanvas.height;
    cursorPreviewCtx.beginPath();
    cursorPreviewCtx.fillStyle = lassoClosed ? "rgba(95, 220, 140, 0.95)" : "rgba(255, 220, 120, 0.95)";
    cursorPreviewCtx.arc(sx0, sy0, 3.6, 0, Math.PI * 2);
    cursorPreviewCtx.fill();
  }
  cursorPreviewCtx.restore();
}

function isClickNearFirstLassoPoint(event) {
  if (!lassoPointsUV.length || !renderer || !cursorPreviewCanvas) return false;
  const first = lassoPointsUV[0];
  const dir = paintBackend.uvToDir(first).multiplyScalar(SPHERE_RADIUS * 1.001);
  const p = dir.project(camera);
  const sx = (p.x * 0.5 + 0.5) * cursorPreviewCanvas.width;
  const sy = (-p.y * 0.5 + 0.5) * cursorPreviewCanvas.height;
  const rect = renderer.domElement.getBoundingClientRect();
  const mx = ((event.clientX - rect.left) / rect.width) * cursorPreviewCanvas.width;
  const my = ((event.clientY - rect.top) / rect.height) * cursorPreviewCanvas.height;
  const dx = mx - sx;
  const dy = my - sy;
  return (dx * dx + dy * dy) <= (16 * 16);
}

function normalizeSignedDegrees(deg) {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

function shortestSignedDelta(a, b) {
  let d = a - b;
  if (d > 0.5) d -= 1;
  if (d < -0.5) d += 1;
  return d;
}

function getLayerPivotUv(layer) {
  return {
    x: layer && layer.pivotU != null ? wrapU(layer.pivotU) : 0.5,
    y: layer && layer.pivotV != null ? clamp01(layer.pivotV) : 0.5
  };
}

function mapDisplayUvToLayerUv(layer, uv) {
  if (!layer || !uv) return uv;
  const offU = layer.offsetU || 0;
  const offV = layer.offsetV || 0;
  const rot = layer.rotationRad || 0;
  if (Math.abs(offU) < 1e-9 && Math.abs(offV) < 1e-9 && Math.abs(rot) < 1e-9) {
    return uv.clone ? uv.clone() : new THREE.Vector2(uv.x, uv.y);
  }
  let dir = uvToDir(wrapU(uv.x), clamp01(uv.y));
  if (Math.abs(rot) > 1e-9) {
    const pivot = getLayerPivotUv(layer);
    const axis = uvToDir(pivot.x, pivot.y);
    dir = rotateAroundAxis(dir, axis, -rot);
  }
  if (Math.abs(offU) > 1e-9 || Math.abs(offV) > 1e-9) {
    const yaw = -(offU * Math.PI * 2);
    const pitch = -(offV * Math.PI);
    dir = rotateY(dir, yaw);
    dir = rotateX(dir, pitch);
  }
  const mapped = dirToUvXYZ(dir.x, dir.y, dir.z);
  return new THREE.Vector2(mapped.x, mapped.y);
}

function mapLayerUvToDisplayUv(layer, uv) {
  if (!layer || !uv) return uv;
  const offU = layer.offsetU || 0;
  const offV = layer.offsetV || 0;
  const rot = layer.rotationRad || 0;
  if (Math.abs(offU) < 1e-9 && Math.abs(offV) < 1e-9 && Math.abs(rot) < 1e-9) {
    return uv.clone ? uv.clone() : new THREE.Vector2(uv.x, uv.y);
  }
  let dir = uvToDir(wrapU(uv.x), clamp01(uv.y));
  if (Math.abs(offU) > 1e-9 || Math.abs(offV) > 1e-9) {
    const yaw = offU * Math.PI * 2;
    const pitch = offV * Math.PI;
    dir = rotateX(dir, pitch);
    dir = rotateY(dir, yaw);
  }
  if (Math.abs(rot) > 1e-9) {
    const pivot = getLayerPivotUv(layer);
    const axis = uvToDir(pivot.x, pivot.y);
    dir = rotateAroundAxis(dir, axis, rot);
  }
  const mapped = dirToUvXYZ(dir.x, dir.y, dir.z);
  return new THREE.Vector2(mapped.x, mapped.y);
}

function mapLayerUvToDisplayUvXY(layer, u, v, out) {
  const offU = layer.offsetU || 0;
  const offV = layer.offsetV || 0;
  const rot = layer.rotationRad || 0;
  if (Math.abs(offU) < 1e-9 && Math.abs(offV) < 1e-9 && Math.abs(rot) < 1e-9) {
    out.x = wrapU(u);
    out.y = clamp01(v);
    return out;
  }
  let dir = uvToDir(wrapU(u), clamp01(v));
  if (Math.abs(offU) > 1e-9 || Math.abs(offV) > 1e-9) {
    const yaw = offU * Math.PI * 2;
    const pitch = offV * Math.PI;
    dir = rotateX(dir, pitch);
    dir = rotateY(dir, yaw);
  }
  if (Math.abs(rot) > 1e-9) {
    const pivot = getLayerPivotUv(layer);
    const axis = uvToDir(pivot.x, pivot.y);
    dir = rotateAroundAxis(dir, axis, rot);
  }
  const mapped = dirToUvXYZ(dir.x, dir.y, dir.z);
  out.x = mapped.x;
  out.y = mapped.y;
  return out;
}

function getActiveLayerSelectionMask() {
  if (!hasActiveSelection() || !layerStack) return null;
  const activeLayer = layerStack.getActiveLayer();
  if (!activeLayer || !lassoSelectionMask) return null;
  const hasTransform =
    Math.abs(activeLayer.offsetU || 0) > 1e-9 ||
    Math.abs(activeLayer.offsetV || 0) > 1e-9 ||
    Math.abs(activeLayer.rotationRad || 0) > 1e-9;
  if (!hasTransform) return null;

  const w = editCanvas.width;
  const h = editCanvas.height;
  if (
    layerSelectionMaskCache.mask &&
    layerSelectionMaskCache.revision === lassoSelectionRevision &&
    layerSelectionMaskCache.layerId === activeLayer.id &&
    layerSelectionMaskCache.offsetU === (activeLayer.offsetU || 0) &&
    layerSelectionMaskCache.offsetV === (activeLayer.offsetV || 0) &&
    layerSelectionMaskCache.rotationRad === (activeLayer.rotationRad || 0) &&
    layerSelectionMaskCache.pivotU === (activeLayer.pivotU == null ? 0.5 : activeLayer.pivotU) &&
    layerSelectionMaskCache.pivotV === (activeLayer.pivotV == null ? 0.5 : activeLayer.pivotV) &&
    layerSelectionMaskCache.width === w &&
    layerSelectionMaskCache.height === h
  ) {
    return layerSelectionMaskCache.mask;
  }

  const mappedMask = new Uint8Array(w * h);
  const mapped = { x: 0, y: 0 };
  for (let y = 0; y < h; y++) {
    const v = 1 - ((y + 0.5) / h);
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const u = (x + 0.5) / w;
      mapLayerUvToDisplayUvXY(activeLayer, u, v, mapped);
      const sx = Math.max(0, Math.min(w - 1, Math.floor(wrapU(mapped.x) * w)));
      const sy = Math.max(0, Math.min(h - 1, Math.floor((1 - clamp01(mapped.y)) * h)));
      const inside = !!lassoSelectionMask[sy * w + sx];
      mappedMask[row + x] = lassoSelectionInverted ? (inside ? 0 : 1) : (inside ? 1 : 0);
    }
  }

  layerSelectionMaskCache.revision = lassoSelectionRevision;
  layerSelectionMaskCache.layerId = activeLayer.id;
  layerSelectionMaskCache.offsetU = activeLayer.offsetU || 0;
  layerSelectionMaskCache.offsetV = activeLayer.offsetV || 0;
  layerSelectionMaskCache.rotationRad = activeLayer.rotationRad || 0;
  layerSelectionMaskCache.pivotU = activeLayer.pivotU == null ? 0.5 : activeLayer.pivotU;
  layerSelectionMaskCache.pivotV = activeLayer.pivotV == null ? 0.5 : activeLayer.pivotV;
  layerSelectionMaskCache.width = w;
  layerSelectionMaskCache.height = h;
  layerSelectionMaskCache.mask = mappedMask;
  return mappedMask;
}

function isPixelSelectedForActiveLayer(x, y) {
  if (!hasActiveSelection()) return true;
  const mappedMask = getActiveLayerSelectionMask();
  if (mappedMask) {
    const w = editCanvas.width;
    const h = editCanvas.height;
    const xi = ((x % w) + w) % w;
    const yi = Math.max(0, Math.min(h - 1, y));
    return !!mappedMask[yi * w + xi];
  }

  return isPixelSelected(x, y);
}

function syncLayerTransformControls() {
  if (!layerStack) return;
  const layer = layerStack.getActiveLayer();
  if (!layer) return;
  const xDeg = normalizeSignedDegrees(-(layer.offsetU || 0) * 360);
  const yDeg = normalizeSignedDegrees(-(layer.offsetV || 0) * 180);
  const rotDeg = normalizeSignedDegrees(-(layer.rotationRad || 0) * 180 / Math.PI);
  const pivot = getLayerPivotUv(layer);
  const pivotUDeg = normalizeSignedDegrees(pivot.x * 360 - 180);
  const pivotVDeg = Math.max(-90, Math.min(90, pivot.y * 180 - 90));
  if (moveLayerX) moveLayerX.value = `${xDeg.toFixed(2)}`;
  if (moveLayerY) moveLayerY.value = `${yDeg.toFixed(2)}`;
  if (rotateLayerAngle) rotateLayerAngle.value = `${rotDeg.toFixed(2)}`;
  if (rotateLayerPivotU) rotateLayerPivotU.value = `${pivotUDeg.toFixed(2)}`;
  if (rotateLayerPivotV) rotateLayerPivotV.value = `${pivotVDeg.toFixed(2)}`;
}

function applyMoveLayerInputs() {
  if (!layerStack) return;
  const layer = layerStack.getActiveLayer();
  if (!layer) return;
  const xDeg = Number(moveLayerX ? moveLayerX.value : 0) || 0;
  const yDeg = Number(moveLayerY ? moveLayerY.value : 0) || 0;
  layerStack.setLayerTransform(layer.id, {
    offsetU: -normalizeSignedDegrees(xDeg) / 360,
    offsetV: -normalizeSignedDegrees(yDeg) / 180
  });
  invalidateLayerSelectionMaskCache();
  markCompositeDirty();
  textureDirty = true;
  syncLayerTransformControls();
}

function applyRotateLayerInputs() {
  if (!layerStack) return;
  const layer = layerStack.getActiveLayer();
  if (!layer) return;
  const rotDeg = Number(rotateLayerAngle ? rotateLayerAngle.value : 0) || 0;
  const pivotUDeg = Number(rotateLayerPivotU ? rotateLayerPivotU.value : 0) || 0;
  const pivotVDeg = Number(rotateLayerPivotV ? rotateLayerPivotV.value : 0) || 0;
  layerStack.setLayerTransform(layer.id, {
    rotationRad: -normalizeSignedDegrees(rotDeg) * Math.PI / 180,
    pivotU: wrapU((normalizeSignedDegrees(pivotUDeg) + 180) / 360),
    pivotV: clamp01((Math.max(-90, Math.min(90, pivotVDeg)) + 90) / 180)
  });
  invalidateLayerSelectionMaskCache();
  markCompositeDirty();
  textureDirty = true;
  syncLayerTransformControls();
  refreshCursorPreview();
}

function drawRotatePivotOverlay() {
  if (!cursorPreviewCtx || !cursorPreviewCanvas || !layerStack) return;
  const layer = layerStack.getActiveLayer();
  if (!layer) return;
  const pivot = getLayerPivotUv(layer);
  const dir = paintBackend.uvToDir(new THREE.Vector2(pivot.x, pivot.y)).multiplyScalar(SPHERE_RADIUS * 1.001);
  const p = dir.project(camera);
  const sx = (p.x * 0.5 + 0.5) * cursorPreviewCanvas.width;
  const sy = (-p.y * 0.5 + 0.5) * cursorPreviewCanvas.height;

  clearCursorPreview();
  cursorPreviewCtx.save();
  cursorPreviewCtx.strokeStyle = "rgba(255, 180, 90, 0.95)";
  cursorPreviewCtx.lineWidth = 1.4;
  cursorPreviewCtx.beginPath();
  cursorPreviewCtx.arc(sx, sy, 8, 0, Math.PI * 2);
  cursorPreviewCtx.stroke();
  cursorPreviewCtx.beginPath();
  cursorPreviewCtx.moveTo(sx - 10, sy);
  cursorPreviewCtx.lineTo(sx + 10, sy);
  cursorPreviewCtx.moveTo(sx, sy - 10);
  cursorPreviewCtx.lineTo(sx, sy + 10);
  cursorPreviewCtx.stroke();
  cursorPreviewCtx.restore();
}

function renderLayerList() {
  if (!layerList) return;
  layerList.innerHTML = "";
  if (!layerStack || layerStack.layers.length === 0) return;
  const visualLayers = [...layerStack.layers].reverse();

  for (let i = 0; i < visualLayers.length; i++) {
    const layer = visualLayers[i];
    const item = document.createElement("div");
    item.className = `layer-item${layer.id === layerStack.activeLayerId ? " active" : ""}`;
    item.draggable = true;
    item.dataset.layerId = `${layer.id}`;

    item.addEventListener("dragstart", (e) => {
      draggingLayerId = layer.id;
      item.style.opacity = "0.45";
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", `${layer.id}`);
      }
    });
    item.addEventListener("dragend", () => {
      draggingLayerId = null;
      item.style.opacity = "1";
      for (const node of layerList.querySelectorAll(".layer-item")) {
        node.classList.remove("drag-over-top");
        node.classList.remove("drag-over-bottom");
      }
    });
    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (draggingLayerId == null || draggingLayerId === layer.id) return;
      const rect = item.getBoundingClientRect();
      const isBottom = (e.clientY - rect.top) > rect.height * 0.5;
      item.classList.toggle("drag-over-bottom", isBottom);
      item.classList.toggle("drag-over-top", !isBottom);
    });
    item.addEventListener("dragleave", () => {
      item.classList.remove("drag-over-top");
      item.classList.remove("drag-over-bottom");
    });
    item.addEventListener("drop", (e) => {
      e.preventDefault();
      item.classList.remove("drag-over-top");
      item.classList.remove("drag-over-bottom");
      if (!layerStack || draggingLayerId == null || draggingLayerId === layer.id) return;

      const rect = item.getBoundingClientRect();
      const dropAfter = (e.clientY - rect.top) > rect.height * 0.5;
      const visual = [...layerStack.layers].reverse();
      const srcVisual = visual.findIndex((l) => l.id === draggingLayerId);
      const tgtVisual = visual.findIndex((l) => l.id === layer.id);
      if (srcVisual < 0 || tgtVisual < 0) return;
      let insertVisual = tgtVisual + (dropAfter ? 1 : 0);
      if (srcVisual < insertVisual) insertVisual -= 1;
      if (srcVisual === insertVisual) return;
      const toActual = layerStack.layers.length - 1 - insertVisual;
      if (layerStack.moveLayerToIndex(draggingLayerId, toActual)) {
        renderLayerList();
        markCompositeDirty();
      }
    });

    item.addEventListener("click", () => {
      if (!layerStack || layerStack.activeLayerId === layer.id) return;
      if (filterPreview) clearFilterPreview();
      layerStack.setActiveLayer(layer.id);
      syncActiveLayerImageData();
      renderLayerList();
      syncLayerTransformControls();
      refreshCursorPreview();
    });

    const head = document.createElement("div");
    head.className = "layer-head";

    const vis = document.createElement("input");
    vis.type = "checkbox";
    vis.checked = layer.visible;
    vis.addEventListener("click", (e) => e.stopPropagation());
    vis.addEventListener("change", () => {
      layerStack.setLayerVisibility(layer.id, vis.checked);
      markCompositeDirty();
      renderLayerList();
    });

    const name = document.createElement("span");
    name.className = "layer-name";
    name.textContent = layer.name;
    name.title = "Double click to rename";
    name.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      if (!layerStack) return;
      const input = document.createElement("input");
      input.type = "text";
      input.value = layer.name;
      input.className = "layer-name-edit";
      const finish = (commit) => {
        const next = input.value.trim();
        if (commit && next && layerStack.setLayerName(layer.id, next)) {
          renderLayerList();
          return;
        }
        renderLayerList();
      };
      input.addEventListener("keydown", (ke) => {
        if (ke.key === "Enter") {
          ke.preventDefault();
          finish(true);
        } else if (ke.key === "Escape") {
          ke.preventDefault();
          finish(false);
        }
      });
      input.addEventListener("blur", () => finish(true));
      head.replaceChild(input, name);
      input.focus();
      input.select();
    });

    head.appendChild(vis);
    head.appendChild(name);

    const opacityRow = document.createElement("div");
    opacityRow.className = "layer-opacity";
    const opacityInput = document.createElement("input");
    opacityInput.type = "range";
    opacityInput.min = "0";
    opacityInput.max = "100";
    opacityInput.value = `${Math.round(layer.opacity * 100)}`;
    opacityInput.addEventListener("click", (e) => e.stopPropagation());
    const restoreDraggable = () => {
      item.draggable = true;
      window.removeEventListener("pointerup", restoreDraggable, true);
      window.removeEventListener("mouseup", restoreDraggable, true);
      window.removeEventListener("touchend", restoreDraggable, true);
      window.removeEventListener("touchcancel", restoreDraggable, true);
    };
    opacityInput.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      item.draggable = false;
      window.addEventListener("pointerup", restoreDraggable, true);
    });
    opacityInput.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      item.draggable = false;
      window.addEventListener("mouseup", restoreDraggable, true);
    });
    opacityInput.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      item.draggable = false;
      window.addEventListener("touchend", restoreDraggable, true);
      window.addEventListener("touchcancel", restoreDraggable, true);
    }, { passive: true });
    const opacityOut = document.createElement("output");
    opacityOut.textContent = `${Math.round(layer.opacity * 100)}%`;
    opacityInput.addEventListener("input", () => {
      const value = Math.max(0, Math.min(100, Number(opacityInput.value) || 0));
      opacityOut.textContent = `${value}%`;
      layerStack.setLayerOpacity(layer.id, value / 100);
      markCompositeDirty();
    });
    opacityRow.appendChild(opacityInput);
    opacityRow.appendChild(opacityOut);

    item.appendChild(head);
    item.appendChild(opacityRow);
    layerList.appendChild(item);
  }
  syncLayerTransformControls();
}

function getPerformanceSettings() {
  return {
    polarSafeEnabled: !perfPolarSafeToggle || !!perfPolarSafeToggle.checked,
    polarRowSamples: Math.max(16, Number(perfPolarRowSamples ? perfPolarRowSamples.value : 64) | 0)
  };
}

paintBackend = new PaintBackend({
  sphereRadius: SPHERE_RADIUS,
  getImageData: () => imageData,
  getWidth: () => editCanvas.width,
  getHeight: () => editCanvas.height,
  getStampAnchor: () => stampAnchor,
  getStampSource: () => stampSource
});

cursorPreviewRenderer = new CursorPreviewRenderer({
  canvas: cursorPreviewCanvas,
  ctx: cursorPreviewCtx,
  camera,
  glCanvas,
  sphereRadius: SPHERE_RADIUS,
  math: paintBackend
});

const backendContext = {
  getImageData: () => imageData,
  getWidth: () => editCanvas.width,
  getHeight: () => editCanvas.height,
  getBrushSettings,
  getEraserSettings,
  getBlurSettings,
  getStampSettings,
  getHealingSettings,
  getTexturePaintSettings,
  getFillSettings,
  getSeamSettings,
  getPoleSettings,
  getPerformanceSettings,
  getBrushMask: () => ({ data: brushMaskData, width: brushMaskW, height: brushMaskH }),
  getEraserMask: () => ({ data: eraserMaskData, width: eraserMaskW, height: eraserMaskH }),
  getTexturePaint: () => ({ data: texturePaintData, width: texturePaintW, height: texturePaintH }),
  getStampSource: () => stampSource,
  hasActiveSelection: () => hasActiveSelection(),
  isPixelSelected: (x, y) => isPixelSelectedForActiveLayer(x, y),
  applyStampProjected: (uv, sizePx, strength, softness, smooth, triplanar, options, blendMode, sharpSampling) => {
    const nextOptions = { ...(options || {}) };
    if (hasActiveSelection()) nextOptions.isPixelSelected = (x, y) => isPixelSelectedForActiveLayer(x, y);
    return paintBackend.applyStampProjected(uv, sizePx, strength, softness, smooth, triplanar, nextOptions, blendMode, sharpSampling);
  },
  applyHealingProjected: (uv, sizePx, strength, softness, smooth, triplanar, options, sharpSampling) => {
    const nextOptions = { ...(options || {}) };
    if (hasActiveSelection()) nextOptions.isPixelSelected = (x, y) => isPixelSelectedForActiveLayer(x, y);
    return paintBackend.applyHealingProjected(uv, sizePx, strength, softness, smooth, triplanar, nextOptions, sharpSampling);
  },
  forEachProjectedBrushPixel: (...args) => paintBackend.forEachProjectedBrushPixel(...args),
  sampleBilinearRGBA: (...args) => paintBackend.sampleBilinearRGBA(...args),
  sampleBilinearRGB: (...args) => paintBackend.sampleBilinearRGB(...args),
  offsetOnSphereFast: (...args) => paintBackend.offsetOnSphereFast(...args),
  dirToUvXYZ: (...args) => paintBackend.dirToUvXYZ(...args),
  wrapU: (u) => paintBackend.wrapU(u),
  clamp01: (v) => paintBackend.clamp01(v),
  requestTextureUpload,
  setStatus
};

const toolManager = new ToolManager(backendContext);

function toggleWindowCollapse(el) {
  if (!el) return;
  el.classList.toggle("collapsed");
  updateFloatingLayout();
}

function bindCollapsibleWindow(el) {
  if (!el) return;
  const header = el.querySelector("header");
  if (!header) return;
  header.addEventListener("click", () => toggleWindowCollapse(el));
}

function updateFloatingLayout() {
  if (!filesWindow || !toolsWindow || !toolSettingsPanel) return;
  const gap = 12;
  const top = 12;

  filesWindow.style.top = `${top}px`;
  filesWindow.style.left = `${gap}px`;
  filesWindow.style.right = "auto";

  if (actionsWindow) {
    const filesRectNow = filesWindow.getBoundingClientRect();
    actionsWindow.style.top = `${top}px`;
    actionsWindow.style.left = `${Math.ceil(filesRectNow.right + gap)}px`;
    actionsWindow.style.right = "auto";
  }

  if (orientationWindow) {
    orientationWindow.style.top = `${top}px`;
    orientationWindow.style.right = `${gap}px`;
    orientationWindow.style.left = "auto";
  }

  if (viewportWindow) {
    const ow = orientationWindow ? (orientationWindow.offsetWidth || 136) : 136;
    viewportWindow.style.top = `${top}px`;
    viewportWindow.style.right = `${gap + ow + gap}px`;
    viewportWindow.style.left = "auto";
  }

  if (filtersWindow) {
    const actionsRectNow = actionsWindow ? actionsWindow.getBoundingClientRect() : filesWindow.getBoundingClientRect();
    filtersWindow.style.top = `${top}px`;
    filtersWindow.style.left = `${Math.ceil(actionsRectNow.right + gap)}px`;
    filtersWindow.style.right = "auto";
  }

  if (performanceWindow) {
    const filesRectNow = filesWindow.getBoundingClientRect();
    const filtersRectNow = filtersWindow ? filtersWindow.getBoundingClientRect() : null;
    const actionsRectNow = actionsWindow ? actionsWindow.getBoundingClientRect() : filesRectNow;
    const anchorRect = filtersRectNow || actionsRectNow;
    const viewportRectNow = viewportWindow ? viewportWindow.getBoundingClientRect() : { left: window.innerWidth - gap };
    const perfW = performanceWindow.offsetWidth || 240;
    const candidateX = Math.ceil(anchorRect.right + gap);
    const maxX = Math.floor(viewportRectNow.left - gap - perfW);

    performanceWindow.style.left = "auto";
    performanceWindow.style.right = "auto";

    if (candidateX <= maxX) {
      performanceWindow.style.top = `${top}px`;
      performanceWindow.style.left = `${candidateX}px`;
    } else {
      const rowBottom = Math.max(filesRectNow.bottom, actionsRectNow.bottom, filtersRectNow ? filtersRectNow.bottom : 0);
      performanceWindow.style.top = `${Math.ceil(rowBottom + gap)}px`;
      performanceWindow.style.left = `${gap}px`;
    }
  }

  toolsWindow.style.left = `${gap}px`;
  const toolLeft = gap;
  const toolRight = toolLeft + (toolsWindow.offsetWidth || 78);
  const leftGroupBottoms = [filesWindow, actionsWindow, filtersWindow, performanceWindow]
    .filter(Boolean)
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.right > toolLeft && r.left < toolRight)
    .map((r) => r.bottom);
  const toolsTop = Math.ceil((leftGroupBottoms.length ? Math.max(...leftGroupBottoms) : filesWindow.getBoundingClientRect().bottom) + gap);
  toolsWindow.style.top = `${toolsTop}px`;

  const toolsRect = toolsWindow.getBoundingClientRect();
  toolSettingsPanel.style.top = `${toolsTop}px`;

  const panelWidth = toolSettingsPanel.offsetWidth || 320;
  const minLeft = gap;
  const maxLeft = Math.max(minLeft, window.innerWidth - panelWidth - gap);
  const nextLeft = Math.ceil(toolsRect.right + 8);
  toolSettingsPanel.style.left = `${Math.max(minLeft, Math.min(maxLeft, nextLeft))}px`;
}

function setToolSettingsOpen(open) {
  toolSettingsOpen = !!open;
  if (toolSettingsPanel) {
    toolSettingsPanel.classList.toggle("hidden", !toolSettingsOpen);
  }
  updateFloatingLayout();
}

function setActiveToolMode(mode) {
  if (activeToolMode !== mode) {
    pendingStrokeUV = null;
    layerTransformDrag = null;
  }
  if (mode !== "rotateLayer") {
    pendingRotatePivotPick = false;
  }
  activeToolMode = mode;

  const buttons = [toolBtnBrush, toolBtnEraser, toolBtnBlur, toolBtnStamp, toolBtnHealing, toolBtnLasso, toolBtnMoveLayer, toolBtnRotateLayer, toolBtnTexture, toolBtnFill, toolBtnSeam, toolBtnPole].filter(Boolean);
  for (const btn of buttons) {
    btn.classList.toggle("active", btn.dataset.toolMode === mode);
  }

  if (toolSettingsTitle) {
    const label =
      mode === "brush" ? "Brush" :
      mode === "eraser" ? "Eraser" :
      mode === "blur" ? "Blur" :
      mode === "stamp" ? "Stamp" :
      mode === "healing" ? "Healing" :
      mode === "lasso" ? "Lasso" :
      mode === "moveLayer" ? "Move Layer" :
      mode === "rotateLayer" ? "Rotate Layer" :
      mode === "texture" ? "Texture Painting" :
      mode === "fill" ? "Fill" :
      mode === "seam" ? "Seam" :
      mode === "pole" ? "Pole" : "Tool";
    toolSettingsTitle.textContent = `Tool Settings: ${label}`;
  }

  if (settingsBrush) settingsBrush.classList.toggle("hidden", mode !== "brush");
  if (settingsEraser) settingsEraser.classList.toggle("hidden", mode !== "eraser");
  if (settingsBlur) settingsBlur.classList.toggle("hidden", mode !== "blur");
  if (settingsStamp) settingsStamp.classList.toggle("hidden", mode !== "stamp");
  if (settingsHealing) settingsHealing.classList.toggle("hidden", mode !== "healing");
  if (settingsLasso) settingsLasso.classList.toggle("hidden", mode !== "lasso");
  if (settingsMoveLayer) settingsMoveLayer.classList.toggle("hidden", mode !== "moveLayer");
  if (settingsRotateLayer) settingsRotateLayer.classList.toggle("hidden", mode !== "rotateLayer");
  if (settingsTexture) settingsTexture.classList.toggle("hidden", mode !== "texture");
  if (settingsFill) settingsFill.classList.toggle("hidden", mode !== "fill");
  if (settingsSeam) settingsSeam.classList.toggle("hidden", mode !== "seam");
  if (settingsPole) settingsPole.classList.toggle("hidden", mode !== "pole");

  if (mode === "brush" || mode === "eraser" || mode === "blur" || mode === "stamp" || mode === "healing" || mode === "lasso" || mode === "moveLayer" || mode === "rotateLayer" || mode === "texture" || mode === "fill") {
    toolSelect.value = mode;
  }

  if (mode === "seam") {
    setStatus("Seam mode: tune parameters and click Apply Seam Blend.");
  } else if (mode === "pole") {
    setStatus("Pole mode: tune parameters and click Apply Pole Blend.");
  } else if (mode === "fill") {
    setStatus("Fill mode: click to flood fill area on active layer.");
  } else if (mode === "eraser") {
    setStatus("Eraser mode: paint to erase on active layer.");
  } else if (mode === "healing") {
    setStatus("Healing mode: pick source, then paint to blend patch into surroundings.");
  } else if (mode === "lasso") {
    setStatus("Lasso mode: click to add points, close selection, then copy/paste.");
  } else if (mode === "moveLayer") {
    setStatus("Move Layer mode: drag sphere to move active layer.");
  } else if (mode === "rotateLayer") {
    setStatus("Rotate Layer mode: drag around pivot to rotate active layer.");
  }

  if (mode === "moveLayer" || mode === "rotateLayer") {
    syncLayerTransformControls();
  }
  refreshCursorPreview();
}
function setStatus(text) {
  statusEl.textContent = text;
}

function linearToSrgb(v) {
  const x = Math.max(0, Math.min(1, v));
  if (x <= 0.0031308) {
    return x * 12.92;
  }
  return 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}


function srgbToLinear(v) {
  const x = Math.max(0, Math.min(1, v));
  if (x <= 0.04045) {
    return x / 12.92;
  }
  return Math.pow((x + 0.055) / 1.055, 2.4);
}
function setViewMode(mode) {
  controls.rotateSpeed = mode === "outside" ? 0.28 : -0.28;
  if (mode === "inside") {
    controls.minDistance = 0.01;
    controls.maxDistance = 9.8;
    if (camera.position.length() > 9.8) {
      camera.position.set(0, 0, 0.01);
    }
    return;
  }

  controls.minDistance = 10.5;
  controls.maxDistance = 60;
  if (camera.position.length() < 10.5) {
    camera.position.set(0, 0, 22);
  }
}

function applyPreviewExposure() {
  const exposure = Number(exposureSlider.value);
  sphere.material.color.setScalar(exposure);
  sphere.material.needsUpdate = true;
  exposureOut.textContent = `${exposure.toFixed(2)}x`;
}

function applyViewportBackground() {
  const hex = viewportBg && viewportBg.value ? viewportBg.value : "#444b55";
  renderer.setClearColor(hex, 1);
}
function updateOutputs() {
  if (brushSizeOut) brushSizeOut.textContent = brushSize.value;
  if (brushStrengthOut) brushStrengthOut.textContent = `${brushStrength.value}%`;
  if (brushSoftnessOut) brushSoftnessOut.textContent = `${brushSoftness.value}%`;
  if (brushRotationOut) brushRotationOut.textContent = `${brushRotation ? brushRotation.value : 0} deg`;
  if (eraserSizeOut) eraserSizeOut.textContent = `${eraserSize ? eraserSize.value : brushSize.value}`;
  if (eraserStrengthOut) eraserStrengthOut.textContent = `${eraserStrength ? eraserStrength.value : brushStrength.value}%`;
  if (eraserSoftnessOut) eraserSoftnessOut.textContent = `${eraserSoftness ? eraserSoftness.value : brushSoftness.value}%`;

  if (blurSizeOut) blurSizeOut.textContent = blurSize.value;
  if (blurStrengthOut) blurStrengthOut.textContent = `${blurStrength.value}%`;
  if (blurSoftnessOut) blurSoftnessOut.textContent = `${blurSoftness.value}%`;
  if (blurQualityOut) {
    const q = Math.max(1, Math.min(3, Number(blurQuality ? blurQuality.value : 2)));
    blurQualityOut.textContent = q === 1 ? "Low" : q === 3 ? "High" : "Medium";
  }

  if (stampSizeOut) stampSizeOut.textContent = stampSize.value;
  if (stampStrengthOut) stampStrengthOut.textContent = `${stampStrength.value}%`;
  if (stampSoftnessOut) stampSoftnessOut.textContent = `${stampSoftness.value}%`;
  if (stampSmoothOut) stampSmoothOut.textContent = `${stampSmooth.value}%`;
  if (healingSizeOut) healingSizeOut.textContent = `${healingSize ? healingSize.value : stampSize.value}`;
  if (healingStrengthOut) healingStrengthOut.textContent = `${healingStrength ? healingStrength.value : stampStrength.value}%`;
  if (healingSoftnessOut) healingSoftnessOut.textContent = `${healingSoftness ? healingSoftness.value : stampSoftness.value}%`;
  if (healingSmoothOut) healingSmoothOut.textContent = `${healingSmooth ? healingSmooth.value : stampSmooth.value}%`;

  if (texPaintSizeOut) texPaintSizeOut.textContent = texPaintSize.value;
  if (texPaintSoftnessOut) texPaintSoftnessOut.textContent = `${texPaintSoftness.value}%`;
  if (texPaintOpacityOut) texPaintOpacityOut.textContent = `${texPaintOpacity.value}%`;
  if (texPaintRotationOut) texPaintRotationOut.textContent = `${texPaintRotation ? texPaintRotation.value : 0} deg`;
  if (fillToleranceOut) fillToleranceOut.textContent = `${Math.max(0, Math.min(255, Number(fillTolerance ? fillTolerance.value : 12) | 0))}`;
  if (fillOpacityOut) fillOpacityOut.textContent = `${Math.max(1, Math.min(100, Number(fillOpacity ? fillOpacity.value : 100) | 0))}%`;

  if (seamWidthOut) seamWidthOut.textContent = seamWidth.value;
  if (seamStrengthOut) seamStrengthOut.textContent = `${seamStrength.value}%`;
  if (poleWidthOut) poleWidthOut.textContent = poleWidth.value;
  if (poleStrengthOut) poleStrengthOut.textContent = `${poleStrength.value}%`;
  const perfTarget = Math.max(20, Number(perfTargetFps ? perfTargetFps.value : 45) | 0);
  if (perfMinFps) {
    perfMinFps.max = `${perfTarget}`;
    if (Number(perfMinFps.value) > perfTarget) perfMinFps.value = `${perfTarget}`;
  }
  if (perfTargetFpsOut) perfTargetFpsOut.textContent = `${perfTarget}`;
  if (perfMinFpsOut) perfMinFpsOut.textContent = `${Math.max(12, Number(perfMinFps ? perfMinFps.value : 24) | 0)}`;
  if (perfMaxSpacingBoostOut) {
    const boost = Math.max(100, Number(perfMaxSpacingBoost ? perfMaxSpacingBoost.value : 160) | 0);
    perfMaxSpacingBoostOut.textContent = `${(boost / 100).toFixed(2)}x`;
  }
  if (perfPolarRowSamplesOut) {
    perfPolarRowSamplesOut.textContent = `${Math.max(16, Number(perfPolarRowSamples ? perfPolarRowSamples.value : 64) | 0)}`;
  }
  if (gaussRadiusOut) gaussRadiusOut.textContent = `${Math.max(0, Number(gaussRadius ? gaussRadius.value : 0) | 0)}`;
  if (ccBrightnessOut) ccBrightnessOut.textContent = `${Number(ccBrightness ? ccBrightness.value : 0) | 0}`;
  if (ccContrastOut) ccContrastOut.textContent = `${Number(ccContrast ? ccContrast.value : 0) | 0}`;
  if (ccSaturationOut) ccSaturationOut.textContent = `${Math.max(0, Number(ccSaturation ? ccSaturation.value : 100) | 0)}%`;
  if (toneCyanRedOut) toneCyanRedOut.textContent = `${Number(toneCyanRed ? toneCyanRed.value : 0) | 0}`;
  if (toneMagentaGreenOut) toneMagentaGreenOut.textContent = `${Number(toneMagentaGreen ? toneMagentaGreen.value : 0) | 0}`;
  if (toneYellowBlueOut) toneYellowBlueOut.textContent = `${Number(toneYellowBlue ? toneYellowBlue.value : 0) | 0}`;
}
function drawAxis2D(ctx, center, axis, color, label) {
  const scale = 38;
  const x = center + axis.x * scale;
  const y = center - axis.y * scale;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(center, center);
  ctx.lineTo(x, y);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "12px Segoe UI";
  ctx.fillText(label, x + 5, y - 4);
}

function updateOrientationWidget() {
  if (!orientationCtx || !orientationCanvas) return;

  const ctx = orientationCtx;
  const w = orientationCanvas.width;
  const h = orientationCanvas.height;
  const c = Math.floor(Math.min(w, h) * 0.5);

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(10, 15, 25, 0.96)";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(126, 140, 166, 0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(c, c, 40, 0, Math.PI * 2);
  ctx.stroke();

  orientQuatInv.copy(camera.quaternion).invert();

  orientVec.x.set(1, 0, 0).applyQuaternion(orientQuatInv).normalize();
  orientVec.y.set(0, 1, 0).applyQuaternion(orientQuatInv).normalize();
  orientVec.z.set(0, 0, 1).applyQuaternion(orientQuatInv).normalize();

  const axes = [
    { axis: orientVec.x, color: "#ff6d6d", label: "X" },
    { axis: orientVec.y, color: "#7dff86", label: "Y" },
    { axis: orientVec.z, color: "#6ea8ff", label: "Z" }
  ].sort((a, b) => a.axis.z - b.axis.z);

  for (const it of axes) {
    drawAxis2D(ctx, c, it.axis, it.color, it.label);
  }
}
function getIntersection(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  pointer.set(x, y);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(sphere, false)[0] || null;
  if (!hit || !hit.uv) return hit;
  hit.uv.x = paintBackend.wrapU(1 - hit.uv.x);
  return hit;
}

function makeCircleGeometry(segments = 64) {
  const positions = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    positions.push(Math.cos(a), Math.sin(a), 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return g;
}

const brushPreview = new THREE.LineLoop(
  makeCircleGeometry(64),
  new THREE.LineBasicMaterial({ color: 0xff5f5f, transparent: true, opacity: 0.9, depthTest: false })
);
brushPreview.visible = false;
brushPreview.renderOrder = 1000;
scene.add(brushPreview);

function getActiveToolSizePx() {
  if (activeToolMode === "eraser") return Math.max(2, Number(eraserSize ? eraserSize.value : brushSize.value));
  if (activeToolMode === "blur") return Math.max(2, Number(blurSize.value));
  if (activeToolMode === "stamp") return Math.max(2, Number(stampSize.value));
  if (activeToolMode === "healing") return Math.max(2, Number(healingSize ? healingSize.value : stampSize.value));
  if (activeToolMode === "texture") return Math.max(2, Number(texPaintSize.value));
  return Math.max(2, Number(brushSize.value));
}

function isBufferedStrokeToolMode(mode) {
  return mode === "blur" || mode === "stamp" || mode === "healing";
}

function getEffectiveStrokeSpacingPx() {
  const base = Math.max(1, getActiveToolSizePx() * 0.22);
  if (!isBufferedStrokeToolMode(activeToolMode)) return base;
  return base * adaptiveSpacingMultiplier;
}
function resizeCursorPreviewCanvas() {
  if (!cursorPreviewRenderer) return;
  cursorPreviewRenderer.resize();
}

function clearCursorPreview() {
  if (!cursorPreviewRenderer) return;
  cursorPreviewRenderer.clear();
}

function getToolRotationRad() {
  if (activeToolMode === "texture") {
    return (Number(texPaintRotation ? texPaintRotation.value : 0) * Math.PI) / 180;
  }
  if (activeToolMode === "brush") {
    return (Number(brushRotation ? brushRotation.value : 0) * Math.PI) / 180;
  }
  return 0;
}

function refreshCursorPreview() {
  if (lastPreviewHit) {
    scheduleBrushPreview(lastPreviewHit);
  } else {
    clearCursorPreview();
  }
}

function scheduleBrushPreview(hit) {
  pendingPreviewHit = hit || null;
  if (previewRafId) return;
  previewRafId = requestAnimationFrame(() => {
    previewRafId = 0;
    updateBrushPreview(pendingPreviewHit);
  });
}

function cancelScheduledBrushPreview() {
  if (previewRafId) {
    cancelAnimationFrame(previewRafId);
    previewRafId = 0;
  }
  pendingPreviewHit = null;
}

function updateBrushPreview(hit) {
  if (!previewToggle || !previewToggle.checked) {
    brushPreview.visible = false;
    clearCursorPreview();
    lastPreviewHit = hit || null;
    return;
  }

  if (!getWorkingImageData()) {
    brushPreview.visible = false;
    clearCursorPreview();
    lastPreviewHit = null;
    return;
  }
  if ((!hit || !hit.uv) && activeToolMode !== "rotateLayer") {
    brushPreview.visible = false;
    if (lassoClosed) {
      drawLassoOverlay(null);
    } else {
      clearCursorPreview();
    }
    lastPreviewHit = hit || null;
    return;
  }

  brushPreview.visible = false;
  lastPreviewHit = hit || null;
  if (activeToolMode === "lasso") {
    drawLassoOverlay(hit);
    return;
  }
  if (activeToolMode === "rotateLayer") {
    drawRotatePivotOverlay();
    if (lassoClosed) drawLassoOverlay(null, true);
    return;
  }
  if (activeToolMode === "moveLayer") {
    clearCursorPreview();
    if (lassoClosed) drawLassoOverlay(null, true);
    return;
  }
  cursorPreviewRenderer.draw(hit, {
    previewEnabled: !!(previewToggle && previewToggle.checked),
    imageLoaded: !!getWorkingImageData(),
    activeToolMode,
    activeToolSizePx: getActiveToolSizePx(),
    mapHeight: editCanvas.height,
    rotationRad: getToolRotationRad(),
    brushShape: brushShape ? brushShape.value : "circle",
    brushColor: brushColor ? brushColor.value : "#ffffff",
    brushSoftness: Number(brushSoftness.value) / 100,
    brushStrength: Number(brushStrength.value) / 100,
    eraserSoftness: Number(eraserSoftness ? eraserSoftness.value : brushSoftness.value) / 100,
    eraserStrength: Number(eraserStrength ? eraserStrength.value : brushStrength.value) / 100,
    blurSoftness: Number(blurSoftness.value) / 100,
    blurStrength: Number(blurStrength.value) / 100,
    stampSoftness: Number(stampSoftness.value) / 100,
    stampStrength: Number(stampStrength.value) / 100,
    healingSoftness: Number(healingSoftness ? healingSoftness.value : stampSoftness.value) / 100,
    healingStrength: Number(healingStrength ? healingStrength.value : stampStrength.value) / 100,
    texSoftness: Number(texPaintSoftness.value) / 100,
    texOpacity: Number(texPaintOpacity.value) / 100,
    brushMaskPreviewCanvas,
    eraserMaskPreviewCanvas,
    texturePaintPreviewCanvas
  });
  if (lassoClosed) drawLassoOverlay(null, true);
}

function requestTextureUpload() {
  if (textureUploadBatchDepth > 0) {
    textureUploadPending = true;
    return;
  }
  markCompositeDirty();
  textureDirty = true;
}

function beginTextureUploadBatch() {
  textureUploadBatchDepth++;
}

function endTextureUploadBatch() {
  if (textureUploadBatchDepth > 0) {
    textureUploadBatchDepth--;
  }
  if (textureUploadBatchDepth === 0 && textureUploadPending) {
    textureUploadPending = false;
    markCompositeDirty();
    textureDirty = true;
  }
}

function pushUndo(force = false) {
  if (!imageData || !layerStack) return;
  const active = layerStack.getActiveLayer();
  if (!active) return;
  const now = performance.now();
  if (!force && now - lastPushTs < 180) return;
  lastPushTs = now;

  const copy = new Uint8ClampedArray(imageData.data);
  undoStack.push({ layerId: active.id, data: copy });
  if (undoStack.length > 15) undoStack.shift();
}

function hexToRgb(hex) {
  const h = (hex || "#ffffff").replace("#", "");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

async function loadPngMaskFromFile(file) {
  if (!file) return null;
  const img = await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      resolve(im);
    };
    im.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load PNG"));
    };
    im.src = url;
  });

  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const cx = c.getContext("2d", { willReadFrequently: true });
  cx.clearRect(0, 0, c.width, c.height);
  cx.drawImage(img, 0, 0);
  const image = cx.getImageData(0, 0, c.width, c.height);
  return { data: image.data, width: c.width, height: c.height, canvas: c };
}

function applyBrushAtUV(uv) {
  if (!imageData) return;
  if (activeToolMode === "seam" || activeToolMode === "pole") return;
  const activeLayer = layerStack ? layerStack.getActiveLayer() : null;
  const mappedUv = mapDisplayUvToLayerUv(activeLayer, uv);
  toolManager.apply(activeToolMode, mappedUv);
}
function paintStroke(uv) {
  beginTextureUploadBatch();
  try {
    if (!lastUV) {
      applyBrushAtUV(uv);
      lastUV = uv.clone();
      return;
    }

    let dx = uv.x - lastUV.x;
    if (dx > 0.5) dx -= 1;
    if (dx < -0.5) dx += 1;
    const dy = uv.y - lastUV.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const spacingPx = getEffectiveStrokeSpacingPx();
    const steps = Math.max(1, Math.ceil(dist * Math.max(editCanvas.width, editCanvas.height) / spacingPx));

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const iu = paintBackend.wrapU(lastUV.x + dx * t);
      const iv = paintBackend.clamp01(lastUV.y + dy * t);
      applyBrushAtUV(new THREE.Vector2(iu, iv));
    }

    lastUV.copy(uv);
  } finally {
    endTextureUploadBatch();
  }
}

function queueBufferedStroke(uv) {
  if (!pendingStrokeUV) {
    pendingStrokeUV = uv.clone();
    return;
  }
  pendingStrokeUV.copy(uv);
}

function flushBufferedStroke(now, force = false) {
  if (!pendingStrokeUV || !isPainting || !imageData) return;
  if (!force && now - lastBufferedPaintTs < bufferedPaintIntervalMs) return;
  paintStroke(pendingStrokeUV);
  lastBufferedPaintTs = now;
  pendingStrokeUV = null;
}

function applySeamBlend() {
  if (!imageData) return;
  pushUndo();
  toolManager.applyGlobal("seam");
}

function applyPoleBlend() {
  if (!imageData) return;
  pushUndo();
  toolManager.applyGlobal("pole");
}

function createImageDataFromHdr(parsed) {
  const { width, height, rgbFloat } = parsed;
  const out = new ImageData(width, height);

  for (let i = 0, j = 0; i < rgbFloat.length; i += 3, j += 4) {
    const r = linearToSrgb(rgbFloat[i + 0]);
    const g = linearToSrgb(rgbFloat[i + 1]);
    const b = linearToSrgb(rgbFloat[i + 2]);

    out.data[j + 0] = Math.round(r * 255);
    out.data[j + 1] = Math.round(g * 255);
    out.data[j + 2] = Math.round(b * 255);
    out.data[j + 3] = 255;
  }

  return out;
}

function initializeCanvasEditingState() {
  filterPreview = null;
  if (gaussPreviewToggle) gaussPreviewToggle.checked = false;
  if (ccPreviewToggle) ccPreviewToggle.checked = false;
  if (tonePreviewToggle) tonePreviewToggle.checked = false;
  const loadedImageData = editCtx.getImageData(0, 0, editCanvas.width, editCanvas.height);
  layerStack = new LayerStack(editCanvas.width, editCanvas.height);
  layerStack.resetFromBaseImage(loadedImageData);
  syncActiveLayerImageData();
  compositedImageData = new ImageData(editCanvas.width, editCanvas.height);
  layerStack.composite(compositedImageData);
  baseImageData = new Uint8ClampedArray(compositedImageData.data);
  editCtx.putImageData(compositedImageData, 0, 0);
  renderLayerList();

  if (texture) texture.dispose();
  texture = new THREE.CanvasTexture(editCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.repeat.x = -1;
  texture.offset.x = 1;
  texture.needsUpdate = true;

  sphere.material.map = texture;
  sphere.material.needsUpdate = true;
  undoStack = [];
  stampSource = null;
  stampAnchor = null;
  lassoPointsUV = [];
  lassoClosed = false;
  lassoClipboardImageData = null;
  lassoSelectionMask = null;
  lassoSelectionInverted = false;
  bumpLassoSelectionRevision();
  textureDirty = false;
  compositeDirty = false;
  textureUploadPending = false;
  textureUploadBatchDepth = 0;
  refreshCursorPreview();
}

function createSolidHdrFloat(width, height, rgb, alpha01) {
  const out = new Float32Array(width * height * 3);
  const r = srgbToLinear((rgb[0] / 255) * alpha01);
  const g = srgbToLinear((rgb[1] / 255) * alpha01);
  const b = srgbToLinear((rgb[2] / 255) * alpha01);
  for (let i = 0; i < out.length; i += 3) {
    out[i + 0] = r;
    out[i + 1] = g;
    out[i + 2] = b;
  }
  return out;
}

function createNewCanvas(width, height, colorHex, alpha01) {
  const baseW = Math.max(2, Math.min(CREATE_MAX_DIM, Math.round(width)));
  const baseH = Math.max(2, Math.min(CREATE_MAX_DIM, Math.round(height)));
  const scale = baseW > WORK_MAX_WIDTH ? WORK_MAX_WIDTH / baseW : 1;
  const workW = Math.max(1, Math.round(baseW * scale));
  const workH = Math.max(1, Math.round(baseH * scale));
  const rgb = hexToRgb(colorHex || "#ffffff");

  editCanvas.width = workW;
  editCanvas.height = workH;
  editCtx.clearRect(0, 0, workW, workH);
  editCtx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Math.max(0, Math.min(1, alpha01)).toFixed(4)})`;
  editCtx.fillRect(0, 0, workW, workH);

  loadedFromHdr = true;
  hdrOriginalWidth = baseW;
  hdrOriginalHeight = baseH;
  hdrOriginalFloat = createSolidHdrFloat(baseW, baseH, rgb, Math.max(0, Math.min(1, alpha01)));
  currentBaseName = "new_canvas";

  initializeCanvasEditingState();
  setStatus(`Created new canvas: ${baseW}x${baseH} (working ${workW}x${workH})`);
}

async function loadTextureFromFile(file) {
  const isHdr = /\.hdr$/i.test(file.name);
  loadedFromHdr = isHdr;
  currentBaseName = file.name.replace(/\.[^.]+$/, "") || "pano";

  if (isHdr) {
    if (!window.HDRjs || typeof window.HDRjs.read !== "function") {
      throw new Error("HDR loader not found (HDRjs).");
    }

    const buf = new Uint8Array(await file.arrayBuffer());
    const parsed = window.HDRjs.read(buf);
    if (typeof parsed === "string") {
      throw new Error(`HDR parse error: ${parsed}`);
    }

    hdrOriginalFloat = parsed.rgbFloat;
    hdrOriginalWidth = parsed.width;
    hdrOriginalHeight = parsed.height;

    const hdrData = createImageDataFromHdr(parsed);
    const scale = parsed.width > WORK_MAX_WIDTH ? WORK_MAX_WIDTH / parsed.width : 1;

    editCanvas.width = Math.round(parsed.width * scale);
    editCanvas.height = Math.round(parsed.height * scale);

    const tmp = document.createElement("canvas");
    tmp.width = parsed.width;
    tmp.height = parsed.height;
    tmp.getContext("2d").putImageData(hdrData, 0, 0);

    editCtx.clearRect(0, 0, editCanvas.width, editCanvas.height);
    editCtx.drawImage(tmp, 0, 0, editCanvas.width, editCanvas.height);
  } else {
    hdrOriginalFloat = null;
    hdrOriginalWidth = 0;
    hdrOriginalHeight = 0;
    const img = await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };
      image.src = url;
    });

    const scale = img.width > WORK_MAX_WIDTH ? WORK_MAX_WIDTH / img.width : 1;
    editCanvas.width = Math.round(img.width * scale);
    editCanvas.height = Math.round(img.height * scale);

    editCtx.clearRect(0, 0, editCanvas.width, editCanvas.height);
    editCtx.drawImage(img, 0, 0, editCanvas.width, editCanvas.height);
  }

  initializeCanvasEditingState();

  const srcNote = loadedFromHdr ? " (neutral HDR preview)" : "";
  setStatus(`Loaded: ${file.name} (${editCanvas.width}x${editCanvas.height})${srcNote}`);
}

function onPointerDown(e) {
  if (e.button !== 0) return;

  if (e.altKey) {
    isPainting = false;
    lastUV = null;
    controls.enabled = true;
    return;
  }

  if (!imageData) return;

  e.preventDefault();
  controls.enabled = false;

  const hit = getIntersection(e);
  if (!hit || !hit.uv) return;

  if (activeToolMode === "seam" || activeToolMode === "pole") {
    controls.enabled = true;
    return;
  }

  if (filterPreview) clearFilterPreview();

  if (activeToolMode === "lasso") {
    if (pendingRotatePivotPick) pendingRotatePivotPick = false;
    if (!lassoClosed) {
      if (lassoPointsUV.length >= 3 && isClickNearFirstLassoPoint(e)) {
          closeLassoSelection();
          isPainting = false;
          lastUV = null;
          pendingStrokeUV = null;
          controls.enabled = true;
          return;
      }
      lassoPointsUV.push(hit.uv.clone());
      setStatus(`Lasso point ${lassoPointsUV.length} added.`);
      refreshCursorPreview();
    } else {
      setStatus("Lasso already closed. Copy/Paste or clear selection.");
    }
    isPainting = false;
    lastUV = null;
    pendingStrokeUV = null;
    controls.enabled = true;
    return;
  }

  if (activeToolMode === "moveLayer" || activeToolMode === "rotateLayer") {
    const active = layerStack ? layerStack.getActiveLayer() : null;
    if (!active) {
      controls.enabled = true;
      return;
    }
    if (activeToolMode === "rotateLayer" && pendingRotatePivotPick) {
      layerStack.setLayerTransform(active.id, {
        pivotU: wrapU(hit.uv.x),
        pivotV: clamp01(hit.uv.y)
      });
      invalidateLayerSelectionMaskCache();
      pendingRotatePivotPick = false;
      syncLayerTransformControls();
      markCompositeDirty();
      textureDirty = true;
      setStatus("Rotate Layer: pivot set from cursor.");
      refreshCursorPreview();
      controls.enabled = true;
      return;
    }

    const pivot = getLayerPivotUv(active);
    const startAngle = Math.atan2(hit.uv.y - pivot.y, shortestSignedDelta(hit.uv.x, pivot.x));
    layerTransformDrag = {
      mode: activeToolMode,
      layerId: active.id,
      startUv: hit.uv.clone(),
      startOffsetU: active.offsetU || 0,
      startOffsetV: active.offsetV || 0,
      startRotationRad: active.rotationRad || 0,
      pivotU: pivot.x,
      pivotV: pivot.y,
      startAngle,
      didTransform: false
    };
    isPainting = false;
    lastUV = null;
    pendingStrokeUV = null;
    return;
  }

  if ((activeToolMode === "stamp" || activeToolMode === "healing") && pendingStampSource) {
    const activeLayer = layerStack ? layerStack.getActiveLayer() : null;
    stampSource = mapDisplayUvToLayerUv(activeLayer, hit.uv);
    pendingStampSource = false;
    if (stampHint) stampHint.textContent = `Source picked: u=${stampSource.x.toFixed(3)}, v=${stampSource.y.toFixed(3)}`;
    if (healingHint) healingHint.textContent = `Source picked: u=${stampSource.x.toFixed(3)}, v=${stampSource.y.toFixed(3)}`;
    setStatus(`${activeToolMode === "healing" ? "Healing" : "Stamp"}: source picked, now paint on sphere.`);
    return;
  }

  if (activeToolMode === "fill") {
    pushUndo();
    applyBrushAtUV(hit.uv);
    isPainting = false;
    lastUV = null;
    pendingStrokeUV = null;
    controls.enabled = true;
    return;
  }

  pushUndo();
  isPainting = true;
  lastUV = hit.uv.clone();
  pendingStrokeUV = null;
  lastBufferedPaintTs = performance.now();

  if (activeToolMode === "stamp" || activeToolMode === "healing") {
    const activeLayer = layerStack ? layerStack.getActiveLayer() : null;
    stampAnchor = mapDisplayUvToLayerUv(activeLayer, hit.uv);
  }

  paintStroke(hit.uv);
}

function onPointerMove(e) {
  const hit = getIntersection(e);
  scheduleBrushPreview(hit);

  if (layerTransformDrag && hit && hit.uv && layerStack) {
    const layer = layerStack.getLayerById(layerTransformDrag.layerId);
    if (!layer) return;
    if (layerTransformDrag.mode === "moveLayer") {
      const du = shortestSignedDelta(hit.uv.x, layerTransformDrag.startUv.x);
      const dv = hit.uv.y - layerTransformDrag.startUv.y;
      const nextOffsetU = layerTransformDrag.startOffsetU - du;
      const nextOffsetV = layerTransformDrag.startOffsetV - dv;
      const moved = Math.abs(nextOffsetU - (layer.offsetU || 0)) > 1e-9 || Math.abs(nextOffsetV - (layer.offsetV || 0)) > 1e-9;
      if (!moved) return;
      layerStack.setLayerTransform(layer.id, {
        offsetU: nextOffsetU,
        offsetV: nextOffsetV
      });
      layerTransformDrag.didTransform = true;
      invalidateLayerSelectionMaskCache();
      markCompositeDirty();
      textureDirty = true;
      syncLayerTransformControls();
      return;
    }
    if (layerTransformDrag.mode === "rotateLayer") {
      const pivotU = layerTransformDrag.pivotU;
      const pivotV = layerTransformDrag.pivotV;
      const angle = Math.atan2(hit.uv.y - pivotV, shortestSignedDelta(hit.uv.x, pivotU));
      const delta = angle - layerTransformDrag.startAngle;
      const nextRot = layerTransformDrag.startRotationRad - delta;
      if (Math.abs(nextRot - (layer.rotationRad || 0)) <= 1e-9) return;
      layerStack.setLayerTransform(layer.id, {
        rotationRad: nextRot
      });
      layerTransformDrag.didTransform = true;
      invalidateLayerSelectionMaskCache();
      markCompositeDirty();
      textureDirty = true;
      syncLayerTransformControls();
      return;
    }
  }

  if (!isPainting || !imageData || !hit || !hit.uv) return;
  if (isBufferedStrokeToolMode(activeToolMode)) {
    queueBufferedStroke(hit.uv);
    return;
  }
  paintStroke(hit.uv);
}

function onPointerLeave() {
  brushPreview.visible = false;
  cancelScheduledBrushPreview();
  flushBufferedStroke(performance.now(), true);
  if (activeToolMode === "lasso" && lassoPointsUV.length > 0) {
    drawLassoOverlay(null);
  } else if (activeToolMode === "rotateLayer") {
    drawRotatePivotOverlay();
  } else {
    clearCursorPreview();
    lastPreviewHit = null;
  }
  pendingStrokeUV = null;
}

function onPointerUp() {
  flushBufferedStroke(performance.now(), true);
  if (layerTransformDrag && layerTransformDrag.didTransform && layerStack) {
    const bakedLayer = layerStack.getLayerById(layerTransformDrag.layerId);
    if (bakedLayer) {
      pushUndo(true);
      if (layerStack.bakeLayerTransform(bakedLayer.id)) {
        syncActiveLayerImageData();
        syncLayerTransformControls();
        invalidateLayerSelectionMaskCache();
        markCompositeDirty();
        textureDirty = true;
      }
    }
  }
  isPainting = false;
  layerTransformDrag = null;
  lastUV = null;
  stampAnchor = null;
  pendingStrokeUV = null;
  controls.enabled = true;
}

function undo() {
  if (!layerStack || undoStack.length === 0) return;
  const prev = undoStack.pop();
  const layer = layerStack.getLayerById(prev.layerId);
  if (!layer) return;
  layer.imageData.data.set(prev.data);
  if (layerStack.activeLayerId === prev.layerId) {
    imageData = layer.imageData;
  }
  markCompositeDirty();
  if (texture) texture.needsUpdate = true;
}

function savePng() {
  if (!getWorkingImageData()) return;
  if (filterPreview) clearFilterPreview();
  flushCompositeNow();
  savePngFile({
    editCanvas,
    baseName: currentBaseName
  });
}

async function saveHdrOriginalSize() {
  if (filterPreview) clearFilterPreview();
  flushCompositeNow();
  const working = getWorkingImageData();
  await saveHdrOriginalSizeFile({
    loadedFromHdr,
    hdrOriginalFloat,
    baseImageData,
    imageData: working,
    mapWidth: editCanvas.width,
    mapHeight: editCanvas.height,
    hdrOriginalWidth,
    hdrOriginalHeight,
    baseName: currentBaseName,
    srgbToLinear,
    setStatus
  });
}

function updateCreateCanvasPreview() {
  if (!createCanvasWidth || !createCanvasHeight || !createCanvasOrientation) return;
  const widthRaw = Number(createCanvasWidth.value);
  const width = Number.isFinite(widthRaw) && widthRaw > 0 ? widthRaw : 4096;
  const orientation = createCanvasOrientation.value === "portrait" ? "portrait" : "landscape";
  const height = orientation === "portrait"
    ? Math.round(width * 2)
    : Math.round(width / 2);
  const workingScale = width > WORK_MAX_WIDTH ? WORK_MAX_WIDTH / width : 1;
  const workingW = Math.max(1, Math.round(width * workingScale));
  const workingH = Math.max(1, Math.round(height * workingScale));

  createCanvasHeight.value = `${height}`;
  if (createCanvasAlphaOut) {
    const alpha = Math.max(0, Math.min(100, Number(createCanvasAlpha ? createCanvasAlpha.value : 100) | 0));
    createCanvasAlphaOut.textContent = `${alpha}%`;
  }
  if (createCanvasWorkingOut) {
    createCanvasWorkingOut.textContent = `Working resolution: ${workingW}x${workingH}`;
  }
}

function openCreateCanvasModal() {
  if (!createCanvasModal) return;
  createCanvasModal.classList.remove("hidden");
  updateCreateCanvasPreview();
}

function closeCreateCanvasModal() {
  if (!createCanvasModal) return;
  createCanvasModal.classList.add("hidden");
}

function onResize() {
  const w = glCanvas.clientWidth;
  const h = glCanvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  resizeCursorPreviewCanvas();
  refreshCursorPreview();
  updateFloatingLayout();
}

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  try {
    await loadTextureFromFile(file);
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  } finally {
    fileInput.value = "";
  }
});

if (loadHdrBtn) {
  loadHdrBtn.addEventListener("click", () => {
    if (fileInput) fileInput.click();
  });
}

if (createNewBtn) {
  createNewBtn.addEventListener("click", () => {
    openCreateCanvasModal();
  });
}

if (createCanvasWidth) createCanvasWidth.addEventListener("input", updateCreateCanvasPreview);
if (createCanvasOrientation) createCanvasOrientation.addEventListener("change", updateCreateCanvasPreview);
if (createCanvasAlpha) createCanvasAlpha.addEventListener("input", updateCreateCanvasPreview);
if (createCanvasCancelBtn) createCanvasCancelBtn.addEventListener("click", closeCreateCanvasModal);
if (createCanvasModal) {
  createCanvasModal.addEventListener("pointerdown", (e) => {
    if (createCanvasColor && e.target !== createCanvasColor && document.activeElement === createCanvasColor) {
      createCanvasColor.blur();
    }
    if (e.target === createCanvasModal) closeCreateCanvasModal();
  });
}
if (createCanvasApplyBtn) {
  createCanvasApplyBtn.addEventListener("click", () => {
    const width = Math.round(Number(createCanvasWidth ? createCanvasWidth.value : 4096) || 0);
    if (width < 2 || width > CREATE_MAX_DIM) {
      setStatus(`Create new: width must be in range 2..${CREATE_MAX_DIM}.`);
      return;
    }
    const orientation = createCanvasOrientation && createCanvasOrientation.value === "portrait" ? "portrait" : "landscape";
    const height = orientation === "portrait" ? Math.round(width * 2) : Math.round(width / 2);
    if (height < 2 || height > CREATE_MAX_DIM) {
      setStatus(`Create new: resulting height ${height} exceeds max ${CREATE_MAX_DIM}.`);
      return;
    }
    const alpha = Math.max(0, Math.min(100, Number(createCanvasAlpha ? createCanvasAlpha.value : 100) | 0)) / 100;
    const color = createCanvasColor ? createCanvasColor.value : "#ffffff";
    createNewCanvas(width, height, color, alpha);
    closeCreateCanvasModal();
  });
}

brushSize.addEventListener("input", updateOutputs);
brushStrength.addEventListener("input", updateOutputs);
brushSoftness.addEventListener("input", updateOutputs);
if (brushRotation) brushRotation.addEventListener("input", updateOutputs);
if (eraserSize) eraserSize.addEventListener("input", updateOutputs);
if (eraserStrength) eraserStrength.addEventListener("input", updateOutputs);
if (eraserSoftness) eraserSoftness.addEventListener("input", updateOutputs);

blurSize.addEventListener("input", updateOutputs);
blurStrength.addEventListener("input", updateOutputs);
blurSoftness.addEventListener("input", updateOutputs);
if (blurQuality) blurQuality.addEventListener("input", updateOutputs);

stampSize.addEventListener("input", updateOutputs);
stampStrength.addEventListener("input", updateOutputs);
stampSoftness.addEventListener("input", updateOutputs);
stampSmooth.addEventListener("input", updateOutputs);
if (healingSize) healingSize.addEventListener("input", updateOutputs);
if (healingStrength) healingStrength.addEventListener("input", updateOutputs);
if (healingSoftness) healingSoftness.addEventListener("input", updateOutputs);
if (healingSmooth) healingSmooth.addEventListener("input", updateOutputs);
if (healingTriplanar) healingTriplanar.addEventListener("change", updateOutputs);
if (healingSharpSampling) healingSharpSampling.addEventListener("change", updateOutputs);

texPaintSize.addEventListener("input", updateOutputs);
texPaintSoftness.addEventListener("input", updateOutputs);
texPaintOpacity.addEventListener("input", updateOutputs);
if (texPaintRotation) texPaintRotation.addEventListener("input", updateOutputs);
if (fillTolerance) fillTolerance.addEventListener("input", updateOutputs);
if (fillOpacity) fillOpacity.addEventListener("input", updateOutputs);
if (gaussRadius) gaussRadius.addEventListener("input", updateOutputs);
if (ccBrightness) ccBrightness.addEventListener("input", updateOutputs);
if (ccContrast) ccContrast.addEventListener("input", updateOutputs);
if (ccSaturation) ccSaturation.addEventListener("input", updateOutputs);
if (toneCyanRed) toneCyanRed.addEventListener("input", updateOutputs);
if (toneMagentaGreen) toneMagentaGreen.addEventListener("input", updateOutputs);
if (toneYellowBlue) toneYellowBlue.addEventListener("input", updateOutputs);
if (toneRangeShadows) toneRangeShadows.addEventListener("change", updateOutputs);
if (toneRangeMidtones) toneRangeMidtones.addEventListener("change", updateOutputs);
if (toneRangeHighlights) toneRangeHighlights.addEventListener("change", updateOutputs);
if (tonePreserveLum) tonePreserveLum.addEventListener("change", updateOutputs);

seamWidth.addEventListener("input", updateOutputs);
seamStrength.addEventListener("input", updateOutputs);
poleWidth.addEventListener("input", updateOutputs);
poleStrength.addEventListener("input", updateOutputs);
if (perfTargetFps) perfTargetFps.addEventListener("input", updateOutputs);
if (perfMinFps) perfMinFps.addEventListener("input", updateOutputs);
if (perfMaxSpacingBoost) perfMaxSpacingBoost.addEventListener("input", updateOutputs);
if (perfAdaptiveToggle) perfAdaptiveToggle.addEventListener("change", updateOutputs);
if (perfPolarSafeToggle) perfPolarSafeToggle.addEventListener("change", updateOutputs);
if (perfPolarRowSamples) perfPolarRowSamples.addEventListener("input", updateOutputs);

brushSize.addEventListener("input", refreshCursorPreview);
brushStrength.addEventListener("input", refreshCursorPreview);
brushSoftness.addEventListener("input", refreshCursorPreview);
if (brushRotation) brushRotation.addEventListener("input", refreshCursorPreview);
if (brushShape) brushShape.addEventListener("change", refreshCursorPreview);
if (eraserSize) eraserSize.addEventListener("input", refreshCursorPreview);
if (eraserStrength) eraserStrength.addEventListener("input", refreshCursorPreview);
if (eraserSoftness) eraserSoftness.addEventListener("input", refreshCursorPreview);
blurSize.addEventListener("input", refreshCursorPreview);
if (blurQuality) blurQuality.addEventListener("input", refreshCursorPreview);
stampSize.addEventListener("input", refreshCursorPreview);
if (healingSize) healingSize.addEventListener("input", refreshCursorPreview);
if (healingStrength) healingStrength.addEventListener("input", refreshCursorPreview);
if (healingSoftness) healingSoftness.addEventListener("input", refreshCursorPreview);
if (healingSmooth) healingSmooth.addEventListener("input", refreshCursorPreview);
if (healingTriplanar) healingTriplanar.addEventListener("change", refreshCursorPreview);
if (healingSharpSampling) healingSharpSampling.addEventListener("change", refreshCursorPreview);
texPaintSize.addEventListener("input", refreshCursorPreview);
texPaintSoftness.addEventListener("input", refreshCursorPreview);
texPaintOpacity.addEventListener("input", refreshCursorPreview);
if (texPaintRotation) texPaintRotation.addEventListener("input", refreshCursorPreview);
if (texPaintBlendMode) texPaintBlendMode.addEventListener("change", refreshCursorPreview);
if (previewToggle) previewToggle.addEventListener("change", refreshCursorPreview);

if (gaussRadius) {
  gaussRadius.addEventListener("input", () => {
    if (gaussPreviewToggle && gaussPreviewToggle.checked) {
      if (ccPreviewToggle) ccPreviewToggle.checked = false;
      if (tonePreviewToggle) tonePreviewToggle.checked = false;
      renderFilterPreview("gaussian");
    }
  });
}
if (ccBrightness) {
  ccBrightness.addEventListener("input", () => {
    if (ccPreviewToggle && ccPreviewToggle.checked) {
      if (gaussPreviewToggle) gaussPreviewToggle.checked = false;
      if (tonePreviewToggle) tonePreviewToggle.checked = false;
      renderFilterPreview("cc");
    }
  });
}
if (ccContrast) {
  ccContrast.addEventListener("input", () => {
    if (ccPreviewToggle && ccPreviewToggle.checked) {
      if (gaussPreviewToggle) gaussPreviewToggle.checked = false;
      if (tonePreviewToggle) tonePreviewToggle.checked = false;
      renderFilterPreview("cc");
    }
  });
}
if (ccSaturation) {
  ccSaturation.addEventListener("input", () => {
    if (ccPreviewToggle && ccPreviewToggle.checked) {
      if (gaussPreviewToggle) gaussPreviewToggle.checked = false;
      if (tonePreviewToggle) tonePreviewToggle.checked = false;
      renderFilterPreview("cc");
    }
  });
}
if (toneCyanRed) {
  toneCyanRed.addEventListener("input", () => {
    if (tonePreviewToggle && tonePreviewToggle.checked) {
      if (gaussPreviewToggle) gaussPreviewToggle.checked = false;
      if (ccPreviewToggle) ccPreviewToggle.checked = false;
      renderFilterPreview("tone");
    }
  });
}
if (toneMagentaGreen) {
  toneMagentaGreen.addEventListener("input", () => {
    if (tonePreviewToggle && tonePreviewToggle.checked) {
      if (gaussPreviewToggle) gaussPreviewToggle.checked = false;
      if (ccPreviewToggle) ccPreviewToggle.checked = false;
      renderFilterPreview("tone");
    }
  });
}
if (toneYellowBlue) {
  toneYellowBlue.addEventListener("input", () => {
    if (tonePreviewToggle && tonePreviewToggle.checked) {
      if (gaussPreviewToggle) gaussPreviewToggle.checked = false;
      if (ccPreviewToggle) ccPreviewToggle.checked = false;
      renderFilterPreview("tone");
    }
  });
}
if (toneRangeShadows) {
  toneRangeShadows.addEventListener("change", () => {
    if (tonePreviewToggle && tonePreviewToggle.checked) {
      renderFilterPreview("tone");
    }
  });
}
if (toneRangeMidtones) {
  toneRangeMidtones.addEventListener("change", () => {
    if (tonePreviewToggle && tonePreviewToggle.checked) {
      renderFilterPreview("tone");
    }
  });
}
if (toneRangeHighlights) {
  toneRangeHighlights.addEventListener("change", () => {
    if (tonePreviewToggle && tonePreviewToggle.checked) {
      renderFilterPreview("tone");
    }
  });
}
if (tonePreserveLum) {
  tonePreserveLum.addEventListener("change", () => {
    if (tonePreviewToggle && tonePreviewToggle.checked) {
      renderFilterPreview("tone");
    }
  });
}
if (gaussPreviewToggle) {
  gaussPreviewToggle.addEventListener("change", () => {
    if (!gaussPreviewToggle.checked) {
      if (filterPreview && filterPreview.type === "gaussian") clearFilterPreview();
      return;
    }
    if (ccPreviewToggle) ccPreviewToggle.checked = false;
    if (tonePreviewToggle) tonePreviewToggle.checked = false;
    renderFilterPreview("gaussian");
  });
}
if (ccPreviewToggle) {
  ccPreviewToggle.addEventListener("change", () => {
    if (!ccPreviewToggle.checked) {
      if (filterPreview && filterPreview.type === "cc") clearFilterPreview();
      return;
    }
    if (gaussPreviewToggle) gaussPreviewToggle.checked = false;
    if (tonePreviewToggle) tonePreviewToggle.checked = false;
    renderFilterPreview("cc");
  });
}
if (tonePreviewToggle) {
  tonePreviewToggle.addEventListener("change", () => {
    if (!tonePreviewToggle.checked) {
      if (filterPreview && filterPreview.type === "tone") clearFilterPreview();
      return;
    }
    if (gaussPreviewToggle) gaussPreviewToggle.checked = false;
    if (ccPreviewToggle) ccPreviewToggle.checked = false;
    renderFilterPreview("tone");
  });
}
if (gaussApplyBtn) {
  gaussApplyBtn.addEventListener("click", () => applyFilterToActiveLayer("gaussian"));
}
if (ccApplyBtn) {
  ccApplyBtn.addEventListener("click", () => applyFilterToActiveLayer("cc"));
}
if (toneApplyBtn) {
  toneApplyBtn.addEventListener("click", () => applyFilterToActiveLayer("tone"));
}
if (filtersClearPreviewBtn) {
  filtersClearPreviewBtn.addEventListener("click", () => {
    if (filterPreview) {
      clearFilterPreview();
      setStatus("Filter preview cleared.");
    }
  });
}

exposureSlider.addEventListener("input", applyPreviewExposure);
if (viewportBg) viewportBg.addEventListener("input", applyViewportBackground);

if (brushTextureInput) {
  brushTextureInput.addEventListener("change", async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const img = await loadPngMaskFromFile(f);
      brushMaskData = img.data;
      brushMaskW = img.width;
      brushMaskH = img.height;
      brushMaskPreviewCanvas = img.canvas;
      setStatus(`Brush mask loaded: ${f.name}`);
      refreshCursorPreview();
    } catch (err) {
      setStatus(`Brush mask error: ${err.message}`);
    }
  });
}

if (eraserTextureInput) {
  eraserTextureInput.addEventListener("change", async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const img = await loadPngMaskFromFile(f);
      eraserMaskData = img.data;
      eraserMaskW = img.width;
      eraserMaskH = img.height;
      eraserMaskPreviewCanvas = img.canvas;
      setStatus(`Eraser texture loaded: ${f.name}`);
      refreshCursorPreview();
    } catch (err) {
      setStatus(`Eraser texture error: ${err.message}`);
    }
  });
}

if (texPaintInput) {
  texPaintInput.addEventListener("change", async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const img = await loadPngMaskFromFile(f);
      texturePaintData = img.data;
      texturePaintW = img.width;
      texturePaintH = img.height;
      texturePaintPreviewCanvas = img.canvas;
      if (texPaintHint) texPaintHint.textContent = `Loaded: ${f.name} (${img.width}x${img.height})`;
      setStatus("Texture Painting texture loaded.");
      refreshCursorPreview();
    } catch (err) {
      setStatus(`Texture Painting error: ${err.message}`);
    }
  });
}

updateOutputs();
applyPreviewExposure();
applyViewportBackground();

viewModeSelect.addEventListener("change", () => {
  setViewMode(viewModeSelect.value);
});

for (const btn of [toolBtnBrush, toolBtnEraser, toolBtnBlur, toolBtnStamp, toolBtnHealing, toolBtnLasso, toolBtnMoveLayer, toolBtnRotateLayer, toolBtnTexture, toolBtnFill, toolBtnSeam, toolBtnPole]) {
  if (!btn) continue;
  btn.addEventListener("click", () => {
    const mode = btn.dataset.toolMode || "brush";
    if (mode === activeToolMode) {
      setToolSettingsOpen(!toolSettingsOpen);
      return;
    }

    setActiveToolMode(mode);
    setToolSettingsOpen(true);
  });
}
if (lassoClearBtn) {
  lassoClearBtn.addEventListener("click", () => {
    clearLassoSelection();
    setStatus("Lasso selection cleared.");
  });
}
if (lassoInvertBtn) lassoInvertBtn.addEventListener("click", () => invertLassoSelection());
if (lassoCopyBtn) lassoCopyBtn.addEventListener("click", () => copyLassoSelectionToClipboard());
if (lassoPasteBtn) lassoPasteBtn.addEventListener("click", () => pasteLassoClipboardAsLayer());
if (moveLayerX) moveLayerX.addEventListener("input", applyMoveLayerInputs);
if (moveLayerY) moveLayerY.addEventListener("input", applyMoveLayerInputs);
if (rotateLayerAngle) rotateLayerAngle.addEventListener("input", applyRotateLayerInputs);
if (rotateLayerPivotU) rotateLayerPivotU.addEventListener("input", applyRotateLayerInputs);
if (rotateLayerPivotV) rotateLayerPivotV.addEventListener("input", applyRotateLayerInputs);
if (rotateLayerPickPivotBtn) {
  rotateLayerPickPivotBtn.addEventListener("click", () => {
    pendingRotatePivotPick = true;
    setStatus("Rotate Layer: click sphere to set pivot point.");
  });
}
if (setStampSourceBtn) {
  setStampSourceBtn.addEventListener("click", () => {
    pendingStampSource = true;
    if (stampHint) stampHint.textContent = "Click a point on sphere to pick source pixels.";
    setStatus("Stamp: waiting for source click.");
  });
}
if (setHealingSourceBtn) {
  setHealingSourceBtn.addEventListener("click", () => {
    pendingStampSource = true;
    if (healingHint) healingHint.textContent = "Click a point on sphere to pick source pixels.";
    setStatus("Healing: waiting for source click.");
  });
}

if (layerAddBtn) {
  layerAddBtn.addEventListener("click", () => {
    if (!layerStack) return;
    if (filterPreview) clearFilterPreview();
    layerStack.createEmptyLayer();
    syncActiveLayerImageData();
    renderLayerList();
    syncLayerTransformControls();
    markCompositeDirty();
    refreshCursorPreview();
  });
}

if (layerDuplicateBtn) {
  layerDuplicateBtn.addEventListener("click", () => {
    if (!layerStack) return;
    if (filterPreview) clearFilterPreview();
    const active = layerStack.getActiveLayer();
    if (!active) return;
    layerStack.duplicateLayer(active.id);
    syncActiveLayerImageData();
    renderLayerList();
    syncLayerTransformControls();
    markCompositeDirty();
    refreshCursorPreview();
  });
}

if (layerMergeDownBtn) {
  layerMergeDownBtn.addEventListener("click", () => {
    if (!layerStack) return;
    if (filterPreview) clearFilterPreview();
    const active = layerStack.getActiveLayer();
    if (!active) return;
    const merged = layerStack.mergeLayerDown(active.id);
    if (!merged) {
      setStatus("Merge Down unavailable: no lower layer.");
      return;
    }
    syncActiveLayerImageData();
    renderLayerList();
    syncLayerTransformControls();
    markCompositeDirty();
    refreshCursorPreview();
    setStatus(`Merged down into "${merged.name}".`);
  });
}

if (layerDeleteBtn) {
  layerDeleteBtn.addEventListener("click", () => {
    if (!layerStack) return;
    if (filterPreview) clearFilterPreview();
    const active = layerStack.getActiveLayer();
    if (!active) return;
    if (!layerStack.removeLayer(active.id)) {
      setStatus("Cannot delete the last layer.");
      return;
    }
    syncActiveLayerImageData();
    renderLayerList();
    syncLayerTransformControls();
    markCompositeDirty();
    refreshCursorPreview();
  });
}

undoBtn.addEventListener("click", undo);
saveBtn.addEventListener("click", savePng);
saveHdrBtn.addEventListener("click", saveHdrOriginalSize);
applySeamBlendBtn.addEventListener("click", applySeamBlend);
applyPoleBlendBtn.addEventListener("click", applyPoleBlend);

function onKeyDown(e) {
  if (e.key === "Escape" && createCanvasModal && !createCanvasModal.classList.contains("hidden")) {
    e.preventDefault();
    closeCreateCanvasModal();
    return;
  }

  if (e.defaultPrevented) return;
  if (!(e.ctrlKey || e.metaKey)) return;
  if (e.shiftKey) return;
  const target = e.target;
  const tag = target && target.tagName ? target.tagName.toLowerCase() : "";
  if (tag === "input" || tag === "textarea" || tag === "select" || (target && target.isContentEditable)) return;

  const code = e.code || "";
  const key = (e.key || "").toLowerCase();
  if (code === "KeyC" || key === "c") {
    if (hasActiveSelection()) {
      e.preventDefault();
      copyLassoSelectionToClipboard();
    }
    return;
  }
  if (code === "KeyV" || key === "v") {
    if (lassoClipboardImageData) {
      e.preventDefault();
      pasteLassoClipboardAsLayer();
    }
    return;
  }

  if (!(code === "KeyZ" || key === "z")) return;

  e.preventDefault();
  undo();
}

renderer.domElement.addEventListener("pointerdown", (e) => {
  if (e.button === 0 && !e.altKey) {
    controls.enabled = false;
  }
}, true);

renderer.domElement.addEventListener("pointerdown", onPointerDown);
renderer.domElement.addEventListener("pointermove", onPointerMove);
renderer.domElement.addEventListener("pointerleave", onPointerLeave);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("resize", onResize);
document.addEventListener("keydown", onKeyDown, true);
window.addEventListener("keydown", onKeyDown);

bindCollapsibleWindow(actionsWindow);
bindCollapsibleWindow(filtersWindow);
bindCollapsibleWindow(viewportWindow);
bindCollapsibleWindow(performanceWindow);
bindCollapsibleWindow(layersWindow);
bindCollapsibleWindow(filesWindow);

if (window.ResizeObserver) {
  layoutObserver = new ResizeObserver(() => updateFloatingLayout());
  if (filesWindow) layoutObserver.observe(filesWindow);
  if (actionsWindow) layoutObserver.observe(actionsWindow);
  if (filtersWindow) layoutObserver.observe(filtersWindow);
  if (viewportWindow) layoutObserver.observe(viewportWindow);
  if (performanceWindow) layoutObserver.observe(performanceWindow);
  if (orientationWindow) layoutObserver.observe(orientationWindow);
  if (layersWindow) layoutObserver.observe(layersWindow);
}
setActiveToolMode(activeToolMode);
setToolSettingsOpen(false);
setViewMode(viewModeSelect.value);
updateCreateCanvasPreview();
renderLayerList();
onResize();

function animate() {
  const now = performance.now();
  const frameMs = Math.max(0.1, now - lastAnimationTs);
  lastAnimationTs = now;
  averageFrameMs = averageFrameMs * 0.9 + frameMs * 0.1;

  const targetFps = Math.max(20, Number(perfTargetFps ? perfTargetFps.value : 45) | 0);
  const minFpsRaw = Math.max(12, Number(perfMinFps ? perfMinFps.value : 24) | 0);
  const minFps = Math.min(targetFps, minFpsRaw);
  const maxBoost = Math.max(1, (Math.max(100, Number(perfMaxSpacingBoost ? perfMaxSpacingBoost.value : 160) | 0)) / 100);
  const adaptiveEnabled = !perfAdaptiveToggle || !!perfAdaptiveToggle.checked;

  if (adaptiveEnabled) {
    const fps = 1000 / averageFrameMs;
    const highFps = Math.max(minFps + 0.1, targetFps * 0.9);
    const stress = Math.max(0, Math.min(1, (highFps - fps) / Math.max(0.1, highFps - minFps)));
    const effectiveFps = targetFps - (targetFps - minFps) * stress;
    bufferedPaintIntervalMs = 1000 / Math.max(1, effectiveFps);
    adaptiveSpacingMultiplier = 1 + (maxBoost - 1) * stress;
  } else {
    bufferedPaintIntervalMs = 1000 / targetFps;
    adaptiveSpacingMultiplier = 1.0;
  }

  flushBufferedStroke(now);

  controls.update();
  updateOrientationWidget();

  flushCompositeNow();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();





























































































