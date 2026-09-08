import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { JSDOM } from "jsdom";
import puppeteer, { Browser } from "puppeteer";

const app = express();
const PORT = 3000;

// Directories & Files
const APP_DIR = process.cwd();
const TEMP_DIR = path.join(APP_DIR, "temp");
const OUT_DIR = path.join(APP_DIR, "out");
// The user explicitly requested to save the temporary rendered HTML specifically as index.html
const TEMP_INDEX_HTML = path.join(TEMP_DIR, "index.html");
const LEGACY_TEMP_HTML = path.join(TEMP_DIR, "temp_source.html");

// Ensure directories exist
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Initial sample index.html with .text_layer elements if none exists
if (!fs.existsSync(TEMP_INDEX_HTML)) {
  const sampleHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cybernetics & Neural Text-Layer Source</title>
  <style>
    body { background-color: #0b0f19; color: #e2e8f0; font-family: monospace, system-ui; padding: 2rem; line-height: 1.7; }
    h1 { color: #00f2fe; text-shadow: 0 0 10px rgba(0, 242, 254, 0.4); }
    .neon-pill { display: inline-block; padding: 4px 10px; background: rgba(0, 255, 157, 0.1); border: 1px solid #00ff9d; color: #00ff9d; border-radius: 4px; font-size: 12px; margin-bottom: 16px; }
    .text_layer { background: #111827; border-left: 3px solid #00f2fe; padding: 14px 18px; margin-bottom: 14px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4); }
    .meta { color: #94a3b8; font-size: 13px; }
  </style>
</head>
<body>
  <div class="neon-pill">WEB ENGINE RENDERED SOURCE: INDEX.HTML</div>
  <h1>Gerendertes HTML Dokument (index.html)</h1>
  <p class="meta">Dieses Dokument wird von der Headless Webengine (Puppeteer/Chromium) dynamisch gerendert und temporär als <code>temp/index.html</code> abgespeichert.</p>
  
  <div class="viewer-container">
    <div class="text_layer">Absatz 1: Initialisierung des neuronalen Text-Layers. Die Headless-Browser-Engine rendert den vollständigen DOM-Baum inklusive aller asynchron ausgeführten JavaScript-Skripte und client-seitig generierten DOM-Knoten.</div>
    
    <div class="text_layer">Absatz 2: Text-Layer Erkennung. Mittels document.querySelectorAll('.text_layer') werden alle relevanten Textebenen segmentiert und über innerText bereinigt extrahiert.</div>
    
    <div class="text_layer">Absatz 3: Markdown-Synthese. Sämtliche gefilterten Ausgaben werden mit doppelten Zeilenumbrüchen als formatierte Absätze strukturiert und persistent im './out' Verzeichnis archiviert.</div>
    
    <div class="text_layer">Absatz 4: Lokale Bearbeitung. Der gerenderte Quellcode in temp/index.html kann vor der Selektion im integrierten Code-Editor modifiziert oder um weitere .text_layer Blöcke erweitert werden.</div>
  </div>
</body>
</html>`;
  fs.writeFileSync(TEMP_INDEX_HTML, sampleHtml, "utf-8");
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Helper: Puppeteer rendering engine
async function renderWithPuppeteer(
  targetUrl: string,
  options: {
    waitForSelector?: string;
    timeoutMs?: number;
    waitForNetworkIdle?: boolean;
  } = {}
): Promise<{ html: string; title: string; renderEngine: string; statusCode: number }> {
  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-extensions",
      ],
      timeout: 30000,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 AI-Studio-WebEngine/2.0"
    );

    // Navigate to URL
    const response = await page.goto(targetUrl, {
      waitUntil: options.waitForNetworkIdle !== false ? ["domcontentloaded", "networkidle2"] : "domcontentloaded",
      timeout: options.timeoutMs || 30000,
    });

    const statusCode = response ? response.status() : 200;

    // If wait selector specified (e.g. .text_layer), wait up to 4s for it to appear
    if (options.waitForSelector) {
      try {
        await page.waitForSelector(options.waitForSelector, { timeout: 4000 });
      } catch {
        // Continue even if selector didn't appear within 4s
      }
    } else {
      // Default: wait up to 2.5s for dynamic .text_layer (useful for PDF.js and SPA text layers)
      try {
        await page.waitForSelector(".text_layer", { timeout: 2500 });
      } catch {
        // fine if not found
      }
    }

    // Give micro-hydration a brief 300ms window
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Get fully rendered HTML source code (view-source rendered)
    const html = await page.content();
    const title = await page.title();

    return {
      html,
      title: title || targetUrl,
      renderEngine: "Puppeteer (Headless Chromium WebEngine)",
      statusCode,
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

// Fallback: Fetch + JSDOM
async function renderWithFetchFallback(targetUrl: string) {
  const res = await fetch(targetUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const html = await res.text();
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = match && match[1] ? match[1].trim() : targetUrl;

  return {
    html,
    title,
    renderEngine: "Fetch Fallback (Raw HTML)",
    statusCode: res.status,
  };
}

// --- API Endpoints ---

// Health
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    webEngine: "Puppeteer / Chromium",
    tempIndexPath: "temp/index.html",
    outDir: "out",
    time: new Date().toISOString(),
  });
});

// 1. Download & Render URL to temp/index.html via WebEngine
app.post("/api/render-and-download", async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      url,
      useWebEngine = true,
      waitForSelector = ".text_layer",
      autoExtract = false,
      outputFilename,
    } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL ist erforderlich." });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return res.status(400).json({ error: "Ungültiges URL-Format." });
    }

    let renderResult: { html: string; title: string; renderEngine: string; statusCode: number };

    if (useWebEngine) {
      try {
        renderResult = await renderWithPuppeteer(parsedUrl.href, {
          waitForSelector,
          timeoutMs: 30000,
        });
      } catch (puppeteerErr: any) {
        console.warn("Puppeteer failed, falling back to fetch:", puppeteerErr.message);
        renderResult = await renderWithFetchFallback(parsedUrl.href);
        renderResult.renderEngine = `Fetch Fallback (Puppeteer-Fehler: ${puppeteerErr.message})`;
      }
    } else {
      renderResult = await renderWithFetchFallback(parsedUrl.href);
    }

    // Ensure temp dir exists
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    // Save strictly as temp/index.html as requested!
    fs.writeFileSync(TEMP_INDEX_HTML, renderResult.html, "utf-8");
    // Also update legacy path for compatibility
    fs.writeFileSync(LEGACY_TEMP_HTML, renderResult.html, "utf-8");

    const fileStats = fs.statSync(TEMP_INDEX_HTML);
    const durationMs = Date.now() - startTime;

    // Quick match count for .text_layer in rendered HTML
    let textLayerCount = 0;
    try {
      const dom = new JSDOM(renderResult.html);
      textLayerCount = dom.window.document.querySelectorAll(".text_layer").length;
    } catch {
      // ignore
    }

    let extractionResult: any = null;
    if (autoExtract) {
      // Directly run extraction on newly rendered index.html
      extractionResult = await performExtraction({
        html: renderResult.html,
        selector: waitForSelector || ".text_layer",
        filename: outputFilename,
        addMetadataHeader: true,
        sourceUrl: parsedUrl.href,
        renderEngine: renderResult.renderEngine,
      });
    }

    return res.json({
      success: true,
      url: parsedUrl.href,
      pageTitle: renderResult.title,
      renderEngine: renderResult.renderEngine,
      statusCode: renderResult.statusCode,
      savedFile: "temp/index.html",
      size: fileStats.size,
      updatedAt: fileStats.mtime.toISOString(),
      renderDurationMs: durationMs,
      textLayerCount,
      html: renderResult.html,
      extraction: extractionResult,
    });
  } catch (err: any) {
    console.error("Render & download error:", err);
    return res.status(500).json({
      error: `Web-Engine Render-Fehler: ${err?.message || "Unbekannter Fehler"}`,
    });
  }
});

// 2. Get current temp/index.html
app.get("/api/temp", (req, res) => {
  try {
    const targetPath = fs.existsSync(TEMP_INDEX_HTML) ? TEMP_INDEX_HTML : LEGACY_TEMP_HTML;
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: "Keine temporäre index.html vorhanden." });
    }

    const html = fs.readFileSync(targetPath, "utf-8");
    const stats = fs.statSync(targetPath);

    return res.json({
      success: true,
      html,
      size: stats.size,
      updatedAt: stats.mtime.toISOString(),
      tempPath: "temp/index.html",
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Save modified HTML to temp/index.html
app.post("/api/temp/save", (req, res) => {
  try {
    const { html } = req.body;
    if (typeof html !== "string") {
      return res.status(400).json({ error: "HTML-Inhalt erforderlich." });
    }

    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    fs.writeFileSync(TEMP_INDEX_HTML, html, "utf-8");
    fs.writeFileSync(LEGACY_TEMP_HTML, html, "utf-8");

    const stats = fs.statSync(TEMP_INDEX_HTML);

    return res.json({
      success: true,
      message: "temp/index.html erfolgreich lokal gespeichert.",
      size: stats.size,
      updatedAt: stats.mtime.toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Helper for extraction logic
async function performExtraction(params: {
  html?: string;
  selector?: string;
  customJs?: string;
  filename?: string;
  addMetadataHeader?: boolean;
  sourceUrl?: string;
  renderEngine?: string;
}) {
  let html = params.html;
  if (!html) {
    const targetPath = fs.existsSync(TEMP_INDEX_HTML) ? TEMP_INDEX_HTML : LEGACY_TEMP_HTML;
    if (fs.existsSync(targetPath)) {
      html = fs.readFileSync(targetPath, "utf-8");
    } else {
      throw new Error("Keine index.html Datei vorhanden. Bitte zuerst URL rendern.");
    }
  }

  // Ensure out folder exists
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const extractedOutputs: string[] = [];

  // Parse HTML
  const dom = new JSDOM(html, {
    runScripts: params.customJs ? "dangerously" : undefined,
    resources: "usable",
  });
  const doc = dom.window.document;

  if (params.customJs && params.customJs.trim().length > 0) {
    // Custom JS capturing console.log
    const originalConsoleLog = dom.window.console.log;
    dom.window.console.log = (...args: any[]) => {
      const text = args
        .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
        .join(" ");
      extractedOutputs.push(text);
      if (originalConsoleLog) {
        originalConsoleLog.apply(dom.window.console, args);
      }
    };

    const scriptFn = new Function("document", "window", "console", params.customJs);
    scriptFn(doc, dom.window, dom.window.console);
  } else {
    // Exact requested pattern:
    // document.querySelectorAll('.text_layer').forEach(element => { console.log(element.innerText); });
    const sel = params.selector?.trim() || ".text_layer";
    const elements = doc.querySelectorAll(sel);

    elements.forEach((element) => {
      const text =
        (element as HTMLElement).innerText ??
        element.textContent ??
        "";
      if (text && text.trim().length > 0) {
        extractedOutputs.push(text.trim());
      }
    });
  }

  // Absatz formatieren: clean each paragraph and combine with double newline \n\n
  const paragraphs = extractedOutputs
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  let finalFilename = params.filename && params.filename.trim()
    ? params.filename.trim()
    : `extracted_text_layer_${timestamp}.md`;

  if (!finalFilename.endsWith(".md")) {
    finalFilename += ".md";
  }
  const safeFilename = path.basename(finalFilename);
  const targetFilePath = path.join(OUT_DIR, safeFilename);

  let markdownContent = "";
  if (params.addMetadataHeader !== false) {
    markdownContent += `---
titel: Extrahierte Text-Layer Absätze
quelle: temp/index.html${params.sourceUrl ? ` (${params.sourceUrl})` : ""}
selektor: ${params.selector || ".text_layer"}
absätze_anzahl: ${paragraphs.length}
erstellt_am: ${new Date().toLocaleString("de-DE")}
---

`;
  }

  // Absätze als formatierte Paragraphen mit Leerzeile getrennt
  markdownContent += paragraphs.join("\n\n");

  fs.writeFileSync(targetFilePath, markdownContent, "utf-8");
  const stats = fs.statSync(targetFilePath);

  // Calculate word and character count
  const allText = paragraphs.join(" ");
  const wordCount = allText.split(/\s+/).filter(Boolean).length;
  const charCount = allText.length;

  return {
    success: true,
    filename: safeFilename,
    filePath: `out/${safeFilename}`,
    fullPath: targetFilePath,
    paragraphsCount: paragraphs.length,
    wordCount,
    charCount,
    markdown: markdownContent,
    paragraphs,
    fileSize: stats.size,
    createdAt: stats.mtime.toISOString(),
  };
}

// 4. Extract endpoint
app.post("/api/extract", async (req, res) => {
  try {
    const {
      selector = ".text_layer",
      customJs,
      sourceHtml,
      filename,
      addMetadataHeader = true,
      sourceUrl,
    } = req.body;

    const result = await performExtraction({
      html: sourceHtml,
      selector,
      customJs,
      filename,
      addMetadataHeader,
      sourceUrl,
    });

    return res.json(result);
  } catch (err: any) {
    console.error("Extraction error:", err);
    return res.status(500).json({
      error: `Extraktion fehlgeschlagen: ${err?.message || "Unbekannter Fehler"}`,
    });
  }
});

// 5. List files in out folder
app.get("/api/out/files", (req, res) => {
  try {
    if (!fs.existsSync(OUT_DIR)) {
      fs.mkdirSync(OUT_DIR, { recursive: true });
      return res.json({ files: [] });
    }

    const filenames = fs.readdirSync(OUT_DIR);
    const files = filenames
      .filter((name) => !name.startsWith("."))
      .map((name) => {
        const filePath = path.join(OUT_DIR, name);
        const stats = fs.statSync(filePath);
        return {
          name,
          size: stats.size,
          mtime: stats.mtime.toISOString(),
          path: `out/${name}`,
        };
      })
      .sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());

    return res.json({ files, outDirPath: "out" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. Get single file from out folder
app.get("/api/out/file/:filename", (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(OUT_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Datei nicht gefunden." });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const stats = fs.statSync(filePath);

    return res.json({
      filename,
      content,
      size: stats.size,
      mtime: stats.mtime.toISOString(),
      path: `out/${filename}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 7. Update file in out folder
app.put("/api/out/file/:filename", (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(OUT_DIR, filename);
    const { content } = req.body;

    if (typeof content !== "string") {
      return res.status(400).json({ error: "Inhalt erforderlich." });
    }

    fs.writeFileSync(filePath, content, "utf-8");
    const stats = fs.statSync(filePath);

    return res.json({
      success: true,
      filename,
      size: stats.size,
      mtime: stats.mtime.toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 8. Delete file in out folder
app.delete("/api/out/file/:filename", (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(OUT_DIR, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.json({ success: true, message: `Datei ${filename} gelöscht.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 9. Download file from out folder
app.get("/api/out/download/:filename", (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(OUT_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Datei nicht gefunden.");
    }

    res.download(filePath, filename);
  } catch (err: any) {
    return res.status(500).send(err.message);
  }
});

// 10. Raw view of temp/index.html
app.get("/api/temp/raw", (req, res) => {
  const targetPath = fs.existsSync(TEMP_INDEX_HTML) ? TEMP_INDEX_HTML : LEGACY_TEMP_HTML;
  if (!fs.existsSync(targetPath)) {
    return res.status(404).send("Kein temp/index.html vorhanden");
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.sendFile(targetPath);
});

// --- Vite integration ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(APP_DIR, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[WebEngine Server] Läuft auf http://localhost:${PORT}`);
  });
}

startServer();
