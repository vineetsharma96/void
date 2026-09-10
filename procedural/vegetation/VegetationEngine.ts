import * as THREE from "three";
import { createPRNG } from "@/engine/math/prng";

export interface TreeConfig {
  seed: number;
  height: number;
  trunkRadius: number;
  branchingAngle: number;
  recursionDepth: number;
  branchesPerLevel: number;
  taper: number;
  randomness: number;
  foliageDensity: number;
}

export interface GeneratedTreeData {
  branchGeometry: THREE.BufferGeometry;
  foliageTransforms: THREE.Matrix4[];
  foliageWindPhases: number[];
}

const DEFAULT_TREE_CONFIG: TreeConfig = {
  seed: 48192,
  height: 5.5,
  trunkRadius: 0.28,
  branchingAngle: 0.58, // in radians (~33 deg)
  recursionDepth: 3,
  branchesPerLevel: 3,
  taper: 0.68,
  randomness: 0.35,
  foliageDensity: 12,
};

/**
 * Procedural Vegetation Engine
 * Generates recursive organic tree trunks, branching tiers, and canopy foliage.
 * Zero external mesh assets.
 */
export class ProceduralVegetationEngine {
  public static generateTree(config: Partial<TreeConfig> = {}): GeneratedTreeData {
    const cfg = { ...DEFAULT_TREE_CONFIG, ...config };
    const prng = createPRNG(cfg.seed);

    const branchGeometries: THREE.BufferGeometry[] = [];
    const foliageTransforms: THREE.Matrix4[] = [];
    const foliageWindPhases: number[] = [];

    // Recursive branch builder
    function buildBranch(
      startPos: THREE.Vector3,
      direction: THREE.Vector3,
      length: number,
      radius: number,
      depth: number
    ) {
      if (depth > cfg.recursionDepth || length < 0.2) {
        // Generate foliage cluster at terminal branch tips
        for (let i = 0; i < cfg.foliageDensity; i++) {
          const offset = new THREE.Vector3(
            (prng() - 0.5) * 1.2,
            (prng() - 0.5) * 1.2,
            (prng() - 0.5) * 1.2
          );
          const leafPos = startPos.clone().add(offset);
          const leafMatrix = new THREE.Matrix4();
          
          const leafScale = 0.25 + prng() * 0.35;
          leafMatrix.compose(
            leafPos,
            new THREE.Quaternion().setFromEuler(
              new THREE.Euler(prng() * Math.PI, prng() * Math.PI, prng() * Math.PI)
            ),
            new THREE.Vector3(leafScale, leafScale * 1.4, leafScale)
          );

          foliageTransforms.push(leafMatrix);
          foliageWindPhases.push(prng() * Math.PI * 2);
        }
        return;
      }

      // Cylinder segment between startPos and endPos
      const endPos = startPos.clone().add(direction.clone().multiplyScalar(length));
      const topRadius = radius * cfg.taper;

      const segGeom = new THREE.CylinderGeometry(topRadius, radius, length, 6);
      
      // Orient cylinder from startPos to endPos
      const midPoint = startPos.clone().add(endPos).multiplyScalar(0.5);
      const orientQuat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize()
      );

      segGeom.applyQuaternion(orientQuat);
      segGeom.translate(midPoint.x, midPoint.y, midPoint.z);
      branchGeometries.push(segGeom);

      // Child branches
      const childCount = depth === 0 ? cfg.branchesPerLevel + 1 : cfg.branchesPerLevel;
      const angleStep = (Math.PI * 2) / childCount;

      for (let i = 0; i < childCount; i++) {
        const phi = i * angleStep + (prng() - 0.5) * cfg.randomness;
        const tilt = cfg.branchingAngle + (prng() - 0.5) * cfg.randomness * 0.5;

        // Spherical rotation relative to parent direction
        const orthoAxis = new THREE.Vector3(1, 0, 0);
        if (Math.abs(direction.dot(orthoAxis)) > 0.9) {
          orthoAxis.set(0, 0, 1);
        }
        const right = new THREE.Vector3().crossVectors(direction, orthoAxis).normalize();
        const up = direction.clone().normalize();

        const childDir = up
          .clone()
          .applyAxisAngle(right, tilt)
          .applyAxisAngle(up, phi)
          .normalize();

        const childLength = length * (cfg.taper + (prng() - 0.5) * 0.15);
        const childRadius = topRadius * 0.85;

        buildBranch(endPos, childDir, childLength, childRadius, depth + 1);
      }
    }

    // Root trunk starts upward
    const rootPos = new THREE.Vector3(0, 0, 0);
    const rootDir = new THREE.Vector3(0, 1, 0);
    buildBranch(rootPos, rootDir, cfg.height, cfg.trunkRadius, 0);

    // Merge branch segments into single BufferGeometry
    const merged = mergeBufferGeometries(branchGeometries);

    return {
      branchGeometry: merged,
      foliageTransforms,
      foliageWindPhases,
    };
  }
}

/**
 * Lightweight geometry merger without external three-stdlib dependency
 */
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 0) return new THREE.BufferGeometry();
  if (geometries.length === 1) return geometries[0];

  let totalPositions = 0;
  let totalNormals = 0;
  let totalIndices = 0;

  for (const g of geometries) {
    totalPositions += g.attributes.position.count * 3;
    if (g.attributes.normal) totalNormals += g.attributes.normal.count * 3;
    if (g.index) totalIndices += g.index.count;
  }

  const mergedPos = new Float32Array(totalPositions);
  const mergedNorm = new Float32Array(totalNormals);
  const mergedIndices: number[] = [];

  let posOffset = 0;
  let normOffset = 0;
  let indexOffset = 0;

  for (const g of geometries) {
    const pos = g.attributes.position.array;
    mergedPos.set(pos, posOffset);

    if (g.attributes.normal) {
      mergedNorm.set(g.attributes.normal.array, normOffset);
      normOffset += g.attributes.normal.array.length;
    }

    if (g.index) {
      const idx = g.index.array;
      const vertexOffset = posOffset / 3;
      for (let i = 0; i < idx.length; i++) {
        mergedIndices.push(idx[i] + vertexOffset);
      }
      indexOffset += idx.length;
    }

    posOffset += pos.length;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(mergedPos, 3));
  if (totalNormals > 0) {
    merged.setAttribute("normal", new THREE.BufferAttribute(mergedNorm, 3));
  } else {
    merged.computeVertexNormals();
  }
  merged.setIndex(mergedIndices);

  return merged;
}
