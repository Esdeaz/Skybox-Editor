const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const pngToIcoModule = require("png-to-ico");
const pngToIco = pngToIcoModule.default || pngToIcoModule.imagesToIco;

const root = path.resolve(__dirname, "..");
const sourcePng = path.join(root, "build", "Icon_1024x1024.png");
const buildDir = path.join(root, "build");
const webDir = path.join(root, "sphere-editor");

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function renderPng(size, outFile) {
  await sharp(sourcePng).resize(size, size).png().toFile(outFile);
}

async function main() {
  if (!fs.existsSync(sourcePng)) {
    throw new Error(`Source icon not found: ${sourcePng}`);
  }

  await ensureDir(buildDir);
  await ensureDir(webDir);

  await renderPng(1024, path.join(buildDir, "icon-1024.png"));
  await renderPng(512, path.join(buildDir, "icon-512.png"));
  await renderPng(256, path.join(buildDir, "icon-256.png"));
  await renderPng(64, path.join(webDir, "favicon-64.png"));
  await renderPng(32, path.join(webDir, "favicon-32.png"));
  await renderPng(16, path.join(webDir, "favicon-16.png"));

  const winIco = await pngToIco([
    path.join(buildDir, "icon-256.png"),
    path.join(webDir, "favicon-64.png"),
    path.join(webDir, "favicon-32.png"),
    path.join(webDir, "favicon-16.png")
  ]);
  await fs.promises.writeFile(path.join(buildDir, "icon.ico"), winIco);

  const favIco = await pngToIco([
    path.join(webDir, "favicon-64.png"),
    path.join(webDir, "favicon-32.png"),
    path.join(webDir, "favicon-16.png")
  ]);
  await fs.promises.writeFile(path.join(webDir, "favicon.ico"), favIco);

  console.log("Icons generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
