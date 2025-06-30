import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = ({ onSave }) => {
  const sigCanvas = useRef(null);

  const clear = () => sigCanvas.current.clear();

  const save = () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      alert('Please draw your signature before saving.');
      return;
    }
    onSave({
      image: sigCanvas.current.getCanvas().toDataURL('image/png'),
      position: { x: 0, y: 0 },
    });
  };

  return (
    <div>
      <SignatureCanvas
        ref={sigCanvas}
        penColor="black"
        canvasProps={{
          width: 400,
          height: 200,
          className: 'sigCanvas',
          style: {
            width: '400px',
            height: '200px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }
        }}
      />
      <div className="flex justify-around p-1 bg-gray-200">
        <button onClick={save} className="px-2 py-1 text-xs text-white bg-green-500 rounded">
          Save
        </button>
        <button onClick={clear} className="px-2 py-1 text-xs text-white bg-red-500 rounded">
          Clear
        </button>
      </div>
    </div>
  );
};

export default SignaturePad; 