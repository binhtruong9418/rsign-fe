import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../services/api';
import { Document } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { Copy, X, Signature, FileText, AlertCircle, Download, Play } from 'lucide-react';
import SignatureViewer, { SignatureViewerRef } from '../components/SignatureViewer';

const fetchDocument = async (id: string): Promise<Document> => {
    const { data } = await api.get(`/api/documents/${id}`);
    return data;
};

const DocumentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const signatureViewerRef = useRef<SignatureViewerRef>(null);

    if (!id) {
        return <p>Document ID is missing.</p>;
    }

    const { data: document, isLoading: isLoadingDoc, error: docError } = useQuery<Document, Error>({
        queryKey: ['document', id],
        queryFn: () => fetchDocument(id),
    });

    const latestSignature = document?.signatures?.length
        ? [...document.signatures].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : null;

    const signUrl = document?.signing_token ? `${window.location.origin}/sign/${document?.signing_token}` : '';

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
                <h2 className="text-xl font-semibold mb-4 text-dark-text">Latest Signature</h2>
                {latestSignature ? (
                    <>
                        <div className="bg-white rounded-lg aspect-video w-full flex-grow">
                            <SignatureViewer
                                ref={signatureViewerRef}
                                strokes={latestSignature.signature_data.strokes}
                                documentTitle={document.title}
                            />
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <p className="font-semibold text-dark-text">Signed by: {latestSignature.user?.email}</p>
                            <p className="text-sm text-dark-text-secondary">Signed on: {new Date(latestSignature.created_at).toLocaleString()}</p>
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
                    <div className="flex-grow flex flex-col items-center justify-center bg-gray-700/50 rounded-lg p-8 text-center">
                        <Signature size={48} className="text-dark-text-secondary mb-4" />
                        <h3 className="text-xl font-medium text-dark-text">No Signatures Yet</h3>
                        <p className="text-dark-text-secondary mt-1">Share the signing link to get this document signed.</p>
                    </div>
                )}
            </div>

            {/* Sidebar: Document Content & Actions */}
            <div className="bg-dark-card p-6 rounded-lg shadow-lg flex flex-col">
                <div className="flex-grow">
                    <h1 className="text-2xl font-bold text-brand-primary mb-2">{document.title}</h1>
                    <p className="text-sm text-dark-text-secondary mb-4">
                        Created on {new Date(document.created_at).toLocaleString()}
                    </p>
                    <div className="prose prose-invert max-w-none prose-p:text-dark-text prose-headings:text-dark-text">
                        <p>{document.content}</p>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-700">
                    <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-secondary flex items-center justify-center space-x-2 transition-colors"
                    >
                        <FileText size={20} />
                        <span>Sign Here</span>
                    </button>
                </div>
            </div>

            {/* Share/Sign Modal */}
            {isShareModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setIsShareModalOpen(false)}>
                    <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-md m-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-gray-700">
                            <h3 className="text-xl font-bold">Share Signing Link</h3>
                            <button onClick={() => setIsShareModalOpen(false)} className="text-dark-text-secondary hover:text-white">
                                <X size={24}/>
                            </button>
                        </div>
                        <div className="p-6">
                            {document?.signing_token ? (
                                <>
                                    <div className="bg-white p-4 rounded-lg flex justify-center">
                                        <QRCodeCanvas value={signUrl} size={200} />
                                    </div>
                                    <div className="mt-4 relative">
                                        <input
                                            type="text"
                                            value={signUrl}
                                            readOnly
                                            className="w-full bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 text-xs p-2 pr-10"
                                        />
                                        <button onClick={copyToClipboard} title="Copy link" className="absolute inset-y-0 right-0 flex items-center pr-3 text-dark-text-secondary hover:text-white transition-colors">
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-dark-text-secondary">
                                    <AlertCircle className="mx-auto h-12 w-12" />
                                    <h4 className="mt-2 text-lg">Signing Link Not Available</h4>
                                    <p className="mt-1 text-sm">A signing link could not be generated for this document.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentDetailPage;
