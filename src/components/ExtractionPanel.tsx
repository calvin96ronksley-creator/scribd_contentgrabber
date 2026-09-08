import React, { useState } from "react";
import {
  Filter,
  Play,
  FileText,
  Settings,
  FolderOutput,
  RefreshCw,
  Terminal,
  Code2,
  Check,
  Zap,
} from "lucide-react";
import { ExtractionOptions } from "../types";

interface ExtractionPanelProps {
  onExecuteExtraction: (options: ExtractionOptions) => Promise<void>;
  isExtracting: boolean;
  defaultFilename?: string;
  sourceUrl?: string;
}

const SELECTOR_PRESETS = [
  { label: ".text_layer", desc: "Standard PDF/Canvas Text-Layer" },
  { label: "p", desc: "Alle Textabsätze" },
  { label: "article p", desc: "Artikel-Fließtext" },
  { label: "h1, h2, h3, p", desc: "Überschriften & Text" },
];

export const ExtractionPanel: React.FC<ExtractionPanelProps> = ({
  onExecuteExtraction,
  isExtracting,
  defaultFilename,
}) => {
  const [selector, setSelector] = useState(".text_layer");
  const [useCustomJs, setUseCustomJs] = useState(false);
  const [customJs, setCustomJs] = useState(
    `document.querySelectorAll('.text_layer').forEach(element => {\n  console.log(element.innerText);\n});`
  );
  const [filename, setFilename] = useState(
    defaultFilename || `text_layer_extract_${new Date().toISOString().slice(0, 10)}.md`
  );
  const [addMetadataHeader, setAddMetadataHeader] = useState(true);

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    await onExecuteExtraction({
      selector,
      useCustomJs,
      customJs: useCustomJs ? customJs : undefined,
      filename,
      addMetadataHeader,
    });
  };

  return (
    <div
      id="extraction-panel-card"
      className="bg-[#0b1120] border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl p-6 shadow-[0_0_20px_rgba(6,182,212,0.08)] transition-all duration-300"
    >
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 text-xs font-mono font-bold">
              03
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              <span>JavaScript-Extraktion & Markdown Export in ./out</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Filtert alle <code className="text-cyan-300 font-bold">.text_layer</code> Textelemente aus{" "}
            <code className="text-slate-300">temp/index.html</code> und formatiert jedes Element als Absatz in ein Markdown-Dokument.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/40 border border-cyan-500/40 rounded-lg text-xs font-mono text-cyan-300">
          <FolderOutput className="w-4 h-4 text-cyan-400" />
          <span>Ziel: ./out/{filename || "*.md"}</span>
        </div>
      </div>

      {/* Code Snippet Highlight */}
      <div className="mt-5 p-4 rounded-xl bg-[#070b14] border border-cyan-500/20 shadow-inner">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
            <Terminal className="w-3.5 h-3.5" />
            <span className="uppercase font-bold tracking-wider">Ausgeführtes JavaScript-Muster</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60 text-cyan-300">
            DOM Selektion
          </span>
        </div>

        <pre className="font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto p-3 rounded-lg bg-[#050811] border border-slate-800">
          <span className="text-purple-400">document</span>.<span className="text-cyan-400">querySelectorAll</span>(
          <span className="text-emerald-300">'{selector}'</span>).<span className="text-cyan-400">forEach</span>(
          <span className="text-amber-300">element</span> =&gt; &#123;{"\n"}
          {"  "}<span className="text-purple-400">console</span>.<span className="text-cyan-400">log</span>(
          <span className="text-amber-300">element</span>.<span className="text-cyan-300 font-bold">innerText</span>);{"\n"}
          &#125;);
        </pre>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleRun} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Selector input & presets */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-slate-300 font-bold flex items-center justify-between">
              <span>CSS-Selektor:</span>
              <span className="text-[11px] text-slate-500 font-normal">Standard: .text_layer</span>
            </label>
            <div className="relative">
              <input
                id="selector-input-field"
                type="text"
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                placeholder=".text_layer"
                className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700/80 rounded-lg text-sm text-cyan-300 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SELECTOR_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setSelector(p.label)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    selector === p.label
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "bg-[#070b14] text-slate-400 hover:text-cyan-300 border border-slate-800"
                  }`}
                  title={p.desc}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Output Filename */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-slate-300 font-bold flex items-center justify-between">
              <span>Markdown-Ausgabedatei in /out:</span>
              <span className="text-[11px] text-slate-500 font-normal">Endet mit .md</span>
            </label>
            <div className="relative">
              <input
                id="filename-input-field"
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="text_layer_output.md"
                className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700/80 rounded-lg text-sm text-emerald-300 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={addMetadataHeader}
                  onChange={(e) => setAddMetadataHeader(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400 bg-slate-900"
                />
                <span>Frontmatter-Header (Metadaten) beifügen</span>
              </label>
            </div>
          </div>
        </div>

        {/* Custom JS Toggle */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setUseCustomJs(!useCustomJs)}
            className="text-xs font-mono text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{useCustomJs ? "Standard-Selektor verwenden" : "Benutzerdefiniertes JS-Skript (Konsole abfangen)"}</span>
          </button>

          {useCustomJs && (
            <div className="mt-2 p-3 bg-[#070b14] rounded-lg border border-slate-800">
              <textarea
                value={customJs}
                onChange={(e) => setCustomJs(e.target.value)}
                rows={4}
                className="w-full bg-[#050811] text-xs font-mono text-cyan-300 p-2.5 rounded border border-slate-800 focus:outline-none focus:border-cyan-400"
                placeholder="document.querySelectorAll('.text_layer').forEach(el => console.log(el.innerText));"
              />
              <span className="text-[11px] font-mono text-slate-500 block mt-1">
                Jeder <code className="text-cyan-400">console.log(...)</code> Aufruf wird als formatierter Absatz im Markdown gespeichert.
              </span>
            </div>
          )}
        </div>

        {/* Execute Button */}
        <div className="pt-3">
          <button
            id="run-extraction-btn"
            type="submit"
            disabled={isExtracting}
            className="w-full py-3 bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-mono text-sm font-bold rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Extrahiere .text_layer & speichere Markdown...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>.text_layer extrahieren & Markdown in /out speichern</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
