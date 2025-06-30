const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  signedFilePath: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'signed', 'rejected'],
    default: 'pending'
  },
  externalSignerStatus: {
    type: String,
    enum: ['pending', 'signed', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  sharedWith: {
    type: String,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  signatureMeta: {
    type: Object
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Clean up files when document is deleted
DocumentSchema.pre('remove', async function(next) {
  try {
    const fs = require('fs').promises;
    if (this.filePath) {
      await fs.unlink(this.filePath);
    }
    if (this.signedFilePath) {
      await fs.unlink(this.signedFilePath);
    }
  } catch (err) {
    console.error('Error deleting document files:', err);
  }
  next();
});

module.exports = mongoose.model('Document', DocumentSchema); 