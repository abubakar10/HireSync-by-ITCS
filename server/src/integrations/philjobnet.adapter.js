import MockAdapter from './mock.adapter.js';

/**
 * DEMO / MOCK adapter — PhilJobNet
 * Replace with PhilJobNet partner API when credentials are available.
 * Does NOT call any real PhilJobNet endpoints.
 */
export default class PhilJobNetAdapter extends MockAdapter {
  constructor() {
    super('PhilJobNet', {
      type: 'API',
      region: 'Philippines',
      failRate: 0.05,
      minDelayMs: 350,
      maxDelayMs: 950,
    });
  }

  async publishJob(job) {
    const result = await super.publishJob(job);
    if (result.success) {
      result.message = `[DEMO] Mock publish to PhilJobNet succeeded — not a real PhilJobNet API call`;
      result.raw = {
        ...result.raw,
        provider: 'PhilJobNet',
        integrationType: 'API',
        demo: true,
      };
    }
    return result;
  }
}
