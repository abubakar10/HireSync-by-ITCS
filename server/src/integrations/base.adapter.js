/**
 * Common job board adapter interface (Demo architecture).
 *
 * Real board SDKs should implement this same contract so
 * IntegrationManager can swap mock adapters for production ones.
 *
 * All current adapters are MOCK / DEMO unless explicitly wired
 * with real API credentials.
 */
export class BaseAdapter {
  constructor(name, options = {}) {
    this.name = name;
    this.isDemo = options.isDemo !== false;
    this.type = options.type || 'API';
    this.region = options.region || 'Global';
  }

  /**
   * @param {object} job - Job document / plain object
   * @returns {Promise<{ success: boolean, externalJobId: string, message: string, raw?: object }>}
   */
  async publishJob(_job) {
    throw new Error(`${this.name}.publishJob() not implemented`);
  }

  /**
   * @param {object} job
   * @param {string} externalJobId
   */
  async updateJob(_job, _externalJobId) {
    throw new Error(`${this.name}.updateJob() not implemented`);
  }

  /**
   * @param {string} externalJobId
   */
  async closeJob(_externalJobId) {
    throw new Error(`${this.name}.closeJob() not implemented`);
  }

  /**
   * @param {object} job
   * @param {string} [externalJobId]
   */
  async getApplications(_job, _externalJobId) {
    throw new Error(`${this.name}.getApplications() not implemented`);
  }

  /**
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async testConnection() {
    throw new Error(`${this.name}.testConnection() not implemented`);
  }

  /** Simulate network latency for demo adapters */
  async simulateDelay(minMs = 300, maxMs = 900) {
    const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise((resolve) => setTimeout(resolve, ms));
    return ms;
  }

  generateExternalId(prefix) {
    const slug = (prefix || this.name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${slug}-demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export default BaseAdapter;
