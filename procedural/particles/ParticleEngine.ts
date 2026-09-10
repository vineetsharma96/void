import * as THREE from "three";
import { noise3DGLSL } from "@/shaders/chunks/noise3D.glsl";

export type ParticleBehavior = "orbit" | "vortex" | "curl" | "convergence" | "explosion";

export interface ParticleSystemOptions {
  count: number;
  radius: number;
  heightRange: number;
  behavior: ParticleBehavior;
  colorCore: string;
  colorEdge: string;
  baseSize: number;
  speed: number;
  seed: number;
}

export const genericParticleVertexShader = /* glsl */ `
${noise3DGLSL}

uniform float uTime;
uniform vec3 uPointer;
uniform float uPointerDown;
uniform float uSeed;
uniform float uSpeed;
uniform int uBehavior; // 0: orbit, 1: vortex, 2: curl, 3: convergence, 4: explosion
uniform vec3 uColorCore;
uniform vec3 uColorEdge;
uniform vec3 uShockwaveCenter;
uniform float uShockwaveTime;
uniform float uShockwaveStrength;

attribute float aRandom;
attribute float aSpeed;
attribute float aSize;

varying float vAlpha;
varying vec3 vColor;

void main() {
  vec3 pos = position;
  float t = uTime * uSpeed * aSpeed;

  // Behavior 0: Orbit
  if (uBehavior == 0) {
    float angle = t * 0.2 + aRandom * 6.28;
    pos = vec3(pos.x * cos(angle) - pos.z * sin(angle), pos.y, pos.x * sin(angle) + pos.z * cos(angle));
  }
  // Behavior 1: Vortex
  else if (uBehavior == 1) {
    float angle = t * 0.4 + aRandom * 6.28;
    float r = length(pos.xz) + sin(t + aRandom * 3.14) * 0.4;
    pos.x = r * cos(angle);
    pos.z = r * sin(angle);
    pos.y = mod(pos.y + t * 0.8, 10.0) - 5.0; // Continuous vertical rise
  }
  // Behavior 2: Curl Flow Field
  else if (uBehavior == 2) {
    vec3 curl = curlNoise(pos * 0.3 + vec3(uSeed * 0.1, t * 0.2, 0.0));
    pos += curl * (1.5 + aRandom);
  }
  // Behavior 3: Convergence
  else if (uBehavior == 3) {
    float convergeProgress = fract(t * 0.2 + aRandom);
    pos = mix(pos, vec3(0.0), convergeProgress);
  }
  // Behavior 4: Explosion shockwave
  else if (uBehavior == 4) {
    vec3 dir = normalize(pos);
    pos += dir * sin(t * 2.0 + aRandom * 3.14) * 2.5;
  }

  // Pointer Repulsion
  float distToPointer = distance(pos, uPointer);
  float repulseRadius = uPointerDown > 0.5 ? 6.0 : 3.5;
  float repulseFactor = smoothstep(repulseRadius, 0.0, distToPointer);
  vec3 repulseDir = normalize(pos - uPointer);
  pos += repulseDir * repulseFactor * (uPointerDown > 0.5 ? 3.5 : 1.8);

  // Dynamic Physical Shockwave Wavefront Displacement
  float waveRadius = uShockwaveTime * 14.0;
  float shockFactor = 0.0;
  if (uShockwaveTime < 2.0 && waveRadius < 26.0) {
    float distToWave = distance(pos, uShockwaveCenter);
    float deltaR = distToWave - waveRadius;
    float waveProfile = exp(-(deltaR * deltaR) / 4.5);
    float waveDecay = exp(-1.8 * uShockwaveTime);
    shockFactor = waveProfile * waveDecay * uShockwaveStrength;
    vec3 waveDir = normalize(pos - uShockwaveCenter + vec3(0.001));
    pos += waveDir * shockFactor * 4.5;
  }

  // Dynamic alpha & color gradient
  float distCenter = length(pos);
  vAlpha = smoothstep(16.0, 2.0, distCenter) * (0.35 + aRandom * 0.55 + shockFactor * 0.4);
  vColor = mix(uColorCore, uColorEdge, smoothstep(1.5, 9.0, distCenter));

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = aSize * (35.0 / -mvPosition.z) * (1.0 + repulseFactor * 0.6 + shockFactor * 1.2);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const genericParticleFragmentShader = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  if (dist > 0.5) discard;

  float strength = 1.0 - smoothstep(0.0, 0.5, dist);
  strength = pow(strength, 1.8);

  gl_FragColor = vec4(vColor, vAlpha * strength);
}
`;

/**
 * Reusable GPU Particle Engine
 */
export class ProceduralParticleEngine {
  public static createParticleBuffer(count: number, radius: number, heightRange: number) {
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count);
    const speeds = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 1.5) * radius + 1.2;
      const y = (Math.random() - 0.5) * heightRange;

      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = r * Math.sin(theta);

      randoms[i] = Math.random();
      speeds[i] = 0.5 + Math.random() * 0.8;
      sizes[i] = 2.0 + Math.random() * 3.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
    geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    return geometry;
  }

  public static createMaterial(options: Partial<ParticleSystemOptions> = {}) {
    const behaviorMap: Record<ParticleBehavior, number> = {
      orbit: 0,
      vortex: 1,
      curl: 2,
      convergence: 3,
      explosion: 4,
    };

    const behaviorVal = behaviorMap[options.behavior || "curl"];

    return new THREE.ShaderMaterial({
      vertexShader: genericParticleVertexShader,
      fragmentShader: genericParticleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector3() },
        uPointerDown: { value: 0 },
        uSeed: { value: options.seed || 847291 },
        uSpeed: { value: options.speed || 1.0 },
        uBehavior: { value: behaviorVal },
        uColorCore: { value: new THREE.Color(options.colorCore || "#e5a93c") },
        uColorEdge: { value: new THREE.Color(options.colorEdge || "#c8f0ee") },
        uShockwaveCenter: { value: new THREE.Vector3() },
        uShockwaveTime: { value: 999.0 },
        uShockwaveStrength: { value: 0.0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }
}
