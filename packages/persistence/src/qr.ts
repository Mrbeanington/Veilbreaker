import QRCode from "qrcode";
import jsQR from "jsqr";

// QR support without any remote service (spec/06): `qrcode` draws, `jsqr`
// reads. Both run entirely in the page and are bundled with the game. The
// matrix is exposed so the UI can paint it on a canvas or as SVG.
export interface QrMatrix {
  size: number;
  /** Row-major, true = dark module. */
  dark: boolean[];
}

export function qrMatrix(text: string): QrMatrix {
  const qr = QRCode.create(text, { errorCorrectionLevel: "L" });
  const size = qr.modules.size;
  const dark: boolean[] = [];
  for (let i = 0; i < size * size; i += 1) dark.push(qr.modules.data[i] === 1);
  return { size, dark };
}

export interface RgbaImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Renders the code to an RGBA bitmap (what a canvas holds), with a quiet zone. */
export function renderQrRgba(text: string, scale = 4, margin = 4): RgbaImage {
  const { size, dark } = qrMatrix(text);
  const pixels = (size + margin * 2) * scale;
  const data = new Uint8ClampedArray(pixels * pixels * 4).fill(255);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!dark[y * size + x]) continue;
      for (let dy = 0; dy < scale; dy += 1) {
        for (let dx = 0; dx < scale; dx += 1) {
          const px = (margin + x) * scale + dx;
          const py = (margin + y) * scale + dy;
          const at = (py * pixels + px) * 4;
          data[at] = 0;
          data[at + 1] = 0;
          data[at + 2] = 0;
        }
      }
    }
  }
  return { data, width: pixels, height: pixels };
}

/** SVG markup for the code (used on screen; sized by CSS). */
export function renderQrSvg(text: string, margin = 2): string {
  const { size, dark } = qrMatrix(text);
  const total = size + margin * 2;
  let path = "";
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) if (dark[y * size + x]) path += `M${x + margin} ${y + margin}h1v1h-1z`;
  }
  return `<svg viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}

/** Reads a QR code out of camera or image pixels. Returns null when none is found. */
export function decodeQr(image: RgbaImage): string | null {
  return jsQR(image.data, image.width, image.height)?.data ?? null;
}
