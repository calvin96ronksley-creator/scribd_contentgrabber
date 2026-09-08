import React, { useState } from "react";
import {
  Globe,
  Download,
  Upload,
  RefreshCw,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Zap,
  Layers,
  Sliders,
  ChevronDown,
} from "lucide-react";
import { TempFileState } from "../types";

interface UrlDownloaderProps {
  tempState: TempFileState | null;
  isLoading: boolean;
  onRenderUrl: (
    url: string,
    options: {
      useWebEngine: boolean;
      waitForSelector: string;
      autoExtract: boolean;
    }
  ) => Promise<void>;
  onLoadSample: () => void;
  onUploadHtml: (content: string, filename?: string) => void;
}

const PRESETS = [
  {
    name: "Beispiel mit .text_layer",
    url: "sample://text-layer",
    description: "Vorkonfiguriertes HTML mit mehreren .text_layer Absätzen",
  },
  {
    name: "Wikipedia: Web Scraping",
    url: "https://de.wikipedia.org/wiki/Web_Scraping",
    description: "Umfangreicher Artikel mit realer DOM-Struktur",
  },
  {
    name: "W3C Standards",
    url: "https://www.w3.org/",
    description: "Offizielle W3C Spezifikations-Seite",
  },
];

export const UrlDownloader: React.FC<UrlDownloaderProps> = ({
  tempState,
  isLoading,
  onRenderUrl,
  onLoadSample,
  onUploadHtml,
}) => {
  const [urlInput, setUrlInput] = useState("https://de.wikipedia.org/wiki/Web_Scraping");
  const [useWebEngine, setUseWebEngine] = useState(true);
  const [waitForSelector, setWaitForSelector] = useState(".text_layer");
  const [autoExtract, setAutoExtract] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setError("Bitte geben Sie eine gültige URL ein.");
      return;
    }
    setError(null);
    try {
      if (urlInput === "sample://text-layer") {
        onLoadSample();
      } else {
        await onRenderUrl(urlInput.trim(), {
          useWebEngine,
          waitForSelector,
          autoExtract,
        });
      }
    } catch (err: any) {
      setError(err.message || "Fehler beim Rendern der URL.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onUploadHtml(content, file.name);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div
      id="url-downloader-card"
      className="bg-[#0b1120] border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl p-6 shadow-[0_0_20px_rgba(6,182,212,0.08)] transition-all duration-300"
    >
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 text-xs font-mono font-bold">
              01
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Webseite rendern & als temp/index.html speichern</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Rendert die Ziel-URL via Headless Chromium WebEngine (Puppeteer) und speichert den kompletten View-Source DOM temporär in{" "}
            <code className="px-1.5 py-0.5 bg-[#070b14] border border-cyan-500/30 rounded text-cyan-300 text-xs">
              temp/index.html
            </code>
          </p>
        </div>

        {tempState?.hasFile && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/40 rounded-lg text-xs font-mono text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>index.html aktiv ({formatBytes(tempState.size)})</span>
          </div>
        )}
      </div>

      {/* URL Input Form */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
              <Globe className="w-4 h-4" />
            </div>
            <input
              id="url-input-field"
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="https://beispiel-seite.de/dokument.html"
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 bg-[#070b14] border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              id="download-url-btn"
              type="submit"
              disabled={isLoading || !urlInput.trim()}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-mono text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>WebEngine rendert...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Rendern & temp/index.html speichern</span>
                </>
              )}
            </button>

            <label
              id="upload-html-label"
              className="px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-mono font-medium rounded-lg border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
              title="Lokale HTML-Datei direkt als temp/index.html laden"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">HTML Upload</span>
              <input
                type="file"
                accept=".html,.htm,.txt"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          </div>
        </div>

        {/* Engine Settings Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs font-mono">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-cyan-300 transition-colors">
              <input
                type="checkbox"
                checked={useWebEngine}
                onChange={(e) => setUseWebEngine(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 bg-slate-900"
              />
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Headless Chromium WebEngine (Puppeteer)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-emerald-300 transition-colors">
              <input
                type="checkbox"
                checked={autoExtract}
                onChange={(e) => setAutoExtract(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 bg-slate-900"
              />
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Sofort .text_layer extrahieren
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <Sliders className="w-3 h-3" />
            <span>Erweiterte Render-Parameter</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Advanced Panel */}
        {showAdvanced && (
          <div className="p-3.5 bg-[#070b14] rounded-lg border border-slate-800 text-xs font-mono space-y-2">
            <div>
              <label className="block text-slate-400 mb-1">
                Warte-Selektor während des Renderns (DOM-Hydration):
              </label>
              <input
                type="text"
                value={waitForSelector}
                onChange={(e) => setWaitForSelector(e.target.value)}
                placeholder=".text_layer"
                className="w-full sm:w-64 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-cyan-300 text-xs focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Die WebEngine wartet bis zu 4 Sekunden auf das Erscheinen dieses Elements, bevor der HTML-Quellcode serialisiert wird.
              </span>
            </div>
          </div>
        )}

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono text-slate-400">
          <span className="text-slate-500">Schnell-Vorlagen:</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                setUrlInput(preset.url);
                if (preset.url === "sample://text-layer") {
                  onLoadSample();
                }
              }}
              className="px-2.5 py-1 bg-[#070b14] hover:bg-slate-800/80 text-cyan-300 hover:text-cyan-200 rounded-md border border-cyan-500/20 hover:border-cyan-500/40 transition-colors cursor-pointer"
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-lg text-xs font-mono text-rose-300 flex items-start gap-2 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-200">Fehler: </span>
              {error}
            </div>
          </div>
        )}
      </form>

      {/* Current File Metadata Bar */}
      {tempState?.hasFile && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 bg-[#070b14] p-3 rounded-lg border border-slate-800/60">
          <div className="flex flex-wrap items-center gap-2.5">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200">
              {tempState.pageTitle || "Gerendertes HTML"}
            </span>
            <span className="text-slate-700">|</span>
            <code className="text-cyan-300 font-bold">{tempState.tempPath}</code>
            {tempState.renderEngine && (
              <span className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                {tempState.renderEngine}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            {tempState.textLayerCount !== undefined && (
              <span>
                Erkannte .text_layer:{" "}
                <strong className="text-cyan-300">{tempState.textLayerCount}</strong>
              </span>
            )}
            <span>
              Größe: <strong className="text-slate-200">{formatBytes(tempState.size)}</strong>
            </span>
            <span>
              Aktualisiert:{" "}
              <strong className="text-slate-200">
                {tempState.updatedAt ? new Date(tempState.updatedAt).toLocaleTimeString("de-DE") : "-"}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
