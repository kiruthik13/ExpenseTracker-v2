import logger from '../config/logger.js';

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`Error: ${message} - Path: ${req.originalUrl} - Method: ${req.method} - User: ${req.user ? req.user.id : 'Guest'}`);
  if (statusCode === 500) {
    logger.error(err.stack);
  }

  const response = {
    success: false,
    message,
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

export default errorHandler;
