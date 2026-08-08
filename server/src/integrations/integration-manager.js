import IndeedAdapter from './indeed.adapter.js';
import LinkedInAdapter from './linkedin.adapter.js';
import MonsterAdapter from './monster.adapter.js';
import JobStreetAdapter from './jobstreet.adapter.js';
import KalibrrAdapter from './kalibrr.adapter.js';
import OnlineJobsPhAdapter from './onlinejobsph.adapter.js';
import JobsDBAdapter from './jobsdb.adapter.js';
import PhilJobNetAdapter from './philjobnet.adapter.js';
import GenericFeedAdapter from './generic-feed.adapter.js';

/**
 * IntegrationManager — central registry for job board adapters.
 *
 * PRIMARY DEMO BOARDS (dedicated mock adapters):
 *   Indeed, LinkedIn, Monster, JobStreet, Kalibrr,
 *   OnlineJobs.ph, JobsDB, PhilJobNet
 *
 * Additional catalog boards use GenericFeedAdapter (also DEMO/MOCK).
 *
 * Nothing here calls real third-party job board APIs.
 * To go live later: replace a mock class with a real SDK client and keep
 * credentials in server env vars / Integration.configuration only.
 */
class IntegrationManager {
  constructor() {
    this.adapters = new Map();
    this.registerDefaults();
  }

  registerDefaults() {
    // Dedicated DEMO adapters requested for multi-board distribution
    this.register(new IndeedAdapter());
    this.register(new LinkedInAdapter());
    this.register(new MonsterAdapter());
    this.register(new JobStreetAdapter());
    this.register(new KalibrrAdapter());
    this.register(new OnlineJobsPhAdapter());
    this.register(new JobsDBAdapter());
    this.register(new PhilJobNetAdapter());

    // Remaining catalog boards — also DEMO via generic feed adapter
    const feedBoards = [
      { name: 'Glassdoor', type: 'API', region: 'Global' },
      { name: 'ZipRecruiter', type: 'API', region: 'US / Canada' },
      { name: 'Naukri', type: 'API', region: 'India' },
      { name: 'Shine', type: 'API', region: 'India' },
      { name: 'Foundit', type: 'API', region: 'India / APAC' },
    ];

    for (const board of feedBoards) {
      this.register(new GenericFeedAdapter(board.name, board));
    }
  }

  register(adapter) {
    this.adapters.set(adapter.name, adapter);
  }

  get(boardName) {
    return this.adapters.get(boardName) || null;
  }

  /** Boards with first-class dedicated demo adapters */
  primaryDemoBoards() {
    return [
      'Indeed',
      'LinkedIn',
      'Monster',
      'JobStreet',
      'Kalibrr',
      'OnlineJobs.ph',
      'JobsDB',
      'PhilJobNet',
    ];
  }

  list() {
    const primary = new Set(this.primaryDemoBoards());
    return Array.from(this.adapters.values()).map((a) => ({
      name: a.name,
      type: a.type,
      region: a.region,
      isDemo: true,
      mode: 'mock',
      primary: primary.has(a.name),
      disclaimer: 'Mock adapter — not connected to a live job board API',
    }));
  }

  async publishJob(boardName, job) {
    const adapter = this.get(boardName);
    if (!adapter) {
      return {
        success: false,
        message: `[DEMO] No adapter registered for board: ${boardName}`,
        isDemo: true,
        mode: 'mock',
      };
    }
    return adapter.publishJob(job);
  }

  async updateJob(boardName, job, externalJobId) {
    const adapter = this.get(boardName);
    if (!adapter) {
      return { success: false, message: `[DEMO] No adapter for ${boardName}`, isDemo: true, mode: 'mock' };
    }
    return adapter.updateJob(job, externalJobId);
  }

  async closeJob(boardName, externalJobId) {
    const adapter = this.get(boardName);
    if (!adapter) {
      return { success: false, message: `[DEMO] No adapter for ${boardName}`, isDemo: true, mode: 'mock' };
    }
    return adapter.closeJob(externalJobId);
  }

  async getApplications(boardName, job, externalJobId) {
    const adapter = this.get(boardName);
    if (!adapter) {
      return {
        success: false,
        applications: [],
        message: `[DEMO] No adapter for ${boardName}`,
        isDemo: true,
        mode: 'mock',
      };
    }
    return adapter.getApplications(job, externalJobId);
  }

  async testConnection(boardName) {
    const adapter = this.get(boardName);
    if (!adapter) {
      return { success: false, message: `[DEMO] No adapter for ${boardName}`, isDemo: true, mode: 'mock' };
    }
    return adapter.testConnection();
  }
}

const integrationManager = new IntegrationManager();

export default integrationManager;
