import { create } from "zustand";

export type RealmId = "origin" | "forest" | "ocean" | "machine" | "void";
export type QualityTier = "ultra" | "high" | "medium" | "low" | "lite";
export type CameraMode = "cinematic" | "orbit" | "inspect" | "explore";
export type ReticleMode = "default" | "focus" | "interact" | "discovery";

export interface WorldState {
  currentRealm: RealmId;
  targetRealm: RealmId | null;
  transitionProgress: number;
  seed: number;
  cameraMode: CameraMode;
  quality: QualityTier;
  adaptiveQuality: boolean;
  reducedMotion: boolean;
  screenReaderAnnouncement: string;
  isLiteFallback: boolean;
  audioEnabled: boolean;
  audioVolume: number;
  isOpeningComplete: boolean;
  hasInteracted: boolean;
  showTelemetry: boolean;
  postProcessingEnabled: boolean;

  // Spatial Exploration State
  playerPosition: [number, number, number];
  playerVelocity: [number, number, number];
  moveInput: {
    forward: number; // -1 to 1 (W/S or Virtual Joystick Y)
    right: number;   // -1 to 1 (A/D or Virtual Joystick X)
    up: number;      // -1 to 1 (Space/Shift)
  };

  // Interaction Focus & Cursor Reticle
  focusedObjectId: string | null;
  reticleMode: ReticleMode;

  // Session Discovery Progress
  discoveries: {
    signals: string[];
    structures: string[];
    portals: string[];
  };

  // Machine Realm Multi-Stage Mechanical Chain Reaction
  machineState: {
    gearsEngaged: boolean;
    pistonsEngaged: boolean;
    capacitorEngaged: boolean;
    gatewayActive: boolean;
  };

  // Forest Realm Multi-Stage Biological Chain Reaction
  forestState: {
    bioCoreAwakened: boolean;
    myceliumPulsing: boolean;
    lotusBloom: boolean;
    portalActive: boolean;
  };
  
  // Interaction & Raycast Pointer
  pointer: {
    x: number; // Normalized -1 to 1
    y: number; // Normalized -1 to 1
    worldRay: [number, number, number];
    isDown: boolean;
  };

  // Pointer Velocity & Dynamics
  pointerVelocity: {
    vx: number;
    vy: number;
    speed: number;
  };

  // DeviceOrientation Gyroscope (Mobile)
  gyro: {
    gamma: number; // Left-to-right tilt (-90 to 90)
    beta: number;  // Front-to-back tilt (-180 to 180)
    active: boolean;
  };

  // Multi-Touch & Pinch Zoom State
  touch: {
    isTouching: boolean;
    touchCount: number;
    pinchDist: number;
  };

  // Camera Dolly Distance Offset (Zoom)
  dollyOffset: number;

  // Active Shockwave Impulse Wave
  shockwave: {
    center: [number, number, number];
    time: number;
    strength: number;
  };

  // Real-time telemetry metrics
  activeTelemetry: {
    fps: number;
    drawCalls: number;
    triangles: number;
    particleCount: number;
  };

