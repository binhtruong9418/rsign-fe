import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SignaturePadRef } from '../components/SignaturePad';
import { useDocumentBySessionId, useSignDocumentBySession } from '../hooks/useDocumentQueries';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import LoadingSpinner from '../components/LoadingSpinner';
import CompletedDocumentView from '../components/sign/CompletedDocumentView';
import DocumentReviewView from '../components/sign/DocumentReviewView';
import SignatureView from '../components/sign/SignatureView';
import Header from '../components/Header';
import { DEFAULT_SIGNATURE_COLOR, DEFAULT_SIGNATURE_WIDTH } from '../constants/app';
import { showToast } from '../utils/toast';
import { useTranslation } from 'react-i18next';

type View = 'document' | 'sign';

const SignDocumentPage: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [view, setView] = useState<View>('document');
    const signaturePadRef = useRef<SignaturePadRef>(null);
    const { t } = useTranslation();

    // Use body scroll lock hook
    useBodyScrollLock(view === 'sign');

    // Use document hooks
    const { data: documentData, isLoading, error }: any = useDocumentBySessionId(sessionId || '');
    const signMutation = useSignDocumentBySession();

    if (!sessionId) {
        return (
            <div className="min-h-screen bg-secondary-50 flex flex-col">
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-center text-red-500">{t('sign_document.missing_session_id')}</p>
                </div>
            </div>
        );
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
                    showToast.success(t('sign_document.success'));
                    navigate('/');
                },
                onError: (error) => {
                    showToast.error(t('sign_document.error_signing', { message: error.response?.data?.message || error.message }));
                }
            });
        } else {
            showToast.warning(t('sign_document.provide_signature'));
        }
    };

    const handleClearSignature = () => {
        signaturePadRef.current?.clear();
    };

    return (
        <div className="min-h-screen bg-secondary-50 flex flex-col">
            <Header />
            <div className="flex-grow flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8">
                <div className={`w-full bg-white shadow-xl border border-secondary-200 flex flex-col rounded-xl overflow-hidden transition-all duration-300 ${view === 'sign' ? 'h-[calc(100vh-6rem)] sm:h-[80vh] max-w-4xl' : 'h-[calc(100vh-6rem)] sm:h-[85vh] max-w-5xl'}`}>
                    {isLoading && (
                        <div className="flex-grow flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    )}
                    {error && (
                        <div className="flex-grow flex items-center justify-center p-6">
                            <p className="text-red-500 text-center">{t('sign_document.error_loading', { message: error?.response?.data?.message })}</p>
                        </div>
                    )}
                    {documentData && (
                        <>
                            {documentData.status === 'COMPLETED' ? (
                                <div className="flex-grow flex items-center justify-center p-6">
                                    <CompletedDocumentView document={documentData} />
                                </div>
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
        </div>
    );
};

export default SignDocumentPage;