import * as THREE from "three";
import { fbm3D, perlin3D } from "@/engine/math/noise";
import { createPRNG } from "@/engine/math/prng";

export interface TerrainConfig {
  width: number;
  depth: number;
  segmentsX: number;
  segmentsZ: number;
  heightScale: number;
  frequency: number;
  octaves: number;
  roughness: number;
  distortion: number;
  seed: number;
}

const DEFAULT_TERRAIN_CONFIG: TerrainConfig = {
  width: 40,
  depth: 40,
  segmentsX: 120,
  segmentsZ: 120,
  heightScale: 4.5,
  frequency: 0.05,
  octaves: 4,
  roughness: 0.5,
  distortion: 1.8,
  seed: 847291,
};

/**
 * Procedural Terrain Engine
 * Synthesizes deterministic mountain, valley, and canyon strata using domain-warped fBm noise.
 * Computes analytical normals and slope steepness per vertex.
 */
export class ProceduralTerrainEngine {
  /**
   * Evaluates height at arbitrary (x, z) coordinates for collision/surface anchoring.
   */
  public static getHeight(x: number, z: number, config: Partial<TerrainConfig> = {}): number {
    const cfg = { ...DEFAULT_TERRAIN_CONFIG, ...config };
    const seedOffset = (cfg.seed % 1000) * 0.137;

    // Domain warping
    const warpX = perlin3D((x + seedOffset) * cfg.frequency * 0.7, 0, (z + seedOffset) * cfg.frequency * 0.7) * cfg.distortion;
    const warpZ = perlin3D((x + seedOffset + 43.1) * cfg.frequency * 0.7, 0, (z + seedOffset + 81.3) * cfg.frequency * 0.7) * cfg.distortion;

    // Multi-octave fBm elevation
    const elevation = fbm3D(
      (x + warpX + seedOffset) * cfg.frequency,
      0,
      (z + warpZ + seedOffset) * cfg.frequency,
      cfg.octaves,
      2.0,
      cfg.roughness
    );

    // Apply power curve for plateaus and valleys
    const sculpted = Math.pow(Math.max(0, elevation + 0.3), 1.6);
    return (sculpted - 0.4) * cfg.heightScale;
  }

  /**
   * Generates a complete Three.js BufferGeometry with positions, normals, UVs, and slope steepness.
   */
  public static generateGeometry(config: Partial<TerrainConfig> = {}): THREE.BufferGeometry {
    const cfg = { ...DEFAULT_TERRAIN_CONFIG, ...config };
    const vertexCount = (cfg.segmentsX + 1) * (cfg.segmentsZ + 1);

    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const slopes = new Float32Array(vertexCount); // Attribute for moss vs cliff rock shader

    const dx = cfg.width / cfg.segmentsX;
    const dz = cfg.depth / cfg.segmentsZ;
    const halfWidth = cfg.width / 2;
    const halfDepth = cfg.depth / 2;

    let index = 0;
    for (let iz = 0; iz <= cfg.segmentsZ; iz++) {
      const z = iz * dz - halfDepth;
      for (let ix = 0; ix <= cfg.segmentsX; ix++) {
        const x = ix * dx - halfWidth;
        const y = this.getHeight(x, z, cfg);

        positions[index * 3] = x;
        positions[index * 3 + 1] = y;
        positions[index * 3 + 2] = z;

        uvs[index * 2] = ix / cfg.segmentsX;
        uvs[index * 2 + 1] = iz / cfg.segmentsZ;

        // Analytical gradient for normals via central differences
        const eps = 0.15;
        const hL = this.getHeight(x - eps, z, cfg);
        const hR = this.getHeight(x + eps, z, cfg);
        const hD = this.getHeight(x, z - eps, cfg);
        const hU = this.getHeight(x, z + eps, cfg);

        const normal = new THREE.Vector3(hL - hR, 2.0 * eps, hD - hU).normalize();
        normals[index * 3] = normal.x;
        normals[index * 3 + 1] = normal.y;
        normals[index * 3 + 2] = normal.z;

        // Slope = 1.0 on flat ground, 0.0 on sheer cliffs
        slopes[index] = Math.max(0, normal.y);

        index++;
      }
    }

    // Generate triangle indices
    const indices: number[] = [];
    for (let iz = 0; iz < cfg.segmentsZ; iz++) {
      for (let ix = 0; ix < cfg.segmentsX; ix++) {
        const a = ix + (cfg.segmentsX + 1) * iz;
        const b = ix + (cfg.segmentsX + 1) * (iz + 1);
        const c = ix + 1 + (cfg.segmentsX + 1) * (iz + 1);
        const d = ix + 1 + (cfg.segmentsX + 1) * iz;

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geometry.setAttribute("aSlope", new THREE.BufferAttribute(slopes, 1));

    return geometry;
  }
}