  // Actions
  actions: {
    setRealm: (realm: RealmId) => void;
    setTargetRealm: (realm: RealmId | null) => void;
    setTransitionProgress: (progress: number) => void;
    setSeed: (seed: number) => void;
    randomizeSeed: () => void;
    setCameraMode: (mode: CameraMode) => void;
    setQuality: (quality: QualityTier) => void;
    toggleAdaptiveQuality: (enable?: boolean) => void;
    toggleLiteFallback: (force?: boolean) => void;
    togglePostProcessing: (enable?: boolean) => void;
    toggleAudio: (enable?: boolean) => void;
    setAudioVolume: (volume: number) => void;
    completeOpening: () => void;
    setHasInteracted: () => void;
    toggleTelemetry: () => void;
    updatePointer: (coords: Partial<WorldState["pointer"]>) => void;
    setPointerVelocity: (velocity: { vx: number; vy: number; speed: number }) => void;
    setGyro: (gyro: Partial<WorldState["gyro"]>) => void;
    setTouchState: (touch: Partial<WorldState["touch"]>) => void;
    setDollyOffset: (offset: number) => void;
    addDollyDelta: (delta: number) => void;
    triggerShockwave: (center?: [number, number, number], strength?: number) => void;
    setReducedMotion: (enable: boolean) => void;
    announce: (message: string) => void;
    updateTelemetry: (metrics: Partial<WorldState["activeTelemetry"]>) => void;
    setPlayerPosition: (pos: [number, number, number]) => void;
    setPlayerVelocity: (vel: [number, number, number]) => void;
    setMoveInput: (input: Partial<WorldState["moveInput"]>) => void;
    setFocusedObject: (id: string | null) => void;
    setReticleMode: (mode: ReticleMode) => void;
    addDiscovery: (id: string, type: string) => void;
    engageMachineGears: () => void;
    engageMachinePistons: () => void;
    engageMachineCapacitor: () => void;
    awakenBioCore: () => void;
    pulseMycelium: () => void;
    bloomSolarLotus: () => void;
  };
}

