"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { ProceduralTerrainEngine } from "@/procedural/terrain/TerrainEngine";
import { ProceduralVegetationEngine } from "@/procedural/vegetation/VegetationEngine";
import { terrainVertexShader, terrainFragmentShader } from "@/shaders/terrain/terrain.glsl";
import { ProceduralMaterials } from "@/procedural/materials/ProceduralMaterials";
import { ProceduralParticleEngine } from "@/procedural/particles/ParticleEngine";

import { MotherTree } from "./MotherTree";
import { MyceliumRing } from "./MyceliumRing";
import { SolarLotus } from "./SolarLotus";
import { WorldPortal } from "@/components/canvas/WorldPortal";
import { EnergyConduit } from "@/components/canvas/EnergyConduit";

export function ForestWorld() {
  const seed = useWorldStore((s) => s.seed);
  const pointer = useWorldStore((s) => s.pointer);
  const quality = useWorldStore((s) => s.quality);
  const forestState = useWorldStore((s) => s.forestState);

  const forestGroupRef = useRef<THREE.Group>(null);
  const foliageMeshRef = useRef<THREE.InstancedMesh>(null);
  const foliageMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const terrainMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const sporesRef = useRef<THREE.Points>(null);

  const isMobile =
    typeof window !== "undefined" &&
    (window.innerWidth < 768 || /Android|iPhone|iPad/i.test(navigator.userAgent));

  // 1. Generate Procedural Terrain (optimized subdivisions)
  const terrainGeometry = useMemo(() => {
    const segments = isMobile ? 48 : quality === "ultra" ? 90 : quality === "high" ? 64 : 48;
    return ProceduralTerrainEngine.generateGeometry({
      width: 48,
      depth: 48,
      segmentsX: segments,
      segmentsZ: segments,
      heightScale: 3.8,
      frequency: 0.055,
      octaves: isMobile ? 3 : 4,
      seed,
    });
  }, [seed, quality, isMobile]);

  // Terrain Shader Material
  const terrainMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSeed: { value: seed },
        uColorAbyss: { value: new THREE.Color("#04070a") },
        uColorRock: { value: new THREE.Color("#131922") },
        uColorMoss: { value: new THREE.Color("#0c2e1f") },
        uColorEnergy: { value: new THREE.Color("#38ef7d") },
      },
      wireframe: false,
    });
  }, [seed]);

  // 2. Generate Procedural Tree Species & Canopy Groves
  // Merged into a SINGLE static draw call to prevent mobile GPU stalls
  const { mergedForestTrunks, allFoliageMatrices, totalFoliageCount } = useMemo(() => {
    const treeCount = isMobile ? 5 : quality === "ultra" ? 12 : quality === "high" ? 8 : 5;
    const trunkGeometries: THREE.BufferGeometry[] = [];
    const foliageMats: THREE.Matrix4[] = [];

    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2;
      const radius = 4.5 + ((i * 137.5) % 14);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = ProceduralTerrainEngine.getHeight(x, z, { seed, heightScale: 3.8, frequency: 0.055 });

      const treeData = ProceduralVegetationEngine.generateTree({
        seed: seed + i * 1009,
        height: 3.6 + ((i * 37) % 2.0),
        trunkRadius: 0.2 + ((i * 19) % 0.1),
        branchingAngle: 0.52 + ((i * 23) % 0.15),
        recursionDepth: isMobile ? 2 : quality === "ultra" ? 3 : 2,
        branchesPerLevel: 2,
        foliageDensity: isMobile ? 4 : quality === "low" ? 4 : 8,
      });

      // Transform tree branches into world coordinates
      const worldTransform = new THREE.Matrix4().makeTranslation(x, y, z);
      const rotY = new THREE.Matrix4().makeRotationY((i * 73) % (Math.PI * 2));
      worldTransform.multiply(rotY);

      treeData.branchGeometry.applyMatrix4(worldTransform);
      trunkGeometries.push(treeData.branchGeometry);

      // Offset foliage instances into world coordinates
      for (const fMat of treeData.foliageTransforms) {
        const combined = worldTransform.clone().multiply(fMat);
        foliageMats.push(combined);
      }
    }

    // Merge all tree trunks into ONE single BufferGeometry (1 draw call!)
    let merged = new THREE.BufferGeometry();
    if (trunkGeometries.length > 0) {
      let totalPos = 0;
      let totalNorm = 0;
      let totalIdx = 0;

      for (const g of trunkGeometries) {
        totalPos += g.attributes.position.count * 3;
        if (g.attributes.normal) totalNorm += g.attributes.normal.count * 3;
        if (g.index) totalIdx += g.index.count;
      }

      const mPos = new Float32Array(totalPos);
      const mNorm = new Float32Array(totalNorm);
      const mIdx = totalIdx > 65535 ? new Uint32Array(totalIdx) : new Uint16Array(totalIdx);

      let pOffset = 0;
      let nOffset = 0;
      let iCounter = 0;

      for (const g of trunkGeometries) {
        const pos = g.attributes.position.array;
        mPos.set(pos, pOffset);

        if (g.attributes.normal) {
          mNorm.set(g.attributes.normal.array, nOffset);
          nOffset += g.attributes.normal.array.length;
        }

        if (g.index) {
          const idx = g.index.array;
          const vOffset = pOffset / 3;
          for (let k = 0; k < idx.length; k++) {
            mIdx[iCounter++] = idx[k] + vOffset;
          }
        }

        pOffset += pos.length;
        g.dispose();
      }

      merged.setAttribute("position", new THREE.BufferAttribute(mPos, 3));
      if (totalNorm > 0) merged.setAttribute("normal", new THREE.BufferAttribute(mNorm, 3));
      if (totalIdx > 0) merged.setIndex(new THREE.BufferAttribute(mIdx, 1));
    }

    return {
      mergedForestTrunks: merged,
      allFoliageMatrices: foliageMats,
      totalFoliageCount: foliageMats.length,
    };
  }, [seed, quality, isMobile]);

  // Foliage instanced mesh setup
  const foliageGeometry = useMemo(() => new THREE.DodecahedronGeometry(0.35, 0), []);
  const foliageMaterial = useMemo(
    () => ProceduralMaterials.createBioluminescentFoliageMaterial("#072216", "#2eed86"),
    []
  );

  // 3. Bio-luminescent Drifting Spores / Pollen Particles
  const sporeCount = isMobile ? 1200 : quality === "ultra" ? 6000 : 2800;
  const sporeGeometry = useMemo(() => {
    return ProceduralParticleEngine.createParticleBuffer(sporeCount, 18, 12);
  }, [sporeCount]);

  const sporeMaterial = useMemo(() => {
    return ProceduralParticleEngine.createMaterial({
      behavior: "curl",
      colorCore: "#2eed86", // Bioluminescent green
      colorEdge: "#c8f0ee", // Ethereal cyan
      speed: 0.7,
      seed,
    });
  }, [seed]);

  useFrame((state, delta) => {
    // Update terrain shader time
    if (terrainMaterialRef.current) {
      terrainMaterialRef.current.uniforms.uTime.value += delta;
    }

    // Update foliage shader wind sway and glow
    if (foliageMaterialRef.current) {
      foliageMaterialRef.current.uniforms.uTime.value += delta;
    }

    // Update spore particles
    if (sporesRef.current) {
      const mat = sporesRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms) {
        mat.uniforms.uTime.value += delta;
        mat.uniforms.uPointer.value.set(pointer.x * 12, 1.5 + pointer.y * 6, 0);
        mat.uniforms.uPointerDown.value = pointer.isDown ? 1 : 0;
      }
    }

    // Forest grove subtle breathing reaction to pointer
    if (forestGroupRef.current) {
      forestGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        forestGroupRef.current.rotation.y,
        pointer.x * 0.15,
        0.04
      );
    }
  });

  return (
    <group ref={forestGroupRef}>
      {/* Procedural Terrain Surface */}
      <mesh geometry={terrainGeometry} position={[0, -1.5, 0]}>
        <primitive object={terrainMaterial} ref={terrainMaterialRef} attach="material" />
      </mesh>

      {/* Recursive Procedural Tree Trunks & Branches — Unified Single Draw Call */}
      {mergedForestTrunks && (
        <mesh geometry={mergedForestTrunks}>
          <meshStandardMaterial
            color="#141920"
            roughness={0.85}
            metalness={0.15}
          />
        </mesh>
      )}

      {/* Instanced Canopy Leaves with Subsurface Wind & Glow */}
      <instancedMesh
        ref={foliageMeshRef}
        args={[foliageGeometry, undefined, totalFoliageCount]}
        onUpdate={(self) => {
          allFoliageMatrices.forEach((matrix, i) => self.setMatrixAt(i, matrix));
          self.instanceMatrix.needsUpdate = true;
        }}
      >
        <primitive object={foliageMaterial} ref={foliageMaterialRef} attach="material" />
      </instancedMesh>

      {/* Drifting Bio-luminescent Spores */}
      <points ref={sporesRef} geometry={sporeGeometry} material={sporeMaterial} position={[0, 2, 0]} />

      {/* Station 01: Ancient Mother Tree & Bio-Core */}
      <MotherTree />

      {/* Station 02: Fibonacci Mycelium Fungal Ring */}
      <MyceliumRing position={[-6.8, -1.2, 3.5]} />

      {/* Station 03: Sunken Phyllotaxis Solar Lotus */}
      <SolarLotus position={[7.2, -1.1, 3.2]} />

      {/* Procedural Bioluminescent Energy Conduits */}
      {/* Station 01 (Mother Tree) -> Station 02 (Mycelium Ring) */}
      <EnergyConduit
        start={[0, -0.6, 0]}
        end={[-6.8, -0.6, 3.5]}
        midpointOffset={[-3.4, 0.4, 1.8]}
        color="#2eed86"
        active={forestState.bioCoreAwakened}
      />

      {/* Station 01 (Mother Tree) -> Station 03 (Solar Lotus) */}
      <EnergyConduit
        start={[0, -0.6, 0]}
        end={[7.2, -0.6, 3.2]}
        midpointOffset={[3.6, 0.4, 1.6]}
        color="#2eed86"
        active={forestState.bioCoreAwakened}
      />

      {/* Station 02 (Mycelium Ring) -> Station 03 (Solar Lotus) */}
      <EnergyConduit
        start={[-6.8, -0.6, 3.5]}
        end={[7.2, -0.6, 3.2]}
        midpointOffset={[0.2, 0.6, 5.2]}
        color="#38bdf8"
        active={forestState.myceliumPulsing}
      />

      {/* Station 03 (Solar Lotus) -> Station 04 (Ocean Gateway Portal) */}
      <EnergyConduit
        start={[7.2, -0.6, 3.2]}
        end={[0, 0.4, 8.8]}
        midpointOffset={[3.6, 0.6, 6.0]}
        color="#28f0dc"
        active={forestState.lotusBloom}
      />

      {/* Station 02 (Mycelium Ring) -> Station 04 (Ocean Gateway Portal) */}
      <EnergyConduit
        start={[-6.8, -0.6, 3.5]}
        end={[0, 0.4, 8.8]}
        midpointOffset={[-3.4, 0.6, 6.0]}
        color="#28f0dc"
        active={forestState.lotusBloom}
      />

      {/* Station 04: Gateway Portal to Realm 03 (OCEAN) */}
      <WorldPortal
        id="portal_forest_to_ocean"
        name="OCEAN ARCHWAY"
        targetRealm="ocean"
        position={[0, 0.4, 8.8]}
        color="#28f0dc"
        locked={!forestState.portalActive}
        lockedSubtext="LOCKED // UNFURL SOLAR LOTUS (STAGE 03)"
      />

      {/* Atmospheric Forest Lighting */}
      <ambientLight color="#051410" intensity={0.9} />
      <directionalLight position={[10, 15, 8]} color="#98f7c5" intensity={1.5} />
      <pointLight
        position={[0, 3, 0]}
        color={forestState.lotusBloom ? "#28f0dc" : forestState.bioCoreAwakened ? "#2eed86" : "#0d3824"}
        intensity={forestState.lotusBloom ? 3.8 : 2.5}
        distance={24}
      />
      <pointLight position={[-8, 2, -6]} color="#c8f0ee" intensity={1.8} distance={15} />
    </group>
  );
}
