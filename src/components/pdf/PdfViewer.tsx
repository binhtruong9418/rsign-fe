import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { usePdfDocument } from '../../hooks/pdf/usePdfDocument';
import { usePdfCache } from '../../hooks/pdf/usePdfCache';
import { useLazyPages } from '../../hooks/pdf/useLazyPages';
import { PdfToolbar } from './PdfToolbar';
import { PdfPagination } from './PdfPagination';
import { PdfCanvas } from './PdfCanvas';
import { PdfTouchHandler } from './PdfTouchHandler';

export interface SignatureZone {
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

interface PdfViewerProps {
    url: string;
    className?: string;
    signatureZones?: SignatureZone[];
    signatureImages?: SignatureImage[];
    onPageChange?: (page: number) => void;
    initialPage?: number;
    enableTouchGestures?: boolean;
    cacheSize?: number;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
    url,
    className = '',
    signatureZones = [],
    signatureImages = [],
    onPageChange,
    initialPage = 1,
    enableTouchGestures = true,
    cacheSize = 5,
}) => {
    const { t } = useTranslation();
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [currentPageProxy, setCurrentPageProxy] = useState<any>(null);
    const [showSignatureZones, setShowSignatureZones] = useState(true);

    const { document, isLoading, error, numPages } = usePdfDocument(url);
    const { getCached, setCached, clearCache } = usePdfCache(cacheSize);

    useLazyPages({
        document,
        currentPage,
    });

    useEffect(() => {
        if (!document) return;

        let isMounted = true;

        document.getPage(currentPage).then(page => {
            if (isMounted) {
                setCurrentPageProxy(page);
            }
        }).catch(err => {
            console.error('Failed to get page:', err);
        });

        return () => {
            isMounted = false;
        };
    }, [document, currentPage]);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);
    const handleReset = () => {
        setScale(1);
        setRotation(0);
    };

    const handleToggleSignatureZones = () => {
        setShowSignatureZones(prev => !prev);
    };

    const handlePageChange = (page: number) => {
        const validPage = Math.max(1, Math.min(numPages, page));
        setCurrentPage(validPage);
        onPageChange?.(validPage);
    };

    const handlePageChangeDirection = (direction: 'next' | 'prev') => {
        if (direction === 'next' && currentPage < numPages) {
            handlePageChange(currentPage + 1);
        } else if (direction === 'prev' && currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
    };

    useEffect(() => {
        return () => {
            clearCache();
        };
    }, [clearCache]);

    if (error) {
        return (
            <div className={`flex flex-col items-center justify-center gap-3 p-12 text-center text-sm text-secondary-500 ${className}`}>
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <p>{t('sign_components.document_viewer.pdf_error')}</p>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm"
                >
                    {t('sign_components.document_viewer.download')}
                </a>
            </div>
        );
    }

    return (
        <div className={`pdf-viewer-container flex flex-col rounded-lg border border-secondary-200 bg-secondary-50/50 overflow-hidden ${className}`}>
            <PdfToolbar
                scale={scale}
                rotation={rotation}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onRotate={handleRotate}
                onReset={handleReset}
                showSignatureZones={showSignatureZones}
                onToggleSignatureZones={handleToggleSignatureZones}
                hasSignatureZones={signatureZones.length > 0}
            />

            <div className="mb-4 px-3 sm:px-4">
                <PdfPagination
                    currentPage={currentPage}
                    totalPages={numPages}
                    onPageChange={handlePageChange}
                    signatureZones={signatureZones}
                />
            </div>

            <PdfTouchHandler
                onZoom={setScale}
                onPageChange={handlePageChangeDirection}
                currentScale={scale}
                minScale={0.5}
                maxScale={3}
                enabled={enableTouchGestures}
                className="grow flex flex-col min-h-0 relative"
            >
                <div className="grow overflow-auto p-4 flex items-start justify-center min-h-[400px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center w-full h-full">
                            <div className="pdf-loading-skeleton w-full max-w-2xl h-[600px] rounded-md" />
                        </div>
                    ) : (
                        <PdfCanvas
                            page={currentPageProxy}
                            scale={scale}
                            rotation={rotation}
                            signatureZones={showSignatureZones ? signatureZones : []}
                            signatureImages={signatureImages}
                            currentPage={currentPage}
                        />
                    )}
                </div>
            </PdfTouchHandler>
        </div>
    );
};
