import * as THREE from "three";
import { useWorldStore } from "../state/useWorldStore";
import { worldEngine } from "../world/WorldEngine";

export interface ExplorerConfig {
  walkSpeed: number;
  runSpeed: number;
  acceleration: number;
  damping: number;
  minRadius: number;
  maxRadius: number;
  headBobFrequency: number;
  headBobAmplitude: number;
}

const DEFAULT_CONFIG: ExplorerConfig = {
  walkSpeed: 4.8,
  runSpeed: 8.5,
  acceleration: 24.0,
  damping: 0.88,
  minRadius: 2.3,   // Prevent clipping inside core
  maxRadius: 22.0,  // Exploration world boundary
  headBobFrequency: 7.5,
  headBobAmplitude: 0.06,
};

/**
 * VOID Explorer Controller
 * Manages spatial movement kinematics, acceleration curves, smooth damping,
 * and lightweight spherical world boundary collisions for free 3D exploration.
 */
export class ExplorerController {
  private static instance: ExplorerController | null = null;
  private config: ExplorerConfig = DEFAULT_CONFIG;

  private position: THREE.Vector3 = new THREE.Vector3(0, 0, 7.5);
  private velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private targetVelocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Orientation angles (yaw and pitch for mouse-look)
  private yaw: number = 0;
  private pitch: number = 0;
  private targetYaw: number = 0;
  private targetPitch: number = 0;

  // Head bobbing phase
  private bobPhase: number = 0;
  private bobOffset: number = 0;

  public static getInstance(): ExplorerController {
    if (!ExplorerController.instance) {
      ExplorerController.instance = new ExplorerController();
    }
    return ExplorerController.instance;
  }

  /**
   * Reset explorer position to default spawn point
   */
  public reset(spawnPoint: THREE.Vector3 = new THREE.Vector3(0, 0, 7.5)) {
    this.position.copy(spawnPoint);
    this.velocity.set(0, 0, 0);
    this.targetVelocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.targetYaw = 0;
    this.targetPitch = 0;
    this.bobPhase = 0;
    this.bobOffset = 0;
  }

  /**
   * Add delta rotation from mouse look or touch drag
   */
  public addLookDelta(deltaX: number, deltaY: number) {
    this.targetYaw -= deltaX * 0.0035;
    this.targetPitch = THREE.MathUtils.clamp(
      this.targetPitch - deltaY * 0.0028,
      -1.42,
      1.42
    );
  }

  /**
   * Update spatial kinematics per frame
   */
  public update(delta: number): {
    cameraPosition: THREE.Vector3;
    lookDirection: THREE.Vector3;
    speed: number;
  } {
    const store = useWorldStore.getState();
    const moveInput = store.moveInput;

    // Smooth yaw & pitch interpolation
    this.yaw = THREE.MathUtils.lerp(this.yaw, this.targetYaw, 0.12);
    this.pitch = THREE.MathUtils.lerp(this.pitch, this.targetPitch, 0.12);

    // Compute forward & right vectors based on yaw
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).negate();
    const right = new THREE.Vector3(-Math.sin(this.yaw - Math.PI / 2), 0, -Math.cos(this.yaw - Math.PI / 2));

    // Combine inputs into desired direction vector
    const inputDir = new THREE.Vector3();
    if (moveInput.forward !== 0) inputDir.addScaledVector(forward, moveInput.forward);
    if (moveInput.right !== 0) inputDir.addScaledVector(right, moveInput.right);
    if (moveInput.up !== 0) inputDir.y += moveInput.up;

    if (inputDir.lengthSq() > 0.001) {
      inputDir.normalize();
    }

    // Accelerate toward target velocity
    const targetSpeed = this.config.walkSpeed;
    this.targetVelocity.copy(inputDir).multiplyScalar(targetSpeed);
    this.velocity.lerp(this.targetVelocity, Math.min(1.0, this.config.acceleration * delta));

    // Apply smooth damping when input ceases
    if (inputDir.lengthSq() < 0.001) {
      this.velocity.multiplyScalar(Math.pow(this.config.damping, delta * 60));
    }

    // Apply displacement
    this.position.addScaledVector(this.velocity, delta);

    // Spherical boundary collision (keep within min & max radii)
    const distFromOrigin = this.position.length();
    if (distFromOrigin < this.config.minRadius) {
      // Repel from core center
      this.position.normalize().multiplyScalar(this.config.minRadius);
      this.velocity.multiplyScalar(0.5);
    } else if (distFromOrigin > this.config.maxRadius) {
      // Constrain inside world boundary
      this.position.normalize().multiplyScalar(this.config.maxRadius);
      this.velocity.multiplyScalar(0.5);
    }

    const currentSpeed = this.velocity.length();

    // Head-bobbing calculation when moving
    if (currentSpeed > 0.2 && !store.reducedMotion) {
      this.bobPhase += delta * this.config.headBobFrequency * (currentSpeed / targetSpeed);
      this.bobOffset = Math.sin(this.bobPhase) * this.config.headBobAmplitude;
    } else {
      this.bobOffset = THREE.MathUtils.lerp(this.bobOffset, 0, 0.1);
    }

    // Sync back to world store & WorldEngine
    store.actions.setPlayerPosition([this.position.x, this.position.y, this.position.z]);
    store.actions.setPlayerVelocity([this.velocity.x, this.velocity.y, this.velocity.z]);
    worldEngine.update(this.position, this.velocity);

    // Compute look-at point based on pitch and yaw
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const lookDir = new THREE.Vector3(
      Math.sin(this.yaw) * cosPitch,
      sinPitch,
      Math.cos(this.yaw) * cosPitch
    ).negate();

    const cameraPos = this.position.clone();
    cameraPos.y += this.bobOffset;

    return {
      cameraPosition: cameraPos,
      lookDirection: lookDir,
      speed: currentSpeed,
    };
  }

  public getPosition(): THREE.Vector3 {
    return this.position;
  }

  public getVelocity(): THREE.Vector3 {
    return this.velocity;
  }
}

export const explorerController = ExplorerController.getInstance();
