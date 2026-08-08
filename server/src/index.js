import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/index.js';
import connectDB from './config/db.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFound, sendSuccess } from './utils/response.js';

const app = express();

if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (no Origin) and configured frontend origin(s)
      if (!origin) return callback(null, true);
      const allowed = config.clientOrigins || [config.clientUrl];
      if (allowed.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
}

/** Ensure MongoDB is connected (local listen + Vercel serverless cold starts). */
let dbReady = null;
export const ensureDbConnected = async () => {
  if (!dbReady) {
    dbReady = connectDB();
  }
  return dbReady;
};

app.use(async (req, res, next) => {
  try {
    await ensureDbConnected();
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/api/health', (_req, res) => {
  sendSuccess(
    res,
    {
      status: 'ok',
      demoMode: config.demoMode,
      allowPublicRecruiterSignup: config.allowPublicRecruiterSignup,
      webhookAuthRequired: Boolean(config.webhookSecret),
      timestamp: new Date().toISOString(),
    },
    'API is healthy'
  );
});

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export const startServer = async ({ connect = true } = {}) => {
  if (connect) {
    await ensureDbConnected();
  }
  const server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
    console.log(
      `Demo mode: ${config.demoMode ? 'ON (mocked job board adapters)' : 'OFF'}`
    );
  });
  return server;
};

// Start when run directly (not when imported by tests / Vercel)
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('index.js') ||
    process.argv[1].includes('src\\index.js') ||
    process.argv[1].includes('src/index.js'));

if (isDirectRun && process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  startServer();
}

export default app;
