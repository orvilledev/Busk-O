/**
 * Prep an image for OCR. Tesseract does much better on large, high-contrast,
 * grayscale input, so we upscale small photos and push the contrast before
 * handing it over. Runs on a canvas in the browser.
 */
export async function preprocessForOcr(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);

  // Aim for ~1600px on the long edge; upscale small shots, leave big ones.
  const target = 1600;
  const longEdge = Math.max(bitmap.width, bitmap.height);
  const scale = longEdge < target ? target / longEdge : 1;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = img.data;
  const contrast = 1.4; // >1 widens the gap between ink and paper
  for (let i = 0; i < px.length; i += 4) {
    const gray = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    const boosted = Math.min(255, Math.max(0, (gray - 128) * contrast + 128));
    px[i] = px[i + 1] = px[i + 2] = boosted;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
