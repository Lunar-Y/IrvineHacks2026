import { DEMO_SCAN_POST_RECOMMENDATION_DELAY_MS } from './demoContract';

export function waitForPostScanDemoDelay(
  ms: number = DEMO_SCAN_POST_RECOMMENDATION_DELAY_MS
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
