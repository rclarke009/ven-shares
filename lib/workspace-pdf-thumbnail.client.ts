"use client";

/** Target width for PDF first-page thumbnails (keeps render cost low). */
export const PDF_THUMBNAIL_WIDTH = 96;

let pdfWorkerReady: Promise<typeof import("pdfjs-dist")> | null = null;

async function loadPdfJs(): Promise<typeof import("pdfjs-dist")> {
  if (!pdfWorkerReady) {
    pdfWorkerReady = (async () => {
      const pdfjs = await import("pdfjs-dist");
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      }
      return pdfjs;
    })();
  }
  return pdfWorkerReady;
}

/**
 * Renders the first page of a PDF into a data URL suitable for <img src>.
 */
export async function renderPdfFirstPageDataUrl(
  source: ArrayBuffer | Uint8Array,
  targetWidth = PDF_THUMBNAIL_WIDTH,
): Promise<string | null> {
  try {
    const pdfjs = await loadPdfJs();
    const data = source instanceof Uint8Array ? source : new Uint8Array(source);
    const loadingTask = pdfjs.getDocument({ data });
    try {
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const scale = targetWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(scaledViewport.width);
      canvas.height = Math.floor(scaledViewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      await page.render({
        canvas,
        canvasContext: ctx,
        viewport: scaledViewport,
      }).promise;
      return canvas.toDataURL("image/jpeg", 0.85);
    } finally {
      void loadingTask.destroy();
    }
  } catch (err) {
    console.log("MYDEBUG →", err);
    return null;
  }
}
