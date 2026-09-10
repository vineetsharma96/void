import gsap from "gsap";
import { useWorldStore, RealmId } from "../state/useWorldStore";
import { audioEngine } from "../audio/AudioSynthesizer";

/**
 * VOID Inter-World Transition & Morphing Engine
 * Orchestrates GSAP timelines for seamless cosmological transformations.
 */
class TransitionManager {
  private isTransitioning: boolean = false;
  private timeline: gsap.core.Timeline | null = null;

  public transitionTo(targetRealm: RealmId) {
    const store = useWorldStore.getState();
    const currentRealm = store.currentRealm;

    if (currentRealm === targetRealm || this.isTransitioning) return;

    this.isTransitioning = true;
    store.actions.setTargetRealm(targetRealm);

    // Trigger procedural transition sweep sound
    audioEngine.triggerClickFoley();

    if (this.timeline) {
      this.timeline.kill();
    }

    const stateObj = { progress: 0 };

    this.timeline = gsap.timeline({
      onUpdate: () => {
        store.actions.setTransitionProgress(stateObj.progress);
        audioEngine.setTransitionSweep(stateObj.progress);
      },
      onComplete: () => {
        store.actions.setRealm(targetRealm);
        audioEngine.setRealmProfile(targetRealm);
        audioEngine.setTransitionSweep(0);
        this.isTransitioning = false;
      },
    });

    const realmDescriptions: Record<RealmId, string> = {
      origin: "Entered Realm 01: ORIGIN. Gravitational geodesic matrix and gyroscopic rings active.",
      forest: "Entered Realm 02: FOREST. Procedural recursive botanical branching and bio-luminescent canopy active.",
      ocean: "Entered Realm 03: OCEAN. Mathematical Gerstner wave ocean and crest foam active.",
      machine: "Entered Realm 04: MACHINE. Synchronized epicyclic gear train and hydraulic pistons active.",
      void: "Entered Realm 05: VOID. Relativistic event horizon singularity and quantum particle field active.",
    };
    store.actions.announce(realmDescriptions[targetRealm] || `Entered Realm: ${targetRealm}`);

    const duration = store.reducedMotion ? 0.15 : 1.8;

    // 1. Camera acceleration & dimensional warp phase
    this.timeline.to(stateObj, {
      progress: 1.0,
      duration,
      ease: store.reducedMotion ? "none" : "power3.inOut",
    });
  }

  public getIsTransitioning(): boolean {
    return this.isTransitioning;
  }
}

export const transitionManager = new TransitionManager();
