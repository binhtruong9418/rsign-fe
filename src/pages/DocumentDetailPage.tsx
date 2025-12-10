import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../services/api';
import { Document, InsertSignaturePayload, InsertSignatureResponse, SignaturePosition } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { Copy, X, Signature, FileText, AlertCircle, Download, Play, CheckCircle, PenSquare, Eye } from 'lucide-react';
import SignatureViewer, { SignatureViewerRef } from '../components/SignatureViewer';
import { DEFAULT_SIGNATURE_COLOR, DEFAULT_SIGNATURE_WIDTH } from '../constants/app';
import DocumentViewer from '../components/DocumentViewer';
import SignaturePlacementModal from '../components/SignaturePlacementModal';
import { formatDate } from '@/utils';
import { detectDocumentMediaType, DocumentMediaType } from '../components/DocumentContentViewer';
import { showToast } from '../utils/toast';
import { AxiosError } from 'axios';

const fetchDocument = async (id: string): Promise<Document> => {
    const { data } = await api.get(`/api/documents/${id}`);
    return data;
};

const DocumentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
    const [latestSignedFileUrl, setLatestSignedFileUrl] = useState<string | null>(null);
    const [viewerSource, setViewerSource] = useState<{ url: string; title: string } | null>(null);
    const signatureViewerRef = useRef<SignatureViewerRef>(null);
    const queryClient = useQueryClient();

    if (!id) {
        return <p>Document ID is missing.</p>;
    }

    const { data: document, isLoading: isLoadingDoc, error: docError, } = useQuery<Document, Error>({
        queryKey: ['document', id],
        queryFn: () => fetchDocument(id),
    });

    const {
        data: signingSession,
        mutate: signatureSessionMutation,
        isPending: signatureSessionIsPending,
    } = useMutation({
        mutationFn: () => api.post(`/api/documents/create-signing-session/${id}`).then(res => res.data),
        onSuccess: () => {
            setIsShareModalOpen(true);
        },
        onError: (error: AxiosError<{ message: string }>) => {
            showToast.error('Failed to create signing session: ' + (error.response?.data?.message || error.message));
        }
    });

    const getParsedSignatureId = () => {
        const rawId = document?.signature?.id;
        if (rawId === undefined || rawId === null) {
            return null;
        }
        const numericId = Number(rawId);
        if (Number.isNaN(numericId)) {
            return null;
        }
        return numericId;
    };

    const insertSignatureMutation = useMutation<InsertSignatureResponse, AxiosError<{ message: string }>, InsertSignaturePayload>({
        mutationFn: (payload) => api.post(`/api/documents/${id}/insert-signature`, payload).then(res => res.data),
        onSuccess: (data) => {
            showToast.success('Signature inserted successfully.');
            setLatestSignedFileUrl(data.fileUrl);
            const signedTitle = document ? `${document.title} (Signed)` : 'Signed Document';
            setViewerSource({ url: data.fileUrl, title: signedTitle });
            setIsViewerOpen(true);
            queryClient.invalidateQueries({ queryKey: ['document', id] });
            setIsInsertModalOpen(false);
        },
        onError: (error) => {
            showToast.error('Failed to insert signature: ' + (error.response?.data?.message || error.message));
        },
    });

    const { reset: resetInsertSignature } = insertSignatureMutation;

    useEffect(() => {
        if (!isInsertModalOpen) {
            resetInsertSignature();
        }
    }, [isInsertModalOpen, resetInsertSignature]);

    useEffect(() => {
        if (!isShareModalOpen || !signingSession?.expires_at) {
            setTimer(0);
            return;
        }

        const calculateAndSetTimer = () => {
            const expires = new Date(signingSession.expires_at).getTime();
            const now = new Date().getTime();
            const remaining = Math.floor((expires - now) / 1000);

            if (remaining <= 0) {
                setTimer(0);
                // Create new session when expired
                if (!signatureSessionIsPending) {
                    signatureSessionMutation();
                }
            } else {
                setTimer(remaining);
            }
        };

        calculateAndSetTimer();
        const intervalId = setInterval(calculateAndSetTimer, 1000);

        return () => clearInterval(intervalId);

    }, [isShareModalOpen, signingSession?.expires_at, signatureSessionMutation, signatureSessionIsPending]);

    useEffect(() => {
        setLatestSignedFileUrl(null);
        setViewerSource(null);
    }, [id]);

    const handleSignHereClick = () => {
        if (document?.status !== 'COMPLETED') {
            // Check if we have a valid session
            if (signingSession?.session_id && signingSession?.expires_at) {
                const expires = new Date(signingSession.expires_at).getTime();
                const now = new Date().getTime();
                if (expires - now <= 0) {
                    // Session expired, create new one
                    signatureSessionMutation();
                } else {
                    // Session valid, open modal
                    setIsShareModalOpen(true);
                }
            } else {
                // No session, create new one
                signatureSessionMutation();
            }
        }
    };

    const signUrl = signingSession?.session_id ? `${window.location.origin}/sign/${signingSession.session_id}` : '';

    const copyToClipboard = () => {
        if (signUrl) {
            navigator.clipboard.writeText(signUrl).then(() => {
                showToast.success('Signing link copied to clipboard!');
            }, (err) => {
                showToast.error('Failed to copy link.');
                console.error('Could not copy text: ', err);
            });
        }
    };

    const handleDownload = () => signatureViewerRef.current?.download();
    const openViewer = (url: string, title?: string) => {
        if (!url) {
            return;
        }
        const resolvedTitle = title || document?.title || 'Document';
        setViewerSource({ url, title: resolvedTitle });
        setIsViewerOpen(true);
    };
    const handlePlayback = () => signatureViewerRef.current?.playback();
    const handleInsertSignatureSubmit = (position: SignaturePosition) => {
        const signatureIdValue = getParsedSignatureId();
        if (signatureIdValue === null) {
            showToast.error('Signature is not available for this document.');
            return;
        }
        insertSignatureMutation.mutate({ signatureId: signatureIdValue, position });
    };
    const handleInsertModalClose = () => setIsInsertModalOpen(false);
    const insertSignatureErrorMessage = insertSignatureMutation.isError
        ? insertSignatureMutation.error?.response?.data?.message || insertSignatureMutation.error?.message
        : null;

    if (isLoadingDoc) return <LoadingSpinner />;
    if (docError) return <p className="text-red-500">Error loading document: {docError.message}</p>;
    if (!document) return <p>Document not found.</p>;

    const signatureIdForPlacement = getParsedSignatureId();
    const documentMediaType: DocumentMediaType = document.fileUrl ? detectDocumentMediaType(document.fileUrl) : 'unknown';
    const supportsPlacement = documentMediaType === 'pdf' || documentMediaType === 'image';
    const canInsertSignature = Boolean(document.fileUrl && signatureIdForPlacement !== null && supportsPlacement);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content: Signature Viewer */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-secondary-200 shadow-sm flex flex-col">
                <h2 className="text-xl font-bold mb-4 text-secondary-900">Signature</h2>
                {document?.signature ? (
                    <>
                        <div className="bg-secondary-50 rounded-lg aspect-video w-full flex-grow border border-secondary-200">
                            <SignatureViewer
                                ref={signatureViewerRef}
                                strokes={document?.signature.signatureData.strokes}
                                documentTitle={document.title}
                                strokeColor={document?.signature.signatureData.color || DEFAULT_SIGNATURE_COLOR}
                                strokeWidth={document?.signature.signatureData.width || DEFAULT_SIGNATURE_WIDTH}
                            />
                        </div>
                        <div className="mt-4 pt-4 border-t border-secondary-200">
                            <p className="font-semibold text-secondary-900">Signed by: {document?.signature.signer?.email}</p>
                            <p className="text-sm text-secondary-500">Signed on: {formatDate(document?.signedAt)}</p>
                            <div className="flex items-center space-x-4 mt-4">
                                <button
                                    onClick={handleDownload}
                                    className="btn-secondary flex items-center justify-center space-x-2"
                                >
                                    <Download size={18} />
                                    <span>Download</span>
                                </button>
                                <button
                                    onClick={handlePlayback}
                                    className="btn-primary flex items-center justify-center space-x-2"
                                >
                                    <Play size={18} />
                                    <span>Playback</span>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div
                        className="flex-grow flex flex-col items-center justify-center bg-secondary-50 rounded-lg p-8 text-center border border-dashed border-secondary-300">
                        <Signature size={48} className="text-secondary-400 mb-4" />
                        <h3 className="text-xl font-medium text-secondary-900">No Signatures Yet</h3>
                        <p className="text-secondary-500 mt-1">Share the signing link to get this document signed.</p>
                    </div>
                )}
            </div>

            {/* Sidebar: Document Content & Actions */}
            <div className="bg-white p-6 rounded-xl border border-secondary-200 shadow-sm flex flex-col">

                <div>
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold text-secondary-900 break-words" title={document.title}>{document.title}</h1>
                        <div className="mt-2">
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${document.status === 'COMPLETED' ? 'bg-accent-500/10 text-accent-600 border border-accent-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                }`}>
                                {document.status}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm border-t border-secondary-200 pt-4">
                        <div className="flex justify-between items-start gap-4">
                            <p className="text-secondary-500">Authority:</p>
                            <p className="font-medium text-secondary-900 text-right break-words">{document.competentAuthority}</p>
                        </div>
                        <div className="flex justify-between items-start gap-4">
                            <p className="text-secondary-500">Created:</p>
                            <p className="font-medium text-secondary-900 text-right">{formatDate(document.createdAt)}</p>
                        </div>
                        {document.deadline && (
                            <div className="flex justify-between items-start gap-4">
                                <p className="text-secondary-500">Deadline:</p>
                                <p className="font-medium text-secondary-900 text-right">{new Date(document.deadline).toLocaleString()}</p>
                            </div>
                        )}
                        {document.signedAt && (
                            <div className="flex justify-between items-start gap-4">
                                <p className="text-secondary-500">Signed:</p>
                                <p className="font-medium text-secondary-900 text-right">{formatDate(document.signedAt)}</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-grow my-6 min-h-[20px]">
                    {document.fileUrl ? (
                        <div className="flex flex-col items-center justify-center h-full text-secondary-500 rounded-lg border border-dashed border-secondary-300 p-6 bg-secondary-50">
                            <FileText size={40} className="text-secondary-400 mb-4" />
                            <p className="font-semibold text-secondary-900 text-center mb-1" title={document.title}>{document.title}</p>
                            <p className="text-sm text-secondary-500 mb-6">Click below to view the document.</p>
                            <div className="mt-auto flex w-full flex-col gap-3">
                                <button
                                    onClick={() => openViewer(document.fileUrl!, document.title)}
                                    className="w-full btn-primary"
                                >
                                    View Document
                                </button>
                                {document.signature && (
                                    <button
                                        onClick={() => setIsInsertModalOpen(true)}
                                        disabled={!canInsertSignature}
                                        title={!canInsertSignature ? 'Signature data is not ready for placement yet.' : undefined}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-2 rounded-lg border border-primary-600 text-primary-600 font-bold transition-colors hover:bg-primary-50 disabled:cursor-not-allowed disabled:border-secondary-300 disabled:text-secondary-400 disabled:hover:bg-transparent"
                                    >
                                        <PenSquare size={18} />
                                        <span>Insert Signature</span>
                                    </button>
                                )}
                            </div>
                            {document.signature && (!supportsPlacement || signatureIdForPlacement === null) && (
                                <p className="mt-2 text-center text-xs text-yellow-600">
                                    {supportsPlacement
                                        ? 'Signature placement unlocks once the final signature ID is available.'
                                        : 'Signature placement is only available for PDF or image documents.'}
                                </p>
                            )}
                            {latestSignedFileUrl && (
                                <div className="mt-4 w-full rounded-lg border border-accent-200 bg-accent-50 p-4 text-sm text-accent-700">
                                    <p className="font-semibold text-accent-800">Signed document ready.</p>
                                    <p className="mt-1 text-xs text-accent-600">Preview or download the updated document below.</p>
                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                        <button
                                            onClick={() => openViewer(latestSignedFileUrl, document ? `${document.title} (Signed)` : undefined)}
                                            className="flex items-center justify-center gap-2 rounded-md bg-accent-600 px-4 py-2 text-white transition-colors hover:bg-accent-700"
                                        >
                                            <Eye size={16} />
                                            <span>Preview</span>
                                        </button>
                                        <a
                                            href={latestSignedFileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download
                                            className="flex items-center justify-center gap-2 rounded-md border border-accent-600 px-4 py-2 text-accent-600 transition-colors hover:bg-accent-50"
                                        >
                                            <Download size={16} />
                                            <span>Download</span>
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : document.content ? (
                        <div className="prose prose-sm max-w-none p-4 h-full overflow-y-auto rounded-md border border-secondary-200 bg-secondary-50">
                            <p>{document.content}</p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-secondary-500 rounded-md border border-dashed border-secondary-300 bg-secondary-50">
                            <p>No document content or file attached.</p>
                        </div>
                    )}
                </div>
                <div className="mt-auto pt-6 border-t border-secondary-200">
                    <button
                        onClick={handleSignHereClick}
                        disabled={document.status === 'COMPLETED' || signatureSessionIsPending}
                        className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {signatureSessionIsPending ? (
                            <>
                                <LoadingSpinner />
                                <span>Creating session...</span>
                            </>
                        ) : document.status === 'COMPLETED' ? (
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
                <div className="fixed inset-0 bg-secondary-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setIsShareModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4 flex flex-col border border-secondary-200"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-secondary-200">
                            <h3 className="text-xl font-bold text-secondary-900">Share Signing Link</h3>
                            <button onClick={() => setIsShareModalOpen(false)}
                                className="text-secondary-500 hover:text-secondary-700">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            {signingSession?.session_id ? (
                                <>
                                    <div className="bg-white p-4 rounded-lg flex justify-center border border-secondary-100 shadow-inner mb-4">
                                        <QRCodeCanvas value={signUrl} size={200} />
                                    </div>
                                    <p className="text-center text-sm text-yellow-600 font-medium mb-4 bg-yellow-50 py-2 rounded-lg border border-yellow-200">
                                        Session expires in {timer} seconds
                                    </p>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={signUrl}
                                            readOnly
                                            className="w-full bg-secondary-50 border border-secondary-300 rounded-lg text-secondary-600 text-xs p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                        <button onClick={copyToClipboard} title="Copy link"
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400 hover:text-primary-600 transition-colors">
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-secondary-500">
                                    <AlertCircle className="mx-auto h-12 w-12 text-secondary-400" />
                                    <h4 className="mt-2 text-lg font-medium text-secondary-900">Signing Link Not Available</h4>
                                    <p className="mt-1 text-sm">A signing session could not be created for this document.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <DocumentViewer
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                documentUri={viewerSource?.url || document.fileUrl || ''}
                documentTitle={viewerSource?.title || document.title}
            />
            {document.fileUrl && (
                <SignaturePlacementModal
                    isOpen={isInsertModalOpen}
                    onClose={handleInsertModalClose}
                    documentUri={document.fileUrl}
                    documentMediaType={documentMediaType}
                    signatureId={signatureIdForPlacement}
                    signatureStrokes={document.signature?.signatureData?.strokes}
                    signatureColor={document.signature?.signatureData?.color || DEFAULT_SIGNATURE_COLOR}
                    signatureWidth={document.signature?.signatureData?.width || DEFAULT_SIGNATURE_WIDTH}
                    onSubmit={handleInsertSignatureSubmit}
                    isSubmitting={insertSignatureMutation.isPending}
                    submitError={insertSignatureErrorMessage}
                />
            )}
        </div>
    );
};

export default DocumentDetailPage;
