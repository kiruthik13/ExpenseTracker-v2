import jwt from 'jsonwebtoken';

export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'super_secret_key_for_jwt_auth_12345', {
    expiresIn: '15m',
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'super_secret_key_for_jwt_refresh_auth_67890', {
    expiresIn: '7d',
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_for_jwt_auth_12345');
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'super_secret_key_for_jwt_refresh_auth_67890');
};
