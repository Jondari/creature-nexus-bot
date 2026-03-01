export const ANCHOR_POLL_INITIAL_DELAY_MS = 150;
export const ANCHOR_POLL_INTERVAL_MS = 100;
export const ANCHOR_POLL_MAX_ATTEMPTS = 12;
export const ANCHOR_POLL_LONG_ATTEMPTS = 120;

export interface AnchorPollingOptions {
  initialDelayMs?: number;
  intervalMs?: number;
  maxAttempts?: number;
}
