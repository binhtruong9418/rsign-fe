import { useEffect, useRef } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';

interface UseLazyPagesOptions {
  document: PDFDocumentProxy | null;
  currentPage: number;
  onPageLoaded?: (pageNum: number) => void;
}

export function useLazyPages({ document, currentPage, onPageLoaded }: UseLazyPagesOptions) {
  const loadingRef = useRef<Set<number>>(new Set());
  const abortControllersRef = useRef<Map<number, AbortController>>(new Map());

  useEffect(() => {
    if (!document) return;

    const preloadPages = [currentPage];
    if (currentPage > 1) preloadPages.push(currentPage - 1);
    if (currentPage < document.numPages) preloadPages.push(currentPage + 1);

    abortControllersRef.current.forEach((controller, pageNum) => {
      if (!preloadPages.includes(pageNum)) {
        controller.abort();
        abortControllersRef.current.delete(pageNum);
        loadingRef.current.delete(pageNum);
      }
    });

    preloadPages.forEach(async (pageNum) => {
      if (loadingRef.current.has(pageNum)) return;

      loadingRef.current.add(pageNum);
      const controller = new AbortController();
      abortControllersRef.current.set(pageNum, controller);

      try {
        await document.getPage(pageNum);
        if (!controller.signal.aborted) {
          onPageLoaded?.(pageNum);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error(`Failed to preload page ${pageNum}:`, err);
        }
      } finally {
        loadingRef.current.delete(pageNum);
        abortControllersRef.current.delete(pageNum);
      }
    });

    return () => {
      abortControllersRef.current.forEach(controller => controller.abort());
      abortControllersRef.current.clear();
      loadingRef.current.clear();
    };
  }, [document, currentPage, onPageLoaded]);
}
