export interface TempFileState {
  hasFile: boolean;
  html: string;
  size: number;
  updatedAt: string;
  url?: string;
  pageTitle?: string;
  tempPath: string;
  renderEngine?: string;
  statusCode?: number;
  renderDurationMs?: number;
  textLayerCount?: number;
}

export interface OutFileInfo {
  name: string;
  size: number;
  mtime: string;
  path: string;
}

export interface ExtractionOptions {
  selector: string;
  customJs?: string;
  useCustomJs: boolean;
  filename: string;
  addMetadataHeader: boolean;
  useWebEngine?: boolean;
}

export interface ExtractionResult {
  success: boolean;
  filename: string;
  filePath: string;
  paragraphsCount: number;
  wordCount: number;
  charCount: number;
  markdown: string;
  fileSize: number;
  createdAt: string;
  paragraphs: string[];
}
