import * as THREE from "three";
import { InteractiveObject, ObjectLifecycleState, WorldEvent, WorldEventType, PlayerDisturbanceField } from "./types";
import { useWorldStore } from "../state/useWorldStore";
import { audioEngine } from "../audio/AudioSynthesizer";

type EventListener = (event: WorldEvent) => void;

/**
 * VOID World Engine
 * Master spatial coordinator for interactive procedural structures,
 * proximity awareness, player disturbance fields, and discovery milestones.
 */
export class WorldEngine {
  private static instance: WorldEngine | null = null;

  private objects: Map<string, InteractiveObject> = new Map();
  private listeners: Map<WorldEventType, Set<EventListener>> = new Map();
  
  private disturbanceField: PlayerDisturbanceField = {
    position: new THREE.Vector3(0, 0, 7.5),
    velocity: new THREE.Vector3(0, 0, 0),
    radius: 3.8,
    strength: 1.0,
    active: true,
  };

  private lastFocusedObjectId: string | null = null;

  public static getInstance(): WorldEngine {
    if (!WorldEngine.instance) {
      WorldEngine.instance = new WorldEngine();
    }
    return WorldEngine.instance;
  }

  /**
   * Register a procedural interactive object
   */
  public registerObject(obj: InteractiveObject): void {
    this.objects.set(obj.id, obj);
  }

  /**
   * Unregister an object
   */
  public unregisterObject(id: string): void {
    if (this.lastFocusedObjectId === id) {
      this.lastFocusedObjectId = null;
      useWorldStore.getState().actions.setFocusedObject(null);
    }
    this.objects.delete(id);
  }

  /**
   * Get an object by ID
   */
  public getObject(id: string): InteractiveObject | undefined {
    return this.objects.get(id);
  }

  /**
   * Get all registered interactive objects
   */
  public getAllObjects(): InteractiveObject[] {
    return Array.from(this.objects.values());
  }

  /**
   * Subscribe to world events
   */
  public on(type: WorldEventType, callback: EventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  /**
   * Emit a world event
   */
  public emit(type: WorldEventType, data?: unknown, objectId?: string): void {
    const event: WorldEvent = {
      type,
      objectId,
      data,
      timestamp: typeof performance !== "undefined" ? performance.now() : Date.now(),
    };

    this.listeners.get(type)?.forEach((cb) => cb(event));
  }

  /**
   * Update object state and trigger hooks
   */
  public setObjectState(id: string, newState: ObjectLifecycleState): void {
    const obj = this.objects.get(id);
    if (!obj || obj.state === newState) return;

    const oldState = obj.state;
    obj.state = newState;
    obj.onStateChange?.(newState, oldState);

    if (newState === "unlocked") {
      this.recordDiscovery(id, obj.type);
    }
  }

  /**
   * Record a milestone discovery
   */
  public recordDiscovery(id: string, type: string): void {
    const store = useWorldStore.getState();
    store.actions.addDiscovery(id, type);
    this.emit("SIGNAL_DISCOVERED", { id, type }, id);
    audioEngine.triggerDataRegenArpeggio();
    store.actions.announce(`Anomaly Discovered: ${id.toUpperCase()}`);
  }

  /**
   * Focus an object (e.g. from Raycaster)
   */
  public setFocus(id: string | null): void {
    if (this.lastFocusedObjectId === id) return;

    if (this.lastFocusedObjectId) {
      const prev = this.objects.get(this.lastFocusedObjectId);
      if (prev) {
        prev.onBlur?.();
        if (prev.state === "focused") {
          prev.state = "aware";
        }
      }
      this.emit("OBJECT_UNFOCUSED", undefined, this.lastFocusedObjectId);
    }

    this.lastFocusedObjectId = id;
    useWorldStore.getState().actions.setFocusedObject(id);

    if (id) {
      const current = this.objects.get(id);
      if (current) {
        current.onFocus?.();
        if (current.state === "aware" || current.state === "dormant") {
          current.state = "focused";
        }
      }
      this.emit("OBJECT_FOCUSED", undefined, id);
    }
  }

  /**
   * Interact with currently focused or specified object
   */
  public interactWith(id?: string): void {
    const targetId = id || this.lastFocusedObjectId;
    if (!targetId) return;

    const obj = this.objects.get(targetId);
    if (!obj) return;

    obj.onInteract?.();
    this.emit("OBJECT_INTERACTED", undefined, targetId);
    audioEngine.triggerShockwaveImpulse(1.2);
  }

  /**
   * Main per-frame update loop
   * Evaluates proximity distances relative to explorer position and updates disturbance field
   */
  public update(playerPos: THREE.Vector3, playerVelocity: THREE.Vector3): void {
    // Update disturbance field
    this.disturbanceField.position.copy(playerPos);
    this.disturbanceField.velocity.copy(playerVelocity);
    const speed = playerVelocity.length();
    this.disturbanceField.strength = Math.min(2.5, 1.0 + speed * 0.4);

    // Evaluate proximity for all objects
    for (const obj of this.objects.values()) {
      const dist = playerPos.distanceTo(obj.position);

      if (dist <= obj.proximityThresholds.aware) {
        if (obj.state === "dormant") {
          obj.state = "aware";
          obj.onAware?.(dist);
          this.emit("PLAYER_NEAR_OBJECT", { distance: dist }, obj.id);
        } else if (obj.state === "aware") {
          obj.onAware?.(dist);
        }
      } else {
        if (obj.state === "aware" || obj.state === "focused") {
          obj.state = "dormant";
          obj.onLeaveAware?.();
        }
      }
    }
  }

  public getDisturbanceField(): PlayerDisturbanceField {
    return this.disturbanceField;
  }
}

export const worldEngine = WorldEngine.getInstance();
