import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patient.routes.js';
import recordRoutes from './routes/record.routes.js';
import prescriptionRoutes from './routes/prescription.routes.js';
import routineRoutes from './routes/routine.routes.js';
import reminderRoutes from './routes/reminder.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import auditRoutes from './routes/audit.routes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { getDatabaseHealth } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Comprehensive Database & API Health Check
app.get('/api/health', (req, res) => {
  const dbHealth = getDatabaseHealth();
  const statusCode = dbHealth.connected ? 200 : 503;
  res.status(statusCode).json({
    status: dbHealth.connected ? 'healthy' : 'degraded',
    service: 'HealthGrid REST API',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: dbHealth,
  });
});

// Rate limit sensitive authentication routes against brute-force
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' },
});

app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);
app.use('/api/auth/oauth', authRateLimiter);
app.use('/api/auth/forgot-password', authRateLimiter);
app.use('/api/auth/reset-password', authRateLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);

// Serve frontend static files (Vite React client dist)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

app.use(notFound);
app.use(errorHandler);

export default app;
