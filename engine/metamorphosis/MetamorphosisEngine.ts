import { RealmId, useWorldStore } from "../state/useWorldStore";
import { MorphGeometries, MorphPointCloud } from "./MorphGeometries";

export type MorphPhase = "idle" | "dissolving" | "transmuting" | "reconstituting";

export interface MorphState {
  isMorphing: boolean;
  sourceRealm: RealmId;
  targetRealm: RealmId;
  progress: number;
  phase: MorphPhase;
}

/**
 * VOID Procedural Metamorphosis Engine
 * Coordinates real-time mathematical in-place transformation between cosmological archetypes.
 */
export class MetamorphosisEngine {
  private static instance: MetamorphosisEngine | null = null;

  private state: MorphState = {
    isMorphing: false,
    sourceRealm: "origin",
    targetRealm: "origin",
    progress: 0,
    phase: "idle",
  };

  private sourceCloud: MorphPointCloud | null = null;
  private targetCloud: MorphPointCloud | null = null;

  public static getInstance(): MetamorphosisEngine {
    if (!MetamorphosisEngine.instance) {
      MetamorphosisEngine.instance = new MetamorphosisEngine();
    }
    return MetamorphosisEngine.instance;
  }

  /**
   * Initialize a new metamorphosis between two realms
   */
  public beginMorph(fromRealm: RealmId, toRealm: RealmId): void {
    this.state = {
      isMorphing: true,
      sourceRealm: fromRealm,
      targetRealm: toRealm,
      progress: 0,
      phase: "dissolving",
    };

    // Precompute the analytical point clouds
    this.sourceCloud = MorphGeometries.sampleRealmPoints(fromRealm);
    this.targetCloud = MorphGeometries.sampleRealmPoints(toRealm);
  }

  /**
   * Update progress of the active metamorphosis (0.0 to 1.0)
   */
  public updateProgress(progress: number): void {
    if (!this.state.isMorphing) return;

    this.state.progress = Math.max(0, Math.min(1, progress));

    if (this.state.progress < 0.35) {
      this.state.phase = "dissolving";
    } else if (this.state.progress < 0.75) {
      this.state.phase = "transmuting";
    } else {
      this.state.phase = "reconstituting";
    }
  }

  /**
   * Finalize the metamorphosis
   */
  public completeMorph(): void {
    this.state.isMorphing = false;
    this.state.progress = 1.0;
    this.state.phase = "idle";
    this.state.sourceRealm = this.state.targetRealm;
  }

  public getState(): MorphState {
    return this.state;
  }

  public getSourceCloud(): MorphPointCloud | null {
    return this.sourceCloud;
  }

  public getTargetCloud(): MorphPointCloud | null {
    return this.targetCloud;
  }

  /**
   * Check which specialized archetype transition is occurring
   */
  public getArchetypePair(): string {
    return `${this.state.sourceRealm}_to_${this.state.targetRealm}`;
  }
}

export const metamorphosisEngine = MetamorphosisEngine.getInstance();
