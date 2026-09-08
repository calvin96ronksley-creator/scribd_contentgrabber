import React, { useState } from "react";
import {
  FileText,
  Copy,
  Check,
  Download,
  Eye,
  Layers,
  Sparkles,
  ExternalLink,
  Terminal,
  Clock,
  Hash,
} from "lucide-react";
import Markdown from "react-markdown";
import { ExtractionResult } from "../types";

interface FilteredTextDisplayProps {
  result: ExtractionResult | null;
  onSelectInFileManager?: (filename: string) => void;
}

export const FilteredTextDisplay: React.FC<FilteredTextDisplayProps> = ({
  result,
  onSelectInFileManager,
}) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"paragraphs" | "markdown" | "raw">("paragraphs");

  if (!result || !result.success) {
    return null;
  }

  const handleCopyAll = () => {
    navigator.clipboard.writeText(result.markdown);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySingleParagraph = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div
      id="filtered-text-display-card"
      className="bg-[#0b1120] border border-cyan-500/40 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.15)] overflow-hidden transition-all duration-300"
    >
      {/* Neon Header */}
      <div className="bg-linear-to-r from-[#0d1829] via-[#0f172a] to-[#0d1829] px-6 py-4 border-b border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
                NEU GEFILTERTER OUTPUT
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                PERSISTIERT IN /OUT
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
              Extrahierte Textebene aus <code className="text-cyan-300 font-mono text-sm">temp/index.html</code>
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex bg-[#070b14] p-1 rounded-lg border border-slate-700/60 text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewMode("paragraphs")}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "paragraphs"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  : "text-slate-400 hover:text-cyan-300"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Absätze ({result.paragraphsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("markdown")}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "markdown"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  : "text-slate-400 hover:text-cyan-300"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("raw")}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "raw"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  : "text-slate-400 hover:text-cyan-300"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Roh-Text</span>
            </button>
          </div>

          {/* Copy All */}
          <button
            type="button"
            onClick={handleCopyAll}
            className="px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/90 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-bold">Kopiert!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Alles Kopieren</span>
              </>
            )}
          </button>

          {/* Download File */}
          <a
            href={`/api/out/download/${encodeURIComponent(result.filename)}`}
            download={result.filename}
            className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.15)] cursor-pointer"
            title="Markdown-Dokument aus ./out herunterladen"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.md Download</span>
          </a>
        </div>
      </div>

      {/* Cyber Meta Bar */}
      <div className="bg-[#070b14]/70 px-6 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <Hash className="w-3.5 h-3.5 text-cyan-400" />
            <span>Absätze: <strong className="text-white">{result.paragraphsCount}</strong></span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            Wörter: <strong className="text-slate-200">{result.wordCount.toLocaleString("de-DE")}</strong>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            Zeichen: <strong className="text-slate-200">{result.charCount.toLocaleString("de-DE")}</strong>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-emerald-400">
            <span>Datei:</span>
            <code className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
              {result.filePath}
            </code>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{new Date(result.createdAt).toLocaleTimeString("de-DE")}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 max-h-[500px] overflow-y-auto bg-[#070b14]/40">
        {result.paragraphsCount === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <p className="text-sm font-mono text-slate-400">Keine Textinhalte für diesen Selektor gefunden.</p>
            <p className="text-xs text-slate-600 mt-1 font-mono">
              Überprüfen Sie in Schritt 2, ob im gerenderten temp/index.html Elemente mit der Klasse vorhanden sind.
            </p>
          </div>
        ) : viewMode === "paragraphs" ? (
          <div className="space-y-3.5">
            {result.paragraphs.map((para, idx) => (
              <div
                key={idx}
                className="group relative p-4 rounded-xl bg-[#0d1527] border border-slate-800/80 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.12)] transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 font-mono text-[10px] font-bold tracking-wider">
                    ABSATZ #{String(idx + 1).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopySingleParagraph(para, idx)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-cyan-300 p-1 rounded hover:bg-slate-800/80 transition-all cursor-pointer"
                    title="Diesen Absatz kopieren"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {para}
                </p>
              </div>
            ))}
          </div>
        ) : viewMode === "markdown" ? (
          <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed p-4 bg-[#0d1527] rounded-xl border border-slate-800/80">
            <Markdown>{result.markdown}</Markdown>
          </div>
        ) : (
          <pre className="p-4 bg-[#0d1527] rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed">
            {result.markdown}
          </pre>
        )}
      </div>
    </div>
  );
};
