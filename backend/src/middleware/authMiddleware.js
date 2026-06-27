import { verifyToken } from '../utils/jwt.util.js';
import UserRepository from '../repositories/User.repository.js';
import AppError from '../exceptions/AppError.js';

export const protect = async (req, res, next) => {
  try {
    let token = '';

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AppError('Not authorized, access token missing', 401);
    }

    try {
      const decoded = verifyToken(token);
      const user = await UserRepository.findById(decoded.id);

      if (!user || !user.isActive) {
        throw new AppError('User session expired or account deactivated', 401);
      }

      req.user = user;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Access token expired, please refresh', 401);
      }
      throw new AppError('Not authorized, invalid token', 401);
    }
  } catch (error) {
    next(error);
  }
};
