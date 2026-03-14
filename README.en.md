# Skybox Editor

**[RU](README.md) | EN**

Local editor for equirectangular panoramas and skybox textures with live 3D sphere preview.

## Why this app was created

### Problem statement
- Editing skyboxes in standard 2D editors is error-prone: strokes look fine in 2D but distort on sphere poles and seams.
- Panorama cleanup tasks (clone/heal/blur/masks) are hard to validate without instant in-sphere preview.
- Artists and tech artists need a fast offline workflow without jumping between heavy DCC tools and game engines.

### Goal
- Provide one focused tool for editing and creating equirectangular textures with live 3D feedback, layers, selections, and export.

## What Skybox Editor can do

### Core workflow
- Load existing panorama (`PNG/JPG/HDR`).
- Create a new 2:1 canvas with selectable base color and opacity.
- Edit directly on a sphere with orbit camera and exposure control.
- Export to `PNG` and `HDR (original size)`.

### Important setting: Polar-safe mode
- Available in the `Performance` panel.
- Enables safer pole processing to reduce pole distortions and artifacts.
- Main parameter: `Polar row samples` (`16..1024`, default `64`).
- Directly affects pole quality for: `Stamp`, `Healing`, `Brush texture`, and `Texture Painting`.
- `16` (minimum): faster, but more pixelated/coarse result.
- `1024` (maximum): best quality/detail, but higher CPU/GPU load.

### Layers
- Layer list with active layer selection.
- Add, duplicate, delete layers.
- Drag-and-drop reordering.
- Rename layer by double-click.
- Merge Down (top layer merged into the one below).
- Per-layer opacity.

### Tools
- `Brush`
- `Eraser`
- `Blur`
- `Stamp (Clone)`
- `Healing`
- `Texture Painting`
- `Fill`
- `Lasso Select`
- `Move Layer`
- `Rotate Layer`
- Extra: `Seam blend`, `Pole blend`

### Selection (Lasso)
- Polygon selection with close-on-first-point click.
- Invert selection.
- Copy selected area and paste as a new layer.
- Effects and filters apply only inside active selection.

### Filters
- Gaussian Blur (preview before apply).
- Color Correction (preview).
- Tone/Color (shadows/midtones/highlights, preview).

### Performance controls
- `Performance` panel with adaptive batching.
- Polar-safe mode and `Polar row samples`.
- Tuning options to reduce lag on pole-heavy edits.

## Controls
- Paint: `LMB`
- Orbit camera: `Alt + LMB`
- Zoom: `Mouse Wheel`
- Undo: `Ctrl + Z`
- Copy Selection (Lasso): `Ctrl + C`

## Tech stack
- `Three.js` for 3D sphere rendering and preview.
- `Electron` for desktop app shell.
- `electron-builder` for Windows portable builds.

## Installation and run (step-by-step)

### 1. Requirements
- Windows 10/11
- Node.js `20.x`
- npm `10+`

### 2. Install dependencies
```bash
npm install
```

### 3. Generate icons
If you changed the source icon `build/Icon_1024x1024.png`:
```bash
npm run icons
```

### 4. Run desktop app (Electron)
```bash
npm run start
```

### 5. Run web mode (optional)
```bash
npm run start:web
```
Then open:
`http://localhost:5173`

## Build (step-by-step)

### Portable `.exe`
```bash
npm run dist
```
Output:
- `dist/Sphere-Editor-Portable-<version>.exe`

### Unpacked app folder
```bash
npm run dist:dir
```
Output:
- `dist/win-unpacked/`

## Project structure
- `sphere-editor/` - editor UI and core logic
- `electron/` - desktop shell
- `scripts/` - utility scripts
- `build/` - icon source and `icon.ico` for packaging
- `dist/` - build artifacts

## Notes
- Designed for offline work.
- Use `npm run dist` to ensure final app name/icon metadata are applied in build output.

## Feature Demos

### 1. Load and Orbit
![Load and Orbit](docs/gifs/01-load-and-orbit.gif)

### 2. Brush and Eraser
![Brush and Eraser](docs/gifs/02-brush-ereaser.gif)

### 3. Stamp and Healing
![Stamp and Healing](docs/gifs/03-stamp-healing.gif)

### 4. Texture Paint
![Texture Paint](docs/gifs/04-texture-paint.gif)

### 5. Lasso and Fill
![Lasso and Fill](docs/gifs/05-lasso-and-fill.gif)

### 6. Layers Move and Rotate
![Layers Move and Rotate](docs/gifs/06-layers-move-rotate.gif)

### 7. Filters
![Filters](docs/gifs/07-filters-end-export.gif)

