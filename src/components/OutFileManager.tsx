import React, { useState, useEffect } from "react";
import {
  Folder,
  FileText,
  Download,
  Trash2,
  Edit3,
  Eye,
  Copy,
  Check,
  RefreshCw,
  Save,
  AlertCircle,
  FolderArchive,
  Layers,
  Sparkles,
} from "lucide-react";
import Markdown from "react-markdown";
import { OutFileInfo } from "../types";
import { getOutFileContent, saveOutFileContent, deleteOutFile } from "../services/api";

interface OutFileManagerProps {
  files: OutFileInfo[];
  selectedFilename: string | null;
  onSelectFile: (filename: string) => void;
  onRefreshList: () => Promise<void>;
  isLoading: boolean;
}

export const OutFileManager: React.FC<OutFileManagerProps> = ({
  files,
  selectedFilename,
  onSelectFile,
  onRefreshList,
  isLoading,
}) => {
  const [fileContent, setFileContent] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load selected file content
  useEffect(() => {
    if (!selectedFilename) {
      if (files.length > 0) {
        onSelectFile(files[0].name);
      } else {
        setFileContent("");
        setEditedContent("");
      }
      return;
    }

    const load = async () => {
      setIsLoadingContent(true);
      setError(null);
      try {
        const res = await getOutFileContent(selectedFilename);
        setFileContent(res.content);
        setEditedContent(res.content);
      } catch (err: any) {
        setError(err.message || "Fehler beim Laden der Datei");
      } finally {
        setIsLoadingContent(false);
      }
    };
    load();
  }, [selectedFilename, files.length]);

  const handleSaveEdit = async () => {
    if (!selectedFilename) return;
    setIsSaving(true);
    setError(null);
    try {
      await saveOutFileContent(selectedFilename, editedContent);
      setFileContent(editedContent);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      await onRefreshList();
    } catch (err: any) {
      setError(err.message || "Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Möchten Sie die Datei "${filename}" wirklich aus dem /out Ordner löschen?`)) {
      return;
    }
    try {
      await deleteOutFile(filename);
      await onRefreshList();
      if (selectedFilename === filename) {
        const remaining = files.filter((f) => f.name !== filename);
        if (remaining.length > 0) {
          onSelectFile(remaining[0].name);
        } else {
          onSelectFile("");
        }
      }
    } catch (err: any) {
      setError(err.message || "Fehler beim Löschen");
    }
  };

  const handleCopy = () => {
    if (!editedContent) return;
    navigator.clipboard.writeText(editedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const hasUnsavedChanges = editedContent !== fileContent;

  // Count paragraphs
  const paragraphCount = editedContent
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0 && !p.trim().startsWith("---")).length;

  return (
    <div
      id="out-file-manager-card"
      className="bg-[#0b1120] border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.08)] transition-all duration-300"
    >
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-800/80 bg-[#0d1527]">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 text-xs font-mono font-bold">
            04
          </span>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-emerald-400" />
              <span>Persistente Markdown-Dateien im Ordner <code className="text-emerald-300 font-mono text-sm bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">./out/</code></span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Verwalten, Voranzeigen, Bearbeiten und Herunterladen aller generierten Absätze.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onRefreshList()}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-cyan-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Dateiliste aktualisieren"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? "animate-spin" : ""}`} />
            <span>Aktualisieren</span>
          </button>
        </div>
      </div>

      {/* Main split: File list & Markdown content view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80">
        {/* Left column: Files List (4 cols) */}
        <div className="lg:col-span-4 p-4 bg-[#070b14]/70 flex flex-col justify-between" style={{ minHeight: "440px" }}>
          <div>
            <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Folder className="w-3.5 h-3.5" />
                <span>Dokumente ({files.length})</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">./out/*.md</span>
            </div>

            {files.length === 0 ? (
              <div className="p-6 text-center text-slate-500 bg-[#0d1527]/50 rounded-lg border border-dashed border-slate-800">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-xs font-mono text-slate-400">Noch keine Dateien im /out Ordner</p>
                <p className="text-[11px] text-slate-600 mt-1 font-mono">
                  Klicken Sie oben auf &bdquo;Extraktion ausführen&ldquo;, um das erste Markdown-Dokument zu generieren.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {files.map((file) => {
                  const isSelected = file.name === selectedFilename;
                  return (
                    <div
                      key={file.name}
                      onClick={() => onSelectFile(file.name)}
                      className={`group p-2.5 rounded-lg border text-xs font-mono cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                          : "bg-[#0d1527]/70 hover:bg-[#0d1527] border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-2 flex-1">
                        <FileText
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? "text-cyan-400" : "text-slate-500 group-hover:text-cyan-400"
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="font-bold truncate text-slate-100">{file.name}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{formatBytes(file.size)}</span>
                            <span>•</span>
                            <span>
                              {new Date(file.mtime).toLocaleDateString("de-DE")}{" "}
                              {new Date(file.mtime).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <a
                          href={`/api/out/download/${encodeURIComponent(file.name)}`}
                          download={file.name}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded"
                          title="Herunterladen"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(file.name, e)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500">
            Speicherort im Workspace: <code className="text-emerald-400">/out/*.md</code>
          </div>
        </div>

        {/* Right column: Viewer & Editor (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-[#070b14]/50">
          {selectedFilename ? (
            <>
              {/* Document Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-800 bg-[#0d1527]/80">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xs text-cyan-300 font-mono">
                    {selectedFilename}
                  </span>
                  <span className="text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded font-mono font-bold">
                    {paragraphCount} Absätze
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex bg-[#070b14] p-0.5 rounded-lg text-xs font-mono text-slate-400 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setViewMode("rendered")}
                      className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                        viewMode === "rendered"
                          ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                          : "hover:text-cyan-300"
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>Vorschau</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("raw")}
                      className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                        viewMode === "raw"
                          ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                          : "hover:text-cyan-300"
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Rohdaten</span>
                    </button>
                  </div>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 text-slate-300 hover:text-cyan-300 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    title="In die Zwischenablage kopieren"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 text-[11px] font-bold">Kopiert</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px]">Kopieren</span>
                      </>
                    )}
                  </button>

                  {/* Download Button */}
                  <a
                    href={`/api/out/download/${encodeURIComponent(selectedFilename)}`}
                    download={selectedFilename}
                    className="p-1.5 text-emerald-300 hover:text-emerald-200 bg-emerald-950/50 border border-emerald-800/50 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors"
                    title="Datei herunterladen"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Download</span>
                  </a>

                  {/* Save Edit Button (when in raw edit mode) */}
                  {viewMode === "raw" && hasUnsavedChanges && (
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isSaving}
                      className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-mono font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(6,182,212,0.4)] cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>{isSaving ? "Speichern..." : "Speichern"}</span>
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="m-4 p-3 bg-rose-950/50 border border-rose-500/50 rounded-lg text-xs font-mono text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* View/Edit area */}
              <div className="p-6 flex-1 overflow-y-auto" style={{ maxHeight: "560px", minHeight: "360px" }}>
                {isLoadingContent ? (
                  <div className="flex items-center justify-center h-48 text-slate-400 text-xs font-mono gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Lade Markdown-Inhalt...</span>
                  </div>
                ) : viewMode === "rendered" ? (
                  <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-4 font-sans">
                    <Markdown>{editedContent}</Markdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <textarea
                      id="markdown-raw-editor"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={16}
                      className="w-full p-4 font-mono text-xs text-emerald-300 bg-[#050811] border border-slate-800 rounded-lg focus:outline-none focus:border-cyan-400 leading-relaxed resize-y selection:bg-cyan-900"
                      placeholder="Markdown-Inhalt..."
                    />
                    {hasUnsavedChanges && (
                      <p className="text-[11px] font-mono text-amber-400 mt-2 font-bold">
                        * Ungespeicherte Änderungen. Klicken Sie oben auf &bdquo;Speichern&ldquo;, um die Datei in /out zu aktualisieren.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full min-h-[360px]">
              <FileText className="w-10 h-10 mb-2 opacity-30 text-slate-400" />
              <p className="text-sm font-mono text-slate-300">Keine Datei ausgewählt</p>
              <p className="text-xs font-mono text-slate-500 mt-1 max-w-sm">
                Wählen Sie links ein Dokument aus oder führen Sie oben Schritt 03 zur Extraktion aus.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
