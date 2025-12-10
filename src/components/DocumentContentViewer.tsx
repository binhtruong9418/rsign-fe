import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Loader2, ZoomIn, ZoomOut, RotateCw, Maximize, RefreshCw } from 'lucide-react';
import { GlobalWorkerOptions, getDocument, PDFDocumentProxy } from 'pdfjs-dist';
// @ts-ignore - Vite resolves ?url assets at build time
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { renderAsync } from 'docx-preview';

const docxRenderOptions: Parameters<typeof renderAsync>[3] = {
  className: 'docx-preview',
  inWrapper: true,
  ignoreWidth: false,
  ignoreHeight: false,
};

let docxPreviewStylesInjected = false;

const ensureDocxPreviewStyles = () => {
  if (docxPreviewStylesInjected || typeof document === 'undefined') {
    return;
  }

  const style = document.createElement('style');
  style.setAttribute('data-docx-preview-styles', 'true');
  style.textContent = `
    .docx-preview-container {
      background: transparent;
    }

    .docx-preview {
      background: #ffffff;
      color: #111827;
      font-family: 'Times New Roman', Georgia, serif;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      padding: 40px !important;
      margin: 0 auto;
    }

    .docx-preview section {
      margin: 0 auto;
    }

    .docx-preview p {
      margin: 0 0 1em;
      line-height: 1.6;
    }
  `;
  document.head.appendChild(style);
  docxPreviewStylesInjected = true;
};

export type DocumentMediaType = 'image' | 'pdf' | 'docx' | 'unknown';

