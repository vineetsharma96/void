import * as THREE from "three";
import { worldEngine } from "../world/WorldEngine";
import { useWorldStore } from "../state/useWorldStore";

/**
 * VOID Spatial Raycast Manager
 * Throttled, high-performance raycaster testing against registered procedural interactive objects.
 */
export class RaycastManager {
  private static instance: RaycastManager | null = null;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private pointerVector: THREE.Vector2 = new THREE.Vector2();
  private frameCount: number = 0;

  public static getInstance(): RaycastManager {
    if (!RaycastManager.instance) {
      RaycastManager.instance = new RaycastManager();
    }
    return RaycastManager.instance;
  }

  /**
   * Update raycast intersection testing
   * Runs on every 2-3 frames to maintain 60 FPS on mobile
   */
  public update(camera: THREE.Camera): void {
    this.frameCount++;
    if (this.frameCount % 2 !== 0) return; // 30Hz evaluation budget

    const store = useWorldStore.getState();
    const pointer = store.pointer;

    this.pointerVector.set(pointer.x, pointer.y);
    this.raycaster.setFromCamera(this.pointerVector, camera);

    const objects = worldEngine.getAllObjects();
    let closestObject: { id: string; distance: number } | null = null;

    for (const obj of objects) {
      // Bounding sphere intersection test against ray
      const sphere = new THREE.Sphere(obj.position, obj.radius);
      const intersectionPoint = new THREE.Vector3();

      if (this.raycaster.ray.intersectSphere(sphere, intersectionPoint)) {
        const dist = this.raycaster.ray.origin.distanceTo(intersectionPoint);
        if (!closestObject || dist < closestObject.distance) {
          closestObject = { id: obj.id, distance: dist };
        }
      }
    }

    if (closestObject) {
      worldEngine.setFocus(closestObject.id);
    } else {
      worldEngine.setFocus(null);
    }
  }

  /**
   * Execute interaction trigger on focused object
   */
  public handleInteraction(): boolean {
    const store = useWorldStore.getState();
    const focusedId = store.focusedObjectId;
    if (focusedId) {
      worldEngine.interactWith(focusedId);
      return true;
    }
    return false;
  }
}

export const raycastManager = RaycastManager.getInstance();
