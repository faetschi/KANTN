export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  minBytesToOptimize?: number;
  maxProcessingMs?: number;
}

export async function optimizeImageForUpload(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<File> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.82,
    minBytesToOptimize = 600 * 1024,
    maxProcessingMs = 2500,
  } = options;

  if (!file.type.startsWith('image/')) return file;
  if (file.size < minBytesToOptimize) return file;
  if (typeof window === 'undefined') return file;

  try {
    const bitmap = await Promise.race([
      createImageBitmap(file),
      new Promise<ImageBitmap>((_, reject) => setTimeout(() => reject(new Error('image-bitmap-timeout')), maxProcessingMs)),
    ]);
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await Promise.race([
      new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', quality);
      }),
      new Promise<null>(resolve => setTimeout(() => resolve(null), maxProcessingMs)),
    ]);

    if (!blob) return file;
    if (blob.size >= file.size) return file;

    const nextName = file.name.replace(/\.[^.]+$/, '.jpg');
    return new File([blob], nextName, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
