const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  user: {
    type: String, // user id or email
  },
  ip: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  details: {
    type: Object,
  },
});

module.exports = mongoose.model('AuditLog', AuditLogSchema); 