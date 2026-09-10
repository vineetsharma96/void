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

export function ForestWorld() {
  const seed = useWorldStore((s) => s.seed);
  const pointer = useWorldStore((s) => s.pointer);
  const quality = useWorldStore((s) => s.quality);

  const forestGroupRef = useRef<THREE.Group>(null);
  const foliageMeshRef = useRef<THREE.InstancedMesh>(null);
  const foliageMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const terrainMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const sporesRef = useRef<THREE.Points>(null);

  // 1. Generate Procedural Terrain
  const terrainGeometry = useMemo(() => {
    return ProceduralTerrainEngine.generateGeometry({
      width: 48,
      depth: 48,
      segmentsX: quality === "ultra" ? 140 : quality === "high" ? 100 : 70,
      segmentsZ: quality === "ultra" ? 140 : quality === "high" ? 100 : 70,
      heightScale: 3.8,
      frequency: 0.055,
      octaves: 4,
      seed,
    });
  }, [seed, quality]);

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
  const { treeMeshes, allFoliageMatrices, totalFoliageCount } = useMemo(() => {
    const treeCount = quality === "ultra" ? 22 : quality === "high" ? 16 : 10;
    const trees: { geometry: THREE.BufferGeometry; position: [number, number, number]; rotationY: number }[] = [];
    const foliageMats: THREE.Matrix4[] = [];

    // Deterministic placement on terrain surface
    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2;
      const radius = 4.5 + ((i * 137.5) % 14);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = ProceduralTerrainEngine.getHeight(x, z, { seed, heightScale: 3.8, frequency: 0.055 });

      // Generate tree variation
      const treeData = ProceduralVegetationEngine.generateTree({
        seed: seed + i * 1009,
        height: 3.8 + ((i * 37) % 2.5),
        trunkRadius: 0.22 + ((i * 19) % 0.12),
        branchingAngle: 0.52 + ((i * 23) % 0.18),
        recursionDepth: 3,
        branchesPerLevel: 3,
        foliageDensity: quality === "low" ? 6 : 12,
      });

      trees.push({
        geometry: treeData.branchGeometry,
        position: [x, y, z],
        rotationY: (i * 73) % (Math.PI * 2),
      });

      // Offset foliage instances into world coordinates
      const worldTransform = new THREE.Matrix4().makeTranslation(x, y, z);
      const rotY = new THREE.Matrix4().makeRotationY((i * 73) % (Math.PI * 2));
      worldTransform.multiply(rotY);

      for (const fMat of treeData.foliageTransforms) {
        const combined = worldTransform.clone().multiply(fMat);
        foliageMats.push(combined);
      }
    }

    return {
      treeMeshes: trees,
      allFoliageMatrices: foliageMats,
      totalFoliageCount: foliageMats.length,
    };
  }, [seed, quality]);

  // Foliage instanced mesh setup
  const foliageGeometry = useMemo(() => new THREE.DodecahedronGeometry(0.35, 0), []);
  const foliageMaterial = useMemo(
    () => ProceduralMaterials.createBioluminescentFoliageMaterial("#072216", "#2eed86"),
    []
  );

  // 3. Bio-luminescent Drifting Spores / Pollen Particles
  const sporeCount = quality === "ultra" ? 8000 : 4000;
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

      {/* Recursive Procedural Tree Trunks & Branches */}
      {treeMeshes.map((tree, idx) => (
        <mesh
          key={idx}
          geometry={tree.geometry}
          position={tree.position}
          rotation={[0, tree.rotationY, 0]}
        >
          <meshStandardMaterial
            color="#141920"
            roughness={0.85}
            metalness={0.15}
          />
        </mesh>
      ))}

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

      {/* Atmospheric Forest Lighting */}
      <ambientLight color="#051410" intensity={0.9} />
      <directionalLight position={[10, 15, 8]} color="#98f7c5" intensity={1.5} />
      <pointLight position={[0, 3, 0]} color="#2eed86" intensity={2.8} distance={20} />
      <pointLight position={[-8, 2, -6]} color="#c8f0ee" intensity={1.8} distance={15} />
    </group>
  );
}
