import 'dotenv/config';
import app from './src/app.js';
import { connectDB, closeDB } from './src/config/db.js';

const PORT = process.env.PORT || 5000;

let server;

const start = async () => {
  for (const key of ['MONGODB_URI', 'JWT_SECRET']) {
    if (!process.env[key]) {
      console.error(`Missing required environment variable: ${key}`);
      process.exit(1);
    }
  }

  await connectDB(process.env.MONGODB_URI, process.env.MONGODB_DB_NAME);

  server = app.listen(PORT, () => {
    console.log(`Client Web App:   http://localhost:5173/`);
    console.log(`Backend REST API: http://localhost:${PORT}/api`);
    console.log(`API Health Check: http://localhost:${PORT}/api/health`);
  });

  const handleShutdown = async (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    if (server) {
      server.close(async () => {
        console.log('HTTP server closed.');
        await closeDB();
        process.exit(0);
      });
    } else {
      await closeDB();
      process.exit(0);
    }
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
};

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
