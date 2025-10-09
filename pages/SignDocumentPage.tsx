import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { Document, Stroke } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import SignaturePad, { SignaturePadRef } from '../components/SignaturePad';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { AxiosError } from 'axios';
import { DEFAULT_SIGNATURE_COLOR, DEFAULT_SIGNATURE_WIDTH } from '../helper/constant';
import DocViewer from '@cyntler/react-doc-viewer';

type View = 'document' | 'sign';

const fetchDocumentByToken = async (token: string): Promise<Document> => {
    const { data } = await api.get(`/api/documents/get-by-token/${token}`);
    return data;
};

const SignDocumentPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [view, setView] = useState<View>('document');
    const [hasAgreed, setHasAgreed] = useState(false);
    const signaturePadRef = useRef<SignaturePadRef>(null);

    useEffect(() => {
        // Guard against document.body being undefined in some environments to prevent crashes.
        if (typeof document !== 'undefined' && document.body) {
            if (view === 'sign') {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
            // Cleanup function to restore scrolling when component unmounts
            return () => {
                if (document.body) {
                    document.body.style.overflow = 'auto';
                }
            };
        }
    }, [view]);

    if (!token) {
        return <p className="text-center text-red-500">Signing token is missing.</p>;
    }

    const { data: documentData, isLoading, error } = useQuery<Document, Error>({
        queryKey: ['documentByToken', token],
        queryFn: () => fetchDocumentByToken(token),
    });

    const signMutation = useMutation<void, AxiosError<{ message: string }>,
        {
            strokes: Stroke[];
            signingToken: string;
            width: number;
            color: string;
        }>({
            mutationFn: (signature) => api.post('/api/signatures/sign', signature),
            onSuccess: () => {
                alert('Document signed successfully!');
                navigate('/');
            },
            onError: (error) => {
                alert('Failed to sign document: ' + (error.response?.data?.message || error.message));
            }
        });

    const handleSubmitSignature = () => {
        const strokesData = signaturePadRef.current?.getSignature();
        if (strokesData && token) {
            signMutation.mutate({
                strokes: strokesData,
                signingToken: token,
                width: DEFAULT_SIGNATURE_WIDTH,
                color: DEFAULT_SIGNATURE_COLOR
            });
        } else {
            alert('Please provide a signature.');
        }
    };

    const handleClearSignature = () => {
        signaturePadRef.current?.clear();
    };

    const containerClasses = view === 'sign'
        ? 'h-screen w-screen sm:h-full sm:max-h-[95vh] sm:max-w-4xl sm:rounded-lg' // Fullscreen mobile, card desktop
        : 'max-w-4xl h-full max-h-[95vh] rounded-lg';

    const paddingClasses = view === 'sign'
        ? 'p-4'
        : 'p-4 sm:p-6';

    return (
        <div className={`min-h-screen bg-dark-bg flex items-center justify-center ${view === 'sign' ? 'p-0' : 'p-2 sm:p-4'}`}>
            <div className={`w-full bg-dark-card shadow-xl flex flex-col ${containerClasses} ${paddingClasses}`}>
                {isLoading && <LoadingSpinner />}
                {error && <p className="text-red-500 text-center">Error loading document: {error.message}</p>}
                {documentData && (
                    <>
                        {documentData.status === 'COMPLETED' ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <CheckCircle size={64} className="text-green-500 mb-4" />
                                <h1 className="text-2xl sm:text-3xl font-bold text-dark-text mb-2">Document Completed</h1>
                                <p className="text-dark-text-secondary mb-6">This document has already been signed and no further action is required.</p>
                                <Link to="/" className="px-8 py-3 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary transition-colors">
                                    Go to Homepage
                                </Link>
                            </div>
                        ) : view === 'document' ? (
                            <div className="flex flex-col h-full min-h-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-dark-text mb-4 truncate" title={documentData.title}>
                                    Review: {documentData.title}
                                </h1>
                                <div className="flex-grow overflow-y-auto min-h-0 border border-gray-700 rounded-md p-4 bg-gray-900/50">
                                    {documentData.fileUrl ? (
                                        <DocViewer
                                            documents={[{ uri: documentData.fileUrl, fileName: documentData.title }]}
                                            config={{
                                                header: { disableHeader: true },
                                                pdfVerticalScrollByDefault: true,
                                            }}
                                            className="w-full h-full"
                                        />
                                    ) : (
                                        <div className="prose prose-invert max-w-none prose-p:text-dark-text prose-headings:text-dark-text p-4">
                                            <p>{documentData.content}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <div className="flex items-center mb-4">
                                        <input
                                            type="checkbox"
                                            id="agreement"
                                            checked={hasAgreed}
                                            onChange={(e) => setHasAgreed(e.target.checked)}
                                            className="h-5 w-5 rounded border-gray-500 bg-gray-700 text-brand-primary focus:ring-brand-secondary"
                                            aria-describedby="agreement-description"
                                        />
                                        <label id="agreement-description" htmlFor="agreement" className="ml-3 block text-sm font-medium text-dark-text-secondary">
                                            I have read and agree to be legally bound by this document.
                                        </label>
                                    </div>
                                    <button
                                        onClick={() => setView('sign')}
                                        disabled={!hasAgreed}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-card focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Proceed to Sign
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex flex-row justify-center gap-4 pb-4 flex-shrink-0">
                                    <button
                                        onClick={handleClearSignature}
                                        className="w-1/2 px-8 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={handleSubmitSignature}
                                        disabled={signMutation.isPending}
                                        className="w-1/2 px-8 py-3 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary disabled:opacity-50 transition-colors"
                                    >
                                        {signMutation.isPending ? 'Submitting...' : 'Sign'}
                                    </button>
                                </div>
                                <div className="flex-grow w-full min-h-0 relative">
                                    <button
                                        onClick={() => setView('document')}
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
                        )
                        }
                    </>
                )}
            </div>
        </div>
    );
};

export default SignDocumentPage;