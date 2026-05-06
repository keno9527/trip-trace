const THUMBNAIL_MAX_EDGE = 320;
const DISPLAY_MAX_EDGE = 1600;
const JPEG_QUALITY = 0.86;

const loadImage = async (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image could not be decoded"));
    };
    image.src = url;
  });

const getScaledSize = (
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } => {
  const scale = Math.min(1, maxEdge / Math.max(width, height));

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

const createImageCopy = async (file: File, maxEdge: number): Promise<Blob> => {
  const image = await loadImage(file);
  const size = getScaledSize(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    maxEdge,
  );
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not available");
  }

  canvas.width = size.width;
  canvas.height = size.height;
  context.drawImage(image, 0, 0, size.width, size.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Image copy could not be created"));
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
};

export const createThumbnail = async (file: File): Promise<Blob> =>
  createImageCopy(file, THUMBNAIL_MAX_EDGE);

export const createDisplayImage = async (file: File): Promise<Blob> =>
  createImageCopy(file, DISPLAY_MAX_EDGE);
