import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Document, Page } from 'react-pdf';
import SignatureModal from '../components/SignatureModal';
import ShareModal from '../components/ShareModal';
import { PDFDocument } from 'pdf-lib';
import { PencilSquareIcon, ShareIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Moveable from 'react-moveable';

// Get backend URL from environment variable
const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DocumentViewer = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signature, setSignature] = useState(null);
  const [finalizing, setFinalizing] = useState(false);
  const [sigPosition, setSigPosition] = useState({ x: 0, y: 0 });
  const [pdfContainerSize, setPdfContainerSize] = useState({ width: 600, height: 800 });
  const pdfContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [moveableTarget, setMoveableTarget] = useState(null);
  const signatureRef = useRef(null);
  const [sigSize, setSigSize] = useState({ width: 200, height: 100 });
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${backendUrl}/api/documents/${id}`, {
          headers: { 'x-auth-token': token },
        });
        setDocument(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDocument();
  }, [id]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const handleSignClick = () => {
    setShowSignatureModal(true);
  };

  const handleSignatureSave = (sig) => {
    setSignature(sig);
    setShowSignatureModal(false);
    setSigPosition({ x: 0, y: 0 });
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
    // Moveable requires you to update the target's style manually
    if (signatureRef.current) {
      signatureRef.current.style.width = `${width}px`;
      signatureRef.current.style.height = `${height}px`;
    }
  };

  const handleFinalize = async () => {
    if (!signature) return;
    setFinalizing(true);
    try {
      const token = localStorage.getItem('token');
      // First, fetch the PDF file
      const pdfRes = await axios.get(`${backendUrl}/${document.filePath}`, {
        responseType: 'arraybuffer',
        headers: { 'x-auth-token': token }
      });
      const pdfBytes = pdfRes.data;
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
      formData.append('signedPdf', new File([blob], 'signed.pdf', { type: 'application/pdf' }));
      formData.append('signatureMeta', JSON.stringify({
        position: sigPosition,
        size: sigSize,
        page: 1,
      }));

      const signRes = await axios.post(`${backendUrl}/api/documents/${id}/sign`, formData, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (signRes.data && signRes.data.filePath) {
        setDocument(prev => ({ ...prev, signedFilePath: signRes.data.filePath }));
      }

      alert('Document signed and uploaded!');
      setSignature(null);

      // Refresh document data
      const res = await axios.get(`${backendUrl}/api/documents/${id}`, {
        headers: { 'x-auth-token': token },
      });
      setDocument(res.data);
    } catch (err) {
      console.error('Error finalizing signature:', err);
      alert('Failed to finalize signature. ' + (err.response?.data?.msg || err.message));
    }
    setFinalizing(false);
  };

  const handleDownload = () => {
    window.open(`${backendUrl}/${document.signedFilePath || document.filePath}`, '_blank');
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  if (!document) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 flex flex-col items-center">
      {/* Toolbar */}
      <div className="flex gap-4 mb-6 w-full justify-center">
        <button
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
          onClick={handleSignClick}
        >
          <PencilSquareIcon className="w-5 h-5" /> Sign
        </button>
        <button
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
          onClick={handleShare}
        >
          <ShareIcon className="w-5 h-5" /> Share
        </button>
        <button
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition"
          onClick={handleDownload}
        >
          <ArrowDownTrayIcon className="w-5 h-5" /> Download
        </button>
        {signature && (
          <button
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700 transition"
            onClick={handleFinalize}
            disabled={finalizing}
          >
            {finalizing ? 'Finalizing...' : 'Finalize'}
          </button>
        )}
      </div>
      {/* PDF Preview */}
      <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">{document.fileName}</h2>
        <div
          className="flex justify-center relative"
          style={{ width: pdfContainerSize.width, height: pdfContainerSize.height }}
          ref={pdfContainerRef}
        >
          <Document
            file={`${backendUrl}/${document.signedFilePath || document.filePath}`}
            onLoadSuccess={onDocumentLoadSuccess}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page key={`page_${index + 1}`} pageNumber={index + 1} width={pdfContainerSize.width} />
            ))}
          </Document>
          {/* Moveable signature overlay */}
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
      {/* Signature Modal */}
      <SignatureModal open={showSignatureModal} onClose={() => setShowSignatureModal(false)} onSave={handleSignatureSave} />
      <ShareModal open={showShareModal} onClose={() => setShowShareModal(false)} documentId={id} />
    </div>
  );
};

export default DocumentViewer; 