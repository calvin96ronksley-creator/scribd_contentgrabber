import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  FolderCheck,
  CheckCircle2,
  Layers,
  Terminal,
  RefreshCw,
  ExternalLink,
  Code2,
  Sparkles,
  Cpu,
  Zap,
  FolderArchive,
  ArrowDownCircle,
} from "lucide-react";
import { UrlDownloader } from "./components/UrlDownloader";
import { HtmlEditor } from "./components/HtmlEditor";
import { ExtractionPanel } from "./components/ExtractionPanel";
import { FilteredTextDisplay } from "./components/FilteredTextDisplay";
import { OutFileManager } from "./components/OutFileManager";
import { TempFileState, OutFileInfo, ExtractionResult, ExtractionOptions } from "./types";
import {
  renderAndDownloadUrl,
  getTempHtml,
  saveTempHtml,
  executeExtraction,
  getOutFiles,
  getOutFileContent,
} from "./services/api";

export default function App() {
  const [tempState, setTempState] = useState<TempFileState | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [lastExtraction, setLastExtraction] = useState<ExtractionResult | null>(null);
  const [outFiles, setOutFiles] = useState<OutFileInfo[]>([]);
  const [selectedOutFile, setSelectedOutFile] = useState<string | null>(null);
  const [isLoadingOutFiles, setIsLoadingOutFiles] = useState(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const showNotification = (type: "success" | "error" | "info", text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Load initial temp/index.html
  const loadTempData = useCallback(async () => {
    try {
      const state = await getTempHtml();
      setTempState(state);
    } catch {
      // temp/index.html will be created on initial render
    }
  }, []);

  // Load files in /out directory
  const loadOutFilesList = useCallback(async () => {
    setIsLoadingOutFiles(true);
    try {
      const files = await getOutFiles();
      setOutFiles(files);
      if (files.length > 0 && !selectedOutFile) {
        setSelectedOutFile(files[0].name);
      }
    } catch (err: any) {
      console.error("Error loading out files:", err);
    } finally {
      setIsLoadingOutFiles(false);
    }
  }, [selectedOutFile]);

  useEffect(() => {
    loadTempData();
    loadOutFilesList();
  }, [loadTempData, loadOutFilesList]);

  // Handler: Render URL with WebEngine (Puppeteer) and save to temp/index.html
  const handleRenderUrl = async (
    url: string,
    options: {
      useWebEngine: boolean;
      waitForSelector: string;
      autoExtract: boolean;
    }
  ) => {
    setIsDownloading(true);
    try {
      // Generate clean filename based on hostname
      let cleanHostname = "page";
      try {
        const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
        cleanHostname = parsed.hostname.replace(/[^a-zA-Z0-9]/g, "_");
      } catch {
        // ignore
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const outputFilename = `text_layer_${cleanHostname}_${timestamp}.md`;

      const result = await renderAndDownloadUrl({
        url,
        useWebEngine: options.useWebEngine,
        waitForSelector: options.waitForSelector,
        autoExtract: options.autoExtract,
        outputFilename,
      });

      setTempState(result.tempState);

      if (result.extraction) {
        setLastExtraction(result.extraction);
        await loadOutFilesList();
        setSelectedOutFile(result.extraction.filename);
        showNotification(
          "success",
          `Webseite gerendert & ${result.extraction.paragraphsCount} Absätze direkt extrahiert!`
        );
      } else {
        showNotification(
          "success",
          `Webseite mit ${result.tempState.renderEngine} gerendert und als temp/index.html gespeichert (${(
            result.tempState.size / 1024
          ).toFixed(1)} KB)`
        );
      }
    } catch (err: any) {
      showNotification("error", err.message || "Fehler beim Rendern der URL");
      throw err;
    } finally {
      setIsDownloading(false);
    }
  };

  // Handler: Save Temp HTML edits
  const handleSaveTempHtml = async (newHtml: string) => {
    try {
      const res = await saveTempHtml(newHtml);
      setTempState((prev) => ({
        hasFile: true,
        html: newHtml,
        size: res.size,
        updatedAt: res.updatedAt,
        tempPath: "temp/index.html",
        url: prev?.url,
        pageTitle: prev?.pageTitle,
        renderEngine: prev?.renderEngine,
      }));
      showNotification("success", "Lokale Änderungen in temp/index.html gesichert.");
    } catch (err: any) {
      showNotification("error", err.message || "Fehler beim Speichern");
      throw err;
    }
  };

  // Handler: Load sample text_layer HTML
  const handleLoadSample = async () => {
    const sampleHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Cybernetics & Neural Text-Layer Source</title>
  <style>
    body { background-color: #0b0f19; color: #e2e8f0; font-family: monospace, system-ui; padding: 2rem; line-height: 1.7; }
    h1 { color: #00f2fe; text-shadow: 0 0 10px rgba(0, 242, 254, 0.4); }
    .text_layer { background: #111827; border-left: 3px solid #00f2fe; padding: 14px 18px; margin-bottom: 14px; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>Gerendertes HTML Dokument (index.html)</h1>
  <p>Dieses Dokument demonstriert das Auslesen von innerText aus allen .text_layer Elementen.</p>
  
  <div class="viewer-container">
    <div class="text_layer">Absatz 1: Initialisierung des neuronalen Text-Layers. Die Headless-Browser-Engine rendert den vollständigen DOM-Baum inklusive aller asynchron ausgeführten JavaScript-Skripte und client-seitig generierten DOM-Knoten.</div>
    <div class="text_layer">Absatz 2: Text-Layer Erkennung. Mittels document.querySelectorAll('.text_layer') werden alle relevanten Textebenen segmentiert und über innerText bereinigt extrahiert.</div>
    <div class="text_layer">Absatz 3: Markdown-Synthese. Sämtliche gefilterten Ausgaben werden mit doppelten Zeilenumbrüchen als formatierte Absätze strukturiert und persistent im './out' Verzeichnis archiviert.</div>
    <div class="text_layer">Absatz 4: Lokale Bearbeitung. Der gerenderte Quellcode in temp/index.html kann vor der Selektion im integrierten Code-Editor modifiziert oder um weitere .text_layer Blöcke erweitert werden.</div>
  </div>
</body>
</html>`;
    await handleSaveTempHtml(sampleHtml);
    showNotification("info", "Beispiel-HTML mit 4 .text_layer Elementen geladen.");
  };

  // Handler: Upload local HTML
  const handleUploadHtml = async (content: string, filename?: string) => {
    await handleSaveTempHtml(content);
    showNotification(
      "success",
      `Datei "${filename || "HTML"}" erfolgreich als temp/index.html importiert.`
    );
  };

  // Handler: Run Extraction
  const handleRunExtraction = async (options: ExtractionOptions) => {
    setIsExtracting(true);
    try {
      const result = await executeExtraction(options, tempState?.html, tempState?.url);
      setLastExtraction(result);

      // Refresh out file list and select the newly generated file
      await loadOutFilesList();
      setSelectedOutFile(result.filename);

      showNotification(
        "success",
        `${result.paragraphsCount} Absätze erfolgreich als Markdown in ${result.filePath} gespeichert!`
      );

      // Scroll smoothly to filtered text result
      setTimeout(() => {
        const displaySection = document.getElementById("filtered-text-display-card");
        if (displaySection) {
          displaySection.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
    } catch (err: any) {
      showNotification("error", err.message || "Extraktionsfehler");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pb-20 selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Cyber Neon Header */}
      <header className="bg-[#0b1120]/90 backdrop-blur-md border-b border-cyan-500/20 sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.35)]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  HTML to Markdown Extractor
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-700/60 text-[10px] font-mono font-bold tracking-wider">
                  WEBENGINE v2
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block font-mono">
                Puppeteer Chromium &bull; temp/index.html &bull; .text_layer Extraktion &bull; ./out/*.md
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status indicators */}
            <div className="hidden md:flex items-center gap-2 text-xs font-mono">
              <span className="px-3 py-1 rounded-lg bg-[#070b14] text-cyan-300 border border-cyan-500/30 flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Engine: Puppeteer</span>
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#070b14] text-emerald-300 border border-emerald-500/30 flex items-center gap-2 shadow-xs">
                <FolderCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>/out ({outFiles.length} {outFiles.length === 1 ? "Dokument" : "Dokumente"})</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-5">
          <div
            className={`px-4 py-3 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.8)] border text-xs font-mono flex items-center gap-3 ${
              notification.type === "success"
                ? "bg-[#062c20] text-emerald-200 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : notification.type === "error"
                ? "bg-[#380e14] text-rose-200 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                : "bg-[#0c1a30] text-cyan-200 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            }`}
          >
            {notification.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span>{notification.text}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Futuristic Mission Banner */}
        <div className="bg-linear-to-r from-[#0b162c] via-[#0d1f3f] to-[#0b162c] border border-cyan-500/40 rounded-xl p-6 shadow-[0_0_25px_rgba(6,182,212,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              <span>HEADLESS BROWSER RENDERING & TEXT-LAYER PIPELINE</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Vollständig gerenderte Webseiten &bull; .text_layer Extraktion
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed font-mono">
              1. Ziel-URL mit Headless Chromium rendern (inkl. SPAs &amp; PDF-Views) &bull; 
              2. Rendered Source in <code className="text-cyan-300 bg-[#070b14] px-1.5 py-0.5 rounded border border-cyan-500/30">temp/index.html</code> sichern &bull; 
              3. <code className="text-emerald-300 bg-[#070b14] px-1.5 py-0.5 rounded border border-emerald-500/30">document.querySelectorAll('.text_layer')</code> anwenden &bull; 
              4. Absätze als Markdown in <code className="text-purple-300 bg-[#070b14] px-1.5 py-0.5 rounded border border-purple-500/30">./out/*.md</code> speichern und sofort anzeigen.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 text-xs font-mono font-bold rounded-lg border border-cyan-500/40 transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            >
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Muster-HTML laden</span>
            </button>
          </div>
        </div>

        {/* Step 1: URL Downloader / Web Engine */}
        <section>
          <UrlDownloader
            tempState={tempState}
            isLoading={isDownloading}
            onRenderUrl={handleRenderUrl}
            onLoadSample={handleLoadSample}
            onUploadHtml={handleUploadHtml}
          />
        </section>

        {/* Step 2: HTML Editor & Preview for temp/index.html */}
        <section>
          <HtmlEditor
            tempState={tempState}
            onSaveHtml={handleSaveTempHtml}
            onReloadTemp={loadTempData}
          />
        </section>

        {/* Step 3: Extraction Panel */}
        <section>
          <ExtractionPanel
            onExecuteExtraction={handleRunExtraction}
            isExtracting={isExtracting}
            sourceUrl={tempState?.url}
          />
        </section>

        {/* Prominent Display of Newly Filtered Text (Requested: "und zeige den neuen text den wr gefiltert haben an") */}
        {lastExtraction && (
          <section>
            <FilteredTextDisplay
              result={lastExtraction}
              onSelectInFileManager={(filename) => setSelectedOutFile(filename)}
            />
          </section>
        )}

        {/* Step 4: Persistent Out Folder File Manager */}
        <section>
          <OutFileManager
            files={outFiles}
            selectedFilename={selectedOutFile}
            onSelectFile={setSelectedOutFile}
            onRefreshList={loadOutFilesList}
            isLoading={isLoadingOutFiles}
          />
        </section>
      </main>
    </div>
  );
}
