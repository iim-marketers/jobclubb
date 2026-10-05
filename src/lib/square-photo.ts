const SIZE = 400;
const QUALITY = 0.85;

function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, QUALITY),
  );
}

// "cover" crops to a centred square (photos); "contain" pads the whole image
// onto a white square so wide logos aren't cut off.
export async function toSquarePhoto(
  file: File,
  fit: "cover" | "contain" = "cover",
): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(
    SIZE,
    fit === "cover" ? side : Math.max(bitmap.width, bitmap.height),
  );

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (fit === "cover") {
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
  } else {
    const scale = canvas.width / Math.max(bitmap.width, bitmap.height);
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;
    ctx.drawImage(bitmap, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }
  bitmap.close();

  // Browsers that can't encode WebP silently return a PNG instead.
  let blob = await toBlob(canvas, "image/webp");
  if (blob?.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg");
  if (!blob) throw new Error("Couldn't encode the photo.");

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `photo.${ext}`, { type: blob.type });
}
