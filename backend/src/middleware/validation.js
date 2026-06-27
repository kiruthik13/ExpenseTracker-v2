import { validationResult } from 'express-validator';
import ValidationError from '../exceptions/ValidationError.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMap = {};
    errors.array().forEach(err => {
      errorMap[err.path || err.param] = err.msg;
    });
    return next(new ValidationError('Validation failed on requested values', errorMap));
  }
  next();
};
