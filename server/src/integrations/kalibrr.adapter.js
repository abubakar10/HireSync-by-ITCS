import MockAdapter from './mock.adapter.js';

/**
 * DEMO / MOCK adapter — Kalibrr
 * Replace with Kalibrr API when credentials are available.
 * Does NOT call any real Kalibrr endpoints.
 */
export default class KalibrrAdapter extends MockAdapter {
  constructor() {
    super('Kalibrr', {
      type: 'API',
      region: 'Philippines',
      failRate: 0.05,
      minDelayMs: 400,
      maxDelayMs: 1000,
    });
  }

  async publishJob(job) {
    const result = await super.publishJob(job);
    if (result.success) {
      result.message = `[DEMO] Mock publish to Kalibrr succeeded — not a real Kalibrr API call`;
      result.raw = {
        ...result.raw,
        provider: 'Kalibrr',
        integrationType: 'API',
        demo: true,
      };
    }
    return result;
  }
}
