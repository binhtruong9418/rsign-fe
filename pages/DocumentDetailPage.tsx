import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../services/api';
import { Document, Signature, Stroke } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { Copy, X } from 'lucide-react';
import SignatureViewer from '../components/SignatureViewer';

const fetchDocument = async (id: string): Promise<Document> => {
    const { data } = await api.get(`/api/documents/${id}`);
    return data;
};

const fetchSignatures = async (id: string): Promise<Signature[]> => {
    const { data } = await api.get(`/api/signatures/document/${id}`);
    return data;
};


const DocumentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null);

    if (!id) {
        return <p>Document ID is missing.</p>;
    }

    const { data: document, isLoading: isLoadingDoc, error: docError } = useQuery<Document, Error>({
        queryKey: ['document', id],
        queryFn: () => fetchDocument(id),
    });

    const signatures = document?.signatures
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

    const generateSvg = (strokes: Stroke[] | null): string => {
        if (!strokes || strokes.length === 0) {
            return '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="64" viewBox="0 0 128 64"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="#a0aec0">No Data</text></svg>';
        }

        const allPoints = strokes.flatMap(s => s.points);
        if(allPoints.length === 0) return generateSvg(null);

        const minX = Math.min(...allPoints.map(p => p.x));
        const maxX = Math.max(...allPoints.map(p => p.x));
        const minY = Math.min(...allPoints.map(p => p.y));
        const maxY = Math.max(...allPoints.map(p => p.y));

        const width = (maxX - minX) || 1;
        const height = (maxY - minY) || 1;
        const padding = Math.max(width, height) * 0.1; // 10% padding

        const paths = strokes.map(stroke => {
            if (stroke.points.length < 2) return '';
            const pathData = 'M ' + stroke.points.map(p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L ');
            return `<path d="${pathData}" stroke="${stroke.color || '#FFFFFF'}" stroke-width="${stroke.width || 2}" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
        }).join('');

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX - padding} ${minY - padding} ${width + padding*2} ${height + padding*2}">${paths}</svg>`;
    };


    if (isLoadingDoc) return <LoadingSpinner />;
    if (docError) return <p className="text-red-500">Error loading document: {docError.message}</p>;
    if (!document) return <p>Document not found.</p>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-dark-card p-6 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-brand-primary mb-4">{document.title}</h1>
                <p className="text-sm text-dark-text-secondary mb-6">
                    Created on {new Date(document.created_at).toLocaleString()}
                </p>
                <div className="prose prose-invert max-w-none prose-p:text-dark-text prose-headings:text-dark-text">
                    <p>{document.content}</p>
                </div>
            </div>

            <div className="space-y-8">
                <div className="bg-dark-card p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-dark-text">Share Signing Link</h2>
                    {document?.signing_token && (
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
                    )}
                </div>

                <div className="bg-dark-card p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-dark-text">Signatures ({signatures?.length || 0})</h2>
                    <ul className="space-y-4">
                        {signatures && signatures.length > 0 ? (
                            signatures.map((sig: any) => (
                                <li key={sig.id} className="flex items-center space-x-4">
                                    <button onClick={() => setSelectedSignature(sig)} className="w-24 h-12 p-1 rounded object-contain cursor-pointer bg-white hover:bg-gray-200 transition-all flex-shrink-0">
                                        <img src={`data:image/svg+xml;base64,${btoa(generateSvg(sig.signature_data.strokes))}`} alt="Signature Preview" className="w-full h-full object-contain"/>
                                    </button>
                                    <div>
                                        <p className="font-semibold text-dark-text">{sig.user?.email}</p>
                                        <p className="text-sm text-dark-text-secondary">Signed on {new Date(sig.created_at).toLocaleString()}</p>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <p className="text-dark-text-secondary">No signatures yet.</p>
                        )}
                    </ul>
                </div>
            </div>

            {selectedSignature && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSignature(null)}>
                    <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-3xl m-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-gray-700">
                            <h3 className="text-xl font-bold">Signature by {selectedSignature.user?.email}</h3>
                            <button onClick={() => setSelectedSignature(null)} className="text-dark-text-secondary hover:text-white">
                                <X size={24}/>
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="bg-white rounded-lg aspect-video w-full">
                                <SignatureViewer strokes={selectedSignature?.signature_data?.strokes || []} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default DocumentDetailPage;
