import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
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
      background: #111827;
    }

    .docx-preview {
      background: #ffffff;
      color: #111827;
      font-family: 'Times New Roman', Georgia, serif;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.3);
    }

    .docx-preview section {
      margin: 0 auto;
    }

    .docx-preview p {
      margin: 0 0 1em;
      line-height: 1.6;
    }

    .docx-preview h1,
    .docx-preview h2,
    .docx-preview h3,
    .docx-preview h4,
    .docx-preview h5,
    .docx-preview h6 {
      font-family: 'Times New Roman', Georgia, serif;
      margin: 1.5em 0 0.75em;
    }
  `;
  document.head.appendChild(style);
  docxPreviewStylesInjected = true;
};

type DocumentMediaType = 'image' | 'pdf' | 'docx' | 'unknown';

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
  if (!uri) {
    return null;
  }

  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(uri, base);
    const pathname = url.pathname;
    const lastSegment = pathname.split('/').pop() ?? '';
    const cleanSegment = lastSegment.split('#')[0].split('?')[0];
    const parts = cleanSegment.split('.');
    if (parts.length < 2) {
      return null;
    }
    return parts.pop()?.toLowerCase() ?? null;
  } catch {
    const sanitizedUri = uri.split('#')[0].split('?')[0];
    const parts = sanitizedUri.split('.');
    if (parts.length < 2) {
      return null;
    }
    return parts.pop()?.toLowerCase() ?? null;
  }
};

export const detectDocumentMediaType = (uri: string): DocumentMediaType => {
  const extension = extractExtension(uri);
  if (!extension) {
    return 'unknown';
  }
  if (IMAGE_EXTENSIONS.includes(extension)) {
    return 'image';
  }
  if (PDF_EXTENSIONS.includes(extension)) {
    return 'pdf';
  }
  if (DOCX_EXTENSIONS.includes(extension)) {
    return 'docx';
  }
  return 'unknown';
};

const DocumentContentViewer: React.FC<DocumentContentViewerProps> = ({
  documentUri,
  documentTitle,
  className = '',
}) => {
  const mediaType = useMemo(() => detectDocumentMediaType(documentUri), [documentUri]);

  if (!documentUri) {
    return (
      <div className={`flex items-center justify-center rounded-lg border border-gray-700 bg-gray-900/70 p-6 text-sm text-dark-text-secondary ${className}`}>
        No document available to preview.
      </div>
    );
  }

  switch (mediaType) {
    case 'image':
      return <ImagePreview url={documentUri} title={documentTitle} className={className} />;
    case 'pdf':
      return <PdfPreview url={documentUri} className={className} />;
    case 'docx':
      return <DocxPreview url={documentUri} className={className} />;
    default:
      return (
        <div className={`flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-900/70 p-6 text-center text-sm text-dark-text-secondary ${className}`}>
          <AlertTriangle className="h-6 w-6 text-yellow-400" />
          <p>Preview is unsupported for this file type.</p>
          <a
            href={documentUri}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-brand-primary px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-brand-primary"
          >
            Download document
          </a>
        </div>
      );
  }
};

interface PreviewProps {
  className?: string;
}

interface ImagePreviewProps extends PreviewProps {
  url: string;
  title: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ url, title, className = '' }) => (
  <div className={`flex max-h-full w-full items-center justify-center overflow-auto rounded-lg bg-gray-900/40 p-3 ${className}`}>
    <img
      src={url}
      alt={title}
      className="max-h-full w-auto max-w-full rounded-md shadow-lg"
    />
  </div>
);

interface PdfPreviewProps extends PreviewProps {
  url: string;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ url, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;

    if (!container) {
      return;
    }

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

          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (!context) {
            page.cleanup();
            continue;
          }

          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.background = '#ffffff';
          canvas.className = 'mb-4 rounded-md shadow-lg';

          container.appendChild(canvas);

          await page.render({ canvasContext: context, viewport }).promise;
          page.cleanup();
        }

        pdf.destroy();
        if (isMounted) {
          setIsLoading(false);
        }
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
  }, [url]);

  return (
    <div className={`relative max-h-full overflow-auto rounded-lg border border-gray-700 bg-gray-900/40 p-3 ${className}`}>
      <div ref={containerRef} className="mx-auto flex max-w-4xl flex-col items-center justify-start" />
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};

interface DocxPreviewProps extends PreviewProps {
  url: string;
}

const DocxPreview: React.FC<DocxPreviewProps> = ({ url, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let isMounted = true;
    const abortController = new AbortController();
    container.innerHTML = '';
    setIsLoading(true);
    setError(null);

    const loadDocx = async () => {
      try {
        ensureDocxPreviewStyles();
        const response = await fetch(url, { signal: abortController.signal });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        if (!isMounted) {
          return;
        }
        await renderAsync(arrayBuffer, container, undefined, docxRenderOptions);
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!isMounted) {
          return;
        }
        if ((err as { name?: string }).name === 'AbortError') {
          return;
        }
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
    <div className={`relative max-h-full overflow-auto rounded-lg border border-gray-700 bg-gray-900/40 p-3 ${className}`}>
      <div
        ref={containerRef}
        className="docx-preview-container mx-auto w-full max-w-4xl rounded-lg bg-white p-6 text-black shadow-lg"
      />
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};

export default DocumentContentViewer;
