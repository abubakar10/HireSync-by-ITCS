import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || '';

if (nodeEnv === 'production') {
  if (!jwtSecret || jwtSecret.length < 32) {
    console.error(
      '[FATAL] JWT_SECRET must be set to a strong value (32+ chars) when NODE_ENV=production'
    );
    process.exit(1);
  }
  if (
    jwtSecret.includes('change_this') ||
    jwtSecret.includes('dev_jwt_secret') ||
    jwtSecret === 'dev_jwt_secret_change_in_production'
  ) {
    console.error('[FATAL] Refusing to start with a known/default JWT_SECRET in production');
    process.exit(1);
  }
}

const normalizeOrigin = (value = '') => String(value).trim().replace(/\/+$/, '');

const clientOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv,
  clientUrl: clientOrigins[0] || 'http://localhost:5173',
  clientOrigins,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/job-integration-system',
  jwtSecret: jwtSecret || 'dev_jwt_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  demoMode: process.env.DEMO_MODE !== 'false',
  /** Shared secret for inbound board webhooks (header: X-Webhook-Secret) */
  webhookSecret: process.env.WEBHOOK_SECRET || '',
  /** When false, public /auth/register cannot create recruiter accounts */
  allowPublicRecruiterSignup: process.env.ALLOW_PUBLIC_RECRUITER_SIGNUP === 'true'
    || process.env.DEMO_MODE !== 'false',
  authRateLimit: {
    windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20,
  },
  publicRateLimit: {
    windowMs: parseInt(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.PUBLIC_RATE_LIMIT_MAX, 10) || 60,
  },
};

export default config;
