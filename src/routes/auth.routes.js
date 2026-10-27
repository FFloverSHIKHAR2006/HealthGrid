import { Router } from 'express';
import { z } from 'zod';
import {
  login,
  register,
  getOAuthConfig,
  googleOAuth,
  microsoftOAuth,
  forgotPassword,
  resetPassword,
  me,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const loginSchema = z
  .object({
    email: z.string().optional(),
    identifier: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .refine((data) => data.email || data.identifier, {
    message: 'Email or ID is required',
  });

const registerSchema = z.object({
  role: z.enum(['patient', 'provider']),
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.union([z.array(z.string()), z.string()]).optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContact: z
    .object({
      name: z.string().optional(),
      relation: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  hospital: z.string().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

router.post('/login', validate({ body: loginSchema }), login);
router.post('/register', validate({ body: registerSchema }), register);

// OAuth routes
router.get('/oauth/config', getOAuthConfig);
router.post('/oauth/google', googleOAuth);
router.post('/oauth/microsoft', microsoftOAuth);

// Password recovery routes
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), resetPassword);

router.get('/me', authenticate, me);

export default router;
