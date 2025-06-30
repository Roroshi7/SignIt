import React, { useState } from 'react';
import axios from 'axios';

const ShareModal = ({ open, onClose, documentId }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleShare = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${backendUrl}/api/documents/${documentId}/share`, 
        { email },
        { headers: { 'x-auth-token': token } }
      );
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setEmail('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to share document');
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative animate-fade-in">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-xl font-semibold mb-4 text-center">Share for Signature</h2>
        {success ? (
          <div className="text-center text-green-600 py-4">
            ✓ Signature request sent successfully!
          </div>
        ) : (
          <form onSubmit={handleShare} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient's Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {loading ? 'Sending...' : 'Send Signature Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ShareModal; 