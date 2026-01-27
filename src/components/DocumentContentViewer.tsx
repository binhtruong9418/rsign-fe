import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PdfViewer } from './pdf/PdfViewer';
import type { SignatureZone as PdfSignatureZone, SignatureImage as PdfSignatureImage } from './pdf/PdfViewer';

interface SignatureZone {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

interface SignatureImage {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  imageData: string;
}

interface DocumentContentViewerProps {
  documentUri: string;
  documentTitle: string;
  className?: string;
  signatureZone?: SignatureZone;
  signatureZones?: SignatureZone[];
  signatureImages?: SignatureImage[];
  onPageChange?: (page: number) => void;
}

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

  const allZones = useMemo(() => {
    if (signatureZones && signatureZones.length > 0) {
      return signatureZones;
    }
    if (signatureZone) {
      return [signatureZone];
    }
    return [];
  }, [signatureZone, signatureZones]);

  if (!documentUri) {
    return (
      <div className={`flex items-center justify-center rounded-lg border border-secondary-200 bg-secondary-50 p-6 text-sm text-secondary-500 ${className}`}>
        {t('sign_components.document_viewer.no_document')}
      </div>
    );
  }

  return (
    <PdfViewer
      url={documentUri}
      signatureZones={allZones}
      signatureImages={signatureImages}
      onPageChange={onPageChange}
      initialPage={1}
      enableTouchGestures={true}
      cacheSize={5}
      className={className}
    />
  );
};

export default DocumentContentViewer;
export type { SignatureImage };
