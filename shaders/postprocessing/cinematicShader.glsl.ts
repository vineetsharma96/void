import * as THREE from "three";

/**
 * Cinematic Optical Full-Screen Shader
 * 100% Procedural - Zero external textures or LUTs
 * - Chromatic Aberration (radial RGB dispersion)
 * - Procedural Film Grain (eliminates 8-bit dark banding)
 * - Cinematic Vignette (peripheral lens falloff)
 * - Barrel Warp Distortion (hyperspace transition curvature)
 */
export const CinematicOpticalShader = {
  name: "CinematicOpticalShader",

  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0.0 },
    uChromaticAberration: { value: 0.0035 },
    uGrainIntensity: { value: 0.032 },
    uVignetteDarkness: { value: 0.72 },
    uVignetteOffset: { value: 0.88 },
    uDistortion: { value: 0.0 },
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uChromaticAberration;
    uniform float uGrainIntensity;
    uniform float uVignetteDarkness;
    uniform float uVignetteOffset;
    uniform float uDistortion;

    varying vec2 vUv;

    // High-frequency procedural pseudo-random noise generator
    float pseudoRandom(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    // Dynamic temporal grain
    float proceduralGrain(vec2 uv, float t) {
      vec2 seed = uv + vec2(sin(t * 15.0), cos(t * 23.0));
      return (pseudoRandom(seed) - 0.5) * 2.0;
    }

    // Barrel distortion mapping for hyperspace warp effect
    vec2 barrelDistort(vec2 uv, float k) {
      if (abs(k) < 0.001) return uv;
      vec2 coord = uv - 0.5;
      float r2 = dot(coord, coord);
      coord = coord * (1.0 + k * r2);
      return coord + 0.5;
    }

    void main() {
      // 1. Apply transition lens barrel distortion
      vec2 uv = barrelDistort(vUv, uDistortion);

      // Discard coordinates warped out of bounds
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.01, 0.01, 0.02, 1.0);
        return;
      }

      // 2. Radial Chromatic Aberration
      vec2 center = vec2(0.5, 0.5);
      vec2 dir = uv - center;
      float distSq = dot(dir, dir);
      vec2 offset = dir * distSq * uChromaticAberration;

      float r = texture2D(tDiffuse, uv + offset).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - offset).b;
      vec3 color = vec3(r, g, b);

      // 3. Procedural Film Grain (subtle micro-texture preventing banding)
      float grain = proceduralGrain(uv, uTime) * uGrainIntensity;
      color += grain;

      // 4. Cinematic Vignette (quadratic edge attenuation)
      float dist = length(dir);
      float vignette = smoothstep(uVignetteOffset, uVignetteOffset - 0.45, dist);
      color = mix(color * (1.0 - uVignetteDarkness), color, vignette);

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `,
};
