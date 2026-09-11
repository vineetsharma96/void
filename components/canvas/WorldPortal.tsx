"use client";

import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore, RealmId } from "@/engine/state/useWorldStore";
import { worldEngine } from "@/engine/world/WorldEngine";
import { transitionManager } from "@/engine/transition/TransitionManager";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { SpatialLabel } from "./SpatialLabel";

interface WorldPortalProps {
  id: string;
  name: string;
  targetRealm: RealmId;
  position: [number, number, number];
  color?: string;
  locked?: boolean;
  lockedSubtext?: string;
}

export function WorldPortal({
  id,
  name,
  targetRealm,
  position,
  color = "#28f0dc",
  locked = false,
  lockedSubtext = "LOCKED // REQUIRES POWER",
}: WorldPortalProps) {
  const portalGroupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const vortexRef = useRef<THREE.Mesh>(null);

  const [isCharged, setIsCharged] = useState(false);
  const [proximityDistance, setProximityDistance] = useState(999);
  const [lockAlert, setLockAlert] = useState(false);
  const triggerShockwave = useWorldStore((s) => s.actions.triggerShockwave);

  const executeTransition = useCallback(() => {
    if (locked) {
      setLockAlert(true);
      setTimeout(() => setLockAlert(false), 1200);
      audioEngine.triggerClickFoley();
      triggerShockwave(position, 0.8);
      return;
    }

    if (!transitionManager.getIsTransitioning()) {
      audioEngine.triggerRealmTransition();
      transitionManager.transitionTo(targetRealm);
      triggerShockwave(position, 2.8);
    }
  }, [locked, position, targetRealm, triggerShockwave]);

  const handleInteract = useCallback(() => {
    if (locked) {
      setLockAlert(true);
      setTimeout(() => setLockAlert(false), 1200);
      audioEngine.triggerClickFoley();
      return;
    }

    setIsCharged(true);
    triggerShockwave(position, 1.8);
    audioEngine.triggerShockwaveImpulse(1.4);
    worldEngine.setObjectState(id, "unlocked");
  }, [id, locked, position, triggerShockwave]);

  // Register interactive portal with WorldEngine
  useEffect(() => {
    const portalPos = new THREE.Vector3(...position);
    worldEngine.registerObject({
      id,
      name,
      type: "portal",
      position: portalPos,
      radius: 2.2,
      proximityThresholds: {
        aware: 9.0,
        active: 4.0,
      },
      state: "dormant",
      onAware: (dist) => {
        setProximityDistance(dist);
      },
      onLeaveAware: () => {
        setProximityDistance(999);
      },
      onInteract: handleInteract,
    });

    return () => {
      worldEngine.unregisterObject(id);
    };
  }, [id, name, position, handleInteract]);

  useFrame((state, delta) => {
    if (!portalGroupRef.current) return;

    const time = state.clock.elapsedTime;
    const isAware = proximityDistance < 9.0;
    const speedMult = locked ? 0.25 : isCharged ? 3.5 : isAware ? 1.8 : 0.8;

    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.6 * speedMult;
      ring1Ref.current.rotation.x = Math.sin(time * 0.8) * 0.15;
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.9 * speedMult;
      ring2Ref.current.rotation.y = Math.cos(time * 0.7) * 0.18;
    }

    if (vortexRef.current) {
      vortexRef.current.rotation.z += delta * 1.5 * speedMult;
      const pulse = 1.0 + Math.sin(time * 3.0) * (locked ? 0.05 : isCharged ? 0.25 : 0.1);
      vortexRef.current.scale.setScalar(pulse);
    }

    // Check if explorer walks directly into active portal
    const playerPos = useWorldStore.getState().playerPosition;
    const distToPlayer = new THREE.Vector3(...position).distanceTo(
      new THREE.Vector3(...playerPos)
    );

    if (distToPlayer < 1.45) {
      executeTransition();
    }
  });

  const portalColor = useMemo(() => new THREE.Color(color), [color]);

  return (
    <group
      ref={portalGroupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (!locked) {
          executeTransition();
        } else {
          handleInteract();
        }
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        worldEngine.setFocus(id);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (useWorldStore.getState().focusedObjectId === id) {
          worldEngine.setFocus(null);
        }
      }}
    >
      {/* Outer Torus Gyro Ring */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.65, 0.055, 16, 64]} />
        <meshBasicMaterial
          color={lockAlert ? "#ff2200" : portalColor}
          wireframe={true}
          transparent={true}
          opacity={locked ? 0.3 : isCharged ? 0.95 : 0.6}
        />
      </mesh>

      {/* Inner Counter-Rotating Hexagonal Ring */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.3, 0.045, 6, 48]} />
        <meshBasicMaterial
          color={lockAlert ? "#ff4400" : locked ? "#64748b" : "#ffffff"}
          wireframe={true}
          transparent={true}
          opacity={locked ? 0.25 : isCharged ? 0.95 : 0.55}
        />
      </mesh>

      {/* Central Gravitational Event Horizon Disc */}
      <mesh ref={vortexRef}>
        <circleGeometry args={[1.15, 48]} />
        <meshBasicMaterial
          color={lockAlert ? "#ff2200" : locked ? "#06090e" : isCharged ? "#28f0dc" : color}
          transparent={true}
          opacity={locked ? 0.4 : isCharged ? 0.95 : 0.75}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Holographic In-World Spatial Tag */}
      <SpatialLabel
        text={`PORTAL // ${name}`}
        subtext={
          lockAlert
            ? "ACCESS DENIED // POWER COUPLING INCOMPLETE"
            : locked
            ? lockedSubtext
            : isCharged
            ? "READY // CLICK OR WALK IN"
            : "ACTIVE // WALK IN TO TRANSIT"
        }
        position={[0, 2.25, 0]}
        color={lockAlert ? "#ff3333" : locked ? "#64748b" : isCharged ? "#28f0dc" : color}
        distanceFade={[1.5, 15.0]}
      />
    </group>
  );
}
