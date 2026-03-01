import * as React from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAnchors } from '@/context/AnchorsContext';
import type { AnchorPollingOptions } from '@/constants/tutorial';
import {
  ANCHOR_POLL_INITIAL_DELAY_MS,
  ANCHOR_POLL_INTERVAL_MS,
  ANCHOR_POLL_MAX_ATTEMPTS,
} from '@/constants/tutorial';

export const useAnchorPolling = (
  anchorIds: string[],
  onReady: () => void,
  options: AnchorPollingOptions = {},
) => {
  const anchors = useAnchors();

  const {
    initialDelayMs = ANCHOR_POLL_INITIAL_DELAY_MS,
    intervalMs = ANCHOR_POLL_INTERVAL_MS,
    maxAttempts = ANCHOR_POLL_MAX_ATTEMPTS,
  } = options;

  useFocusEffect(
    React.useCallback(() => {
      if (anchorIds.length === 0) {
        onReady();
        return () => undefined;
      }

      let cancelled = false;
      let attempts = 0;
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      const poll = async () => {
        if (cancelled) return;

        attempts += 1;
        const rects = await Promise.all(anchorIds.map((id) => anchors.getRect(id)));
        const ready = rects.every(Boolean);

        if (ready) {
          if (!cancelled) {
            onReady();
          }
          return;
        }

        if (attempts < maxAttempts && !cancelled) {
          timeoutId = setTimeout(poll, intervalMs);
        }
      };

      timeoutId = setTimeout(poll, initialDelayMs);

      return () => {
        cancelled = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }, [anchors, anchorIds.join('|'), onReady, initialDelayMs, intervalMs, maxAttempts])
  );
};
