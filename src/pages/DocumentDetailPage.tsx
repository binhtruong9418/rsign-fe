import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../services/api';
import { Document } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { Copy, X, Signature, FileText, AlertCircle, Download, Play, CheckCircle } from 'lucide-react';
import SignatureViewer, { SignatureViewerRef } from '../components/SignatureViewer';
import { DEFAULT_SIGNATURE_COLOR, DEFAULT_SIGNATURE_WIDTH } from '../constants/app';
import DocumentViewer from '../components/DocumentViewer';

const fetchDocument = async (id: string): Promise<Document> => {
    const { data } = await api.get(`/api/documents/${id}`);
    return data;
};

const DocumentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [timer, setTimer] = useState(0);
    const signatureViewerRef = useRef<SignatureViewerRef>(null);
    const queryClient = useQueryClient();

    if (!id) {
        return <p>Document ID is missing.</p>;
    }

    const { data: document, isLoading: isLoadingDoc, error: docError, } = useQuery<Document, Error>({
        queryKey: ['document', id],
        queryFn: () => fetchDocument(id),
    });


    const refreshTokenMutation = useMutation<Document, Error>({
        mutationFn: () => api.post(`/api/documents/refresh-signing-token/${id}`).then(res => res.data),
        onSuccess: (newDocumentData) => {
            queryClient.setQueryData(['document', id], (oldData: any) => ({
                ...oldData,
                signingToken: newDocumentData.signingToken,
                signingTokenExpires: newDocumentData.signingTokenExpires
            }));
        },
        onError: (error) => {
            console.error('Failed to refresh token', error);
            alert('Failed to generate a new signing link. Please close and try again.');
        }
    });



    useEffect(() => {
        if (!isShareModalOpen || !document?.signingTokenExpires) {
            setTimer(0);
            return;
        }

        const calculateAndSetTimer = () => {
            const expires = new Date(document.signingTokenExpires!).getTime();
            const now = new Date().getTime();
            const remaining = Math.floor((expires - now) / 1000);

            if (remaining <= 0) {
                setTimer(0);
                if (!refreshTokenMutation.isPending) {
                    refreshTokenMutation.mutate();
                }
            } else {
                setTimer(remaining);
            }
        };

        calculateAndSetTimer();
        const intervalId = setInterval(calculateAndSetTimer, 1000);

        return () => clearInterval(intervalId);

    }, [isShareModalOpen, document?.signingTokenExpires, refreshTokenMutation]);

    const openShareModal = () => {
        if (document?.signingTokenExpires) {
            console.log('Document signing token expires at:', document.signingTokenExpires);
            const expires = new Date(document.signingTokenExpires).getTime();
            const now = new Date().getTime();
            if (expires - now <= 0 && !refreshTokenMutation.isPending) {
                refreshTokenMutation.mutate();
            }
        }
        setIsShareModalOpen(true);
    };

    const signUrl = document?.signingToken ? `${window.location.origin}/sign/${document?.signingToken}` : '';

    const copyToClipboard = () => {
        if (signUrl) {
            navigator.clipboard.writeText(signUrl).then(() => {
                alert('Signing link copied to clipboard!');
            }, (err) => {
                alert('Failed to copy link.');
                console.error('Could not copy text: ', err);
            });
        }
    };

    const handleDownload = () => signatureViewerRef.current?.download();
    const handlePlayback = () => signatureViewerRef.current?.playback();

    if (isLoadingDoc) return <LoadingSpinner />;
    if (docError) return <p className="text-red-500">Error loading document: {docError.message}</p>;
    if (!document) return <p>Document not found.</p>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content: Signature Viewer */}
            <div className="lg:col-span-2 bg-dark-card p-6 rounded-lg shadow-lg flex flex-col">
                <h2 className="text-xl font-semibold mb-4 text-dark-text">Signature</h2>
                {document?.signature ? (
                    <>
                        <div className="bg-white rounded-lg aspect-video w-full flex-grow">
                            <SignatureViewer
                                ref={signatureViewerRef}
                                strokes={document?.signature.signatureData.strokes}
                                documentTitle={document.title}
                                strokeColor={document?.signature.signatureData.color || DEFAULT_SIGNATURE_COLOR}
                                strokeWidth={document?.signature.signatureData.width || DEFAULT_SIGNATURE_WIDTH}
                            />
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <p className="font-semibold text-dark-text">Signed by: {document?.signature.signer?.email}</p>
                            <p className="text-sm text-dark-text-secondary">Signed
                                on: {new Date(document?.signedAt).toLocaleString()}</p>
                            <div className="flex items-center space-x-4 mt-4">
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    <Download size={18} />
                                    <span>Download</span>
                                </button>
                                <button
                                    onClick={handlePlayback}
                                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-secondary transition-colors"
                                >
                                    <Play size={18} />
                                    <span>Playback</span>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div
                        className="flex-grow flex flex-col items-center justify-center bg-gray-700/50 rounded-lg p-8 text-center">
                        <Signature size={48} className="text-dark-text-secondary mb-4" />
                        <h3 className="text-xl font-medium text-dark-text">No Signatures Yet</h3>
                        <p className="text-dark-text-secondary mt-1">Share the signing link to get this document
                            signed.</p>
                    </div>
                )}
            </div>

            {/* Sidebar: Document Content & Actions */}
            <div className="bg-dark-card p-6 rounded-lg shadow-lg flex flex-col">

                <div>
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold text-brand-primary break-words" title={document.title}>{document.title}</h1>
                        <div className="mt-2">
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${document.status === 'COMPLETED' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
                                }`}>
                                {document.status}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2 text-sm border-t border-gray-700 pt-4">
                        <div className="flex justify-between items-start gap-4">
                            <p className="text-dark-text-secondary">Authority:</p>
                            <p className="font-medium text-dark-text text-right break-words">{document.competentAuthority}</p>
                        </div>
                        <div className="flex justify-between items-start gap-4">
                            <p className="text-dark-text-secondary">Created:</p>
                            <p className="font-medium text-dark-text text-right">{new Date(document.createdAt).toLocaleString()}</p>
                        </div>
                        {document.deadline && (
                            <div className="flex justify-between items-start gap-4">
                                <p className="text-dark-text-secondary">Deadline:</p>
                                <p className="font-medium text-dark-text text-right">{new Date(document.deadline).toLocaleString()}</p>
                            </div>
                        )}
                        {document.signedAt && (
                            <div className="flex justify-between items-start gap-4">
                                <p className="text-dark-text-secondary">Signed:</p>
                                <p className="font-medium text-dark-text text-right">{new Date(document.signedAt).toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-grow my-4 min-h-[250px]">
                    {document.fileUrl ? (
                        <div className="flex flex-col items-center justify-center h-full text-dark-text-secondary rounded-md border border-dashed border-gray-600 p-4">
                            <FileText size={40} className="text-dark-text-secondary mb-4" />
                            <p className="font-semibold text-dark-text text-center mb-1" title={document.title}>{document.title}</p>
                            <p className="text-sm text-gray-400 mb-4">Click below to view the document.</p>
                            <button
                                onClick={() => setIsViewerOpen(true)}
                                className="mt-auto px-6 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary transition-colors"
                            >
                                View Document
                            </button>
                        </div>
                    ) : document.content ? (
                        <div className="prose prose-invert max-w-none p-4 h-full overflow-y-auto rounded-md border border-gray-600">
                            <p>{document.content}</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-dark-text-secondary rounded-md border border-dashed border-gray-600">
                            <p>No document content or file attached.</p>
                        </div>
                    )}
                </div>
                <div className="mt-auto pt-6 border-t border-gray-700">
                    <button
                        onClick={() => document.status !== 'COMPLETED' && openShareModal()}
                        disabled={document.status === 'COMPLETED'}
                        className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-secondary flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {document.status === 'COMPLETED' ? (
                            <>
                                <CheckCircle size={20} />
                                <span>Completed</span>
                            </>
                        ) : (
                            <>
                                <FileText size={20} />
                                <span>Sign Here</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Share/Sign Modal */}
            {isShareModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setIsShareModalOpen(false)}>
                    <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-md m-4 flex flex-col"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-gray-700">
                            <h3 className="text-xl font-bold">Share Signing Link</h3>
                            <button onClick={() => setIsShareModalOpen(false)}
                                className="text-dark-text-secondary hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            {document?.signingToken ? (
                                <>
                                    <div className="bg-white p-4 rounded-lg flex justify-center">
                                        <QRCodeCanvas value={signUrl} size={200} />
                                    </div>
                                    <p className="mt-4 text-center text-sm text-yellow-400 font-medium">
                                        Link expires in {timer} seconds
                                    </p>
                                    <div className="mt-4 relative">
                                        <input
                                            type="text"
                                            value={signUrl}
                                            readOnly
                                            className="w-full bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 text-xs p-2 pr-10"
                                        />
                                        <button onClick={copyToClipboard} title="Copy link"
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-dark-text-secondary hover:text-white transition-colors">
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-dark-text-secondary">
                                    <AlertCircle className="mx-auto h-12 w-12" />
                                    <h4 className="mt-2 text-lg">Signing Link Not Available</h4>
                                    <p className="mt-1 text-sm">A signing link could not be generated for this
                                        document.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <DocumentViewer
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                documentUri={document.fileUrl || ''}
                documentTitle={document.title}
            />
        </div>
    );
};

export default DocumentDetailPage;
