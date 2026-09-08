import React, { useState, useEffect } from "react";
import {
  Code,
  Save,
  Eye,
  Check,
  RefreshCw,
  Copy,
  PlusCircle,
  FileCode,
  Sparkles,
} from "lucide-react";
import { TempFileState } from "../types";

interface HtmlEditorProps {
  tempState: TempFileState | null;
  onSaveHtml: (html: string) => Promise<void>;
  onReloadTemp: () => Promise<void>;
}

export const HtmlEditor: React.FC<HtmlEditorProps> = ({
  tempState,
  onSaveHtml,
  onReloadTemp,
}) => {
  const [editorContent, setEditorContent] = useState(tempState?.html || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [copied, setCopied] = useState(false);

  // Sync with incoming tempState
  useEffect(() => {
    if (tempState?.html) {
      setEditorContent(tempState.html);
    }
  }, [tempState?.html]);

  const handleSave = async () => {
    if (!editorContent) return;
    setIsSaving(true);
    try {
      await onSaveHtml(editorContent);
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editorContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper: insert sample .text_layer block
  const handleInsertTextLayer = () => {
    const snippet = `\n    <div class="text_layer">Neuer manuell eingefügter Text-Layer Absatz zur Extraktion (#${Date.now().toString().slice(-4)})</div>\n`;
    // Insert before </body> if present, or append
    if (editorContent.includes("</body>")) {
      setEditorContent(editorContent.replace("</body>", `${snippet}</body>`));
    } else {
      setEditorContent((prev) => prev + snippet);
    }
  };

  // Live count of .text_layer occurrences in current editor
  const textLayerMatches = editorContent.match(/class=["'][^"']*text_layer[^"']*["']/g) || [];
  const textLayerCount = textLayerMatches.length;

  const isModified = tempState?.html !== editorContent;

  return (
    <div
      id="html-editor-card"
      className="bg-[#0b1120] border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.08)] transition-all duration-300"
    >
      {/* Editor Header */}
      <div className="bg-[#0d1527] px-6 py-4 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 text-xs font-mono font-bold">
              02
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>Lokale Bearbeitung von temp/index.html</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Hier liegt der gerenderte Quellcode. Sie können ihn direkt editieren, Elemente prüfen oder neue{" "}
            <code className="text-cyan-300">.text_layer</code> Blöcke ergänzen.
          </p>
        </div>

        {/* View mode toggle & action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Detected layers counter pill */}
          <div
            className={`px-3 py-1 rounded-lg border text-xs font-mono flex items-center gap-1.5 ${
              textLayerCount > 0
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                : "bg-amber-500/10 border-amber-500/40 text-amber-300"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {textLayerCount} × <code>.text_layer</code> im Quelltext
            </span>
          </div>

          <div className="flex bg-[#070b14] p-1 rounded-lg border border-slate-700/80 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab("code")}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "code"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  : "text-slate-400 hover:text-cyan-300"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "preview"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  : "text-slate-400 hover:text-cyan-300"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Vorschau</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleInsertTextLayer}
            className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            title="Einen weiteren .text_layer Block in den HTML Code einfügen"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ .text_layer einfügen</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700 bg-slate-800/60 cursor-pointer"
            title="HTML kopieren"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isSavedRecently
                ? "bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                : isModified
                ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            }`}
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isSavedRecently ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>
              {isSaving
                ? "Speichern..."
                : isSavedRecently
                ? "Gespeichert!"
                : isModified
                ? "Änderungen speichern"
                : "temp/index.html sichern"}
            </span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative">
        {activeTab === "code" ? (
          <div className="relative">
            <textarea
              id="html-code-textarea"
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              rows={14}
              placeholder="<!-- Gerenderter HTML Quellcode wird hier angezeigt -->"
              className="w-full p-4 bg-[#070b14] text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-y border-0 selection:bg-cyan-900 selection:text-cyan-100"
              spellCheck={false}
            />
            {/* Status bar */}
            <div className="bg-[#050811] px-4 py-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500">
              <div className="flex items-center gap-3">
                <span>
                  Zeilen: <strong className="text-slate-400">{editorContent.split("\n").length}</strong>
                </span>
                <span>•</span>
                <span>
                  Zeichen: <strong className="text-slate-400">{editorContent.length.toLocaleString("de-DE")}</strong>
                </span>
                <span>•</span>
                <span className={isModified ? "text-cyan-400 font-bold" : "text-emerald-400"}>
                  {isModified ? "● Ungespeicherte Änderungen" : "✓ Synchron mit temp/index.html"}
                </span>
              </div>
              <button
                type="button"
                onClick={onReloadTemp}
                className="hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                title="Neu von Festplatte laden"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Neu laden</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[#070b14]">
            <div className="rounded-lg overflow-hidden border border-slate-800 bg-white">
              <iframe
                title="Live HTML Sandbox"
                srcDoc={editorContent}
                className="w-full h-96 border-0 bg-white"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
