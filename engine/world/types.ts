import * as THREE from "three";

/**
 * Procedural Object Lifecycle States
 */
export type ObjectLifecycleState =
  | "dormant"       // Far from explorer, low-frequency ambient activity
  | "aware"         // Explorer within proximity radius, initial reactivity
  | "focused"       // Explorer is gazing/pointing directly at the object
  | "interacting"   // Explorer actively engaging (click/tap/hold)
  | "active"        // Fully activated state
  | "transforming"  // Procedural metamorphosis in progress
  | "unlocked";     // Permanent or milestone state achieved

/**
 * World Event Types
 */
export type WorldEventType =
  | "PLAYER_NEAR_OBJECT"
  | "OBJECT_FOCUSED"
  | "OBJECT_UNFOCUSED"
  | "OBJECT_INTERACTED"
  | "SIGNAL_DISCOVERED"
  | "PORTAL_ACTIVATED"
  | "PORTAL_ENTERED"
  | "WORLD_TRANSFORMATION_STARTED"
  | "WORLD_TRANSFORMATION_COMPLETED";

export interface WorldEvent {
  type: WorldEventType;
  objectId?: string;
  realmId?: string;
  data?: unknown;
  timestamp: number;
}

/**
 * Standard Interface for any Procedural Interactive Object
 */
export interface InteractiveObject {
  id: string;
  name: string;
  type: "core" | "portal" | "signal" | "structure" | "organism" | "machine";
  position: THREE.Vector3;
  radius: number; // Collision & Raycast proxy radius
  proximityThresholds: {
    aware: number;   // e.g. 10.0m
    active: number;  // e.g. 4.0m
  };
  state: ObjectLifecycleState;
  
  // Lifecycle Handlers
  onAware?(distance: number): void;
  onLeaveAware?(): void;
  onFocus?(): void;
  onBlur?(): void;
  onInteract?(): void;
  onStateChange?(newState: ObjectLifecycleState, oldState: ObjectLifecycleState): void;
}

/**
 * Session Discovery State
 */
export interface DiscoveryState {
  discoveredSignals: string[];      // IDs of discovered anomalies
  activatedStructures: string[];    // IDs of energized mechanisms
  unlockedPortals: string[];        // IDs of opened inter-world portals
  totalDiscoveries: number;
}

/**
 * Player Physical Disturbance Field
 */
export interface PlayerDisturbanceField {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  radius: number;
  strength: number;
  active: boolean;
}
