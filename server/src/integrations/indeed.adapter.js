import MockAdapter from './mock.adapter.js';

/**
 * DEMO / MOCK adapter — Indeed
 * Replace with Indeed Publisher / Apply Connect API when credentials are available.
 * Does NOT call any real Indeed endpoints.
 */
export default class IndeedAdapter extends MockAdapter {
  constructor() {
    super('Indeed', {
      type: 'API',
      region: 'Global',
      failRate: 0.04,
      minDelayMs: 400,
      maxDelayMs: 1100,
    });
  }

  async publishJob(job) {
    const result = await super.publishJob(job);
    if (result.success) {
      result.message = `[DEMO] Mock publish to Indeed succeeded — not a real Indeed API call`;
      result.raw = {
        ...result.raw,
        provider: 'Indeed',
        integrationType: 'API',
        demo: true,
        note: 'Swap IndeedAdapter for a production client to go live',
      };
    }
    return result;
  }
}
