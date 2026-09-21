const sharp = require("sharp");
const fs = require("fs");
const SRC = process.argv[2], OUT = process.argv[3];
const spots = [
  { cx: 673, cy: 314, rx: 27, ry: 19, dx: -6, dy: 40 },
  { cx: 794, cy: 344, rx: 26, ry: 18, dx: 6, dy: 36 },
];
(async () => {
  let base = await sharp(SRC).ensureAlpha().toBuffer();
  for (const s of spots) {
    const W = s.rx * 2 + 16, H = s.ry * 2 + 16;
    const left = Math.round(s.cx - W / 2), top = Math.round(s.cy - H / 2);
    const patch = await sharp(SRC).extract({ left: left + s.dx, top: top + s.dy, width: W, height: H }).ensureAlpha().toBuffer();
    // feathered elliptical mask
    const mask = Buffer.from(`<svg width="${W}" height="${H}"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff"/><stop offset="72%" stop-color="#fff"/><stop offset="100%" stop-color="#000"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`);
    const alpha = await sharp(mask).resize(W, H).greyscale().raw().toBuffer();
    const rgba = await sharp(patch).raw().toBuffer();
    for (let i = 0; i < W * H; i++) rgba[i * 4 + 3] = alpha[i];
    const tile = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).blur(0.6).png().toBuffer();
    base = await sharp(base).composite([{ input: tile, left, top }]).png().toBuffer();
  }
  await sharp(base).removeAlpha().png().toFile(OUT);
})();
