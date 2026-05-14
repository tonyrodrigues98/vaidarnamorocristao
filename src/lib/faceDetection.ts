let modelLoaded = false;
let loadingPromise: Promise<void> | null = null;

async function loadModels() {
  if (modelLoaded) return;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const faceapi = await import("face-api.js");
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    modelLoaded = true;
  })();
  return loadingPromise;
}

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem"));
    };
    img.src = url;
  });
}

export async function detectFaceCount(file: File): Promise<number> {
  await loadModels();
  const faceapi = await import("face-api.js");
  const img = await fileToImage(file);
  try {
    const detections = await faceapi.detectAllFaces(
      img,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 })
    );
    return detections.length;
  } finally {
    if (img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
  }
}