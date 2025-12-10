import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SignaturePadRef } from '../components/SignaturePad';
import { useDocumentBySessionId, useSignDocumentBySession } from '../hooks/useDocumentQueries';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import LoadingSpinner from '../components/LoadingSpinner';
import CompletedDocumentView from '../components/sign/CompletedDocumentView';
import DocumentReviewView from '../components/sign/DocumentReviewView';
import SignatureView from '../components/sign/SignatureView';
import { DEFAULT_SIGNATURE_COLOR, DEFAULT_SIGNATURE_WIDTH } from '../constants/app';
import { showToast } from '../utils/toast';

type View = 'document' | 'sign';

const SignDocumentPage: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [view, setView] = useState<View>('document');
    const signaturePadRef = useRef<SignaturePadRef>(null);

    // Use body scroll lock hook
    useBodyScrollLock(view === 'sign');

    // Use document hooks
    const { data: documentData, isLoading, error }: any = useDocumentBySessionId(sessionId || '');
    const signMutation = useSignDocumentBySession();

    console.log(error)

    if (!sessionId) {
        return <p className="text-center text-red-500">Signing session ID is missing.</p>;
    }

    const handleSubmitSignature = () => {
        const strokesData = signaturePadRef.current?.getSignature();
        if (strokesData && sessionId) {
            signMutation.mutate({
                strokes: strokesData,
                sessionId: sessionId,
                width: DEFAULT_SIGNATURE_WIDTH,
                color: DEFAULT_SIGNATURE_COLOR
            }, {
                onSuccess: () => {
                    showToast.success('Document signed successfully!');
                    navigate('/');
                },
                onError: (error) => {
                    showToast.error('Failed to sign document: ' + (error.response?.data?.message || error.message));
                }
            });
        } else {
            showToast.warning('Please provide a signature.');
        }
    };

    const handleClearSignature = () => {
        signaturePadRef.current?.clear();
    };

    const containerClasses = view === 'sign'
        ? 'h-screen w-screen sm:h-full sm:max-h-[95vh] sm:max-w-4xl sm:rounded-xl'
        : 'max-w-4xl h-full max-h-[95vh] rounded-xl';

    const paddingClasses = view === 'sign'
        ? 'p-4'
        : 'p-4 sm:p-6';

    return (
        <div className={`min-h-screen bg-secondary-50 flex items-center justify-center ${view === 'sign' ? 'p-0' : 'p-2 sm:p-4'}`}>
            <div className={`w-full bg-white shadow-xl border border-secondary-200 flex flex-col ${containerClasses} ${paddingClasses}`}>
                {isLoading && <LoadingSpinner />}
                {error && <p className="text-red-500 text-center">Error loading document: {error?.response?.data?.message}</p>}
                {documentData && (
                    <>
                        {documentData.status === 'COMPLETED' ? (
                            <CompletedDocumentView document={documentData} />
                        ) : view === 'document' ? (
                            <DocumentReviewView
                                document={documentData}
                                onProceedToSign={() => setView('sign')}
                            />
                        ) : (
                            <SignatureView
                                onBack={() => setView('document')}
                                onClear={handleClearSignature}
                                onSubmit={handleSubmitSignature}
                                isSubmitting={signMutation.isPending}
                                signaturePadRef={signaturePadRef}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SignDocumentPage;