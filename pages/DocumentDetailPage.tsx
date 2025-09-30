import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
// Fix: Use default import for QRCode component
import {QRCodeSVG} from 'qrcode.react';
import api from '../services/api';
import { Document, Signature } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { Copy } from 'lucide-react';

const fetchDocument = async (id: string): Promise<Document> => {
  const { data } = await api.get(`/api/documents/${id}`);
  return data;
};


const generateToken = async (documentId: string): Promise<{ token: string }> => {
    const { data } = await api.post(`/api/documents/${documentId}/generate-token`);
    return data;
}

const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <p>Document ID is missing.</p>;
  }

  const { data: document, isLoading: isLoadingDoc, error: docError } = useQuery<any, Error>({
    queryKey: ['document', id],
    queryFn: () => fetchDocument(id),
  });

  const signatures = document?.signatures;
  const signingToken = document?.signing_token;
  const signUrl = signingToken ? `${window.location.origin}/#/sign/${signingToken}` : '';

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
           {signingToken && (
             <>
               <div className="bg-white p-4 rounded-lg flex justify-center">
                <QRCodeSVG value={signUrl} size={200} />
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
              signatures.map((sig) => (
                <li key={sig.id} className="flex items-center space-x-4">
                    <div dangerouslySetInnerHTML={{ __html: sig.signature_svg }} className="w-24 h-12 p-1 bg-white rounded object-contain"/>
                  <div>
                    <p className="font-semibold text-dark-text">{sig.user?.email}</p>
                    <p className="text-sm text-dark-text-secondary">Signed on {new Date(sig.signed_at).toLocaleString()}</p>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-dark-text-secondary">No signatures yet.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailPage;