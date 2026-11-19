import { QualityTier, useWorldStore } from "../state/useWorldStore";

export interface PerformanceMetrics {
  fps: number;
  avgFrameTime: number;
  recommendedTier?: QualityTier;
}

const frameTimes: number[] = [];
let lastTime: number = 0;
const sampleSize: number = 60;
const tierOrder: QualityTier[] = ["low", "medium", "high", "ultra"];
let cooldownFrames: number = 120; // Initial warmup cooldown (2 seconds)

/**
 * VOID Adaptive Performance Governor
 * Benchmarks frame render budget and dynamically adjusts visual fidelity
 * across 5 tiers (ultra, high, medium, low, lite) to maintain 60 FPS.
 */
export const performanceGovernor = {
  recordFrame(): PerformanceMetrics {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (lastTime === 0) {
      lastTime = now;
      return { fps: 60, avgFrameTime: 16.6 };
    }

    const delta = now - lastTime;
    lastTime = now;

    // Filter out huge spikes from tab switching or suspension
    if (delta > 0 && delta < 250) {
      frameTimes.push(delta);
      if (frameTimes.length > sampleSize) {
        frameTimes.shift();
      }
    }

    if (frameTimes.length === 0) {
      return { fps: 60, avgFrameTime: 16.6 };
    }

    const avgDelta = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const fps = Math.max(1, Math.min(120, Math.round(1000 / avgDelta)));

    if (cooldownFrames > 0) {
      cooldownFrames--;
      return { fps, avgFrameTime: avgDelta };
    }

    // Check if adaptive quality is enabled in world store
    const store = useWorldStore.getState();
    if (!store.adaptiveQuality) {
      return { fps, avgFrameTime: avgDelta };
    }

    const currentTier = store.quality;
    const currentIndex = tierOrder.indexOf(currentTier);

    let recommendedTier: QualityTier | undefined;

    // Threshold check: Under 45 FPS (> 22.2ms per frame)
    if (avgDelta > 22.2 && currentIndex > 0) {
      recommendedTier = tierOrder[currentIndex - 1];
      cooldownFrames = 180; // 3 seconds thermal stabilization cooldown
    }
    // Threshold check: Over 70 FPS (< 14.2ms per frame)
    else if (avgDelta < 14.2 && currentIndex < tierOrder.length - 1) {
      recommendedTier = tierOrder[currentIndex + 1];
      cooldownFrames = 300; // 5 seconds stabilization cooldown before upgrade
    }

    return { fps, avgFrameTime: avgDelta, recommendedTier };
  },

  resetCooldown() {
    cooldownFrames = 120;
  }
};
