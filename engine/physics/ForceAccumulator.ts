import * as THREE from "three";
import { useWorldStore } from "../state/useWorldStore";

export interface ShockwaveState {
  center: THREE.Vector3;
  startTime: number;
  strength: number;
  speed: number;
  maxRadius: number;
  decayRate: number;
}

/**
 * VOID Procedural Physics & Force Accumulator Engine
 * Zero external physics engine overhead.
 * Computes deterministic mathematical forces: gravitational attraction, cursor repulsion,
 * expanding shockwave impulse waves, and spring-damper equilibrium restoration.
 */
export class ProceduralForceAccumulator {
  private static instance: ProceduralForceAccumulator | null = null;
  private activeShockwave: ShockwaveState | null = null;

  public static getInstance(): ProceduralForceAccumulator {
    if (!ProceduralForceAccumulator.instance) {
      ProceduralForceAccumulator.instance = new ProceduralForceAccumulator();
    }
    return ProceduralForceAccumulator.instance;
  }

  /**
   * 1. Gravitational Attractor Force (Newton's Law with softening parameter epsilon)
   * F = -G * (M * m) / (|r| + epsilon)^2 * r_hat
   */
  public calculateAttractorForce(
    position: THREE.Vector3,
    center: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
    mass: number = 25.0,
    epsilon: number = 0.8
  ): THREE.Vector3 {
    const diff = new THREE.Vector3().subVectors(center, position);
    const dist = diff.length();
    if (dist < 0.001) return new THREE.Vector3(0, 0, 0);

    const forceMagnitude = mass / Math.pow(dist + epsilon, 2);
    return diff.normalize().multiplyScalar(forceMagnitude);
  }

  /**
   * 2. Unprojected Cursor Repulsion Force
   * Quadratic falloff within interaction radius R
   */
  public calculateRepulsionForce(
    position: THREE.Vector3,
    cursorWorld: THREE.Vector3,
    radius: number = 4.5,
    strength: number = 6.0
  ): THREE.Vector3 {
    const diff = new THREE.Vector3().subVectors(position, cursorWorld);
    const dist = diff.length();

    if (dist >= radius || dist < 0.001) {
      return new THREE.Vector3(0, 0, 0);
    }

    const factor = Math.pow(1.0 - dist / radius, 2);
    return diff.normalize().multiplyScalar(strength * factor);
  }

  /**
   * 3. Dynamic Expanding Shockwave Impulse Wave
   * Propagates radially outward: Wave(r, dt) = A * exp(-(r - v*dt)^2 / (2*sigma^2)) * exp(-gamma*dt)
   */
  public triggerShockwave(
    center: THREE.Vector3,
    strength: number = 1.0,
    speed: number = 12.0,
    maxRadius: number = 18.0
  ) {
    const now = typeof performance !== "undefined" ? performance.now() * 0.001 : 0;
    this.activeShockwave = {
      center: center.clone(),
      startTime: now,
      strength,
      speed,
      maxRadius,
      decayRate: 1.8,
    };
  }

  /**
   * Evaluates instantaneous shockwave displacement and force vector at a specific 3D point
   */
  public evaluateShockwaveAt(position: THREE.Vector3, currentTime: number): THREE.Vector3 {
    if (!this.activeShockwave) return new THREE.Vector3(0, 0, 0);

    const elapsed = currentTime - this.activeShockwave.startTime;
    if (elapsed < 0) return new THREE.Vector3(0, 0, 0);

    const currentRadius = elapsed * this.activeShockwave.speed;
    if (currentRadius > this.activeShockwave.maxRadius) {
      // Shockwave dissipated
      this.activeShockwave = null;
      return new THREE.Vector3(0, 0, 0);
    }

    const diff = new THREE.Vector3().subVectors(position, this.activeShockwave.center);
    const dist = diff.length();
    if (dist < 0.001) return new THREE.Vector3(0, 0, 0);

    const sigma = 1.2; // Wavefront thickness
    const gaussian = Math.exp(-Math.pow(dist - currentRadius, 2) / (2 * sigma * sigma));
    const temporalDecay = Math.exp(-this.activeShockwave.decayRate * elapsed);

    const impulseMagnitude = this.activeShockwave.strength * gaussian * temporalDecay * 4.5;
    return diff.normalize().multiplyScalar(impulseMagnitude);
  }

  /**
   * 4. Hooke's Law Spring-Damper Kinematics
   * F = -k*(x - x0) - c*v
   */
  public calculateSpringDamper(
    currentPos: THREE.Vector3,
    restPos: THREE.Vector3,
    velocity: THREE.Vector3,
    springK: number = 4.5,
    dampingC: number = 1.6,
    dt: number = 0.016
  ): { nextPos: THREE.Vector3; nextVel: THREE.Vector3 } {
    const displacement = new THREE.Vector3().subVectors(currentPos, restPos);
    const springForce = displacement.multiplyScalar(-springK);
    const dampingForce = velocity.clone().multiplyScalar(-dampingC);

    const acceleration = springForce.add(dampingForce);
    const nextVel = velocity.clone().addScaledVector(acceleration, dt);
    const nextPos = currentPos.clone().addScaledVector(nextVel, dt);

    return { nextPos, nextVel };
  }

  /**
   * Helper extracting active shockwave parameters for GLSL shader uniforms
   */
  public getShaderUniforms(currentTime: number) {
    const storeShockwave = useWorldStore.getState().shockwave;
    const elapsed = currentTime - storeShockwave.time;

    return {
      uShockwaveCenter: new THREE.Vector3(...storeShockwave.center),
      uShockwaveTime: elapsed >= 0 ? elapsed : 999.0,
      uShockwaveStrength: storeShockwave.strength,
    };
  }
}

export const forceAccumulator = ProceduralForceAccumulator.getInstance();