interface DocumentContentViewerProps {
  documentUri: string;
  documentTitle: string;
  className?: string;
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
const PDF_EXTENSIONS = ['pdf'];
const DOCX_EXTENSIONS = ['docx', 'doc'];

if (GlobalWorkerOptions.workerSrc !== pdfjsWorker) {
  GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

const extractExtension = (uri: string): string | null => {
  if (!uri) return null;
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(uri, base);
    const pathname = url.pathname;
    const lastSegment = pathname.split('/').pop() ?? '';
    const cleanSegment = lastSegment.split('#')[0].split('?')[0];
    const parts = cleanSegment.split('.');
    if (parts.length < 2) return null;
    return parts.pop()?.toLowerCase() ?? null;
  } catch {
    const sanitizedUri = uri.split('#')[0].split('?')[0];
    const parts = sanitizedUri.split('.');
    if (parts.length < 2) return null;
    return parts.pop()?.toLowerCase() ?? null;
  }
};

export const detectDocumentMediaType = (uri: string): DocumentMediaType => {
  const extension = extractExtension(uri);
  if (!extension) return 'unknown';
  if (IMAGE_EXTENSIONS.includes(extension)) return 'image';
  if (PDF_EXTENSIONS.includes(extension)) return 'pdf';
  if (DOCX_EXTENSIONS.includes(extension)) return 'docx';
  return 'unknown';
};

const DocumentContentViewer: React.FC<DocumentContentViewerProps> = ({
  documentUri,
  documentTitle,
  className = '',
}) => {
  const mediaType = useMemo(() => detectDocumentMediaType(documentUri), [documentUri]);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  if (!documentUri) {
    return (
      <div className={`flex items-center justify-center rounded-lg border border-secondary-200 bg-secondary-50 p-6 text-sm text-secondary-500 ${className}`}>
        No document available to preview.
      </div>
    );
  }

  const renderToolbar = () => (
    <div className="sticky top-0 z-20 flex items-center justify-between bg-white/90 backdrop-blur-sm border-b border-secondary-200 px-4 py-2 mb-4 rounded-t-lg shadow-sm">
      <div className="flex items-center space-x-2">
        <span className="text-xs font-medium text-secondary-500 uppercase tracking-wider">{mediaType}</span>
      </div>
      <div className="flex items-center space-x-1 bg-secondary-100 rounded-lg p-1">
        <button onClick={handleZoomOut} className="p-1.5 text-secondary-600 hover:text-primary-600 hover:bg-white rounded-md transition-all" title="Zoom Out">
          <ZoomOut size={18} />
        </button>
        <span className="text-xs font-medium text-secondary-700 w-12 text-center">{Math.round(scale * 100)}%</span>
        <button onClick={handleZoomIn} className="p-1.5 text-secondary-600 hover:text-primary-600 hover:bg-white rounded-md transition-all" title="Zoom In">
          <ZoomIn size={18} />
        </button>
        <div className="w-px h-4 bg-secondary-300 mx-1"></div>
        <button onClick={handleRotate} className="p-1.5 text-secondary-600 hover:text-primary-600 hover:bg-white rounded-md transition-all" title="Rotate">
          <RotateCw size={18} />
        </button>
        <button onClick={handleReset} className="p-1.5 text-secondary-600 hover:text-primary-600 hover:bg-white rounded-md transition-all" title="Reset View">
          <RefreshCw size={18} />
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (mediaType) {
      case 'image':
        return <ImagePreview url={documentUri} title={documentTitle} scale={scale} rotation={rotation} />;
      case 'pdf':
        return <PdfPreview url={documentUri} scale={scale} rotation={rotation} />;
      case 'docx':
        return <DocxPreview url={documentUri} scale={scale} rotation={rotation} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center gap-3 p-12 text-center text-sm text-secondary-500">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <p>Preview is unsupported for this file type.</p>
            <a
              href={documentUri}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm"
            >
              Download document
            </a>
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col rounded-lg border border-secondary-200 bg-secondary-50/50 overflow-hidden ${className}`}>
      {renderToolbar()}
      <div className="flex-grow overflow-auto p-4 flex items-start justify-center min-h-[400px]">
        {renderContent()}
      </div>
    </div>
  );
};

interface PreviewProps {
  scale: number;
  rotation: number;
}

interface ImagePreviewProps extends PreviewProps {
  url: string;
  title: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ url, title, scale, rotation }) => (
  <div 
    className="transition-transform duration-200 ease-out origin-top"
    style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
  >
    <img
      src={url}
      alt={title}
      className="max-w-full h-auto rounded-md shadow-md"
    />
  </div>
);

interface PdfPreviewProps extends PreviewProps {
  url: string;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ url, scale, rotation }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;

    if (!container) return;

    container.innerHTML = '';
    setIsLoading(true);
    setError(null);

    const loadingTask = getDocument({ url });

    loadingTask.promise
      .then(async (pdf: PDFDocumentProxy) => {
        if (!isMounted) {
          pdf.destroy();
          return;
        }

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          if (!isMounted) {
            page.cleanup();
            pdf.destroy();
            return;
          }

          // Adjust scale based on prop
          const viewport = page.getViewport({ scale: scale * 1.5, rotation });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (!context) {
            page.cleanup();
            continue;
          }

          canvas.height = viewport.height;
          canvas.width = viewport.width;
          // Use CSS to control display size, but keep canvas resolution high
          canvas.style.width = `${viewport.width}px`; 
          canvas.style.height = `${viewport.height}px`;
          canvas.style.maxWidth = '100%';
          canvas.style.height = 'auto';
          
          canvas.className = 'mb-4 rounded-md shadow-md border border-secondary-200 bg-white';

          container.appendChild(canvas);

          await page.render({ canvasContext: context, viewport }).promise;
          page.cleanup();
        }

        pdf.destroy();
        if (isMounted) setIsLoading(false);
      })
      .catch((err: unknown) => {
        console.error('Failed to render PDF preview', err);
        if (isMounted) {
          setError('Unable to load PDF document.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      container.innerHTML = '';
      loadingTask.destroy();
    };
  }, [url, scale, rotation]); // Re-render when scale or rotation changes

  return (
    <div className="relative w-full flex justify-center">
      <div ref={containerRef} className="flex flex-col items-center" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      )}
      {error && (
        <div className="absolute top-0 left-0 right-0 p-4 text-center">
          <div className="inline-block rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

interface DocxPreviewProps extends PreviewProps {
  url: string;
}

const DocxPreview: React.FC<DocxPreviewProps> = ({ url, scale, rotation }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isMounted = true;
    const abortController = new AbortController();
    container.innerHTML = '';
    setIsLoading(true);
    setError(null);

    const loadDocx = async () => {
      try {
        ensureDocxPreviewStyles();
        const response = await fetch(url, { signal: abortController.signal });
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        if (!isMounted) return;
        
        await renderAsync(arrayBuffer, container, undefined, docxRenderOptions);
        if (isMounted) setIsLoading(false);
      } catch (err: unknown) {
        if (!isMounted) return;
        if ((err as { name?: string }).name === 'AbortError') return;
        
        console.error('Failed to render DOCX preview', err);
        setError('Unable to load DOCX document.');
        setIsLoading(false);
      }
    };

    loadDocx();

    return () => {
      isMounted = false;
      abortController.abort();
      container.innerHTML = '';
    };
  }, [url]);

  return (
    <div className="relative w-full flex justify-center">
      <div 
        className="transition-transform duration-200 ease-out origin-top"
        style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
      >
        <div
          ref={containerRef}
          className="docx-preview-container mx-auto w-full max-w-4xl bg-white shadow-lg border border-secondary-200 min-h-[800px]"
        />
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      )}
      {error && (
        <div className="absolute top-0 left-0 right-0 p-4 text-center">
          <div className="inline-block rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentContentViewer;
