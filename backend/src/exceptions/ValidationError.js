import AppError from './AppError.js';

class ValidationError extends AppError {
  constructor(message, errors = {}) {
    super(message, 400);
    this.errors = errors;
  }
}

export default ValidationError;
