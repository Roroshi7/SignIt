import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Document, Page } from 'react-pdf';
import SignatureModal from '../components/SignatureModal';
import { PDFDocument } from 'pdf-lib';
import Moveable from 'react-moveable';

const ExternalSign = () => {
  const { token } = useParams();
  const [document, setDocument] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signature, setSignature] = useState(null);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sigPosition, setSigPosition] = useState({ x: 100, y: 100 });
  const [sigSize, setSigSize] = useState({ width: 200, height: 100 });
  const [pdfContainerSize] = useState({ width: 400, height: 600 });
  const pdfContainerRef = React.useRef(null);
  const signatureRef = React.useRef(null);
  const [moveableTarget, setMoveableTarget] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rejected, setRejected] = useState(false);

  const backendUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://signit-t0js.onrender.com');

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        console.log('Fetching document with token:', token);
        const res = await axios.get(`${backendUrl}/api/documents/external/${token}`);
        console.log('Document response:', res.data);
        if (res.data) {
          setDocument(res.data);
        } else {
          setError('Document not found or link has expired.');
        }
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err.response?.data?.msg || 'Document not found or link has expired.');
      }
    };
    if (token) {
      fetchDocument();
    }
  }, [token, backendUrl]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const handleSignatureSave = (sig) => {
    setSignature(sig);
    setShowSignatureModal(false);
    setSigPosition({ x: 100, y: 100 });
    setSigSize({ width: 200, height: 100 });
    setTimeout(() => {
      setMoveableTarget(signatureRef.current);
    }, 0);
  };

  const handleDrag = ({ beforeTranslate }) => {
    setSigPosition({ x: beforeTranslate[0], y: beforeTranslate[1] });
  };

  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);

  const handleResize = e => {
    const { width, height } = e;
    setSigSize({ width, height });
    if (signatureRef.current) {
      signatureRef.current.style.width = `${width}px`;
      signatureRef.current.style.height = `${height}px`;
    }
  };

  const handleFinalize = async () => {
    if (!signature) return;
    setFinalizing(true);
    try {
      const pdfRes = await fetch(`${backendUrl}/${document.filePath}`);
      const pdfBytes = await pdfRes.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const page = pdfDoc.getPages()[0];
      const pngImage = await pdfDoc.embedPng(signature.image);
      const { width, height } = page.getSize();
      const renderedWidth = pdfContainerSize.width;
      const renderedHeight = pdfContainerSize.height;
      const scaleX = width / renderedWidth;
      const scaleY = height / renderedHeight;
      const x = sigPosition.x * scaleX;
      const y = height - (sigPosition.y * scaleY) - sigSize.height * scaleY;
      page.drawImage(pngImage, {
        x,
        y,
        width: sigSize.width * scaleX,
        height: sigSize.height * scaleY,
      });
      const newPdfBytes = await pdfDoc.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const formData = new FormData();
      const file = new File([blob], 'signed.pdf', { type: 'application/pdf' });
      formData.append('signedPdf', file);
      formData.append('signatureMeta', JSON.stringify({
        position: sigPosition,
        size: sigSize,
        page: 1,
      }));
      await axios.post(`${backendUrl}/api/documents/external/${token}/sign`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(true);
    } catch (err) {
      setError('Failed to sign document. Please try again.');
      console.error(err);
    }
    setFinalizing(false);
  };

  const handleReject = async () => {
    const reason = prompt("Please provide a reason for rejection (optional):");
    setFinalizing(true);
    try {
      await axios.post(`${backendUrl}/api/documents/external/${token}/reject`, { reason });
      setRejected(true);
      setError('');
    } catch (err) {
      setError('Failed to reject document. Please try again.');
      console.error(err);
    }
    setFinalizing(false);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-2">✓ Document Signed!</h2>
          <p className="text-gray-600">Thank you for signing the document.</p>
        </div>
      </div>
    );
  }

  if (rejected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Document Rejected</h2>
          <p className="text-gray-600">You have rejected the document for signing.</p>
          {document && document.rejectionReason && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">
              <strong>Rejection Reason:</strong> {document.rejectionReason}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (document && document.status === 'rejected' && document.rejectionReason) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Document Rejected</h2>
          <p className="text-gray-600">This document was rejected for signing.</p>
          <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">
            <strong>Rejection Reason:</strong> {document.rejectionReason}
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 flex flex-col items-center">
      <div className="w-full text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign Document</h1>
        <p className="text-gray-600">Please review the document and add your signature</p>
      </div>
      
      {/* Toolbar */}
      <div className="flex gap-4 mb-6">
        <button
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
          onClick={() => setShowSignatureModal(true)}
        >
          Add Signature
        </button>
        {signature && (
          <button
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700 transition"
            onClick={handleFinalize}
            disabled={finalizing}
          >
            {finalizing ? 'Finalizing...' : 'Sign Document'}
          </button>
        )}
        <button
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 text-white font-semibold shadow hover:bg-red-700 transition"
          onClick={handleReject}
          disabled={finalizing}
        >
          Reject
        </button>
      </div>

      {/* PDF Preview */}
      <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center w-full">
        <h2 className="text-xl font-bold mb-4 text-center">{document.fileName}</h2>
        <div
          className="flex justify-center relative"
          style={{ width: pdfContainerSize.width, height: pdfContainerSize.height }}
          ref={pdfContainerRef}
        >
          <Document
            file={`${backendUrl}/${document.filePath}`}
            onLoadSuccess={onDocumentLoadSuccess}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page key={`page_${index + 1}`} pageNumber={index + 1} width={pdfContainerSize.width} />
            ))}
          </Document>
          {signature && (
            <>
              <img
                ref={signatureRef}
                src={signature.image}
                alt="Signature"
                style={{
                  position: 'absolute',
                  width: sigSize.width,
                  height: sigSize.height,
                  left: sigPosition.x,
                  top: sigPosition.y,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  zIndex: 10,
                  pointerEvents: 'auto',
                  userSelect: 'none',
                }}
                draggable={false}
              />
              <Moveable
                target={moveableTarget}
                container={pdfContainerRef.current}
                origin={false}
                draggable={true}
                resizable={true}
                throttleDrag={0}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                onResize={handleResize}
                keepRatio={false}
                edge={false}
                bounds={{
                  left: 0,
                  top: 0,
                  right: pdfContainerSize.width - sigSize.width,
                  bottom: pdfContainerSize.height - sigSize.height,
                }}
                renderDirections={['nw', 'ne', 'sw', 'se']}
              />
            </>
          )}
        </div>
      </div>
      <SignatureModal open={showSignatureModal} onClose={() => setShowSignatureModal(false)} onSave={handleSignatureSave} />
    </div>
  );
};

export default ExternalSign; 