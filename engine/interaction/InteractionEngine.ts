import { useWorldStore, RealmId } from "../state/useWorldStore";
import { transitionManager } from "../transition/TransitionManager";
import { audioEngine } from "../audio/AudioSynthesizer";

const REALM_CYCLE: RealmId[] = ["origin", "forest", "ocean", "machine", "void"];

/**
 * VOID Multi-Modal Interaction Engine
 * Manages continuous pointer velocity tracking, multi-touch gestures (pinch dolly, swipe paging),
 * mobile DeviceOrientation gyroscopic parallax, and physical click/tap shockwave impulses.
 */
export class InteractionEngine {
  private static instance: InteractionEngine | null = null;

  // Pointer velocity tracking
  private lastX: number = 0;
  private lastY: number = 0;
  private lastTime: number = 0;
  private vx: number = 0;
  private vy: number = 0;

  // Touch tracking for pinch & swipe
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private initialPinchDist: number = 0;
  private isMultiTouch: boolean = false;

  // Gyroscope tracking
  private gyroActive: boolean = false;
  private targetGamma: number = 0; // Roll (-90 to 90)
  private targetBeta: number = 0;  // Pitch (-180 to 180)
  private smoothGamma: number = 0;
  private smoothBeta: number = 0;
  private isGyroListening: boolean = false;

  public static getInstance(): InteractionEngine {
    if (!InteractionEngine.instance) {
      InteractionEngine.instance = new InteractionEngine();
    }
    return InteractionEngine.instance;
  }

  /**
   * Continuous pointer move handler with velocity computation
   */
  public handlePointerMove(clientX: number, clientY: number, rect: DOMRect) {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const dt = Math.max(1, now - this.lastTime);

    // Compute instantaneous velocity in pixels per second
    const rawVx = ((clientX - this.lastX) / dt) * 1000;
    const rawVy = ((clientY - this.lastY) / dt) * 1000;

    // Exponential smoothing filter for velocity
    this.vx = this.vx * 0.75 + rawVx * 0.25;
    this.vy = this.vy * 0.75 + rawVy * 0.25;
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

    this.lastX = clientX;
    this.lastY = clientY;
    this.lastTime = now;

    const store = useWorldStore.getState();
    store.actions.setPointerVelocity({ vx: this.vx, vy: this.vy, speed });

    // Normalized coordinates (-1 to 1)
    const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const normY = -(((clientY - rect.top) / rect.height) * 2 - 1);
    store.actions.updatePointer({ x: normX, y: normY });
  }

  /**
   * Pointer down handler
   */
  public handlePointerDown(clientX: number, clientY: number) {
    this.lastX = clientX;
    this.lastY = clientY;
    this.lastTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.vx = 0;
    this.vy = 0;

    const store = useWorldStore.getState();
    store.actions.updatePointer({ isDown: true });
    store.actions.setHasInteracted();

    // Auto-request gyro permission on user interaction if not yet started
    this.initDeviceOrientation();
  }

  /**
   * Pointer up handler
   */
  public handlePointerUp() {
    const store = useWorldStore.getState();
    store.actions.updatePointer({ isDown: false });
  }

  /**
   * Triggers a shockwave impulse in 3D space and sounds procedural resonant transient
   */
  public triggerShockwave(normX: number, normY: number, strength: number = 1.0) {
    // Unproject approx world position based on camera depth
    const worldX = normX * 4.2;
    const worldY = normY * 3.2;
    const worldZ = 0;

    const store = useWorldStore.getState();
    store.actions.triggerShockwave([worldX, worldY, worldZ], strength);

    // Trigger acoustic physics impulse sweep
    audioEngine.triggerShockwaveImpulse(strength);
  }

  /**
   * Multi-touch start handler
   */
  public handleTouchStart(e: React.TouchEvent<HTMLElement>) {
    const touches = e.touches;
    const store = useWorldStore.getState();
    store.actions.setTouchState({ isTouching: true, touchCount: touches.length });

    if (touches.length === 1) {
      this.isMultiTouch = false;
      this.touchStartX = touches[0].clientX;
      this.touchStartY = touches[0].clientY;
      this.touchStartTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    } else if (touches.length >= 2) {
      this.isMultiTouch = true;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      this.initialPinchDist = Math.sqrt(dx * dx + dy * dy);
    }
  }

