import { TempFileState, OutFileInfo, ExtractionResult, ExtractionOptions } from "../types";

export interface RenderAndDownloadParams {
  url: string;
  useWebEngine?: boolean;
  waitForSelector?: string;
  autoExtract?: boolean;
  outputFilename?: string;
}

export async function renderAndDownloadUrl(
  params: RenderAndDownloadParams
): Promise<{ tempState: TempFileState; extraction?: ExtractionResult }> {
  const res = await fetch("/api/render-and-download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: params.url,
      useWebEngine: params.useWebEngine ?? true,
      waitForSelector: params.waitForSelector || ".text_layer",
      autoExtract: params.autoExtract ?? false,
      outputFilename: params.outputFilename,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Fehler beim Rendern" }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const tempState: TempFileState = {
    hasFile: true,
    html: data.html,
    size: data.size,
    updatedAt: data.updatedAt,
    url: data.url,
    pageTitle: data.pageTitle,
    tempPath: data.savedFile || "temp/index.html",
    renderEngine: data.renderEngine,
    statusCode: data.statusCode,
    renderDurationMs: data.renderDurationMs,
    textLayerCount: data.textLayerCount,
  };

  return { tempState, extraction: data.extraction };
}

export async function getTempHtml(): Promise<TempFileState> {
  const res = await fetch("/api/temp");
  if (!res.ok) {
    throw new Error("Keine temporäre index.html vorhanden");
  }
  const data = await res.json();
  return {
    hasFile: true,
    html: data.html,
    size: data.size,
    updatedAt: data.updatedAt,
    tempPath: data.tempPath || "temp/index.html",
  };
}

export async function saveTempHtml(html: string): Promise<{ size: number; updatedAt: string }> {
  const res = await fetch("/api/temp/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Fehler beim Speichern" }));
    throw new Error(errorData.error || "Fehler beim Speichern");
  }

  return await res.json();
}

export async function executeExtraction(
  options: ExtractionOptions,
  sourceHtml?: string,
  sourceUrl?: string
): Promise<ExtractionResult> {
  const payload: any = {
    selector: options.selector || ".text_layer",
    filename: options.filename,
    addMetadataHeader: options.addMetadataHeader,
    sourceUrl,
  };

  if (options.useCustomJs && options.customJs) {
    payload.customJs = options.customJs;
  }
  if (sourceHtml) {
    payload.sourceHtml = sourceHtml;
  }

  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Extraktionsfehler" }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return await res.json();
}

export async function getOutFiles(): Promise<OutFileInfo[]> {
  const res = await fetch("/api/out/files");
  if (!res.ok) {
    throw new Error("Fehler beim Abrufen der Ausgabedateien");
  }
  const data = await res.json();
  return data.files || [];
}

export async function getOutFileContent(
  filename: string
): Promise<{ content: string; mtime: string; size: number }> {
  const res = await fetch(`/api/out/file/${encodeURIComponent(filename)}`);
  if (!res.ok) {
    throw new Error(`Fehler beim Laden von ${filename}`);
  }
  return await res.json();
}

export async function saveOutFileContent(filename: string, content: string): Promise<void> {
  const res = await fetch(`/api/out/file/${encodeURIComponent(filename)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    throw new Error(`Fehler beim Speichern von ${filename}`);
  }
}

export async function deleteOutFile(filename: string): Promise<void> {
  const res = await fetch(`/api/out/file/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Fehler beim Löschen von ${filename}`);
  }
}
