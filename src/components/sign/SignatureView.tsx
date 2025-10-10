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
                    className="w-1/2 px-8 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors"
                >
                    Clear
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="w-1/2 px-8 py-3 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary disabled:opacity-50 transition-colors"
                >
                    {isSubmitting ? 'Submitting...' : 'Sign'}
                </button>
            </div>
            <div className="flex-grow w-full min-h-0 relative">
                <button
                    onClick={onBack}
                    className="absolute top-2 left-2 z-10 flex items-center space-x-2 bg-dark-card/75 backdrop-blur-sm text-dark-text-secondary hover:text-brand-primary pl-2 pr-3 py-2 rounded-full transition-colors"
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