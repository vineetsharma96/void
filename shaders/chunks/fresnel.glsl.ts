/**
 * GLSL Fresnel and Iridescent Edge Shimmer Chunks
 */
export const fresnelGLSL = /* glsl */ `
float getFresnel(vec3 normal, vec3 viewDir, float power, float bias) {
  float fresnel = bias + (1.0 - bias) * pow(clamp(1.0 - dot(normal, viewDir), 0.0, 1.0), power);
  return clamp(fresnel, 0.0, 1.0);
}

vec3 getIridescentFresnel(vec3 normal, vec3 viewDir, float power, vec3 baseColor, vec3 rimColor) {
  float f = getFresnel(normal, viewDir, power, 0.05);
  // Chromatic dispersion shift based on angle
  float r = getFresnel(normal, viewDir, power * 0.9, 0.05);
  float g = getFresnel(normal, viewDir, power * 1.0, 0.05);
  float b = getFresnel(normal, viewDir, power * 1.15, 0.05);
  
  vec3 chromaticRim = vec3(r, g, b) * rimColor;
  return mix(baseColor, chromaticRim, f);
}
`;
