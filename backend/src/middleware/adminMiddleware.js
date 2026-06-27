import AppError from '../exceptions/AppError.js';

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    next(new AppError('Forbidden - Admin access required', 403));
  }
};
