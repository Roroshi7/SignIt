import React from 'react';
import SignaturePad from './SignaturePad';

const SignatureModal = ({ open, onClose, onSave }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl relative animate-fade-in">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-xl font-semibold mb-2 text-center">Draw Your Signature</h2>
        <p className="text-gray-500 text-center mb-4">Sign in the box below, then drag your signature to the desired position on the document before finalizing.</p>
        <div className="flex justify-center">
          <SignaturePad onSave={onSave} />
        </div>
      </div>
    </div>
  );
};

export default SignatureModal; 