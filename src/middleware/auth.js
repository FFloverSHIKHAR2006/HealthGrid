import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'Authentication required');

  const payload = jwt.verify(token, process.env.JWT_SECRET); // JsonWebTokenError handled centrally
  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Authentication required');
  req.user = user;
  next();
});

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'You do not have permission for this action'));
    next();
  };

/** Providers can access any patient; patients only their own profile. */
export const canAccessPatient = (user, patientId) =>
  user.role === 'provider' || (user.patient && String(user.patient) === String(patientId));
