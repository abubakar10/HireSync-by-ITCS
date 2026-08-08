import MockAdapter from './mock.adapter.js';

/**
 * DEMO / MOCK adapter — LinkedIn
 * Replace with LinkedIn Job Posting API when credentials are available.
 * Does NOT call any real LinkedIn endpoints.
 */
export default class LinkedInAdapter extends MockAdapter {
  constructor() {
    super('LinkedIn', {
      type: 'API',
      region: 'Global',
      failRate: 0.08,
      minDelayMs: 500,
      maxDelayMs: 1300,
    });
  }

  async publishJob(job) {
    const result = await super.publishJob(job);
    if (result.success) {
      result.message = `[DEMO] Mock publish to LinkedIn succeeded — not a real LinkedIn API call`;
      result.raw = {
        ...result.raw,
        provider: 'LinkedIn',
        integrationType: 'API',
        demo: true,
      };
    }
    return result;
  }
}
