import * as THREE from "three";
import { RealmId } from "../state/useWorldStore";

export interface MorphPointCloud {
  positions: Float32Array;
  colors: Float32Array;
}

/**
 * VOID Analytical Morph Geometries
 * Generates exact procedural target point clouds (12,000 vertices) for each cosmological realm.
 * Strictly 0 external assets — all shapes are synthesized mathematically.
 */
export class MorphGeometries {
  public static readonly POINT_COUNT = 12000;

  /**
   * Generates the mathematical point cloud for a given realm archetype
   */
  public static sampleRealmPoints(realm: RealmId): MorphPointCloud {
    switch (realm) {
      case "origin":
        return this.sampleOriginPoints();
      case "forest":
        return this.sampleForestPoints();
      case "ocean":
        return this.sampleOceanPoints();
      case "machine":
        return this.sampleMachinePoints();
      case "void":
        return this.sampleVoidPoints();
      default:
        return this.sampleOriginPoints();
    }
  }

  /**
   * Realm 01: ORIGIN
   * Golden ratio icosahedron core, gyroscopic orbital rings, and concentric aura
   */
  private static sampleOriginPoints(): MorphPointCloud {
    const count = this.POINT_COUNT;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const coreRadius = 2.4;

    for (let i = 0; i < count; i++) {
      if (i < count * 0.55) {
        // Geodesic icosahedron shell with Simplex-like displacement
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phiAngle = Math.acos(2.0 * v - 1.0);

        const r = coreRadius * (0.95 + 0.1 * Math.sin(theta * 5.0) * Math.cos(phiAngle * 4.0));
        pos[i * 3] = r * Math.sin(phiAngle) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phiAngle) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phiAngle);

        // Core colors: Warm gold and amber
        col[i * 3] = 0.9 + Math.random() * 0.1;
        col[i * 3 + 1] = 0.65 + Math.random() * 0.2;
        col[i * 3 + 2] = 0.2 + Math.random() * 0.15;
      } else if (i < count * 0.85) {
        // Gyroscopic precession rings (3 orthogonal rings)
        const ringIdx = i % 3;
        const angle = Math.random() * Math.PI * 2;
        const ringRadius = 4.2 + (i % 5) * 0.35;
        const jitter = (Math.random() - 0.5) * 0.2;

        if (ringIdx === 0) {
          pos[i * 3] = Math.cos(angle) * ringRadius;
          pos[i * 3 + 1] = Math.sin(angle) * ringRadius;
          pos[i * 3 + 2] = jitter;
        } else if (ringIdx === 1) {
          pos[i * 3] = Math.cos(angle) * ringRadius;
          pos[i * 3 + 1] = jitter;
          pos[i * 3 + 2] = Math.sin(angle) * ringRadius;
        } else {
          pos[i * 3] = jitter;
          pos[i * 3 + 1] = Math.cos(angle) * ringRadius;
          pos[i * 3 + 2] = Math.sin(angle) * ringRadius;
        }

        // Ring colors: Pale cyan and iridescent white
        col[i * 3] = 0.2;
        col[i * 3 + 1] = 0.85 + Math.random() * 0.15;
        col[i * 3 + 2] = 0.95;
      } else {
        // Outer halo dispersion cloud
        const r = 6.0 + Math.random() * 6.0;
        const theta = Math.random() * Math.PI * 2;
        const phiA = Math.acos(Math.random() * 2 - 1);

        pos[i * 3] = r * Math.sin(phiA) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phiA) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phiA);

        col[i * 3] = 0.6;
        col[i * 3 + 1] = 0.5;
        col[i * 3 + 2] = 0.8;
      }
    }

    return { positions: pos, colors: col };
  }

  /**
   * Realm 02: FOREST
   * Recursive botanical trunk, 4 primary branching limbs, and glowing leaf canopy
   */
  private static sampleForestPoints(): MorphPointCloud {
    const count = this.POINT_COUNT;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      if (i < count * 0.3) {
        // Central massive botanical trunk (y: -6 to 2)
        const t = Math.random();
        const y = -6.0 + t * 8.0;
        const trunkRadius = (1.0 - t * 0.5) * 1.8;
        const angle = Math.random() * Math.PI * 2;
        const r = trunkRadius * Math.sqrt(Math.random());

        pos[i * 3] = Math.cos(angle) * r;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = Math.sin(angle) * r;

        // Trunk colors: Deep bark and bioluminescent veins
        col[i * 3] = 0.15 + t * 0.2;
        col[i * 3 + 1] = 0.55 + t * 0.3;
        col[i * 3 + 2] = 0.25;
      } else if (i < count * 0.7) {
        // Branching canopy limbs extending outward and upward
        const branchId = i % 5;
        const branchAngle = (branchId / 5) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const branchProgress = Math.random();
        const dist = 1.0 + branchProgress * 7.5;
        const y = 1.5 + Math.sin(branchProgress * Math.PI * 0.6) * 4.5 + (Math.random() - 0.5) * 0.8;

        pos[i * 3] = Math.cos(branchAngle) * dist + (Math.random() - 0.5) * 0.6;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = Math.sin(branchAngle) * dist + (Math.random() - 0.5) * 0.6;

        // Branch colors: Vibrant emerald green
        col[i * 3] = 0.22;
        col[i * 3 + 1] = 0.92;
        col[i * 3 + 2] = 0.48;
      } else {
        // Floating bioluminescent leaf spores & canopy mist
        const angle = Math.random() * Math.PI * 2;
        const dist = 2.0 + Math.random() * 8.5;
        const y = 3.0 + Math.random() * 6.0;

        pos[i * 3] = Math.cos(angle) * dist;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = Math.sin(angle) * dist;

        // Spore colors: Golden amber and cyan bioluminescence
        if (Math.random() < 0.6) {
          col[i * 3] = 0.22;
          col[i * 3 + 1] = 0.95;
          col[i * 3 + 2] = 0.65;
        } else {
          col[i * 3] = 0.95;
          col[i * 3 + 1] = 0.85;
          col[i * 3 + 2] = 0.25;
        }
      }
    }

    return { positions: pos, colors: col };
  }

  /**
   * Realm 03: OCEAN
   * Planar Gerstner wave field with radial swells, foam crests, and spray particles
   */
  private static sampleOceanPoints(): MorphPointCloud {
    const count = this.POINT_COUNT;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const oceanRadius = 14.0;

    for (let i = 0; i < count; i++) {
      // Polar grid distribution for natural wave propagation
      const r = Math.sqrt(Math.random()) * oceanRadius;
      const theta = Math.random() * Math.PI * 2;

      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      // Analytical Gerstner-like wave elevation
      const k1 = 0.45;
      const k2 = 0.85;
      const wave = Math.sin(x * k1 + z * 0.2) * 0.9 + Math.cos(z * k2) * 0.5;
      const y = -1.2 + wave;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // Wave colors: Deep sapphire abyss in troughs, bright cyan/white at crests
      const isCrest = wave > 0.6;
      if (isCrest) {
        col[i * 3] = 0.85;
        col[i * 3 + 1] = 0.98;
        col[i * 3 + 2] = 1.0;
      } else {
        col[i * 3] = 0.04;
        col[i * 3 + 1] = 0.45 + (y + 2.0) * 0.2;
        col[i * 3 + 2] = 0.92;
      }
    }

    return { positions: pos, colors: col };
  }

  /**
   * Realm 04: MACHINE
   * Interlocking planetary gears, circular piston manifold ring, and vertical monolith pylons
   */
  private static sampleMachinePoints(): MorphPointCloud {
    const count = this.POINT_COUNT;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      if (i < count * 0.35) {
        // Central Sun & 4 Planetary Gears
        const gearSelect = i % 5;
        let cx = 0, cy = 0;
        const orbitR = 3.3;
        if (gearSelect === 1) cx = orbitR;
        else if (gearSelect === 2) cx = -orbitR;
        else if (gearSelect === 3) cy = orbitR;
        else if (gearSelect === 4) cy = -orbitR;

        const gearRadius = gearSelect === 0 ? 2.2 : 1.1;
        const angle = Math.random() * Math.PI * 2;
        const tooth = Math.sin(angle * (gearSelect === 0 ? 24 : 12)) * 0.2;
        const r = (gearRadius + tooth) * (0.6 + Math.random() * 0.4);

        pos[i * 3] = cx + Math.cos(angle) * r;
        pos[i * 3 + 1] = cy + Math.sin(angle) * r;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

        // Gear colors: Heavy metallic steel and friction amber
        col[i * 3] = 0.9;
        col[i * 3 + 1] = 0.65;
        col[i * 3 + 2] = 0.22;
      } else if (i < count * 0.65) {
        // Hydraulic Piston Manifold Ring (r = 5.4m)
        const angle = Math.random() * Math.PI * 2;
        const r = 5.4 + (Math.random() - 0.5) * 0.5;
        pos[i * 3] = Math.cos(angle) * r;
        pos[i * 3 + 1] = Math.sin(angle) * r;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;

        // Hydraulic colors: High-voltage cyan & dark iron
        col[i * 3] = 0.16;
        col[i * 3 + 1] = 0.88;
        col[i * 3 + 2] = 0.95;
      } else {
        // Monolith Pylon Columns at X = +/- 8.5m
        const isLeft = i % 2 === 0;
        const baseX = isLeft ? -8.5 : 8.5;
        const y = -6.0 + Math.random() * 12.0;
        const colR = (1.0 - (y + 6.0) / 12.0 * 0.5) * 0.9;
        const a = Math.random() * Math.PI * 2;

        pos[i * 3] = baseX + Math.cos(a) * colR;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = Math.sin(a) * colR;

        // Pylon colors: Dark slate with electric apex
        const isApex = y > 4.0;
        if (isApex) {
          col[i * 3] = 0.16;
          col[i * 3 + 1] = 0.92;
          col[i * 3 + 2] = 0.95;
        } else {
          col[i * 3] = 0.35;
          col[i * 3 + 1] = 0.42;
          col[i * 3 + 2] = 0.52;
        }
      }
    }

    return { positions: pos, colors: col };
  }

  /**
   * Realm 05: VOID
   * Relativistic Schwarzschild event horizon, logarithmic accretion spiral, and quantum halo
   */
  private static sampleVoidPoints(): MorphPointCloud {
    const count = this.POINT_COUNT;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      if (i < count * 0.2) {
        // Gravitational event horizon sphere boundary (r = 1.4m)
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 1.4;

        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phi);

        // Event horizon colors: Gravitational dark violet and ultra-hot photon rim
        col[i * 3] = 0.85;
        col[i * 3 + 1] = 0.2;
        col[i * 3 + 2] = 0.95;
      } else if (i < count * 0.75) {
        // Relativistic logarithmic accretion disk spiral
        const spiralProgress = Math.random();
        const r = 1.45 + Math.pow(spiralProgress, 1.6) * 11.0;
        const angle = spiralProgress * Math.PI * 8.0 + (Math.random() - 0.5) * 0.2;
        const thickness = (1.0 - Math.min(1.0, r / 12.0)) * 0.8;

        pos[i * 3] = Math.cos(angle) * r;
        pos[i * 3 + 1] = (Math.random() - 0.5) * thickness;
        pos[i * 3 + 2] = Math.sin(angle) * r;

        // Accretion disk colors: Blazing quantum cyan to deep infrared violet
        const heat = Math.max(0, 1.0 - (r - 1.45) / 10.0);
        col[i * 3] = 0.2 + heat * 0.7;
        col[i * 3 + 1] = 0.4 + heat * 0.55;
        col[i * 3 + 2] = 0.95;
      } else {
        // Infalling quantum vacuum particle filaments
        const angle = Math.random() * Math.PI * 2;
        const dist = 3.0 + Math.random() * 10.0;
        const y = (Math.random() - 0.5) * 6.0;

        pos[i * 3] = Math.cos(angle) * dist;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = Math.sin(angle) * dist;

        col[i * 3] = 0.9;
        col[i * 3 + 1] = 0.3;
        col[i * 3 + 2] = 0.8;
      }
    }

    return { positions: pos, colors: col };
  }
}
