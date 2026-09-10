import { noise3DGLSL } from "../chunks/noise3D.glsl";
import { fresnelGLSL } from "../chunks/fresnel.glsl";

export const terrainVertexShader = /* glsl */ `
${noise3DGLSL}

attribute float aSlope;

uniform float uTime;
uniform float uSeed;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vSlope;
varying float vElevation;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vSlope = aSlope;
  vElevation = position.y;

  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const terrainFragmentShader = /* glsl */ `
${fresnelGLSL}

uniform float uTime;
uniform vec3 uColorAbyss;
uniform vec3 uColorRock;
uniform vec3 uColorMoss;
uniform vec3 uColorEnergy;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vSlope;
varying float vElevation;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  // Slope-based texturing: vertical cliffs get rock slate, plateaus get moss
  float mossBlend = smoothstep(0.65, 0.95, vSlope);
  vec3 surfaceColor = mix(uColorRock, uColorMoss, mossBlend);

  // Deep canyon shadows (elevation darkening)
  float heightFade = smoothstep(-3.0, 3.5, vElevation);
  surfaceColor = mix(uColorAbyss, surfaceColor, heightFade * 0.9 + 0.1);

  // Subsurface bio-luminescent pulse along rock ridges
  float ridgePulse = 0.5 + 0.5 * sin(vWorldPosition.x * 0.4 + vWorldPosition.z * 0.4 + uTime * 0.8);
  float energyMask = (1.0 - vSlope) * smoothstep(0.4, 0.9, ridgePulse);
  surfaceColor += uColorEnergy * (energyMask * 0.35);

  // Subtle Fresnel rim on grazing angles
  float f = getFresnel(vNormal, viewDir, 3.5, 0.05);
  surfaceColor += vec3(0.78, 0.94, 0.93) * (f * 0.25);

  gl_FragColor = vec4(surfaceColor, 1.0);
}
`;
