import { DEMO_SCAN_POST_RECOMMENDATION_DELAY_MS } from './demoContract';
import { waitForPostScanDemoDelay } from './scanDelay';

describe('waitForPostScanDemoDelay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('uses the demo contract delay value', () => {
    expect(DEMO_SCAN_POST_RECOMMENDATION_DELAY_MS).toBe(1500);
  });

  it('does not resolve before the configured delay', async () => {
    let resolved = false;
    const p = waitForPostScanDemoDelay().then(() => {
      resolved = true;
    });

    jest.advanceTimersByTime(DEMO_SCAN_POST_RECOMMENDATION_DELAY_MS - 1);
    await Promise.resolve();
    expect(resolved).toBe(false);

    jest.advanceTimersByTime(1);
    await p;
    expect(resolved).toBe(true);
  });
});
