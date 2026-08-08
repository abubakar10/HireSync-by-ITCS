import MockAdapter from './mock.adapter.js';

/**
 * Generic feed / XML adapter for boards that typically use feeds
 * (Glassdoor, ZipRecruiter, OnlineJobs.ph, JobsDB, PhilJobNet, Naukri, Shine, Foundit, etc.)
 * DEMO only — no real feed upload.
 */
export default class GenericFeedAdapter extends MockAdapter {
  constructor(name, options = {}) {
    super(name, { type: options.type || 'XML Feed', region: options.region || 'Global', ...options });
  }
}
