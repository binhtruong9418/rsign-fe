import React, { useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import SignaturePad, { SignaturePadRef } from '../SignaturePad';
import { DEFAULT_SIGNATURE_COLOR, DEFAULT_SIGNATURE_WIDTH } from '../../constants/app';

interface SignatureViewProps {
    onBack: () => void;
    onClear: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    signaturePadRef: React.RefObject<SignaturePadRef>;
}

const SignatureView: React.FC<SignatureViewProps> = ({
    onBack,
    onClear,
    onSubmit,
    isSubmitting,
    signaturePadRef,
}) => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-row justify-center gap-4 pb-4 flex-shrink-0">
                <button
                    onClick={onClear}
                    className="w-1/2 btn-secondary py-3"
                >
                    Clear
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="w-1/2 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Submitting...' : 'Sign'}
                </button>
            </div>
            <div className="flex-grow w-full min-h-0 relative border border-secondary-200 rounded-lg overflow-hidden">
                <button
                    onClick={onBack}
                    className="absolute top-2 left-2 z-10 flex items-center space-x-2 bg-white/90 backdrop-blur-sm text-secondary-600 hover:text-primary-600 pl-2 pr-3 py-2 rounded-full shadow-sm border border-secondary-200 transition-colors"
                    aria-label="Back to document"
                >
                    <ArrowLeft size={20} />
                    <span className="text-sm font-medium">Back</span>
                </button>
                <SignaturePad
                    ref={signaturePadRef}
                    strokeColor={DEFAULT_SIGNATURE_COLOR}
                    strokeWidth={DEFAULT_SIGNATURE_WIDTH}
                />
            </div>
        </div>
    );
};

export default SignatureView;