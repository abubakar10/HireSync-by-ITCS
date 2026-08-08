import MockAdapter from './mock.adapter.js';

/**
 * DEMO / MOCK adapter — JobStreet
 * XML feed style in demo; replace with JobStreet partner API later.
 * Does NOT upload a real feed or call JobStreet APIs.
 */
export default class JobStreetAdapter extends MockAdapter {
  constructor() {
    super('JobStreet', {
      type: 'XML Feed',
      region: 'Southeast Asia',
      failRate: 0.06,
      minDelayMs: 450,
      maxDelayMs: 1200,
    });
  }

  async publishJob(job) {
    const result = await super.publishJob(job);
    if (result.success) {
      result.message = `[DEMO] Mock XML feed publish to JobStreet succeeded — not a real JobStreet integration`;
      result.raw = {
        ...result.raw,
        provider: 'JobStreet',
        integrationType: 'XML Feed',
        demo: true,
        feedFormat: 'jobstreet-xml-demo',
      };
    }
    return result;
  }
}
