import AuditLog from '../models/AuditLog.js';

class AuditLogRepository {
  async log(userId, action, resource, ip = 'unknown') {
    try {
      return await AuditLog.create({ userId, action, resource, ip });
    } catch (err) {
      console.error('Audit logging failed:', err);
    }
  }

  async findByUserId(userId, limit = 100) {
    return AuditLog.find({ userId }).sort({ timestamp: -1 }).limit(limit);
  }

  async findByAction(action, limit = 100) {
    return AuditLog.find({ action }).sort({ timestamp: -1 }).limit(limit);
  }
}

export default new AuditLogRepository();
