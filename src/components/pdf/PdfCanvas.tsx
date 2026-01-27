import React, { useEffect, useRef, useState } from 'react';
import { PDFPageProxy } from 'pdfjs-dist';
import { Loader2 } from 'lucide-react';

interface SignatureZone {
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
}

export interface SignatureImage {
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    imageData: string;
}

interface PdfCanvasProps {
    page: PDFPageProxy | null;
    scale: number;
    rotation: number;
    signatureZones?: SignatureZone[];
    signatureImages?: SignatureImage[];
    currentPage: number;
    onRenderComplete?: () => void;
}

export const PdfCanvas: React.FC<PdfCanvasProps> = ({
    page,
    scale,
    rotation,
    signatureZones = [],
    signatureImages = [],
    currentPage,
    onRenderComplete,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isRendering, setIsRendering] = useState(false);
    const renderTaskRef = useRef<any>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !page) return;

        let isMounted = true;
        setIsRendering(true);
        container.innerHTML = '';

        const renderPage = async () => {
            try {
                // ... (existing render logic)
                const devicePixelRatio = window.devicePixelRatio || 1;
                const baseScale = Math.min(devicePixelRatio * 1.5, 2.5);
                const effectiveScale = scale * baseScale;
                const viewport = page.getViewport({ scale: effectiveScale, rotation });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d', {
                    alpha: false,
                    willReadFrequently: false,
                    desynchronized: true,
                });

                if (!context) return;

                canvas.height = viewport.height;
                canvas.width = viewport.width;
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                canvas.style.maxWidth = '100%';
                canvas.className = 'rounded-md shadow-md border border-secondary-200 bg-white';

                renderTaskRef.current = page.render({
                    canvasContext: context,
                    viewport,
                    intent: 'display',
                });

                await Promise.race([
                    renderTaskRef.current.promise,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Render timeout')), 30000)
                    ),
                ]);

                if (!isMounted) return;

                const pageWrapper = document.createElement('div');
                pageWrapper.className = 'relative inline-block w-full flex justify-center';

                const canvasContainer = document.createElement('div');
                canvasContainer.appendChild(canvas);

                // Render Signature Images (Render FIRST so they are behind zones/labels)
                const imagesOnThisPage = signatureImages.filter(img => img.pageNumber === currentPage);
                imagesOnThisPage.forEach((sigImage) => {
                    const imgOverlay = document.createElement('div');
                    imgOverlay.className = 'pdf-signature-overlay absolute pointer-events-none'; // Standard z-index (auto), handled by DOM order
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

                // Render Signature Zones (Render SECOND so they overlay images, keeping labels visible)
                const zonesOnThisPage = signatureZones.filter(zone => zone.pageNumber === currentPage);
                zonesOnThisPage.forEach((zone) => {
                    const overlay = document.createElement('div');
                    overlay.className = 'pdf-signature-overlay pdf-zone-active';
                    overlay.style.left = `${zone.x}%`;
                    overlay.style.top = `${zone.y}%`;
                    overlay.style.width = `${zone.width}%`;
                    overlay.style.height = `${zone.height}%`;

                    const label = document.createElement('div');
                    label.className = 'pdf-zone-label';
                    label.textContent = zone.label || '✍️ Sign Here';
                    overlay.appendChild(label);

                    canvasContainer.appendChild(overlay);
                });

                pageWrapper.appendChild(canvasContainer);
                container.appendChild(pageWrapper);

                setIsRendering(false);
                onRenderComplete?.();
            } catch (err) {
                if (isMounted) {
                    console.error('Failed to render page:', err);
                    setIsRendering(false);
                }
            }
        };

        renderPage();

        return () => {
            isMounted = false;
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel?.();
            }
        };
    }, [page, scale, rotation, signatureZones, signatureImages, currentPage, onRenderComplete]);

    return (
        <div className="relative w-full flex flex-col items-center">
            <div ref={containerRef} className="flex flex-col items-center w-full" />

            {isRendering && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                </div>
            )}
        </div>
    );
};
