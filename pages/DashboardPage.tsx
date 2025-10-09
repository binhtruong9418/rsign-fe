
import React, { useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Document } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlusCircle, FileText, UploadCloud, File as FileIcon, X, Eye } from 'lucide-react';
import axios from 'axios';
import DocumentViewer from '../components/DocumentViewer';

const fetchMyDocuments = async (): Promise<Document[]> => {
  const { data } = await api.get('/api/documents/created/me');
  return data;
};

const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [competentAuthority, setCompetentAuthority] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents, isLoading, error } = useQuery<Document[], Error>({
    queryKey: ['myDocuments'],
    queryFn: fetchMyDocuments
  });

  const createDocumentMutation = useMutation<Document, Error, { title: string; content: string; competentAuthority: string; file: File | null }>({
    mutationFn: async ({ title, content, competentAuthority, file }) => {
      let fileUrl = '';
      if (file) {
        const { presignedUrl, fileUrl: finalFileUrl } = await api.post('/api/documents/generate-presigned-url', {
          fileName: file.name,
          fileType: file.type,
        }).then(res => res.data);

        await axios.put(presignedUrl, file, {
          headers: { 'Content-Type': file.type },
        });

        fileUrl = finalFileUrl;
      }

      const { data } = await api.post('/api/documents', {
        title,
        content: file ? '' : content,
        fileUrl,
        competentAuthority,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDocuments'] });
      setIsModalOpen(false);
      setTitle('');
      setContent('');
      setFile(null);
      setPreviewUrl(null);
      setCompetentAuthority('');
    },
    onError: (error: any) => {
      alert('Failed to create document: ' + (error?.response?.data?.message || 'Unknown error'));
    }
  });


  const handleFileSelected = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    createDocumentMutation.mutate({ title, content, file, competentAuthority });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-dark-text">My Documents</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-secondary flex items-center space-x-2 transition-colors"
        >
          <PlusCircle size={20} />
          <span>New Document</span>
        </button>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <p className="text-red-500">Error: {error.message}</p>}

      {documents && documents.length === 0 && (
        <div className="text-center py-16 bg-dark-card rounded-lg">
          <FileText size={48} className="mx-auto text-dark-text-secondary" />
          <h3 className="mt-2 text-xl font-medium text-dark-text">No documents found</h3>
          <p className="mt-1 text-sm text-dark-text-secondary">Get started by creating a new document.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents?.map((doc) => (
          <Link to={`/documents/${doc.id}`} key={doc.id}
            className="block bg-dark-card p-6 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold text-brand-primary truncate pr-2">{doc.title}</h2>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${doc.status === 'COMPLETED' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
                }`}>
                {doc.status}
              </span>
            </div>

            <div className="mt-4 space-y-1 text-sm text-dark-text-secondary">
              <p>Authority: <span className="font-medium text-dark-text">{doc.competentAuthority}</span></p>
              <p>Last Activity: <span className="font-medium text-dark-text">{new Date(doc.updatedAt).toLocaleDateString()}</span></p>
              {
                doc.signedAt && <p>Signed On: <span className="font-medium text-dark-text">{new Date(doc.signedAt).toLocaleDateString()}</span></p>
              }
            </div>
          </Link>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-dark-card p-8 rounded-lg shadow-xl w-full max-w-2xl m-4">
            <h2 className="text-2xl font-bold mb-4">Create New Document</h2>
            <form onSubmit={handleCreateDocument} id="create-doc-form" className="flex-grow flex flex-col md:flex-row gap-6 min-h-0">
              {/* Left Column: Form Fields */}
              <div className="flex flex-col space-y-4 md:w-1/2">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-dark-text-secondary mb-1">Title *</label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label htmlFor="competentAuthority" className="block text-sm font-medium text-dark-text-secondary mb-1">Competent Authority *</label>
                  <input
                    id="competentAuthority"
                    type="text"
                    value={competentAuthority}
                    onChange={(e) => setCompetentAuthority(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>
                {!file && (
                  <div className="flex-grow flex flex-col">
                    <label htmlFor="content" className="block text-sm font-medium text-dark-text-secondary mb-1">Content (or upload a file)</label>
                    <textarea
                      id="content"
                      rows={10}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full flex-grow px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    />
                  </div>
                )}
              </div>

              {/* Right Column: File Upload & Preview */}
              <div className="flex flex-col md:w-1/2 min-h-0">
                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Document File</label>
                {file ? (
                  <div className="flex-grow border border-gray-600 rounded-lg p-4 flex flex-col justify-center text-center">
                    <FileIcon className="h-16 w-16 text-brand-primary mx-auto mb-4" />
                    <p className="font-semibold truncate" title={file.name}>{file.name}</p>
                    <p className="text-sm text-dark-text-secondary">{formatBytes(file.size)}</p>
                    <div className="mt-4 flex items-center justify-center space-x-4">
                      <button type="button" onClick={() => setIsViewerOpen(true)} className="flex items-center space-x-2 px-4 py-2 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-secondary">
                        <Eye size={16} />
                        <span>Preview</span>
                      </button>
                      <button type="button" onClick={() => { setFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} className="flex items-center space-x-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                        <X size={16} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-full">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
                    <div onClick={() => fileInputRef.current?.click()} onDrop={handleDrop} onDragOver={handleDrag} onDragLeave={handleDrag} className={`h-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragActive ? "border-brand-primary bg-gray-700" : "border-gray-600 hover:border-brand-secondary bg-gray-800/50"}`}>
                      <UploadCloud size={40} className="text-dark-text-secondary mb-2" />
                      <p className="text-dark-text-secondary text-center"><span className="font-semibold text-brand-primary">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOCX, PNG, JPG, etc.</p>
                    </div>
                  </div>
                )}
              </div>
            </form>

            <div className="flex justify-end space-x-4 mt-6 flex-shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-dark-text-secondary hover:bg-gray-600">Cancel</button>
              <button type="submit" form="create-doc-form" disabled={createDocumentMutation.isPending} className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary disabled:opacity-50">
                {createDocumentMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}


      <DocumentViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        documentUri={previewUrl || ''}
        documentTitle={file?.name || 'Preview'}
      />
    </div>
  );
};

export default DashboardPage;
