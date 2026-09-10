import { fresnelGLSL } from "../chunks/fresnel.glsl";
import { noise3DGLSL } from "../chunks/noise3D.glsl";

export const singularityVertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const singularityFragmentShader = /* glsl */ `
${fresnelGLSL}
${noise3DGLSL}

uniform float uTime;
uniform vec3 uPointer;
uniform float uSeed;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  // Negative space event horizon: pure obsidian center with intense relativistic photon rim
  float f = getFresnel(vNormal, viewDir, 6.0, 0.0);

  // Relativistic Doppler chromatic shift on edge
  vec3 amberFlare = vec3(0.95, 0.65, 0.22);
  vec3 cyanIon = vec3(0.78, 0.94, 0.93);
  vec3 rimColor = mix(amberFlare, cyanIon, sin(uTime * 0.5 + vWorldPosition.y * 0.8) * 0.5 + 0.5);

  // Swirling spacetime distortion on grazing angles
  float swirl = snoise(vec3(vWorldPosition.xy * 2.0, uTime * 0.4));
  float glow = pow(f, 3.5) * (1.2 + swirl * 0.3);

  vec3 finalColor = rimColor * glow;

  // Center is absolute pure black (event horizon)
  float centerDarkness = smoothstep(0.02, 0.6, f);
  finalColor *= centerDarkness;

  gl_FragColor = vec4(finalColor, centerDarkness * 0.95);
}
`;

export const accretionDiskFragmentShader = /* glsl */ `
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 uv = vUv - vec2(0.5);
  float r = length(uv) * 2.0; // 0 to 1
  float theta = atan(uv.y, uv.x);

  // Accretion disk band: between radius 0.4 and 0.95
  if (r < 0.35 || r > 0.98) discard;

  // Relativistic spiral rotation
  float spiral = theta + 1.8 / (r + 0.1) - uTime * 1.5;
  float density = 0.5 + 0.5 * sin(spiral * 4.0);

  // Doppler beaming: one side appears brighter due to relativistic motion toward camera
  float doppler = 0.5 + 0.5 * cos(theta - 0.4);

  // Radial intensity falloff
  float radialFalloff = smoothstep(0.35, 0.55, r) * smoothstep(0.98, 0.7, r);

  vec3 colorHot = vec3(1.0, 0.78, 0.4);
  vec3 colorCool = vec3(0.8, 0.3, 0.05);
  vec3 diskColor = mix(colorCool, colorHot, density * doppler);

  float alpha = radialFalloff * (0.4 + density * 0.5) * doppler;
  gl_FragColor = vec4(diskColor, alpha);
}
`;
