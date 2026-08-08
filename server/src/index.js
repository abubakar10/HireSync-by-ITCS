import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/index.js';
import connectDB from './config/db.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFound, sendSuccess } from './utils/response.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
}

app.get('/api/health', (_req, res) => {
  sendSuccess(
    res,
    {
      status: 'ok',
      demoMode: config.demoMode,
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
    await connectDB();
  }
  const server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
    console.log(
      `Demo mode: ${config.demoMode ? 'ON (mocked job board adapters)' : 'OFF'}`
    );
  });
  return server;
};

// Start when run directly (not when imported by tests)
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('index.js') ||
    process.argv[1].includes('src\\index.js') ||
    process.argv[1].includes('src/index.js'));

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
