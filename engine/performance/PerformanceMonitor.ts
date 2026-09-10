import { QualityTier, useWorldStore } from "../state/useWorldStore";

export interface PerformanceMetrics {
  fps: number;
  avgFrameTime: number;
  recommendedTier?: QualityTier;
}

/**
 * VOID Adaptive Performance Governor
 * Benchmarks frame render budget and dynamically adjusts visual fidelity
 * across 5 tiers (ultra, high, medium, low, lite) to maintain 60 FPS.
 */
export class AdaptivePerformanceGovernor {
  private static instance: AdaptivePerformanceGovernor | null = null;

  private frameTimes: number[] = [];
  private lastTime: number = 0;
  private sampleSize: number = 60;
  private tierOrder: QualityTier[] = ["low", "medium", "high", "ultra"];
  private cooldownFrames: number = 120; // Initial warmup cooldown (2 seconds)

  public static getInstance(): AdaptivePerformanceGovernor {
    if (!AdaptivePerformanceGovernor.instance) {
      AdaptivePerformanceGovernor.instance = new AdaptivePerformanceGovernor();
    }
    return AdaptivePerformanceGovernor.instance;
  }

  public recordFrame(): PerformanceMetrics {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (this.lastTime === 0) {
      this.lastTime = now;
      return { fps: 60, avgFrameTime: 16.6 };
    }

    const delta = now - this.lastTime;
    this.lastTime = now;

    // Filter out huge spikes from tab switching or suspension
    if (delta > 0 && delta < 250) {
      this.frameTimes.push(delta);
      if (this.frameTimes.length > this.sampleSize) {
        this.frameTimes.shift();
      }
    }

    if (this.frameTimes.length === 0) {
      return { fps: 60, avgFrameTime: 16.6 };
    }

    const avgDelta = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const fps = Math.max(1, Math.min(120, Math.round(1000 / avgDelta)));

    if (this.cooldownFrames > 0) {
      this.cooldownFrames--;
      return { fps, avgFrameTime: avgDelta };
    }

    // Check if adaptive quality is enabled in world store
    const store = useWorldStore.getState();
    if (!store.adaptiveQuality) {
      return { fps, avgFrameTime: avgDelta };
    }

    const currentTier = store.quality;
    const currentIndex = this.tierOrder.indexOf(currentTier);

    let recommendedTier: QualityTier | undefined;

    // Threshold check: Under 45 FPS (> 22.2ms per frame)
    if (avgDelta > 22.2 && currentIndex > 0) {
      recommendedTier = this.tierOrder[currentIndex - 1];
      this.cooldownFrames = 180; // 3 seconds thermal stabilization cooldown
    }
    // Threshold check: Over 70 FPS (< 14.2ms per frame)
    else if (avgDelta < 14.2 && currentIndex < this.tierOrder.length - 1) {
      recommendedTier = this.tierOrder[currentIndex + 1];
      this.cooldownFrames = 300; // 5 seconds stabilization cooldown before upgrade
    }

    return { fps, avgFrameTime: avgDelta, recommendedTier };
  }

  public resetCooldown() {
    this.cooldownFrames = 120;
  }
}

export const performanceGovernor = AdaptivePerformanceGovernor.getInstance();