  /**
   * Multi-touch move handler (pinch dolly zoom)
   */
  public handleTouchMove(e: React.TouchEvent<HTMLElement>) {
    const touches = e.touches;
    if (touches.length >= 2 && this.isMultiTouch) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const currentDist = Math.sqrt(dx * dx + dy * dy);

      if (this.initialPinchDist > 0) {
        // Delta distance maps to camera dolly zoom
        const delta = (currentDist - this.initialPinchDist) * 0.025;
        const store = useWorldStore.getState();
        store.actions.addDollyDelta(delta);
        this.initialPinchDist = currentDist;
      }
    }
  }

  /**
   * Multi-touch end handler (swipe realm paging)
   */
  public handleTouchEnd(e: React.TouchEvent<HTMLElement>) {
    const store = useWorldStore.getState();
    const touches = e.touches;
    store.actions.setTouchState({ isTouching: touches.length > 0, touchCount: touches.length });

    if (!this.isMultiTouch && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - this.touchStartX;
      const deltaY = touch.clientY - this.touchStartY;
      const dt = Math.max(1, (typeof performance !== "undefined" ? performance.now() : Date.now()) - this.touchStartTime);

      const vx = (deltaX / dt) * 1000; // px/s
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;

      // Swipe detected: threshold 600px/s or displacement > 90px
      if (isHorizontalSwipe && (Math.abs(vx) > 600 || Math.abs(deltaX) > 90)) {
        this.handleSwipeNavigation(deltaX < 0 ? "next" : "prev");
      }
    }

    if (touches.length === 0) {
      this.initialPinchDist = 0;
      this.isMultiTouch = false;
    }
  }

  /**
   * Wheel / Trackpad dolly zoom delta
   */
  public handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    const delta = Math.max(-1.5, Math.min(1.5, e.deltaY * 0.005));
    useWorldStore.getState().actions.addDollyDelta(delta);
  }

  /**
   * Horizontal swipe realm navigation
   */
  private handleSwipeNavigation(direction: "next" | "prev") {
    if (transitionManager.getIsTransitioning()) return;

    const currentRealm = useWorldStore.getState().currentRealm;
    const currentIndex = REALM_CYCLE.indexOf(currentRealm);
    let nextIndex: number;

    if (direction === "next") {
      nextIndex = (currentIndex + 1) % REALM_CYCLE.length;
    } else {
      nextIndex = (currentIndex - 1 + REALM_CYCLE.length) % REALM_CYCLE.length;
    }

    transitionManager.transitionTo(REALM_CYCLE[nextIndex]);
  }

  /**
   * Initialize DeviceOrientation Gyroscope listener
   */
  public initDeviceOrientation() {
    if (this.isGyroListening || typeof window === "undefined") return;

    // iOS 13+ permission request
    const DeviceOrientation = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };

    if (typeof DeviceOrientation?.requestPermission === "function") {
      DeviceOrientation.requestPermission()
        .then((response) => {
          if (response === "granted") {
            this.bindOrientationListener();
          }
        })
        .catch(() => {
          // Graceful fallback to mouse/touch parallax
        });
    } else if ("DeviceOrientationEvent" in window) {
      this.bindOrientationListener();
    }
  }

  private bindOrientationListener() {
    this.isGyroListening = true;
    window.addEventListener(
      "deviceorientation",
      (e: DeviceOrientationEvent) => {
        if (e.gamma === null && e.beta === null) return;

        this.gyroActive = true;
        // Gamma: tilt left/right (-90 to 90) -> clamp to -45 to 45
        this.targetGamma = Math.max(-45, Math.min(45, e.gamma || 0));
        // Beta: tilt front/back (-180 to 180) -> clamp to -45 to 45
        this.targetBeta = Math.max(-45, Math.min(45, e.beta || 0));

        // Smooth orientation values
        this.smoothGamma += (this.targetGamma - this.smoothGamma) * 0.15;
        this.smoothBeta += (this.targetBeta - this.smoothBeta) * 0.15;

        useWorldStore.getState().actions.setGyro({
          gamma: this.smoothGamma,
          beta: this.smoothBeta,
          active: true,
        });
      },
      { passive: true }
    );
  }

  /**
   * Update loop for physics & decay
   */
  public updateDecay() {
    this.vx *= 0.92;
    this.vy *= 0.92;
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 0.1) {
      useWorldStore.getState().actions.setPointerVelocity({ vx: this.vx, vy: this.vy, speed });
    }
  }
}

export const interactionEngine = InteractionEngine.getInstance();
