const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const AuditLog = require('../models/AuditLog');
const fsPromises = require('fs').promises;

async function logAudit({ documentId, action, user, ip, details }) {
  await AuditLog.create({ documentId, action, user, ip, details });
}

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const document = new Document({
      userId: req.user.id,
      fileName: req.file.originalname,
      filePath: req.file.path
    });

    await document.save();

    // Create audit log
    await AuditLog.create({
      documentId: document._id,
      action: 'upload',
      userId: req.user.id,
      details: 'Document uploaded'
    });

    res.json(document);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const filter = { userId: req.user.id };
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const documents = await Document.find(filter);
    res.json(documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    res.json(document);
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Document not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.signDocument = async (req, res) => {
  try {
    // Debug logging
    console.log('req.files:', req.files);
    console.log('req.file:', req.file);
    console.log('req.body.signedPdf:', req.body.signedPdf);
    // Accept signedPdf as a file upload (from multer)
    let file = null;
    if (req.files && req.files.signedPdf && Array.isArray(req.files.signedPdf) && req.files.signedPdf[0]) {
      file = req.files.signedPdf[0];
    } else if (req.file) {
      file = req.file;
    } else if (req.body.signedPdf) {
      file = req.body.signedPdf;
    }
    const signatureMeta = req.body.signatureMeta ? JSON.parse(req.body.signatureMeta) : {};

    if (!file) {
      return res.status(400).json({ msg: 'No signed PDF uploaded', debug: { files: req.files, file: req.file, body: req.body } });
    }

    // Save the file
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    const fileName = `signed-${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);

    let fileBuffer;
    if (file.buffer) {
      fileBuffer = file.buffer;
    } else if (file.data) {
      fileBuffer = file.data;
    } else if (typeof file === 'string') {
      fileBuffer = Buffer.from(file, 'base64');
    } else if (file.path) {
      fileBuffer = fs.readFileSync(file.path);
    } else {
      return res.status(400).json({ msg: 'No file buffer found', debug: { file } });
    }
    fs.writeFileSync(filePath, fileBuffer);

    // Update document
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }
    document.status = 'signed';
    document.signedFilePath = `uploads/${fileName}`;
    document.signatureMeta = signatureMeta;
    await document.save();

    await logAudit({
      documentId: document._id,
      action: 'sign',
      user: req.user.id,
      ip: req.ip,
      details: { fileName: document.fileName },
    });

    res.json({ msg: 'Document signed', filePath: document.signedFilePath });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.shareDocument = async (req, res) => {
  try {
    const { email } = req.body;
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    if (document.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Generate a unique token for external signing
    const token = crypto.randomBytes(32).toString('hex');
    document.shareToken = token;
    document.sharedWith = email;
    document.status = 'pending';
    await document.save();

    // Create audit log
    await AuditLog.create({
      documentId: document._id,
      action: 'shared',
      userId: req.user.id,
      details: `Document shared with ${email}`
    });

    // Send email to recipient
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Ensure the client URL doesn't have a trailing slash
    const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : 'http://localhost:5173';
    const signLink = `${clientUrl}/external-sign/${token}`;
    console.log('Generated sign link:', signLink);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Document Signature Request',
      html: `
        <h2>Document Signature Request</h2>
        <p>You have been requested to sign a document.</p>
        <p>Click the link below to view and sign the document:</p>
        <a href="${signLink}">Sign Document</a>
        <p>This link will expire in 7 days.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ msg: 'Document shared successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getDocumentByToken = async (req, res) => {
  try {
    const document = await Document.findOne({ shareToken: req.params.token });
    if (!document) return res.status(404).json({ msg: 'Document not found' });
    res.json(document);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.signDocumentByToken = async (req, res) => {
  try {
    const file = req.files?.signedPdf || req.file || (req.body.signedPdf ? req.body.signedPdf : null);
    const signatureMeta = req.body.signatureMeta ? JSON.parse(req.body.signatureMeta) : {};
    if (!req.files && !req.file && !req.body.signedPdf) {
      return res.status(400).json({ msg: 'No signed PDF uploaded' });
    }
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    const fileName = `signed-external-${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    let fileBuffer;
    if (req.file && req.file.buffer) {
      fileBuffer = req.file.buffer;
    } else if (file && file.data) {
      fileBuffer = file.data;
    } else if (req.body.signedPdf) {
      fileBuffer = Buffer.from(req.body.signedPdf, 'base64');
    } else {
      return res.status(400).json({ msg: 'No file buffer found' });
    }
    fs.writeFileSync(filePath, fileBuffer);
    const document = await Document.findOne({ shareToken: req.params.token });
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }
    document.status = 'signed';
    document.externalSignerStatus = 'signed';
    document.signedFilePath = `uploads/${fileName}`;
    document.signatureMeta = signatureMeta;
    await document.save();

    await logAudit({
      documentId: document._id,
      action: 'sign',
      user: req.user.id,
      ip: req.ip,
      details: { fileName: document.fileName },
    });

    res.json({ msg: 'Document signed', filePath: document.signedFilePath });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.rejectDocumentByToken = async (req, res) => {
  try {
    const { reason } = req.body;
    const document = await Document.findOne({ shareToken: req.params.token });
    if (!document) return res.status(404).json({ msg: 'Document not found' });
    document.externalSignerStatus = 'rejected';
    document.status = 'rejected';
    document.rejectionReason = reason;
    await document.save();

    await logAudit({
      documentId: document._id,
      action: 'reject',
      user: document.sharedWith || 'external',
      ip: req.ip,
      details: { reason },
    });

    res.json({ msg: 'Document rejected' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({ documentId: req.params.docId }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }
    // Only allow the owner to delete
    if (document.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Delete the file from the filesystem
    const uploadDir = path.join(__dirname, '../uploads');
    
    if (document.filePath) {
      const filePath = path.join(uploadDir, path.basename(document.filePath));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    if (document.signedFilePath) {
      const signedFilePath = path.join(uploadDir, path.basename(document.signedFilePath));
      if (fs.existsSync(signedFilePath)) {
        fs.unlinkSync(signedFilePath);
    }
    }
    
    await document.deleteOne();
    
    await logAudit({
      documentId: document._id,
      action: 'delete',
      user: req.user.id,
      ip: req.ip,
      details: { fileName: document.fileName },
    });
    
    res.json({ msg: 'Document deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getExternalDocument = async (req, res) => {
  try {
    console.log('Getting external document with token:', req.params.token);
    const document = await Document.findOne({ shareToken: req.params.token });
    
    if (!document) {
      console.log('Document not found for token:', req.params.token);
      return res.status(404).json({ msg: 'Document not found or link has expired' });
    }

    // Check if token is expired (7 days)
    const tokenCreatedAt = document._id.getTimestamp();
    const tokenAge = Date.now() - tokenCreatedAt;
    if (tokenAge > 7 * 24 * 60 * 60 * 1000) {
      console.log('Token expired for document:', document._id);
      return res.status(400).json({ msg: 'Link has expired' });
    }

    console.log('Found document:', document._id);
    res.json({
      fileName: document.fileName,
      filePath: document.filePath,
      status: document.status,
      rejectionReason: document.rejectionReason,
    });
  } catch (err) {
    console.error('Error in getExternalDocument:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.signExternalDocument = async (req, res) => {
  try {
    console.log('=== External Signing Request ===');
    console.log('Token:', req.params.token);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request file:', req.file ? 'File received' : 'No file');
    console.log('Content-Type:', req.get('Content-Type'));
    
    const document = await Document.findOne({ shareToken: req.params.token });
    
    if (!document) {
      console.log('❌ Document not found for token:', req.params.token);
      return res.status(404).json({ msg: 'Document not found or link has expired' });
    }

    console.log('✅ Document found:', {
      id: document._id,
      status: document.status,
      fileName: document.fileName,
      sharedWith: document.sharedWith
    });

    if (document.status !== 'pending') {
      console.log('❌ Document status is not pending:', document.status);
      return res.status(400).json({ msg: 'Document has already been signed or rejected' });
    }

    if (!req.file) {
      console.log('❌ No file provided in request');
      console.log('Request files:', req.files);
      console.log('Request body:', req.body);
      return res.status(400).json({ msg: 'No signed PDF provided' });
    }

    console.log('✅ File received:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    let signatureMeta = {};
    if (req.body.signatureMeta) {
      try {
        signatureMeta = JSON.parse(req.body.signatureMeta);
        console.log('✅ Signature meta parsed:', signatureMeta);
      } catch (err) {
        console.log('❌ Error parsing signatureMeta:', err);
        signatureMeta = {};
      }
    } else {
      console.log('⚠️ No signatureMeta in request body');
    }

    // Update document status and path
    document.status = 'signed';
    document.signedFilePath = req.file.path;
    document.signatureMeta = signatureMeta;
    await document.save();

    console.log('✅ Document updated successfully');

    // Create audit log
    await AuditLog.create({
      documentId: document._id,
      action: 'signed',
      details: `Document signed by ${document.sharedWith || 'external signer'}`
    });

    // Send email to recipient with signed document link
    if (document.sharedWith && document.signedFilePath) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        const backendUrl = process.env.BACKEND_URL ? process.env.BACKEND_URL.replace(/\/$/, '') : 'http://localhost:5000';
        const downloadLink = `${backendUrl}/${document.signedFilePath}`;
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: document.sharedWith,
          subject: 'Your Signed Document is Ready',
          html: `
            <h2>Your Document Has Been Signed</h2>
            <p>The document <b>${document.fileName}</b> has been signed.</p>
            <p>You can download the signed document here:</p>
            <a href="${downloadLink}">Download Signed PDF</a>
          `
        };
        await transporter.sendMail(mailOptions);
        console.log('Signed document email sent to recipient.');
      } catch (emailErr) {
        console.error('Error sending signed document email:', emailErr);
      }
    }

    console.log('✅ Audit log created');
    console.log('✅ Document signed successfully:', document._id);
    res.json({ msg: 'Document signed successfully' });
  } catch (err) {
    console.error('❌ Error in signExternalDocument:', err);
    res.status(500).json({ msg: 'Server error' });
  }
}; 