import React, {useState, useRef} from 'react';
import {useParams, useNavigate, Link} from 'react-router-dom';
import {useQuery, useMutation} from '@tanstack/react-query';
import api from '../services/api';
import {Document} from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import SignaturePad, {SignaturePadRef} from '../components/SignaturePad';
import {FileText, Edit, CheckCircle} from 'lucide-react';
import {AxiosError} from 'axios';

type View = 'document' | 'sign';

const fetchDocumentByToken = async (token: string): Promise<Document> => {
    const {data} = await api.get(`/api/documents/get-by-token/${token}`);
    return data;
};

const SignDocumentPage: React.FC = () => {
    const {token} = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [view, setView] = useState<View>('document');
    const signaturePadRef = useRef<SignaturePadRef>(null);
    const [strokeColor, setStrokeColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(2);


    if (!token) {
        return <p className="text-center text-red-500">Signing token is missing.</p>;
    }

    const {data: document, isLoading, error} = useQuery<Document, Error>({
        queryKey: ['documentByToken', token],
        queryFn: () => fetchDocumentByToken(token),
    });

    const signMutation = useMutation<void, AxiosError<{ message: string }>, {
        strokes: any[];
        signingToken: string,
        color?: string,
        width?: number
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
            signMutation.mutate({strokes: strokesData, signingToken: token, color: strokeColor, width: strokeWidth});
        } else {
            alert('Please provide a signature.');
        }
    };

    const handleClearSignature = () => {
        signaturePadRef.current?.clear();
    };

    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-4xl h-[95vh] bg-dark-card rounded-lg shadow-xl p-4 sm:p-6 flex flex-col">
                {isLoading && <LoadingSpinner/>}
                {error && <p className="text-red-500 text-center">Error loading document: {error.message}</p>}
                {document && (
                    <>
                        {
                            document.status === 'COMPLETED' ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <CheckCircle size={64} className="text-green-500 mb-4"/>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-dark-text mb-2">Document
                                        Completed</h1>
                                    <p className="text-dark-text-secondary mb-6">This document has already been signed
                                        and no further action is required.</p>
                                    <Link to="/"
                                          className="px-8 py-3 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary transition-colors">
                                        Go to Homepage
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full min-h-0">
                                    <h1 className="text-xl sm:text-2xl font-bold text-dark-text mb-2 truncate"
                                        title={document.title}>
                                        Sign: {document.title}
                                    </h1>

                                    <div className="flex border-b border-gray-700 mb-4">
                                        <button onClick={() => setView('document')}
                                                className={`px-4 py-2 text-base sm:text-lg font-medium flex items-center space-x-2 ${view === 'document' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-dark-text-secondary'}`}>
                                            <FileText size={20}/>
                                            <span>Document</span>
                                        </button>
                                        <button onClick={() => setView('sign')}
                                                className={`px-4 py-2 text-base sm:text-lg font-medium flex items-center space-x-2 ${view === 'sign' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-dark-text-secondary'}`}>
                                            <Edit size={20}/>
                                            <span>Sign Here</span>
                                        </button>
                                    </div>

                                    <div className="flex-grow overflow-y-auto min-h-0">
                                        {view === 'document' && (
                                            <div className="p-1">
                                                <div
                                                    className="prose prose-invert max-w-none prose-p:text-dark-text prose-headings:text-dark-text">
                                                    <p>{document.content}</p>
                                                </div>
                                            </div>
                                        )}

                                        {view === 'sign' && (
                                            <div className="flex flex-col h-full">
                                                <p className="text-dark-text-secondary mb-2 text-center">Please sign in
                                                    the box below.</p>

                                                <div
                                                    className="flex justify-center items-center gap-x-4 gap-y-2 mb-4 flex-wrap">
                                                    <div className="flex items-center gap-2">
                                                        <label htmlFor="strokeColor"
                                                               className="text-dark-text-secondary text-sm">Color:</label>
                                                        <input
                                                            type="color"
                                                            id="strokeColor"
                                                            value={strokeColor}
                                                            onChange={(e) => setStrokeColor(e.target.value)}
                                                            className="w-8 h-8 p-0.5 bg-dark-card border-2 border-gray-600 rounded cursor-pointer"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <label htmlFor="strokeWidth"
                                                               className="text-dark-text-secondary text-sm">Width:</label>
                                                        <input
                                                            type="range"
                                                            id="strokeWidth"
                                                            min="1"
                                                            max="20"
                                                            step="1"
                                                            value={strokeWidth}
                                                            onChange={(e) => setStrokeWidth(Number(e.target.value))}
                                                            className="w-32 cursor-pointer"
                                                        />
                                                        <span
                                                            className="text-dark-text-secondary w-8 text-center">{strokeWidth}px</span>
                                                    </div>
                                                </div>

                                                <div className="flex-grow w-full min-h-64">
                                                    <SignaturePad ref={signaturePadRef} strokeColor={strokeColor}
                                                                  strokeWidth={strokeWidth}/>
                                                </div>
                                                <div className="flex justify-center flex-wrap gap-4 mt-4">
                                                    <button
                                                        onClick={handleClearSignature}
                                                        className="px-8 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors"
                                                    >
                                                        Clear
                                                    </button>
                                                    <button
                                                        onClick={handleSubmitSignature}
                                                        disabled={signMutation.isPending}
                                                        className="px-8 py-3 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary disabled:opacity-50 transition-colors"
                                                    >
                                                        {signMutation.isPending ? 'Submitting...' : 'Submit Signature'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
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
