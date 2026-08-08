import MockAdapter from './mock.adapter.js';

/**
 * DEMO / MOCK adapter — OnlineJobs.ph
 * Feed-style mock. Does NOT upload to OnlineJobs.ph.
 */
export default class OnlineJobsPhAdapter extends MockAdapter {
  constructor() {
    super('OnlineJobs.ph', {
      type: 'XML Feed',
      region: 'Philippines',
      failRate: 0.05,
      minDelayMs: 400,
      maxDelayMs: 1100,
    });
  }

  async publishJob(job) {
    const result = await super.publishJob(job);
    if (result.success) {
      result.message = `[DEMO] Mock feed publish to OnlineJobs.ph succeeded — not a real OnlineJobs.ph integration`;
      result.raw = {
        ...result.raw,
        provider: 'OnlineJobs.ph',
        integrationType: 'XML Feed',
        demo: true,
      };
    }
    return result;
  }
}
