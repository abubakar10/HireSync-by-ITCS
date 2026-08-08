import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Integration name is required'],
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['API', 'XML Feed', 'Email', 'Webhook', 'CSV'],
      default: 'API',
    },
    status: {
      type: String,
      enum: ['connected', 'not_connected', 'available', 'error', 'pending'],
      default: 'not_connected',
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    region: {
      type: String,
      trim: true,
      default: 'Global',
    },
    configuration: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isDemo: {
      type: Boolean,
      default: true,
    },
    lastSyncAt: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        // Never expose raw credentials from configuration
        if (ret.configuration && typeof ret.configuration === 'object') {
          const safe = { ...ret.configuration };
          if (safe.apiKey) safe.apiKey = '***';
          if (safe.apiSecret) safe.apiSecret = '***';
          if (safe.clientSecret) safe.clientSecret = '***';
          if (safe.password) safe.password = '***';
          if (safe.token) safe.token = '***';
          ret.configuration = safe;
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

integrationSchema.index({ status: 1 });
integrationSchema.index({ enabled: 1 });

const Integration = mongoose.model('Integration', integrationSchema);

export default Integration;
