import { noise3DGLSL } from "./noise3D.glsl";

/**
 * GLSL Dissolve & Metamorphic Phase Transition Chunk
 * Cuts away geometry using 3D Simplex noise with a glowing emissive threshold edge.
 */
export const dissolveGLSL = /* glsl */ `
${noise3DGLSL}

uniform float uDissolve;       // 0.0 (fully visible) to 1.0 (fully dissolved)
uniform vec3 uDissolveGlow;    // Glowing burn edge color (e.g. amber or ion cyan)

void applyDissolve(vec3 worldPos) {
  if (uDissolve <= 0.001) return;
  if (uDissolve >= 0.999) discard;

  // 3D noise slice
  float n = snoise(worldPos * 0.6) * 0.5 + 0.5;
  
  // Burn threshold
  float threshold = uDissolve;
  if (n < threshold) {
    discard;
  }
}

vec3 getDissolveEdgeGlow(vec3 worldPos, vec3 baseColor) {
  if (uDissolve <= 0.001 || uDissolve >= 0.999) return baseColor;

  float n = snoise(worldPos * 0.6) * 0.5 + 0.5;
  float edgeWidth = 0.065;
  
  // If close to the discard threshold, emit intense edge photons
  if (n >= uDissolve && n <= uDissolve + edgeWidth) {
    float glowStrength = 1.0 - (n - uDissolve) / edgeWidth;
    return mix(baseColor, uDissolveGlow * 3.0, glowStrength);
  }

  return baseColor;
}
`;
