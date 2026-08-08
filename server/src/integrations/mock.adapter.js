import BaseAdapter from './base.adapter.js';

/**
 * Generic mock adapter used by board-specific DEMO adapters.
 * Clearly labeled as Demo / Mock — no real API calls are made.
 */
export class MockAdapter extends BaseAdapter {
  constructor(name, options = {}) {
    super(name, { isDemo: true, ...options });
    this.failRate = options.failRate ?? 0.05;
    this.minDelayMs = options.minDelayMs ?? 300;
    this.maxDelayMs = options.maxDelayMs ?? 900;
  }

  async publishJob(job) {
    const durationMs = await this.simulateDelay(this.minDelayMs, this.maxDelayMs);

    if (!job?.title || !job?.description) {
      return {
        success: false,
        externalJobId: null,
        message: `[DEMO] Validation failed for ${this.name}: title and description are required`,
        durationMs,
        isDemo: true,
        mode: 'mock',
      };
    }

    if (Math.random() < this.failRate) {
      return {
        success: false,
        externalJobId: null,
        message: `[DEMO] Simulated publish failure for ${this.name} (mock adapter)`,
        durationMs,
        isDemo: true,
        mode: 'mock',
      };
    }

    const externalJobId = this.generateExternalId(this.name);

    return {
      success: true,
      externalJobId,
      message: `[DEMO] Job published to ${this.name} via mock adapter`,
      durationMs,
      isDemo: true,
      mode: 'mock',
      raw: {
        board: this.name,
        type: this.type,
        region: this.region,
        mode: 'mock',
        demo: true,
        title: job.title,
        company: job.company,
        location: job.location,
        postedAt: new Date().toISOString(),
        disclaimer: 'This is a simulated response. No real job board API was called.',
      },
    };
  }

  async updateJob(job, externalJobId) {
    const durationMs = await this.simulateDelay(200, 600);
    return {
      success: true,
      externalJobId,
      message: `[DEMO] Job updated on ${this.name} (mock)`,
      durationMs,
      isDemo: true,
      mode: 'mock',
      raw: { board: this.name, mode: 'mock', demo: true, title: job?.title },
    };
  }

  async closeJob(externalJobId) {
    const durationMs = await this.simulateDelay(200, 500);
    return {
      success: true,
      externalJobId,
      message: `[DEMO] Job closed on ${this.name} (mock)`,
      durationMs,
      isDemo: true,
      mode: 'mock',
    };
  }

  async getApplications(_job, _externalJobId) {
    const durationMs = await this.simulateDelay(200, 500);
    return {
      success: true,
      applications: [],
      message: `[DEMO] No new applications from ${this.name} (mock)`,
      durationMs,
      isDemo: true,
      mode: 'mock',
    };
  }

  async testConnection() {
    const durationMs = await this.simulateDelay(100, 400);
    return {
      success: true,
      message: `[DEMO] Connection test OK for ${this.name} — mock adapter only`,
      durationMs,
      isDemo: true,
      mode: 'mock',
    };
  }
}

export default MockAdapter;
