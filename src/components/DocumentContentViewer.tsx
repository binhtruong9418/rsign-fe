import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Loader2, ZoomIn, ZoomOut, RotateCw, Maximize, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { GlobalWorkerOptions, getDocument, PDFDocumentProxy } from 'pdfjs-dist';
import { useTranslation } from 'react-i18next';
// @ts-ignore - Vite resolves ?url assets at build time
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { renderAsync } from 'docx-preview';

// Polyfill for requestIdleCallback (for Safari and older browsers)
const requestIdleCallbackPolyfill = (cb: (deadline: IdleDeadline) => void) => {
  if (typeof requestIdleCallback !== 'undefined') {
    return requestIdleCallback(cb);
  }
  // Fallback to setTimeout
  const start = Date.now();
  return setTimeout(() => {
    cb({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
    });
  }, 1) as unknown as number;
};

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

interface SignatureZone {
  pageNumber: number;
  x: number;        // Percentage (0-100) from left edge
  y: number;        // Percentage (0-100) from top edge
  width: number;    // Percentage (0-100) of page width
  height: number;   // Percentage (0-100) of page height
  label?: string;
}

interface SignatureImage {
  pageNumber: number;
  x: number;        // Percentage (0-100) from left edge
  y: number;        // Percentage (0-100) from top edge
  width: number;    // Percentage (0-100) of page width
  height: number;   // Percentage (0-100) of page height
  imageData: string; // Base64 or data URL
}

