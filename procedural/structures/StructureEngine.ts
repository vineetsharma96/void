import * as THREE from "three";
import { createPRNG } from "@/engine/math/prng";

export interface PortalConfig {
  radius: number;
  tubeRadius: number;
  segments: number;
  symmetry: number;
  strutCount: number;
  seed: number;
}

export interface MonolithTowerConfig {
  height: number;
  baseWidth: number;
  topWidth: number;
  tiers: number;
  recessDepth: number;
  seed: number;
}

export interface GearConfig {
  radius: number;
  teeth: number;
  thickness: number;
  holeRadius: number;
}

/**
 * Procedural Structure Generator
 * Generates futuristic portals, monumental towers, and mechanical gear components.
 * Zero external 3D meshes.
 */
export class ProceduralStructureEngine {
  /**
   * Generates a segmented monumental Portal / Gateway structure.
   */
  public static generatePortal(config: Partial<PortalConfig> = {}): {
    ringGeometry: THREE.BufferGeometry;
    strutGeometries: THREE.BufferGeometry[];
  } {
    const cfg = {
      radius: 4.5,
      tubeRadius: 0.28,
      segments: 64,
      symmetry: 8,
      strutCount: 6,
      seed: 98124,
      ...config,
    };

    // Main Torus Conduit Ring
    const ringGeometry = new THREE.TorusGeometry(cfg.radius, cfg.tubeRadius, 16, cfg.segments);

    // Radial struts & chevron brackets
    const strutGeometries: THREE.BufferGeometry[] = [];
    const angleStep = (Math.PI * 2) / cfg.strutCount;

    for (let i = 0; i < cfg.strutCount; i++) {
      const angle = i * angleStep;
      const strut = new THREE.BoxGeometry(0.35, 1.2, 0.45);

      const x = Math.cos(angle) * (cfg.radius + 0.4);
      const y = Math.sin(angle) * (cfg.radius + 0.4);

      strut.rotateZ(angle + Math.PI / 2);
      strut.translate(x, y, 0);
      strutGeometries.push(strut);
    }

    return { ringGeometry, strutGeometries };
  }

  /**
   * Generates a monumental tiered Brutalist Monolith Tower.
   */
  public static generateMonolithTower(config: Partial<MonolithTowerConfig> = {}): THREE.BufferGeometry {
    const cfg = {
      height: 12.0,
      baseWidth: 3.2,
      topWidth: 1.4,
      tiers: 5,
      recessDepth: 0.35,
      seed: 77215,
      ...config,
    };

    const tierGeometries: THREE.BufferGeometry[] = [];
    const tierHeight = cfg.height / cfg.tiers;

    for (let i = 0; i < cfg.tiers; i++) {
      const t = i / (cfg.tiers - 1);
      const tierBottomWidth = THREE.MathUtils.lerp(cfg.baseWidth, cfg.topWidth * 1.2, t);
      const tierTopWidth = THREE.MathUtils.lerp(cfg.baseWidth * 0.9, cfg.topWidth, t);

      const box = new THREE.CylinderGeometry(
        tierTopWidth * 0.5,
        tierBottomWidth * 0.5,
        tierHeight * 0.92,
        4 // Square cross-section with 45 deg rotation
      );

      box.rotateY(Math.PI / 4);
      box.translate(0, i * tierHeight + tierHeight * 0.5, 0);
      tierGeometries.push(box);
    }

    // Merge tiers into single geometry
    return mergeGeometries(tierGeometries);
  }

  /**
   * Generates an analytical mechanical gear with involute-style teeth.
   */
  public static generateGear(config: Partial<GearConfig> = {}): THREE.BufferGeometry {
    const cfg = {
      radius: 2.0,
      teeth: 16,
      thickness: 0.4,
      holeRadius: 0.5,
      ...config,
    };

    const shape = new THREE.Shape();
    const toothAngle = (Math.PI * 2) / cfg.teeth;
    const outerRadius = cfg.radius * 1.15;
    const rootRadius = cfg.radius * 0.88;

    for (let i = 0; i < cfg.teeth; i++) {
      const baseAngle = i * toothAngle;
      const a1 = baseAngle;
      const a2 = baseAngle + toothAngle * 0.25;
      const a3 = baseAngle + toothAngle * 0.55;
      const a4 = baseAngle + toothAngle * 0.8;

      // Root to tip to root
      if (i === 0) shape.moveTo(Math.cos(a1) * rootRadius, Math.sin(a1) * rootRadius);
      else shape.lineTo(Math.cos(a1) * rootRadius, Math.sin(a1) * rootRadius);

      shape.lineTo(Math.cos(a2) * outerRadius, Math.sin(a2) * outerRadius);
      shape.lineTo(Math.cos(a3) * outerRadius, Math.sin(a3) * outerRadius);
      shape.lineTo(Math.cos(a4) * rootRadius, Math.sin(a4) * rootRadius);
    }
    shape.closePath();

    // Axle bore hole
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, cfg.holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);

    return new THREE.ExtrudeGeometry(shape, {
      depth: cfg.thickness,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 3,
    });
  }
}

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geometries.length === 0) return new THREE.BufferGeometry();
  if (geometries.length === 1) return geometries[0];

  let totalPos = 0;
  for (const g of geometries) totalPos += g.attributes.position.count * 3;

  const mergedPos = new Float32Array(totalPos);
  let offset = 0;
  for (const g of geometries) {
    mergedPos.set(g.attributes.position.array, offset);
    offset += g.attributes.position.array.length;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(mergedPos, 3));
  merged.computeVertexNormals();
  return merged;
}
