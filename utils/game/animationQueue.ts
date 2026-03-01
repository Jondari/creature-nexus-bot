// Centralized animation queue for sequencing turn-transition animations.
// Animations enqueued during the AI turn (e.g. energy wave) are held until
// flush() is called, then played one after another.

export type AnimationItem = {
  type: string;
  payload: any;
  duration: number;
};

type AnimationCallback = (item: AnimationItem) => void;

export class AnimationQueue {
  private queue: AnimationItem[] = [];
  private playing = false;
  private onPlayCb: AnimationCallback | null = null;
  private onCompleteCb: AnimationCallback | null = null;

  /** Register callbacks dispatched when an animation starts / ends */
  setCallbacks(onPlay: AnimationCallback, onComplete: AnimationCallback) {
    this.onPlayCb = onPlay;
    this.onCompleteCb = onComplete;
  }

  /** Add an animation to the queue (does NOT start it immediately) */
  enqueue(item: AnimationItem) {
    this.queue.push(item);
  }

  /** Insert an animation at the front of the queue */
  prepend(item: AnimationItem) {
    this.queue.unshift(item);
  }

  /** Play all queued animations sequentially, then resolve */
  async flush(): Promise<void> {
    if (this.playing) return;
    this.playing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.onPlayCb?.(item);
      await delay(item.duration);
      this.onCompleteCb?.(item);
    }

    this.playing = false;
  }

  /** Discard all pending animations (e.g. game reset) */
  clear() {
    this.queue = [];
    this.playing = false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