interface DocumentContentViewerProps {
  documentUri: string;
  documentTitle: string;
  className?: string;
  signatureZone?: SignatureZone;  // Optional single signature zone to highlight
  signatureZones?: SignatureZone[];  // Optional multiple signature zones to highlight
  signatureImages?: SignatureImage[]; // Optional signature images to display
  onPageChange?: (page: number) => void;  // Callback when page changes
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
  signatureZone,
  signatureZones,
  signatureImages,
  onPageChange,
}) => {
  const { t } = useTranslation();
  const mediaType = useMemo(() => detectDocumentMediaType(documentUri), [documentUri]);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Combine single zone and multiple zones into one array
  const allZones = useMemo(() => {
    if (signatureZones && signatureZones.length > 0) {
      return signatureZones;
    }
    if (signatureZone) {
      return [signatureZone];
    }
    return [];
  }, [signatureZone, signatureZones]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    onPageChange?.(page);
  };

  if (!documentUri) {
    return (
      <div className={`flex items-center justify-center rounded-lg border border-secondary-200 bg-secondary-50 p-6 text-sm text-secondary-500 ${className}`}>
        {t('sign_components.document_viewer.no_document')}
      </div>
    );
  }

  const renderToolbar = () => (
    <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 bg-white/90 backdrop-blur-sm border-b border-secondary-200 px-3 sm:px-4 py-2 mb-4 rounded-t-lg shadow-sm">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-secondary-500 uppercase tracking-wider">{mediaType}</span>
        {totalPages > 1 && (
          <>
            <div className="hidden sm:block w-px h-4 bg-secondary-300"></div>
            <div className="flex items-center gap-1 bg-secondary-100 rounded-lg p-1">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-secondary-600 hover:text-primary-600 hover:bg-white rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                title={t('sign_components.document_viewer.previous_page')}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs font-medium text-secondary-700 px-2 min-w-[60px] text-center">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 text-secondary-600 hover:text-primary-600 hover:bg-white rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                title={t('sign_components.document_viewer.next_page')}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-1 bg-secondary-100 rounded-lg p-1">
        <button onClick={handleZoomOut} className="p-1.5 text-secondary-600 hover:text-primary-600 hover:bg-white rounded-md transition-all" title={t('sign_components.document_viewer.zoom_out')}>
          <ZoomOut size={18} />
        </button>
        <span className="text-xs font-medium text-secondary-700 w-12 text-center">{Math.round(scale * 100)}%</span>
        <button onClick={handleZoomIn} className="p-1.5 text-secondary-600 hover:text-primary-600 hover:bg-white rounded-md transition-all" title={t('sign_components.document_viewer.zoom_in')}>
          <ZoomIn size={18} />
        </button>
        <div className="w-px h-4 bg-secondary-300 mx-1"></div>
        <button onClick={handleRotate} className="p-1.5 text-secondary-600 hover:text-primary-600 hover:bg-white rounded-md transition-all" title={t('sign_components.document_viewer.rotate')}>
          <RotateCw size={18} />
        </button>
        <button onClick={handleReset} className="p-1.5 text-secondary-600 hover:text-primary-600 hover:bg-white rounded-md transition-all" title={t('sign_components.document_viewer.reset')}>
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
        return <PdfPreview url={documentUri} scale={scale} rotation={rotation} signatureZones={allZones} signatureImages={signatureImages} currentPage={currentPage} onTotalPagesChange={setTotalPages} />;
      case 'docx':
        return <DocxPreview url={documentUri} scale={scale} rotation={rotation} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center gap-3 p-12 text-center text-sm text-secondary-500">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <p>{t('sign_components.document_viewer.unsupported_type')}</p>
            <a
              href={documentUri}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm"
            >
              {t('sign_components.document_viewer.download')}
            </a>
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col rounded-lg border border-secondary-200 bg-secondary-50/50 overflow-hidden ${className}`}>
      {renderToolbar()}
      <div className="grow overflow-auto p-4 flex items-start justify-center min-h-[400px]">
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
  signatureZones?: SignatureZone[];
  signatureImages?: SignatureImage[];
  currentPage: number;
  onTotalPagesChange: (total: number) => void;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ url, scale, rotation, signatureZones = [], signatureImages = [], currentPage, onTotalPagesChange }) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const lastUrlRef = useRef<string>('');

  // Load PDF document
  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError(null);

    const loadingTask = getDocument({
      url,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.12.313/cmaps/',
      cMapPacked: true,
      enableXfa: true,
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.12.313/standard_fonts/',
      disableAutoFetch: false,
      disableStream: false,
      disableRange: false,
    });

    loadingTask.promise
      .then((pdf: PDFDocumentProxy) => {
        if (!isMounted) {
          pdf.destroy();
          return;
        }

        pdfDocRef.current = pdf;
        onTotalPagesChange(pdf.numPages);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        console.error('Failed to load PDF', err);
        if (isMounted) {
          setError(t('sign_components.document_viewer.pdf_error'));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
      loadingTask.destroy();
    };
  }, [url, t, onTotalPagesChange]);

  // Render current page
  useEffect(() => {
    const container = containerRef.current;
    const pdf = pdfDocRef.current;

    if (!container || !pdf || isLoading) return;

    let isMounted = true;
    container.innerHTML = '';

    const renderCurrentPage = async () => {
      try {
        const page = await pdf.getPage(currentPage);
        if (!isMounted) {
          page.cleanup();
          return;
        }

        const devicePixelRatio = window.devicePixelRatio || 1;
        const baseScale = Math.min(devicePixelRatio * 1.5, 2.5);
        const effectiveScale = scale * baseScale;
        const viewport = page.getViewport({ scale: effectiveScale, rotation });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', {
          alpha: false,
          willReadFrequently: false,
          desynchronized: true
        });

        if (!context) {
          page.cleanup();
          return;
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        canvas.style.maxWidth = '100%';
        canvas.className = 'rounded-md shadow-md border border-secondary-200 bg-white';

        // Render with timeout
        const renderTask = page.render({
          canvasContext: context,
          viewport,
          intent: 'display',
        });

        await Promise.race([
          renderTask.promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Render timeout')), 30000)
          )
        ]);

        if (!isMounted) {
          page.cleanup();
          return;
        }

        // Create wrapper for canvas + signature zones
        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'relative inline-block w-full flex justify-center';

        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'relative';
        canvasContainer.appendChild(canvas);

        // Add signature zone highlights for current page
        const zonesOnThisPage = signatureZones.filter(zone => zone.pageNumber === currentPage);

        zonesOnThisPage.forEach((zone) => {
          const overlay = document.createElement('div');
          overlay.className = 'absolute border-4 border-red-500 bg-red-500/10 pointer-events-none rounded';
          overlay.style.left = `${zone.x}%`;
          overlay.style.top = `${zone.y}%`;
          overlay.style.width = `${zone.width}%`;
          overlay.style.height = `${zone.height}%`;

          const label = document.createElement('div');
          label.className = 'absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded font-semibold shadow-md whitespace-nowrap';
          label.textContent = zone.label || '✍️ Sign Here';
          overlay.appendChild(label);

          canvasContainer.appendChild(overlay);
        });

        // Add signature images for current page (render on top of zones)
        const imagesOnThisPage = signatureImages.filter(img => img.pageNumber === currentPage);

        imagesOnThisPage.forEach((sigImage) => {
          const imgOverlay = document.createElement('div');
          imgOverlay.className = 'absolute pointer-events-none';
          imgOverlay.style.left = `${sigImage.x}%`;
          imgOverlay.style.top = `${sigImage.y}%`;
          imgOverlay.style.width = `${sigImage.width}%`;
          imgOverlay.style.height = `${sigImage.height}%`;

          const img = document.createElement('img');
          img.src = sigImage.imageData;
          img.alt = 'Signature';
          img.className = 'w-full h-full object-contain';
          imgOverlay.appendChild(img);

          canvasContainer.appendChild(imgOverlay);
        });

        pageWrapper.appendChild(canvasContainer);
        container.appendChild(pageWrapper);

        page.cleanup();
      } catch (err) {
        console.error(`Failed to render page ${currentPage}:`, err);
        if (isMounted) {
          setError(t('sign_components.document_viewer.pdf_error'));
        }
      }
    };

    renderCurrentPage();

    return () => {
      isMounted = false;
    };
  }, [currentPage, scale, rotation, signatureZones, signatureImages, isLoading, t]);

  return (
    <div className="relative w-full flex flex-col items-center">
      <div ref={containerRef} className="flex flex-col items-center w-full" />

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
  const { t } = useTranslation();
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
        setError(t('sign_components.document_viewer.docx_error'));
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
export type { SignatureImage };
