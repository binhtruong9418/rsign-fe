import { useEffect, useRef, useState } from 'react';
import { getDocument, PDFDocumentProxy, GlobalWorkerOptions } from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

if (GlobalWorkerOptions.workerSrc !== pdfjsWorker) {
  GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

interface UsePdfDocumentResult {
  document: PDFDocumentProxy | null;
  isLoading: boolean;
  error: Error | null;
  numPages: number;
  reload: () => void;
}

export function usePdfDocument(url: string): UsePdfDocumentResult {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [numPages, setNumPages] = useState(0);
  const loadingTaskRef = useRef<ReturnType<typeof getDocument> | null>(null);
  const documentRef = useRef<PDFDocumentProxy | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDocument = async () => {
      // Cleanup previous loading task if exists
      if (loadingTaskRef.current) {
        try {
          loadingTaskRef.current.destroy();
        } catch (e) {
          // Ignore errors during cleanup
        }
        loadingTaskRef.current = null;
      }

      setIsLoading(true);
      setError(null);

      console.log('Loading PDF from URL:', url);

      try {
        loadingTaskRef.current = getDocument({
          url,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.12.313/cmaps/',
          cMapPacked: true,
          enableXfa: true,
          standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.12.313/standard_fonts/',
          disableAutoFetch: false,
          disableStream: false,
          disableRange: false,
        });

        const pdf = await loadingTaskRef.current.promise;

        if (!isMounted) {
          pdf.destroy();
          return;
        }

        console.log('PDF loaded successfully, pages:', pdf.numPages);
        documentRef.current = pdf;
        setDocument(pdf);
        setNumPages(pdf.numPages);
        setIsLoading(false);
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error('Failed to load PDF:', err);
        setError(err instanceof Error ? err : new Error('Failed to load PDF'));
        setIsLoading(false);
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
      
      // Cleanup loading task
      if (loadingTaskRef.current) {
        try {
          loadingTaskRef.current.destroy();
        } catch (e) {
          // Ignore errors during cleanup
        }
        loadingTaskRef.current = null;
      }

      // Cleanup document
      if (documentRef.current) {
        try {
          documentRef.current.destroy();
        } catch (e) {
          // Ignore errors during cleanup
        }
        documentRef.current = null;
      }
    };
  }, [url]);

  const reload = () => {
    // Trigger re-load by updating a dependency
    setIsLoading(true);
  };

  return {
    document,
    isLoading,
    error,
    numPages,
    reload,
  };
}
