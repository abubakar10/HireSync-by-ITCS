import mongoose from 'mongoose';

export const JOB_BOARDS = [
  'Indeed',
  'LinkedIn',
  'Monster',
  'Glassdoor',
  'ZipRecruiter',
  'JobStreet',
  'Kalibrr',
  'OnlineJobs.ph',
  'JobsDB',
  'PhilJobNet',
  'Naukri',
  'Shine',
  'Foundit',
];

const jobDistributionSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
    },
    board: {
      type: String,
      required: [true, 'Board name is required'],
      enum: JOB_BOARDS,
    },
    status: {
      type: String,
      enum: ['pending', 'published', 'failed', 'updated', 'closed'],
      default: 'pending',
    },
    externalJobId: {
      type: String,
      default: null,
      trim: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    responsePayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    durationMs: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

jobDistributionSchema.index({ jobId: 1, board: 1 }, { unique: true });
jobDistributionSchema.index({ externalJobId: 1 });
jobDistributionSchema.index({ status: 1 });
jobDistributionSchema.index({ board: 1 });

const JobDistribution = mongoose.model('JobDistribution', jobDistributionSchema);

export default JobDistribution;
