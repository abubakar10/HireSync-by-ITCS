import MockAdapter from './mock.adapter.js';

/**
 * DEMO / MOCK adapter — JobsDB
 * Feed-style mock. Does NOT call JobsDB / SEEK partner APIs.
 */
export default class JobsDBAdapter extends MockAdapter {
  constructor() {
    super('JobsDB', {
      type: 'XML Feed',
      region: 'Asia Pacific',
      failRate: 0.06,
      minDelayMs: 450,
      maxDelayMs: 1200,
    });
  }

  async publishJob(job) {
    const result = await super.publishJob(job);
    if (result.success) {
      result.message = `[DEMO] Mock feed publish to JobsDB succeeded — not a real JobsDB integration`;
      result.raw = {
        ...result.raw,
        provider: 'JobsDB',
        integrationType: 'XML Feed',
        demo: true,
      };
    }
    return result;
  }
}
