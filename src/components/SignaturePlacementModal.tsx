import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { GlobalWorkerOptions, getDocument, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
// @ts-ignore - Vite handles ?url imports for static assets
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { SignaturePosition, Stroke } from '../types';
import { DocumentMediaType } from './DocumentContentViewer';

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
    documentMediaType: DocumentMediaType;
    signatureId: number | null;
    signatureStrokes?: Stroke[];
    signatureColor?: string;
    signatureWidth?: number;
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

type SignatureGeometry = {
    strokes: Stroke[];
    bounds: {
        minX: number;
        minY: number;
        width: number;
        height: number;
    };
};

const clearCanvas = (canvas: HTMLCanvasElement) => {
    const context = canvas.getContext('2d');
    if (!context) {
        return;
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
};

const drawSignatureToCanvas = (
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    geometry: SignatureGeometry,
    options: {
        color?: string;
        baseLineWidth?: number;
    }
) => {
    if (width <= 0 || height <= 0) {
        clearCanvas(canvas);
        return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
        return;
    }

    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.max(Math.round(width * dpr), 1);
    const pixelHeight = Math.max(Math.round(height * dpr), 1);

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.scale(dpr, dpr);

    const { bounds, strokes } = geometry;
    const paddingBase = Math.min(width, height) > 120 ? 16 : 8;
    const padding = Math.min(paddingBase, Math.min(width, height) / 3);

    const availableWidth = Math.max(width - padding * 2, 1);
    const availableHeight = Math.max(height - padding * 2, 1);
    const rawScale = Math.min(availableWidth / bounds.width, availableHeight / bounds.height);
    const scale = Math.max(rawScale, 0.05);

    const offsetX = (width - bounds.width * scale) / 2 - bounds.minX * scale;
    const offsetY = (height - bounds.height * scale) / 2 - bounds.minY * scale;

    const strokeColor = options.color || '#111827';
    const baseLineWidth = options.baseLineWidth ?? 2;

    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = strokeColor;
    context.lineWidth = Math.max(baseLineWidth * scale, 0.5);

    strokes.forEach((stroke) => {
        const points = stroke.points;
        if (!points || points.length === 0) {
            return;
        }

        context.beginPath();
        context.moveTo(points[0].x * scale + offsetX, points[0].y * scale + offsetY);

        for (let index = 1; index < points.length; index++) {
            const point = points[index];
            context.lineTo(point.x * scale + offsetX, point.y * scale + offsetY);
        }

        context.stroke();
    });
};

const SignaturePlacementModal: React.FC<SignaturePlacementModalProps> = ({
    isOpen,
    onClose,
    documentUri,
    documentMediaType,
    signatureId,
    signatureStrokes,
    signatureColor,
    signatureWidth,
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
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const sidePreviewCanvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const modeRef = useRef<InteractionMode>('idle');
    const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const resizeHandleRef = useRef<Handle | null>(null);
    const selectionStartRef = useRef<Selection | null>(null);
    const pointerStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const selectionRef = useRef<Selection | null>(null);
    const renderScaleRef = useRef(1);

    const selection = selectionByPage[activePage] ?? null;
    const signatureGeometry = useMemo<SignatureGeometry | null>(() => {
        if (!signatureStrokes || signatureStrokes.length === 0) {
            return null;
        }

        const normalizedStrokes = signatureStrokes
            .map((stroke) => {
                const filteredPoints = (stroke.points ?? []).filter(
                    (point): point is Stroke['points'][number] => Boolean(point)
                );
                return {
                    ...stroke,
                    points: filteredPoints,
                };
            })
            .filter((stroke) => stroke.points.length > 0);

        if (normalizedStrokes.length === 0) {
            return null;
        }

        const allPoints = normalizedStrokes.flatMap((stroke) => stroke.points);
        const minX = Math.min(...allPoints.map((point) => point.x));
        const maxX = Math.max(...allPoints.map((point) => point.x));
        const minY = Math.min(...allPoints.map((point) => point.y));
        const maxY = Math.max(...allPoints.map((point) => point.y));

        return {
            strokes: normalizedStrokes,
            bounds: {
                minX,
                minY,
                width: Math.max(maxX - minX, 1),
                height: Math.max(maxY - minY, 1),
            },
        };
    }, [signatureStrokes]);
    const hasDrawableSignature = Boolean(signatureGeometry);
    const isPdfDocument = documentMediaType === 'pdf';
    const isImageDocument = documentMediaType === 'image';
    const supportsPlacement = isPdfDocument || isImageDocument;

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

    const renderSidePreview = useCallback(() => {
        const canvas = sidePreviewCanvasRef.current;
        if (!canvas) {
            return;
        }

        if (!isOpen || !signatureGeometry) {
            clearCanvas(canvas);
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const width = Math.max(rect.width, 1);
        const height = Math.max(rect.height, 1);

        drawSignatureToCanvas(
            canvas,
            width,
            height,
            signatureGeometry,
            {
                color: signatureColor,
                baseLineWidth: signatureWidth,
            }
        );
    }, [isOpen, signatureGeometry, signatureColor, signatureWidth]);

    useEffect(() => {
        const canvas = previewCanvasRef.current;
        if (!canvas) {
            return;
        }

        if (!isOpen || !selection || !signatureGeometry) {
            clearCanvas(canvas);
            return;
        }

        drawSignatureToCanvas(
            canvas,
            Math.max(selection.width, 1),
            Math.max(selection.height, 1),
            signatureGeometry,
            {
                color: signatureColor,
                baseLineWidth: signatureWidth,
            }
        );
    }, [isOpen, selection, signatureGeometry, signatureColor, signatureWidth]);

    useEffect(() => {
        renderSidePreview();
    }, [renderSidePreview]);

    const applyImageDimensions = useCallback((img: HTMLImageElement) => {
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;

        if (!naturalWidth || !naturalHeight) {
            setDocumentError('Unable to read image dimensions for signature placement.');
            return;
        }

        const baseScale = Math.min(CANVAS_TARGET_WIDTH / naturalWidth, 2);
        const safeScale = Number.isFinite(baseScale) && baseScale > 0 ? Math.max(baseScale, 0.1) : 1;

        renderScaleRef.current = safeScale;
        setRenderedSize({
            width: naturalWidth * safeScale,
            height: naturalHeight * safeScale,
        });
    }, [setDocumentError]);

    const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
        applyImageDimensions(event.currentTarget);
        setDocumentError(null);
        setIsPageRendering(false);
    }, [applyImageDimensions]);

    const handleImageError = useCallback(() => {
        setDocumentError('Unable to load image preview for signature placement.');
        setIsPageRendering(false);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        const handleResize = () => {
            renderSidePreview();
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [renderSidePreview]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setSelectionByPage({});
        setActivePage(1);
        setRenderedSize(null);
        setDocumentError(null);
        renderScaleRef.current = 1;
        setPageCount(1);
        modeRef.current = 'idle';

        if (isPdfDocument) {
            let isSubscribed = true;
            setIsPageRendering(true);
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
                    setIsPageRendering(false);
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
        }

        setPdfDoc((currentDoc) => {
            if (currentDoc) {
                currentDoc.destroy();
            }
            return null;
        });

        if (isImageDocument) {
            setPageCount(1);
            setIsPageRendering(true);
            const imgElement = imageRef.current;
            if (imgElement && imgElement.complete && imgElement.naturalWidth) {
                applyImageDimensions(imgElement);
                setIsPageRendering(false);
            }
            return;
        }

        setIsPageRendering(false);
        setDocumentError('This document type is not supported for signature placement.');
    }, [isOpen, documentUri, isPdfDocument, isImageDocument, applyImageDimensions]);

    useEffect(() => {
        if (!isPdfDocument || !pdfDoc || !canvasRef.current) {
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
    }, [pdfDoc, activePage, isPdfDocument]);

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
        if (
            !supportsPlacement ||
            modeRef.current !== 'idle' ||
            !containerRef.current ||
            isPageRendering ||
            !renderedSize
        ) {
            return;
        }

        modeRef.current = 'drawing';
        const point = getRelativePoint(event.clientX, event.clientY);
        pointerStartRef.current = point;
        updateSelectionForActive({ x: point.x, y: point.y, width: 0, height: 0 });
        overlayRef.current?.setPointerCapture(event.pointerId);
    };

    const handleOverlayPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!supportsPlacement || modeRef.current !== 'drawing') {
            return;
        }
        const point = getRelativePoint(event.clientX, event.clientY);
        const start = pointerStartRef.current;
        updateSelectionForActive(normalizeSelection(start.x, start.y, point.x, point.y));
    };

    const handleOverlayPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!supportsPlacement || modeRef.current !== 'drawing') {
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
        if (!supportsPlacement) {
            return;
        }
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
        if (!supportsPlacement) {
            return;
        }
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
        if (!supportsPlacement || !containerRef.current || modeRef.current === 'idle') {
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
        if (!supportsPlacement || modeRef.current === 'idle') {
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
        if (signatureId == null) {
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
    const submitDisabled = !selection || signatureId == null || !!documentError || !supportsPlacement;

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-secondary-900/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="flex w-full max-w-6xl flex-col gap-6 rounded-xl bg-white p-6 shadow-2xl border border-secondary-200"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-secondary-900">Insert Signature</h2>
                        <p className="text-sm text-secondary-500">
                            Draw the placement area and configure signature details. A live preview renders inside your selection.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-secondary-500 transition-colors hover:bg-secondary-100 hover:text-secondary-900"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col gap-6 lg:flex-row">
                    <div className="flex-1">
                        <div className="mb-3 flex items-center justify-between text-sm text-secondary-500">
                            <span>Page {activePage} of {pageCount}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => goToPage('prev')}
                                    disabled={activePage === 1 || pageCount <= 1}
                                    className="flex items-center justify-center rounded-lg border border-secondary-300 p-1 text-secondary-500 transition-colors hover:border-primary-600 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => goToPage('next')}
                                    disabled={activePage === pageCount || pageCount <= 1}
                                    className="flex items-center justify-center rounded-lg border border-secondary-300 p-1 text-secondary-500 transition-colors hover:border-primary-600 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="relative h-[520px] overflow-auto rounded-lg border border-secondary-200 bg-secondary-50">
                            <div
                                ref={containerRef}
                                className="relative mx-auto my-4"
                                style={{
                                    width: renderedSize ? `${renderedSize.width}px` : '100%',
                                    height: renderedSize ? `${renderedSize.height}px` : '100%',
                                }}
                            >
                                {isPdfDocument && (
                                    <canvas ref={canvasRef} className="block w-full" />
                                )}
                                {isImageDocument && (
                                    <img
                                        ref={imageRef}
                                        src={documentUri}
                                        alt="Document for signature placement"
                                        onLoad={handleImageLoad}
                                        onError={handleImageError}
                                        draggable={false}
                                        className="block h-full w-full select-none object-contain"
                                    />
                                )}
                                {!isPdfDocument && !isImageDocument && (
                                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-secondary-50 text-xs text-secondary-500">
                                        Document preview is not available for this file type.
                                    </div>
                                )}
                                {selection && renderedSize && (
                                    <div
                                        className="absolute border-2 border-primary-600 bg-primary-600/15 text-xs text-white"
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
                                        <canvas
                                            ref={previewCanvasRef}
                                            className="pointer-events-none absolute inset-0"
                                        />
                                        {!hasDrawableSignature && (
                                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded bg-black/40 px-2 text-center text-[11px] font-medium">
                                                Signature preview unavailable
                                            </div>
                                        )}
                                        <div className="absolute top-1 left-1 rounded bg-primary-600/90 px-2 py-0.5 text-[10px] font-semibold shadow-sm">
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
                                                    className="absolute rounded-full border-2 border-white bg-primary-600 shadow-sm"
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
                                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/50 backdrop-blur-sm">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-3 flex flex-col gap-2 text-sm text-secondary-500 sm:flex-row sm:items-center sm:justify-between">
                            <span>Selection: {selectionSummary}</span>
                            <button
                                type="button"
                                onClick={handleResetSelection}
                                className="text-primary-600 underline-offset-2 transition-colors hover:text-primary-700 hover:underline"
                            >
                                Reset selection
                            </button>
                        </div>
                        {documentError && (
                            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                                {documentError}
                            </div>
                        )}
                    </div>
                    <form
                        onSubmit={handleSubmit}
                        className="w-full max-w-xs flex-shrink-0 rounded-xl border border-secondary-200 bg-white p-4 shadow-sm"
                    >
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-bold text-secondary-900">Signature preview</p>
                                <p className="mt-1 text-xs text-secondary-500">
                                    Review the captured signature before placing it on the document.
                                </p>
                                <div className="mt-3 rounded-lg border border-dashed border-secondary-300 bg-secondary-50 p-3">
                                    <div className="relative overflow-hidden rounded-md bg-white border border-secondary-200">
                                        <canvas
                                            ref={sidePreviewCanvasRef}
                                            className="h-32 w-full"
                                        />
                                        {!hasDrawableSignature && (
                                            <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-secondary-400">
                                                Signature preview unavailable.
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-2 text-[11px] text-secondary-500">
                                        The preview scales automatically to match your placement selection.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-lg border border-dashed border-secondary-300 bg-secondary-50 p-3 text-sm text-secondary-500">
                                <p className="font-bold text-secondary-900">Placement summary</p>
                                <p className="mt-1 text-xs text-secondary-500">
                                    Coordinates convert automatically to PDF space when you submit. Drag or resize the selection for precise placement.
                                </p>
                                <p className="mt-2 rounded bg-white border border-secondary-200 px-2 py-1 font-mono text-xs text-secondary-700">
                                    {selectionSummary}
                                </p>
                                <p className="mt-2 font-mono text-xs text-secondary-700">
                                    Target page: {activePage}
                                </p>
                            </div>

                            {(submitError || signatureId == null) && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                                    {submitError || 'No signature is associated with this document.'}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitDisabled || isSubmitting}
                                className="w-full btn-primary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Inserting…' : 'Insert Signature'}
                            </button>

                            <button
                                type="button"
                                onClick={handleClose}
                                className="mt-2 w-full btn-secondary py-2"
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
