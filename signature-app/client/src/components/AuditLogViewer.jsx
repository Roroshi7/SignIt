import React, { useState, useEffect } from 'react';

const AuditLogViewer = ({ documentId, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, [documentId]);

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/documents/${documentId}/audit-logs`, {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        console.error('Failed to fetch audit logs:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'upload': return '📄';
      case 'sign': return '✍️';
      case 'shared': return '📤';
      case 'delete': return '🗑️';
      case 'reject': return '❌';
      default: return '📝';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'upload': return 'bg-blue-100 text-blue-800';
      case 'sign': return 'bg-green-100 text-green-800';
      case 'shared': return 'bg-purple-100 text-purple-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'reject': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading audit logs...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Audit Trail</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No audit logs found for this document.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log, index) => (
              <div key={log._id || index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getActionIcon(log.action)}</span>
                    <div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action.toUpperCase()}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        {log.details && typeof log.details === 'string' 
                          ? log.details 
                          : log.details && log.details.fileName 
                            ? `Document: ${log.details.fileName}`
                            : `Action performed on document`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(log.timestamp)}
                    </p>
                    {log.ip && (
                      <p className="text-xs text-gray-400">IP: {log.ip}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer; 