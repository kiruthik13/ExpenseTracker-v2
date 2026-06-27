import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  action: {
    type: String,
    required: true,
  },
  resource: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
    default: 'unknown',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: false,
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
