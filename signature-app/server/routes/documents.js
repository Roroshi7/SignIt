const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadDocument, getDocuments, getDocument, shareDocument, getExternalDocument, signExternalDocument, signDocument, deleteDocument } = require('../controllers/documents');

// Upload new document
router.post('/upload', auth, upload.single('document'), uploadDocument);

// Get all documents
router.get('/', auth, getDocuments);

// Get document by share token (must come before /:id routes)
router.get('/external/:token', getExternalDocument);

// Submit external signature (must come before /:id routes)
router.post('/external/:token/sign', upload.single('signedPdf'), signExternalDocument);

// Get single document
router.get('/:id', auth, getDocument);

// Sign document
router.post('/:id/sign', auth, upload.single('signedPdf'), signDocument);

// Share document for external signing
router.post('/:id/share', auth, shareDocument);

// Delete document
router.delete('/:id', auth, deleteDocument);

module.exports = router;

 