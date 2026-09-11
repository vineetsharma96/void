"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { worldEngine } from "@/engine/world/WorldEngine";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { SpatialLabel } from "@/components/canvas/SpatialLabel";

interface SolarLotusProps {
  position?: [number, number, number];
}

export function SolarLotus({ position = [7.8, -1.0, 3.8] }: SolarLotusProps) {
  const forestState = useWorldStore((s) => s.forestState);
  const bloomSolarLotus = useWorldStore((s) => s.actions.bloomSolarLotus);
  const addDiscovery = useWorldStore((s) => s.actions.addDiscovery);
  const triggerShockwave = useWorldStore((s) => s.actions.triggerShockwave);

  const coreRef = useRef<THREE.Mesh>(null);
  const petalsGroupRef = useRef<THREE.Group>(null);
  const beaconLightRef = useRef<THREE.PointLight>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const lockAlertRef = useRef(0);
  const bloomAnimRef = useRef(0); // 0 (closed bud) to 1.0 (bloomed)

  const canActivate = forestState.myceliumPulsing;
  const isBloomed = forestState.lotusBloom;

  const handleInteract = () => {
    if (!canActivate) {
      lockAlertRef.current = 1.0;
      audioEngine.triggerClickFoley();
      return;
    }

    if (!isBloomed) {
      bloomSolarLotus();
      addDiscovery("station_03_lotus", "structure");
      triggerShockwave([position[0], position[1] + 0.65, position[2]], 3.0);
      audioEngine.triggerLotusBloom();
    } else {
      audioEngine.triggerLotusBloom();
    }
  };

  // 1. Procedural Curved Petal Geometry
  const petalGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.35, 0.6, 0.28, 1.4);
    shape.quadraticCurveTo(0, 1.8, -0.28, 1.4);
    shape.quadraticCurveTo(-0.35, 0.6, 0, 0);

    const geom = new THREE.ShapeGeometry(shape, 8);
    const pos = geom.attributes.position;
    // Add parabolic curvature along the petal length
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const zCurve = -Math.pow(y / 1.8, 1.8) * 0.45;
      pos.setZ(i, zCurve);
    }
    geom.computeVertexNormals();
    return geom;
  }, []);

  // 2. Fibonacci Phyllotaxis Petal Matrices (34 petals total: 21 outer, 13 inner)
  const { petalConfigs } = useMemo(() => {
    const configs: Array<{
      position: THREE.Vector3;
      rotation: THREE.Euler;
      scale: number;
      tier: "inner" | "outer";
      basePitch: number;
      targetPitch: number;
    }> = [];

    const goldenAngle = 137.507764 * (Math.PI / 180);
    const totalPetals = 34;

    for (let i = 0; i < totalPetals; i++) {
      const isInner = i < 13;
      const radius = isInner ? 0.35 + (i / 13) * 0.45 : 0.85 + ((i - 13) / 21) * 0.75;
      const angle = i * goldenAngle;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = isInner ? 0.15 : 0.05;

      const basePitch = isInner ? 0.45 : 0.35; // Closed inward
      const targetPitch = isInner ? 1.05 : 1.35; // Bloomed outward flare

      configs.push({
        position: new THREE.Vector3(x, y, z),
        rotation: new THREE.Euler(0, -angle + Math.PI / 2, 0),
        scale: isInner ? 0.85 : 1.15,
        tier: isInner ? "inner" : "outer",
        basePitch,
        targetPitch,
      });
    }

    return { petalConfigs: configs };
  }, []);

  // Register Stamen Core with WorldEngine
  useEffect(() => {
    worldEngine.registerObject({
      id: "station_03_lotus",
      name: "PHYLLOTAXIS SOLAR LOTUS",
      type: "structure",
      position: new THREE.Vector3(position[0], position[1] + 0.65, position[2]),
      radius: 4.5,
      proximityThresholds: {
        aware: 9.5,
        active: 5.0,
      },
      state: isBloomed ? "unlocked" : "dormant",
    });

    return () => {
      worldEngine.unregisterObject("station_03_lotus");
    };
  }, [isBloomed, position]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (lockAlertRef.current > 0) {
      lockAlertRef.current = Math.max(0, lockAlertRef.current - delta * 2.0);
    }

    // Smooth petal blooming transition
    const targetBloom = isBloomed ? 1.0 : 0.0;
    bloomAnimRef.current = THREE.MathUtils.lerp(bloomAnimRef.current, targetBloom, delta * 2.0);

    // Animate petals unfolding
    if (petalsGroupRef.current) {
      petalsGroupRef.current.children.forEach((child, idx) => {
        const cfg = petalConfigs[idx];
        if (!cfg) return;
        const currentPitch = THREE.MathUtils.lerp(cfg.basePitch, cfg.targetPitch, bloomAnimRef.current);
        child.rotation.x = currentPitch;
      });
    }

    // Core levitation & spin
    if (coreRef.current) {
      coreRef.current.position.y = 0.65 + bloomAnimRef.current * 0.45 + Math.sin(t * 2.0) * 0.06;
      coreRef.current.rotation.y += delta * (isBloomed ? 1.8 : 0.5);
    }

    // Skyward Beacon Light Beam
    if (beamRef.current) {
      beamRef.current.visible = bloomAnimRef.current > 0.05;
      const mat = beamRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = bloomAnimRef.current * (0.45 + Math.sin(t * 3.5) * 0.15);
      }
    }

    // Beacon point light
    if (beaconLightRef.current) {
      const targetIntensity = isBloomed ? 4.5 : canActivate ? 1.6 : 0.4;
      beaconLightRef.current.intensity = THREE.MathUtils.lerp(
        beaconLightRef.current.intensity,
        targetIntensity,
        delta * 3.0
      );
      beaconLightRef.current.color.set(
        lockAlertRef.current > 0
          ? "#ff2200"
          : isBloomed
          ? "#28f0dc"
          : canActivate
          ? "#2eed86"
          : "#0d2b1c"
      );
    }
  });

  return (
    <group position={position}>
      {/* Sunken Stone Basin Pedestal */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[2.2, 2.6, 0.45, 24]} />
        <meshStandardMaterial color="#0f1612" roughness={0.9} metalness={0.2} />
      </mesh>

      {/* Group of 34 Mathematical Petals */}
      <group ref={petalsGroupRef} position={[0, 0.05, 0]}>
        {petalConfigs.map((cfg, idx) => (
          <group
            key={idx}
            position={[cfg.position.x, cfg.position.y, cfg.position.z]}
            rotation={[0, cfg.rotation.y, 0]}
          >
            <mesh geometry={petalGeometry} scale={cfg.scale}>
              <meshStandardMaterial
                color="#0c251a"
                emissive={
                  lockAlertRef.current > 0
                    ? "#ff2200"
                    : isBloomed
                    ? "#28f0dc"
                    : canActivate
                    ? "#2eed86"
                    : "#06180f"
                }
                emissiveIntensity={
                  lockAlertRef.current > 0
                    ? 2.5
                    : isBloomed
                    ? 1.4
                    : canActivate
                    ? 0.65
                    : 0.1
                }
                roughness={0.45}
                metalness={0.7}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Center Golden Ratio Stamen Crystal (Clickable Target) */}
      <mesh
        ref={coreRef}
        position={[0, 0.65, 0]}
        onClick={(e) => {
          e.stopPropagation();
          handleInteract();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          worldEngine.setFocus("station_03_lotus");
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          if (useWorldStore.getState().focusedObjectId === "station_03_lotus") {
            worldEngine.setFocus(null);
          }
        }}
      >
        <octahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color="#062215"
          emissive={
            lockAlertRef.current > 0
              ? "#ff2200"
              : isBloomed
              ? "#28f0dc"
              : canActivate
              ? "#2eed86"
              : "#0c301d"
          }
          emissiveIntensity={
            lockAlertRef.current > 0 ? 3.0 : isBloomed ? 2.8 : canActivate ? 1.4 : 0.2
          }
          metalness={0.92}
          roughness={0.12}
        />
      </mesh>

      {/* Skyward Celestial Light Column Beam */}
      <mesh ref={beamRef} position={[0, 8.0, 0]}>
        <cylinderGeometry args={[0.25, 0.75, 16.0, 16, 1, true]} />
        <meshBasicMaterial
          color="#28f0dc"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Beacon Point Light */}
      <pointLight
        ref={beaconLightRef}
        position={[0, 1.2, 0]}
        color={isBloomed ? "#28f0dc" : "#2eed86"}
        intensity={1.2}
        distance={18}
      />

      {/* In-World Spatial Readout */}
      <SpatialLabel
        text="STATION 03 // SOLAR LOTUS"
        subtext={
          lockAlertRef.current > 0
            ? "ACCESS DENIED // HARMONIZE STAGE 02 FIRST"
            : isBloomed
            ? "CANOPY BEACON ACTIVE // OCEAN CONDUIT OPEN"
            : canActivate
            ? "READY // CLICK TO UNFURL LOTUS"
            : "LOCKED // REQUIRES STAGE 02 (MYCELIUM RING)"
        }
        position={[0, 2.5, 0]}
        color={
          lockAlertRef.current > 0
            ? "#ff3333"
            : isBloomed
            ? "#28f0dc"
            : canActivate
            ? "#2eed86"
            : "#64748b"
        }
        distanceFade={[2.0, 16.0]}
      />
    </group>
  );
}
