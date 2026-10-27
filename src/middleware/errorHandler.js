import { ZodError } from 'zod';

export const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
    });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: `Invalid value for ${err.path}` });
  if (err.code === 11000) return res.status(409).json({ message: 'Duplicate value for a unique field' });
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')
    return res.status(401).json({ message: 'Invalid or expired token' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON body' });

  if (err.status && err.status < 500) return res.status(err.status).json({ message: err.message });

  console.error(err); // full detail only in server logs
  res.status(500).json({ message: 'Internal server error' });
};
