const SIZE = 400;
const QUALITY = 0.85;

function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, QUALITY),
  );
}

export async function toSquarePhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(SIZE, side);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  bitmap.close();

  // Browsers that can't encode WebP silently return a PNG instead.
  let blob = await toBlob(canvas, "image/webp");
  if (blob?.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg");
  if (!blob) throw new Error("Couldn't encode the photo.");

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `photo.${ext}`, { type: blob.type });
}
