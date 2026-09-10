import { noise3DGLSL } from "../chunks/noise3D.glsl";
import { fresnelGLSL } from "../chunks/fresnel.glsl";

export const oceanVertexShader = /* glsl */ `
${noise3DGLSL}

uniform float uTime;
uniform vec3 uPointer;
uniform float uPointerDown;
uniform float uSeed;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vElevation;
varying float vCrest;

// Gerstner Wave parameter structure
struct Wave {
  vec2 direction;
  float amplitude;
  float steepness;
  float wavelength;
};

vec3 calculateGerstnerWave(Wave wave, vec3 pos, inout vec3 tangent, inout vec3 binormal, float time) {
  float k = 2.0 * 3.14159265 / wave.wavelength;
  float c = sqrt(9.8 / k);
  vec2 d = normalize(wave.direction);
  float f = k * (dot(d, pos.xz) - c * time);
  float a = wave.steepness / k;

  tangent += vec3(
    -d.x * d.x * (wave.steepness * sin(f)),
    d.x * (wave.steepness * cos(f)),
    -d.x * d.y * (wave.steepness * sin(f))
  );

  binormal += vec3(
    -d.x * d.y * (wave.steepness * sin(f)),
    d.y * (wave.steepness * cos(f)),
    -d.y * d.y * (wave.steepness * sin(f))
  );

  return vec3(
    d.x * (a * cos(f)),
    a * sin(f),
    d.y * (a * cos(f))
  );
}

void main() {
  vec3 gridPoint = position;
  vec3 displaced = gridPoint;

  vec3 tangent = vec3(1.0, 0.0, 0.0);
  vec3 binormal = vec3(0.0, 0.0, 1.0);

  // 4 Octaves of Gerstner Waves
  Wave w1 = Wave(vec2(1.0, 0.3), 0.45, 0.35, 12.0);
  Wave w2 = Wave(vec2(-0.7, 0.6), 0.28, 0.25, 7.5);
  Wave w3 = Wave(vec2(0.3, 1.0), 0.18, 0.22, 4.2);
  Wave w4 = Wave(vec2(0.8, -0.5), 0.09, 0.18, 2.1);

  float t = uTime * 0.9;
  displaced += calculateGerstnerWave(w1, gridPoint, tangent, binormal, t);
  displaced += calculateGerstnerWave(w2, gridPoint, tangent, binormal, t * 1.15);
  displaced += calculateGerstnerWave(w3, gridPoint, tangent, binormal, t * 1.35);
  displaced += calculateGerstnerWave(w4, gridPoint, tangent, binormal, t * 1.6);

  // Pointer surface disturbance / wake ripple
  float distToPointer = distance(vec3(displaced.x, 0.0, displaced.z), vec3(uPointer.x, 0.0, uPointer.z));
  float wakeFactor = smoothstep(6.0, 0.0, distToPointer);
  float ripple = sin(distToPointer * 4.0 - uTime * 6.0) * wakeFactor * (uPointerDown > 0.5 ? 0.8 : 0.35);
  displaced.y += ripple;

  // High-frequency capillary surface noise
  float microNoise = snoise(vec3(displaced.xz * 1.2, t * 0.6)) * 0.06;
  displaced.y += microNoise;

  // Analytical normal from cross product of tangent and binormal
  vec3 computedNormal = normalize(cross(binormal, tangent));
  vNormal = normalize(normalMatrix * computedNormal);
  vElevation = displaced.y;
  vCrest = smoothstep(0.35, 0.85, displaced.y + microNoise * 2.0);

  vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
  vWorldPosition = worldPos.xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const oceanFragmentShader = /* glsl */ `
${fresnelGLSL}
${noise3DGLSL}

uniform float uTime;
uniform vec3 uColorDeep;
uniform vec3 uColorShallow;
uniform vec3 uColorCrest;
uniform vec3 uColorFoam;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vElevation;
varying float vCrest;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  // Beer-Lambert light extinction through depth
  float depthFactor = smoothstep(-0.8, 0.6, vElevation);
  vec3 waterColor = mix(uColorDeep, uColorShallow, depthFactor);

  // Fresnel surface reflection
  float f = getFresnel(vNormal, viewDir, 4.0, 0.08);
  vec3 skyReflection = vec3(0.78, 0.95, 0.98); // Ethereal specular crest
  waterColor = mix(waterColor, skyReflection, f * 0.85);

  // Wave crest foam
  float foamNoise = snoise(vec3(vWorldPosition.xz * 2.5, uTime * 0.8));
  float foamMask = smoothstep(0.4, 0.8, vCrest + foamNoise * 0.25);
  waterColor = mix(waterColor, uColorFoam, foamMask * 0.8);

  // Simulated caustic refractive highlights
  float caustic1 = sin(vWorldPosition.x * 3.0 + uTime * 2.0) * sin(vWorldPosition.z * 3.0 + uTime * 1.5);
  float caustic2 = cos(vWorldPosition.x * 2.2 - uTime * 1.8) * cos(vWorldPosition.z * 2.2 + uTime * 2.2);
  float caustic = max(0.0, caustic1 + caustic2) * 0.15 * depthFactor;
  waterColor += uColorCrest * caustic;

  gl_FragColor = vec4(waterColor, 0.94);
}
`;
