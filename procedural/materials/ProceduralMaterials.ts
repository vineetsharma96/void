import * as THREE from "three";
import { fresnelGLSL } from "@/shaders/chunks/fresnel.glsl";
import { noise3DGLSL } from "@/shaders/chunks/noise3D.glsl";

/**
 * Procedural Material System
 * Synthesizes materials with custom GLSL shaders without external textures.
 */
export class ProceduralMaterials {
  /**
   * Holographic Translucent Energy Shield Material
   */
  public static createHolographicMaterial(color: string = "#c8f0ee", opacity: number = 0.6): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: /* glsl */ `
        ${fresnelGLSL}
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float f = getFresnel(vNormal, viewDir, 2.5, 0.1);
          
          // Scanning interference bars
          float scanline = sin(vWorldPosition.y * 12.0 - uTime * 4.0);
          float alpha = uOpacity * (f * 0.8 + 0.2) + scanline * 0.08;

          gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }

  /**
   * Procedural Brushed Titanium Slate Material with micro-facet variation
   */
  public static createTitaniumSlateMaterial(baseColor: string = "#1a1e27", edgeColor: string = "#e2e8f0"): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(baseColor) },
        uEdgeColor: { value: new THREE.Color(edgeColor) },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: /* glsl */ `
        ${fresnelGLSL}
        ${noise3DGLSL}
        uniform float uTime;
        uniform vec3 uBaseColor;
        uniform vec3 uEdgeColor;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          
          // Micro-facet surface noise
          float microRoughness = snoise(vWorldPosition * 8.0) * 0.08;
          vec3 perturbedNormal = normalize(vNormal + vec3(microRoughness));

          // Edge Fresnel
          float f = getFresnel(perturbedNormal, viewDir, 3.8, 0.04);
          vec3 finalColor = mix(uBaseColor, uEdgeColor, f * 0.65);

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });
  }

  /**
   * Subsurface Organic Chlorophyll / Bioluminescent Vegetation Material
   */
  public static createBioluminescentFoliageMaterial(
    baseColor: string = "#0a2618",
    glowColor: string = "#48ff91"
  ): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(baseColor) },
        uGlowColor: { value: new THREE.Color(glowColor) },
      },
      vertexShader: /* glsl */ `
        attribute float aWindPhase;
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          
          // Wind sway displacement
          vec3 pos = position;
          float sway = sin(uTime * 1.8 + pos.y * 1.2 + aWindPhase) * 0.12;
          pos.x += sway * (pos.y * 0.3);

          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: /* glsl */ `
        ${fresnelGLSL}
        uniform float uTime;
        uniform vec3 uBaseColor;
        uniform vec3 uGlowColor;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float f = getFresnel(vNormal, viewDir, 2.8, 0.15);

          // Pulsing bio-luminescence
          float pulse = 0.5 + 0.5 * sin(uTime * 2.2 + vWorldPosition.y * 2.0);
          vec3 finalColor = mix(uBaseColor, uGlowColor, f * 0.5 + pulse * 0.35);

          gl_FragColor = vec4(finalColor, 0.92);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }
}
