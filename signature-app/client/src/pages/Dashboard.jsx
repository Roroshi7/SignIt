import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Document, Page } from 'react-pdf';
import { Link } from 'react-router-dom';
import { ArrowDownTrayIcon, EyeIcon, ShareIcon, TrashIcon } from '@heroicons/react/24/outline';

const statusColors = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Signed: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
};

const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef();
  const [pdfErrors, setPdfErrors] = useState({});
  const [statusFilter, setStatusFilter] = useState('All');
  const [shareDocId, setShareDocId] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${backendUrl}/api/documents`, {
          headers: { 'x-auth-token': token },
        });
        setDocuments(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDocuments();
  }, []);

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const onFileUpload = async () => {
    const formData = new FormData();
    formData.append('document', file);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${backendUrl}/api/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': token,
        },
      });
      setDocuments([res.data, ...documents]);
      setFile(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${backendUrl}/api/documents/${id}`, {
        headers: { 'x-auth-token': token },
      });
      setDocuments(documents.filter((doc) => doc._id !== id));
      console.log('Document deleted successfully:', response.data);
    } catch (err) {
      console.error('Delete error:', err);
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 404) {
          alert('Document not found. It may have already been deleted.');
        } else if (err.response.status === 401) {
          alert('You are not authorized to delete this document.');
        } else {
          alert(`Failed to delete document: ${err.response.data.msg || 'Unknown error'}`);
        }
      } else if (err.request) {
        // Network error
        alert('Network error. Please check your connection and try again.');
      } else {
        // Other error
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  const handleShare = (docId) => {
    setShareDocId(docId);
  };

  const handleShareSubmit = async () => {
    setShareLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${backendUrl}/api/documents/${shareDocId}/share`, { email: shareEmail }, {
        headers: { 'x-auth-token': token }
      });
      alert('Document shared successfully!');
      setShareDocId(null);
      setShareEmail('');
    } catch (err) {
      alert('Failed to share document.');
      console.error(err);
    }
    setShareLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Filter Dropdown */}
      <div className="flex justify-end mb-6">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Signed">Signed</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>
      {/* Upload Card */}
      <div
        className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg p-8 mb-10 border-2 border-dashed border-indigo-200 hover:border-indigo-400 transition cursor-pointer"
        onClick={() => fileInputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
      >
        <img src="/Upload.png" alt="Upload" className="w-24 h-24 mb-4 opacity-80" />
        <h2 className="text-2xl font-semibold mb-2">Upload your PDF</h2>
        <p className="text-gray-500 mb-4">Drag & drop or click to select a PDF file</p>
        <input
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
        />
        {file && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-700">{file.name}</span>
            <button
              onClick={e => { e.stopPropagation(); onFileUpload(); }}
              className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow"
            >
              Upload
            </button>
          </div>
        )}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {documents
          .filter(doc => statusFilter === 'All' || doc.status === statusFilter)
          .map((doc) => (
            <div key={doc._id} className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center relative group border hover:shadow-xl transition">
              <div className="w-full flex justify-between items-center mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[doc.status] || 'bg-gray-100 text-gray-700'}`}>{doc.status}
                  {doc.status === 'rejected' && doc.rejectionReason && (
                    <span className="ml-2 text-red-600 text-xs">({doc.rejectionReason})</span>
                  )}
                </span>
                {doc.signedFilePath && (
                  <a
                    href={`${backendUrl}/${doc.signedFilePath}`}
                    download
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-green-700 bg-green-100 rounded hover:bg-green-200"
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" /> Download
                  </a>
                )}
              </div>
              <div className="h-48 w-full flex items-center justify-center overflow-hidden rounded-lg border bg-gray-50 mb-3">
                <Link to={`/document/${doc._id}`} className="w-full flex items-center justify-center">
                  <Document
                    file={`${backendUrl}/${doc.signedFilePath || doc.filePath}`}
                    onLoadError={err => setPdfErrors(prev => ({ ...prev, [doc._id]: err.message }))}
                    onSourceError={err => setPdfErrors(prev => ({ ...prev, [doc._id]: err.message }))}
                  >
                    {pdfErrors[doc._id] ? (
                      <div className="text-red-500 text-xs text-center p-2">Failed to load PDF</div>
                    ) : (
                      <Page pageNumber={1} width={150} />
                    )}
                  </Document>
                </Link>
              </div>
              <h3 className="text-lg font-semibold text-center mb-1 w-full truncate">{doc.fileName}</h3>
              <div className="flex gap-2 mt-2">
                <Link to={`/document/${doc._id}`} className="inline-flex items-center gap-1 px-3 py-1 text-xs text-indigo-700 bg-indigo-100 rounded hover:bg-indigo-200">
                  <EyeIcon className="w-4 h-4" /> View
                </Link>
                <button
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                  onClick={() => handleShare(doc._id)}
                >
                  <ShareIcon className="w-4 h-4" /> Share
                </button>
                <button onClick={() => handleDelete(doc._id)} className="inline-flex items-center gap-1 px-3 py-1 text-xs text-red-700 bg-red-100 rounded hover:bg-red-200">
                  <TrashIcon className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}
      </div>

      {shareDocId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-2">Share Document</h2>
            <input
              type="email"
              placeholder="Recipient's email"
              value={shareEmail}
              onChange={e => setShareEmail(e.target.value)}
              className="border px-3 py-2 rounded w-full mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleShareSubmit}
                className="bg-blue-600 text-white px-4 py-2 rounded"
                disabled={shareLoading}
              >
                {shareLoading ? 'Sharing...' : 'Share'}
              </button>
              <button
                onClick={() => setShareDocId(null)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 