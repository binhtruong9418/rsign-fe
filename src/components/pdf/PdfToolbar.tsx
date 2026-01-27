import React from 'react';
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PdfToolbarProps {
    scale: number;
    rotation: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onRotate: () => void;
    onReset: () => void;
    showSignatureZones?: boolean;
    onToggleSignatureZones?: () => void;
    hasSignatureZones?: boolean;
    mediaType?: string;
    className?: string;
}

export const PdfToolbar: React.FC<PdfToolbarProps> = ({
    scale,
    rotation,
    onZoomIn,
    onZoomOut,
    onRotate,
    onReset,
    showSignatureZones = true,
    onToggleSignatureZones,
    hasSignatureZones = false,
    mediaType = 'pdf',
    className = '',
}) => {
    const { t } = useTranslation();

    return (
        <div className={`sticky top-0 z-20 flex flex-wrap items-center justify-between gap-y-3 gap-x-4 bg-white/90 backdrop-blur-md border-b border-secondary-200 px-3 sm:px-4 py-3 rounded-t-xl shadow-sm ${className}`}>
            <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 text-[10px] sm:text-xs font-bold text-primary-700 bg-primary-100/50 border border-primary-200 rounded uppercase tracking-wider">
                    {mediaType}
                </span>

                {hasSignatureZones && onToggleSignatureZones && (
                    <button
                        onClick={onToggleSignatureZones}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${showSignatureZones
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-sm ring-1 ring-amber-200'
                                : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200 hover:text-secondary-900'
                            }`}
                        title={showSignatureZones ? 'Hide signature zones' : 'Show signature zones'}
                        aria-label={showSignatureZones ? 'Hide signature zones' : 'Show signature zones'}
                    >
                        {showSignatureZones ? <Eye size={14} strokeWidth={2.5} /> : <EyeOff size={14} strokeWidth={2.5} />}
                        <span className="hidden sm:inline">
                            {showSignatureZones ? 'Signatures' : 'Show Signatures'}
                        </span>
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar mask-gradient-right">
                {/* Zoom Controls */}
                <div className="flex items-center bg-secondary-50 border border-secondary-200 rounded-lg p-0.5 shadow-sm">
                    <button
                        onClick={onZoomOut}
                        className="p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-white rounded-md transition-all active:scale-95 disabled:opacity-50"
                        title={t('sign_components.document_viewer.zoom_out')}
                        aria-label="Zoom out"
                        disabled={scale <= 0.5}
                    >
                        <ZoomOut size={16} strokeWidth={2.5} />
                    </button>

                    <span className="text-xs font-bold text-secondary-700 w-10 sm:w-12 text-center tabular-nums select-none">
                        {Math.round(scale * 100)}%
                    </span>

                    <button
                        onClick={onZoomIn}
                        className="p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-white rounded-md transition-all active:scale-95 disabled:opacity-50"
                        title={t('sign_components.document_viewer.zoom_in')}
                        aria-label="Zoom in"
                        disabled={scale >= 3}
                    >
                        <ZoomIn size={16} strokeWidth={2.5} />
                    </button>
                </div>

                {/* View Controls */}
                <div className="flex items-center bg-secondary-50 border border-secondary-200 rounded-lg p-0.5 shadow-sm">
                    <button
                        onClick={onRotate}
                        className="p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-white rounded-md transition-all active:scale-95"
                        title={t('sign_components.document_viewer.rotate')}
                        aria-label="Rotate"
                    >
                        <RotateCw size={16} strokeWidth={2.5} />
                    </button>

                    <div className="w-px h-3.5 bg-secondary-200 mx-0.5" />

                    <button
                        onClick={onReset}
                        className="p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-white rounded-md transition-all active:scale-95"
                        title={t('sign_components.document_viewer.reset')}
                        aria-label="Reset view"
                    >
                        <RefreshCw size={16} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );
};
