import mongoose from 'mongoose';

export const CANDIDATE_STATUSES = [
  'New',
  'Screening',
  'Shortlisted',
  'Interview',
  'Rejected',
  'Hired',
];

export const CANDIDATE_SOURCES = [
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
  'Direct',
];

const noteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const timelineSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
    },
    fromStatus: {
      type: String,
      default: null,
    },
    toStatus: {
      type: String,
      default: null,
    },
    note: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    resumeUrl: {
      type: String,
      trim: true,
      default: '',
    },
    coverLetter: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      enum: CANDIDATE_SOURCES,
      default: 'Direct',
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
    },
    status: {
      type: String,
      enum: CANDIDATE_STATUSES,
      default: 'New',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    externalApplicationId: {
      type: String,
      default: null,
      trim: true,
    },
    notes: {
      type: [noteSchema],
      default: [],
    },
    timeline: {
      type: [timelineSchema],
      default: [],
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

candidateSchema.index({ jobId: 1, email: 1 }, { unique: true });
candidateSchema.index({ externalApplicationId: 1 }, { sparse: true, unique: true });
candidateSchema.index({ status: 1 });
candidateSchema.index({ source: 1 });
candidateSchema.index({ appliedAt: -1 });
candidateSchema.index({ name: 'text', email: 'text' });

const Candidate = mongoose.model('Candidate', candidateSchema);

export default Candidate;
