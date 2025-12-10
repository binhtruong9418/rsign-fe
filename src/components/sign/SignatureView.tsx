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
        <div className="flex flex-col h-full relative bg-secondary-50 sm:bg-white">
            {/* Header / Back Button Area */}
            <div className="absolute top-4 left-4 z-10">
                <button
                    onClick={onBack}
                    className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm text-secondary-600 hover:text-primary-600 pl-2 pr-3 py-2 rounded-full shadow-sm border border-secondary-200 transition-colors"
                    aria-label="Back to document"
                >
                    <ArrowLeft size={20} />
                    <span className="text-sm font-medium">Back</span>
                </button>
            </div>

            {/* Signature Area */}
            <div className="flex-grow flex items-center justify-center p-4 sm:p-0 overflow-hidden">
                {/* Mobile: Square & Centered. Desktop: Full size */}
                <div className="w-full aspect-square max-w-[400px] sm:max-w-none sm:w-full sm:h-full sm:aspect-auto bg-white border border-secondary-200 sm:border-0 rounded-2xl sm:rounded-none shadow-sm sm:shadow-none overflow-hidden relative">
                    <SignaturePad
                        ref={signaturePadRef}
                        strokeColor={DEFAULT_SIGNATURE_COLOR}
                        strokeWidth={DEFAULT_SIGNATURE_WIDTH}
                    />
                    {/* Helper text for mobile */}
                    <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none sm:hidden">
                        <span className="text-xs text-secondary-400 bg-white/80 px-2 py-1 rounded-full backdrop-blur-sm">
                            Sign above
                        </span>
                    </div>
                </div>
            </div>

            {/* Buttons Area */}
            <div className="p-4 bg-white border-t border-secondary-200 sm:border-t-0 flex gap-4 shrink-0 z-20">
                <button
                    onClick={onClear}
                    className="flex-1 btn-secondary py-3 text-base"
                >
                    Clear
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="flex-1 btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg sm:shadow-sm"
                >
                    {isSubmitting ? 'Submitting...' : 'Sign Document'}
                </button>
            </div>
        </div>
    );
};

export default SignatureView;