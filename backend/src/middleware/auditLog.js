import logger from '../config/logger.js';

export const auditLogger = (req, res, next) => {
  // Capture the start time
  const startTime = Date.now();
  
  // Wrap res.json or finish event to check mutation outcomes
  res.on('finish', () => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const userId = req.user ? req.user.id || req.user._id : 'Anonymous';
      const action = req.method;
      const resource = req.originalUrl;
      const statusCode = res.statusCode;
      const duration = Date.now() - startTime;
      
      logger.info(
        `[Audit Log] User: ${userId} | Action: ${action} | Resource: ${resource} | Status: ${statusCode} | Duration: ${duration}ms`
      );
    }
  });

  next();
};