export const useWorldStore = create<WorldState>((set, get) => ({
  currentRealm: "origin",
  targetRealm: null,
  transitionProgress: 0,
  seed: 847291,
  cameraMode: "cinematic",
  quality: "high",
  adaptiveQuality: true,
  reducedMotion: false,
  postProcessingEnabled: true,
  screenReaderAnnouncement: "VOID Engine Initialized. Realm 01: ORIGIN.",
  isLiteFallback: false,
  audioEnabled: false,
  audioVolume: 0.7,
  isOpeningComplete: false,
  hasInteracted: false,
  showTelemetry: true,

  // Spatial Exploration State
  playerPosition: [0, 0, 7.5],
  playerVelocity: [0, 0, 0],
  moveInput: {
    forward: 0,
    right: 0,
    up: 0,
  },

  // Interaction Focus & Cursor Reticle
  focusedObjectId: null,
  reticleMode: "default",

  // Session Discovery Progress
  discoveries: {
    signals: [],
    structures: [],
    portals: [],
  },

  // Machine Realm Multi-Stage Mechanical Chain Reaction
  machineState: {
    gearsEngaged: false,
    pistonsEngaged: false,
    capacitorEngaged: false,
    gatewayActive: false,
  },

  // Forest Realm Multi-Stage Biological Chain Reaction
  forestState: {
    bioCoreAwakened: false,
    myceliumPulsing: false,
    lotusBloom: false,
    portalActive: false,
  },

  pointer: {
    x: 0,
    y: 0,
    worldRay: [0, 0, 0],
    isDown: false,
  },

  pointerVelocity: {
    vx: 0,
    vy: 0,
    speed: 0,
  },

  gyro: {
    gamma: 0,
    beta: 0,
    active: false,
  },

  touch: {
    isTouching: false,
    touchCount: 0,
    pinchDist: 0,
  },

  dollyOffset: 0,

  shockwave: {
    center: [0, 0, 0],
    time: 0,
    strength: 0,
  },

  activeTelemetry: {
    fps: 60,
    drawCalls: 12,
    triangles: 48200,
    particleCount: 25000,
  },

  actions: {
    setRealm: (realm) => set({ currentRealm: realm, targetRealm: null, transitionProgress: 0 }),
    setTargetRealm: (realm) => set({ targetRealm: realm }),
    setTransitionProgress: (progress) => set({ transitionProgress: progress }),
    setSeed: (seed) => set({ seed }),
    randomizeSeed: () => set({ seed: Math.floor(100000 + Math.random() * 900000) }),
    setCameraMode: (mode) => set({ cameraMode: mode }),
    setQuality: (quality) => {
      const isLite = quality === "lite";
      set({ quality, isLiteFallback: isLite });
    },
    toggleAdaptiveQuality: (enable) =>
      set((state) => ({
        adaptiveQuality: enable !== undefined ? enable : !state.adaptiveQuality,
      })),
    toggleLiteFallback: (force) =>
      set((state) => ({
        isLiteFallback: force !== undefined ? force : !state.isLiteFallback,
        quality: (force !== undefined ? force : !state.isLiteFallback) ? "lite" : "high",
      })),
    togglePostProcessing: (enable) =>
      set((state) => ({
        postProcessingEnabled: enable !== undefined ? enable : !state.postProcessingEnabled,
      })),
    toggleAudio: (enable) =>
      set((state) => ({
        audioEnabled: enable !== undefined ? enable : !state.audioEnabled,
      })),
    setAudioVolume: (volume) => set({ audioVolume: Math.max(0, Math.min(1, volume)) }),
    completeOpening: () => set({ isOpeningComplete: true, hasInteracted: true }),
    setHasInteracted: () => set({ hasInteracted: true }),
    toggleTelemetry: () => set((state) => ({ showTelemetry: !state.showTelemetry })),
    updatePointer: (coords) =>
      set((state) => ({
        pointer: { ...state.pointer, ...coords },
      })),
    setPointerVelocity: (velocity) => set({ pointerVelocity: velocity }),
    setGyro: (gyro) =>
      set((state) => ({
        gyro: { ...state.gyro, ...gyro },
      })),
    setTouchState: (touch) =>
      set((state) => ({
        touch: { ...state.touch, ...touch },
      })),
    setDollyOffset: (offset) =>
      set({ dollyOffset: Math.max(-4.5, Math.min(12.0, offset)) }),
    addDollyDelta: (delta) =>
      set((state) => ({
        dollyOffset: Math.max(-4.5, Math.min(12.0, state.dollyOffset + delta)),
      })),
    triggerShockwave: (center = [0, 0, 0], strength = 1.0) =>
      set({
        shockwave: {
          center,
          time: typeof performance !== "undefined" ? performance.now() * 0.001 : 0,
          strength,
        },
      }),
    setReducedMotion: (enable) => set({ reducedMotion: enable }),
    announce: (message) => set({ screenReaderAnnouncement: message }),
    updateTelemetry: (metrics) =>
      set((state) => ({
        activeTelemetry: { ...state.activeTelemetry, ...metrics },
      })),
    setPlayerPosition: (pos) => set({ playerPosition: pos }),
    setPlayerVelocity: (vel) => set({ playerVelocity: vel }),
    setMoveInput: (input) =>
      set((state) => ({
        moveInput: { ...state.moveInput, ...input },
      })),
    setFocusedObject: (id) =>
      set((state) => ({
        focusedObjectId: id,
        reticleMode: id ? "focus" : state.reticleMode === "focus" ? "default" : state.reticleMode,
      })),
    setReticleMode: (mode) => set({ reticleMode: mode }),
    addDiscovery: (id, type) =>
      set((state) => {
        const key = type === "portal" ? "portals" : type === "structure" || type === "core" ? "structures" : "signals";
        if (state.discoveries[key].includes(id)) return state;
        return {
          discoveries: {
            ...state.discoveries,
            [key]: [...state.discoveries[key], id],
          },
        };
      }),
    engageMachineGears: () =>
      set((state) => ({
        machineState: { ...state.machineState, gearsEngaged: true },
      })),
    engageMachinePistons: () =>
      set((state) => ({
        machineState: { ...state.machineState, pistonsEngaged: true },
      })),
    engageMachineCapacitor: () =>
      set((state) => ({
        machineState: { ...state.machineState, capacitorEngaged: true, gatewayActive: true },
      })),
    awakenBioCore: () =>
      set((state) => ({
        forestState: { ...state.forestState, bioCoreAwakened: true },
      })),
    pulseMycelium: () =>
      set((state) => ({
        forestState: { ...state.forestState, myceliumPulsing: true },
      })),
    bloomSolarLotus: () =>
      set((state) => ({
        forestState: { ...state.forestState, lotusBloom: true, portalActive: true },
      })),
  },
}));
