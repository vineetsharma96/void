"use client";

import { useEffect, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { CinematicOpticalShader } from "@/shaders/postprocessing/cinematicShader.glsl";
import { useWorldStore } from "@/engine/state/useWorldStore";

export function Effects() {
  const { gl, scene, camera, size } = useThree();
  const quality = useWorldStore((s) => s.quality);
  const postProcessingEnabled = useWorldStore((s) => s.postProcessingEnabled);
  const transitionProgress = useWorldStore((s) => s.transitionProgress);
  const reducedMotion = useWorldStore((s) => s.reducedMotion);

  // Initialize EffectComposer and rendering passes
  const [composer, bloomPass, cinematicPass] = useMemo(() => {
    const isMobile = typeof window !== "undefined" && (window.innerWidth < 768 || /Android|iPhone|iPad/i.test(navigator.userAgent));
    const effectiveDpr = isMobile ? 1.0 : Math.min(gl.getPixelRatio(), 1.5);

    const renderTarget = new THREE.WebGLRenderTarget(
      Math.floor(size.width * effectiveDpr),
      Math.floor(size.height * effectiveDpr),
      {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        samples: 0, // 0 samples prevents mobile WebGL context loss
      }
    );

    const comp = new EffectComposer(gl, renderTarget);

    // 1. Base Scene Render Pass
    const renderPass = new RenderPass(scene, camera);
    comp.addPass(renderPass);

    // 2. Multi-Scale Unreal Bloom Pass
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(Math.floor(size.width * effectiveDpr), Math.floor(size.height * effectiveDpr)),
      isMobile ? 0.45 : 0.75,
      0.35,
      0.72
    );
    comp.addPass(bloom);

    // 3. Custom Procedural Optical Shader Pass
    const cinematic = new ShaderPass(CinematicOpticalShader);
    comp.addPass(cinematic);

    return [comp, bloom, cinematic];
  }, [gl, scene, camera]);

  // Synchronize composer buffer dimensions with viewport resize
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && (window.innerWidth < 768 || /Android|iPhone|iPad/i.test(navigator.userAgent));
    const effectiveDpr = isMobile ? 1.0 : Math.min(gl.getPixelRatio(), 1.5);
    const w = Math.floor(size.width * effectiveDpr);
    const h = Math.floor(size.height * effectiveDpr);

    composer.setSize(w, h);
    bloomPass.resolution.set(w, h);
  }, [composer, bloomPass, size, gl]);

  // Adaptive fidelity scaling mapped to quality tier
  useEffect(() => {
    if (!bloomPass || !cinematicPass) return;

    if (quality === "ultra") {
      bloomPass.enabled = true;
      bloomPass.strength = 0.88;
      bloomPass.radius = 0.45;
      bloomPass.threshold = 0.65;
      cinematicPass.uniforms.uGrainIntensity.value = 0.034;
      cinematicPass.uniforms.uChromaticAberration.value = reducedMotion ? 0.001 : 0.004;
    } else if (quality === "high") {
      bloomPass.enabled = true;
      bloomPass.strength = 0.72;
      bloomPass.radius = 0.4;
      bloomPass.threshold = 0.7;
      cinematicPass.uniforms.uGrainIntensity.value = 0.028;
      cinematicPass.uniforms.uChromaticAberration.value = reducedMotion ? 0.001 : 0.003;
    } else if (quality === "medium") {
      bloomPass.enabled = true;
      bloomPass.strength = 0.45;
      bloomPass.radius = 0.32;
      bloomPass.threshold = 0.76;
      cinematicPass.uniforms.uGrainIntensity.value = 0.02;
      cinematicPass.uniforms.uChromaticAberration.value = 0.002;
    } else {
      // Low tier: bypass bloom to sustain 60 FPS
      bloomPass.enabled = false;
      cinematicPass.uniforms.uGrainIntensity.value = 0.015;
      cinematicPass.uniforms.uChromaticAberration.value = 0.0015;
    }
  }, [quality, bloomPass, cinematicPass, reducedMotion]);

  // Render loop override with priority 1
  useFrame((state, delta) => {
    if (!postProcessingEnabled || quality === "lite") {
      gl.render(scene, camera);
      return;
    }

    // Update temporal procedural grain
    cinematicPass.uniforms.uTime.value = state.clock.elapsedTime;

    // Modulate lens barrel distortion during inter-world hyperspace warp
    if (!reducedMotion && transitionProgress > 0.01 && transitionProgress < 0.99) {
      const warpCurve = Math.sin(transitionProgress * Math.PI);
      cinematicPass.uniforms.uDistortion.value = warpCurve * 0.12;
      cinematicPass.uniforms.uChromaticAberration.value = 0.0035 + warpCurve * 0.0055;
    } else {
      cinematicPass.uniforms.uDistortion.value = 0.0;
    }

    composer.render(delta);
  }, 1);

  // Resource cleanup
  useEffect(() => {
    return () => {
      composer.dispose();
    };
  }, [composer]);

  return null;
}
