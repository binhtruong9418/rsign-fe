import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { GlobalWorkerOptions, getDocument, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
// @ts-ignore - Vite handles ?url imports for static assets
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { SignaturePosition } from '../types';

type Selection = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type Handle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

type InteractionMode = 'idle' | 'drawing' | 'dragging' | 'resizing';

interface SignaturePlacementModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentUri: string;
    signatureId: number | null;
    onSubmit: (position: SignaturePosition) => void;
    isSubmitting: boolean;
    submitError?: string | null;
}

const CANVAS_TARGET_WIDTH = 620;
const MIN_SELECTION_SIZE = 16;
const HANDLE_SIZE = 12;

const handles: Handle[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

GlobalWorkerOptions.workerSrc = pdfjsWorker;

const SignaturePlacementModal: React.FC<SignaturePlacementModalProps> = ({
    isOpen,
    onClose,
    documentUri,
    signatureId,
    onSubmit,
    isSubmitting,
    submitError,
}) => {
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [pageCount, setPageCount] = useState(1);
    const [activePage, setActivePage] = useState(1);
    const [documentError, setDocumentError] = useState<string | null>(null);
    const [isPageRendering, setIsPageRendering] = useState(false);
    const [selectionByPage, setSelectionByPage] = useState<Record<number, Selection>>({});
    const [renderedSize, setRenderedSize] = useState<{ width: number; height: number } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const modeRef = useRef<InteractionMode>('idle');
    const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const resizeHandleRef = useRef<Handle | null>(null);
    const selectionStartRef = useRef<Selection | null>(null);
    const pointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const selectionRef = useRef<Selection | null>(null);
    const renderScaleRef = useRef(1);

    const selection = selectionByPage[activePage] ?? null;

    const updateSelectionForActive = (next: Selection | null | ((current: Selection | null) => Selection | null)) => {
        setSelectionByPage((currentMap) => {
            const currentSelection = currentMap[activePage] ?? null;
            const computed =
                typeof next === 'function'
                    ? (next as (current: Selection | null) => Selection | null)(currentSelection)
                    : next;
            const updated = { ...currentMap };
            if (!computed) {
                delete updated[activePage];
                return updated;
            }
            updated[activePage] = computed;
            return updated;
        });
    };

    useEffect(() => {
        selectionRef.current = selection ?? null;
    }, [selection]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        let isSubscribed = true;
        setDocumentError(null);
        setSelectionByPage({});
        setActivePage(1);
        setRenderedSize(null);

        const loadingTask = getDocument({ url: documentUri });

        loadingTask.promise
            .then((doc) => {
                if (!isSubscribed) {
                    return;
                }
                setPdfDoc(doc);
                setPageCount(doc.numPages);
            })
            .catch((error) => {
                if (!isSubscribed) {
                    return;
                }
                console.error('Failed to load PDF document', error);
                setDocumentError('Unable to load document preview for signature placement.');
            });

        return () => {
            isSubscribed = false;
            setPdfDoc((currentDoc) => {
                if (currentDoc) {
                    currentDoc.destroy();
                }
                return null;
            });
            loadingTask.destroy();
        };
    }, [documentUri, isOpen]);

    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) {
            return;
        }

        let isSubscribed = true;
        setIsPageRendering(true);

        pdfDoc
            .getPage(activePage)
            .then((page: PDFPageProxy) => {
                if (!isSubscribed) {
                    return;
                }

                const viewport = page.getViewport({ scale: 1 });
                const scale = Math.min(CANVAS_TARGET_WIDTH / viewport.width, 2);
                const renderViewport = page.getViewport({ scale });

                renderScaleRef.current = scale;
                setRenderedSize({ width: renderViewport.width, height: renderViewport.height });

                const canvas = canvasRef.current;
                if (!canvas) {
                    return;
                }
                const context = canvas.getContext('2d');
                if (!context) {
                    setDocumentError('Canvas rendering is not supported in this browser.');
                    return;
                }

                canvas.width = renderViewport.width;
                canvas.height = renderViewport.height;

                context.clearRect(0, 0, canvas.width, canvas.height);

                return page.render({ canvasContext: context, viewport: renderViewport }).promise;
            })
            .then(() => {
                if (!isSubscribed) {
                    return;
                }
                setIsPageRendering(false);
            })
            .catch((error) => {
                if (!isSubscribed) {
                    return;
                }
                console.error('Failed to render PDF page', error);
                setDocumentError('Unable to render this page for signature placement.');
                setIsPageRendering(false);
            });

        return () => {
            isSubscribed = false;
            setIsPageRendering(false);
        };
    }, [pdfDoc, activePage]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (modeRef.current !== 'idle') {
                    modeRef.current = 'idle';
                    updateSelectionForActive(null);
                } else {
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const getRelativePoint = (clientX: number, clientY: number) => {
        const container = containerRef.current;
        if (!container) {
            return { x: 0, y: 0 };
        }
        const rect = container.getBoundingClientRect();
        const x = clamp(clientX - rect.left, 0, rect.width);
        const y = clamp(clientY - rect.top, 0, rect.height);
        return { x, y };
    };

    const normalizeSelection = (startX: number, startY: number, endX: number, endY: number): Selection => {
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        return { x, y, width, height };
    };

    const handleOverlayPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (modeRef.current !== 'idle' || !containerRef.current || isPageRendering || !renderedSize) {
            return;
        }

        modeRef.current = 'drawing';
        const point = getRelativePoint(event.clientX, event.clientY);
        pointerStartRef.current = point;
        updateSelectionForActive({ x: point.x, y: point.y, width: 0, height: 0 });
        overlayRef.current?.setPointerCapture(event.pointerId);
    };

    const handleOverlayPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (modeRef.current !== 'drawing') {
            return;
        }
        const point = getRelativePoint(event.clientX, event.clientY);
        const start = pointerStartRef.current;
        updateSelectionForActive(normalizeSelection(start.x, start.y, point.x, point.y));
    };

    const handleOverlayPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (modeRef.current !== 'drawing') {
            return;
        }
        overlayRef.current?.releasePointerCapture(event.pointerId);
        modeRef.current = 'idle';
        updateSelectionForActive((current) => {
            if (!current) {
                return null;
            }
            if (current.width < MIN_SELECTION_SIZE || current.height < MIN_SELECTION_SIZE) {
                return null;
            }
            return current;
        });
    };

    const beginDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        event.stopPropagation();
        const currentSelection = selectionRef.current;
        if (!currentSelection) {
            return;
        }
        const point = getRelativePoint(event.clientX, event.clientY);
        dragOffsetRef.current = {
            x: point.x - currentSelection.x,
            y: point.y - currentSelection.y,
        };
        modeRef.current = 'dragging';
        (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
    };

    const beginResize = (event: React.PointerEvent<HTMLDivElement>, handle: Handle) => {
        event.stopPropagation();
        const currentSelection = selectionRef.current;
        if (!currentSelection) {
            return;
        }
        modeRef.current = 'resizing';
        resizeHandleRef.current = handle;
        selectionStartRef.current = currentSelection;
        pointerStartRef.current = getRelativePoint(event.clientX, event.clientY);
        (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
    };

    const handleInteractionPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!containerRef.current || modeRef.current === 'idle') {
            return;
        }
        event.preventDefault();
        const container = containerRef.current;
        const { clientWidth: maxX, clientHeight: maxY } = container;
        const point = getRelativePoint(event.clientX, event.clientY);

        if (modeRef.current === 'dragging' && selectionRef.current) {
            const { width, height } = selectionRef.current;
            const newX = clamp(point.x - dragOffsetRef.current.x, 0, Math.max(maxX - width, 0));
            const newY = clamp(point.y - dragOffsetRef.current.y, 0, Math.max(maxY - height, 0));
            updateSelectionForActive((current) => (current ? { ...current, x: newX, y: newY } : current));
        } else if (modeRef.current === 'resizing' && selectionStartRef.current && resizeHandleRef.current) {
            const original = selectionStartRef.current;
            let newX = original.x;
            let newY = original.y;
            let newWidth = original.width;
            let newHeight = original.height;
            const handle = resizeHandleRef.current;

            if (handle.includes('n')) {
                newY = clamp(point.y, 0, original.y + original.height - MIN_SELECTION_SIZE);
                newHeight = original.y + original.height - newY;
            }
            if (handle.includes('s')) {
                const clampedY = clamp(point.y, original.y + MIN_SELECTION_SIZE, maxY);
                newHeight = clampedY - original.y;
            }
            if (handle.includes('w')) {
                newX = clamp(point.x, 0, original.x + original.width - MIN_SELECTION_SIZE);
                newWidth = original.x + original.width - newX;
            }
            if (handle.includes('e')) {
                const clampedX = clamp(point.x, original.x + MIN_SELECTION_SIZE, maxX);
                newWidth = clampedX - original.x;
            }

            newWidth = clamp(newWidth, MIN_SELECTION_SIZE, maxX);
            newHeight = clamp(newHeight, MIN_SELECTION_SIZE, maxY);
            newX = clamp(newX, 0, maxX - newWidth);
            newY = clamp(newY, 0, maxY - newHeight);

            updateSelectionForActive({ x: newX, y: newY, width: newWidth, height: newHeight });
        }
    };

    const handleInteractionPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (modeRef.current === 'idle') {
            return;
        }
        (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
        modeRef.current = 'idle';
        resizeHandleRef.current = null;
        selectionStartRef.current = null;
    };

    const handleResetSelection = () => {
        updateSelectionForActive(null);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!selection) {
            return;
        }
        if (signatureId === null || signatureId === undefined) {
            return;
        }

        const scale = renderScaleRef.current || 1;
        const position: SignaturePosition = {
            x: Math.round(selection.x / scale),
            y: Math.round(selection.y / scale),
            width: Math.round(selection.width / scale),
            height: Math.round(selection.height / scale),
            pageNumber: activePage,
        };

        onSubmit(position);
    };

    const handleClose = () => {
        modeRef.current = 'idle';
        updateSelectionForActive(null);
        onClose();
    };

    const goToPage = (direction: 'prev' | 'next') => {
        setRenderedSize(null);
        updateSelectionForActive(null);
        setActivePage((prev) => {
            if (direction === 'prev') {
                return Math.max(1, prev - 1);
            }
            return Math.min(pageCount, prev + 1);
        });
    };

    const selectionSummary = useMemo(() => {
        if (!selection) {
            return 'No selection';
        }
        return `${Math.round(selection.width)} × ${Math.round(selection.height)} px @ (${Math.round(selection.x)}, ${Math.round(selection.y)})`;
    }, [selection]);
    const submitDisabled = !selection || signatureId === null || signatureId === undefined || !!documentError;

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
            <div
                className="flex w-full max-w-6xl flex-col gap-6 rounded-lg bg-dark-card p-6 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-dark-text">Insert Signature</h2>
                        <p className="text-sm text-dark-text-secondary">Draw the placement area and configure signature details.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-dark-text-secondary transition-colors hover:bg-gray-700 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col gap-6 lg:flex-row">
                    <div className="flex-1">
                        <div className="mb-3 flex items-center justify-between text-sm text-dark-text-secondary">
                            <span>Page {activePage} of {pageCount}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => goToPage('prev')}
                                    disabled={activePage === 1 || pageCount <= 1}
                                    className="flex items-center justify-center rounded-md border border-gray-600 p-1 text-dark-text-secondary transition-colors hover:border-brand-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => goToPage('next')}
                                    disabled={activePage === pageCount || pageCount <= 1}
                                    className="flex items-center justify-center rounded-md border border-gray-600 p-1 text-dark-text-secondary transition-colors hover:border-brand-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="relative h-[520px] overflow-auto rounded-md border border-gray-700 bg-gray-900/60">
                            <div
                                ref={containerRef}
                                className="relative mx-auto my-4"
                                style={{
                                    width: renderedSize ? `${renderedSize.width}px` : '100%',
                                    height: renderedSize ? `${renderedSize.height}px` : '100%',
                                }}
                            >
                                <canvas ref={canvasRef} className="block w-full" />
                                {selection && renderedSize && (
                                    <div
                                        className="absolute border-2 border-brand-primary bg-brand-primary/15 text-xs text-white"
                                        style={{
                                            left: selection.x,
                                            top: selection.y,
                                            width: selection.width,
                                            height: selection.height,
                                        }}
                                        onPointerDown={beginDrag}
                                        onPointerMove={handleInteractionPointerMove}
                                        onPointerUp={handleInteractionPointerUp}
                                    >
                                        <div className="absolute top-1 left-1 rounded bg-brand-primary/80 px-2 py-0.5 text-[10px] font-semibold">
                                            {Math.round(selection.width)} × {Math.round(selection.height)}
                                        </div>
                                        {handles.map((handle) => {
                                            const positionStyles: React.CSSProperties = {
                                                width: HANDLE_SIZE,
                                                height: HANDLE_SIZE,
                                            };

                                            switch (handle) {
                                                case 'n':
                                                    positionStyles.left = `calc(50% - ${HANDLE_SIZE / 2}px)`;
                                                    positionStyles.top = -HANDLE_SIZE / 2;
                                                    break;
                                                case 'ne':
                                                    positionStyles.right = -HANDLE_SIZE / 2;
                                                    positionStyles.top = -HANDLE_SIZE / 2;
                                                    break;
                                                case 'e':
                                                    positionStyles.right = -HANDLE_SIZE / 2;
                                                    positionStyles.top = `calc(50% - ${HANDLE_SIZE / 2}px)`;
                                                    break;
                                                case 'se':
                                                    positionStyles.right = -HANDLE_SIZE / 2;
                                                    positionStyles.bottom = -HANDLE_SIZE / 2;
                                                    break;
                                                case 's':
                                                    positionStyles.left = `calc(50% - ${HANDLE_SIZE / 2}px)`;
                                                    positionStyles.bottom = -HANDLE_SIZE / 2;
                                                    break;
                                                case 'sw':
                                                    positionStyles.left = -HANDLE_SIZE / 2;
                                                    positionStyles.bottom = -HANDLE_SIZE / 2;
                                                    break;
                                                case 'w':
                                                    positionStyles.left = -HANDLE_SIZE / 2;
                                                    positionStyles.top = `calc(50% - ${HANDLE_SIZE / 2}px)`;
                                                    break;
                                                case 'nw':
                                                    positionStyles.left = -HANDLE_SIZE / 2;
                                                    positionStyles.top = -HANDLE_SIZE / 2;
                                                    break;
                                                default:
                                                    break;
                                            }

                                            return (
                                                <div
                                                    key={handle}
                                                    className="absolute rounded-full border-2 border-white bg-brand-primary"
                                                    style={positionStyles}
                                                    onPointerDown={(event) => beginResize(event, handle)}
                                                    onPointerMove={handleInteractionPointerMove}
                                                    onPointerUp={handleInteractionPointerUp}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                                <div
                                    ref={overlayRef}
                                    className="absolute inset-0 cursor-crosshair"
                                    onPointerDown={handleOverlayPointerDown}
                                    onPointerMove={handleOverlayPointerMove}
                                    onPointerUp={handleOverlayPointerUp}
                                />
                                {isPageRendering && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40">
                                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-3 flex flex-col gap-2 text-sm text-dark-text-secondary sm:flex-row sm:items-center sm:justify-between">
                            <span>Selection: {selectionSummary}</span>
                            <button
                                type="button"
                                onClick={handleResetSelection}
                                className="text-brand-primary underline-offset-2 transition-colors hover:text-brand-secondary hover:underline"
                            >
                                Reset selection
                            </button>
                        </div>
                        {documentError && (
                            <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
                                {documentError}
                            </div>
                        )}
                    </div>
                    <form
                        onSubmit={handleSubmit}
                        className="w-full max-w-xs flex-shrink-0 rounded-lg border border-gray-700 bg-gray-900/60 p-4"
                    >
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-dark-text">Signature</p>
                                <p className="mt-1 text-xs text-dark-text-secondary">
                                    Using signature ID <span className="font-mono text-dark-text">{signatureId ?? '—'}</span>
                                </p>
                            </div>

                            <div className="rounded-md border border-dashed border-gray-600 bg-gray-800/50 p-3 text-sm text-dark-text-secondary">
                                <p className="font-medium text-dark-text">Placement summary</p>
                                <p className="mt-1 text-xs text-dark-text-secondary">
                                    Coordinates convert automatically to PDF space when you submit. Drag or resize the selection for precise placement.
                                </p>
                                <p className="mt-2 rounded bg-gray-900/60 px-2 py-1 font-mono text-xs text-dark-text">
                                    {selectionSummary}
                                </p>
                                <p className="mt-2 font-mono text-xs text-dark-text">
                                    Target page: {activePage}
                                </p>
                            </div>

                            {(submitError || (signatureId === null || signatureId === undefined)) && (
                                <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
                                    {submitError || 'No signature is associated with this document.'}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitDisabled || isSubmitting}
                                className="flex w-full items-center justify-center rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-secondary disabled:cursor-not-allowed disabled:bg-brand-primary/60"
                            >
                                {isSubmitting ? 'Inserting…' : 'Insert Signature'}
                            </button>

                            <button
                                type="button"
                                onClick={handleClose}
                                className="mt-2 w-full rounded-md border border-gray-600 px-4 py-2 text-sm font-semibold text-dark-text transition-colors hover:border-brand-primary hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignaturePlacementModal;
