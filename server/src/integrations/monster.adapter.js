import MockAdapter from './mock.adapter.js';

/**
 * DEMO / MOCK adapter — Monster
 * Replace with Monster partner API when credentials are available.
 * Does NOT call any real Monster endpoints.
 */
export default class MonsterAdapter extends MockAdapter {
  constructor() {
    super('Monster', {
      type: 'API',
      region: 'Global',
      failRate: 0.05,
      minDelayMs: 350,
      maxDelayMs: 1000,
    });
  }

  async publishJob(job) {
    const result = await super.publishJob(job);
    if (result.success) {
      result.message = `[DEMO] Mock publish to Monster succeeded — not a real Monster API call`;
      result.raw = {
        ...result.raw,
        provider: 'Monster',
        integrationType: 'API',
        demo: true,
      };
    }
    return result;
  }
}
