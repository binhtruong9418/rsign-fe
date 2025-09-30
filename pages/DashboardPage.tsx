
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Document } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { PlusCircle, FileText } from 'lucide-react';

const fetchMyDocuments = async (): Promise<Document[]> => {
  const { data } = await api.get('/api/documents/created/me');
  return data;
};

const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: documents, isLoading, error } = useQuery<Document[], Error>({
    queryKey: ['myDocuments'],
    queryFn: fetchMyDocuments
  });

  const createDocumentMutation = useMutation<Document, Error, { title: string; content: string }>({
    mutationFn: (newDocument) => api.post('/api/documents', newDocument),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDocuments'] });
      setIsModalOpen(false);
      setTitle('');
      setContent('');
    },
    onError: (error) => {
        alert('Failed to create document: ' + (error?.message || 'Unknown error'));
    }
  });

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    createDocumentMutation.mutate({ title, content });
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
            <FileText size={48} className="mx-auto text-dark-text-secondary"/>
            <h3 className="mt-2 text-xl font-medium text-dark-text">No documents found</h3>
            <p className="mt-1 text-sm text-dark-text-secondary">Get started by creating a new document.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents?.map((doc) => (
          <Link to={`/documents/${doc.id}`} key={doc.id} className="block bg-dark-card p-6 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
            <h2 className="text-xl font-semibold text-brand-primary truncate">{doc.title}</h2>
            <p className="text-dark-text-secondary mt-2">Created: {new Date(doc.createdAt).toLocaleDateString()}</p>
          </Link>
        ))}
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-dark-card p-8 rounded-lg shadow-xl w-full max-w-2xl m-4">
            <h2 className="text-2xl font-bold mb-4">Create New Document</h2>
            <form onSubmit={handleCreateDocument}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-dark-text-secondary mb-1">Title</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="content" className="block text-sm font-medium text-dark-text-secondary mb-1">Content (Markdown supported)</label>
                <textarea
                  id="content"
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-dark-text-secondary hover:bg-gray-600">Cancel</button>
                <button type="submit" disabled={createDocumentMutation.isPending} className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary disabled:opacity-50">
                  {createDocumentMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
