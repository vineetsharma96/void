"use client";

import React, { useState, useEffect } from "react";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { ArrowRight, FastForward } from "lucide-react";

const STEPS = [
  { text: "VOID", subtext: "ZERO-ASSET PROCEDURAL WEB EXPERIENCE", duration: 1200 },
  { text: "INITIALIZING", subtext: "ALLOCATING GPU SHADER BUFFERS", duration: 900 },
  { text: "GENERATING SPACE", subtext: "EVALUATING TOPOLOGICAL CONTINUUM", duration: 900 },
  { text: "GENERATING MATTER", subtext: "SOLVING GOLDEN-RATIO GEODESICS", duration: 900 },
  { text: "GENERATING MOTION", subtext: "COMPUTING 3D CURL NOISE FIELDS", duration: 900 },
];

export function OpeningSequence() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [readyToEnter, setReadyToEnter] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const isOpeningComplete = useWorldStore((s) => s.isOpeningComplete);
  const completeOpening = useWorldStore((s) => s.actions.completeOpening);
  const toggleAudio = useWorldStore((s) => s.actions.toggleAudio);
  const audioVolume = useWorldStore((s) => s.audioVolume);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReadyToEnter(true);
      return;
    }

    if (currentStepIndex < STEPS.length) {
      const timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, STEPS[currentStepIndex].duration);
      return () => clearTimeout(timer);
    } else {
      setReadyToEnter(true);
    }
  }, [currentStepIndex]);

  const handleEnter = (withAudio: boolean = true) => {
    if (withAudio) {
      toggleAudio(true);
      audioEngine.setMuted(false, audioVolume);
    }
    audioEngine.triggerClickFoley();

    setIsExiting(true);
    setTimeout(() => {
      completeOpening();
    }, 800);
  };

  const handleSkip = () => {
    handleEnter(false);
  };

  if (isOpeningComplete) return null;

  const currentStep = STEPS[Math.min(currentStepIndex, STEPS.length - 1)];

  return (
    <div
      className={`fixed inset-0 z-40 bg-void-950 flex flex-col justify-between p-8 font-mono select-none transition-opacity duration-700 ease-out ${
        isExiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Top Header & Skip */}
      <div className="flex justify-between items-center text-[10px] tracking-widest text-void-500">
        <div>// ARCHITECTURE: ZERO EXTERNAL ASSETS</div>
        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 text-void-400 hover:text-ion-cyan transition-colors px-2 py-1 rounded border border-void-800"
        >
          SKIP <FastForward className="w-3 h-3" />
        </button>
      </div>

      {/* Central Cinematic Typography */}
      <div className="flex flex-col items-center justify-center text-center my-auto">
        <div className="text-void-100 text-5xl md:text-7xl font-extrabold tracking-tighter mb-4 transition-all duration-300">
          {readyToEnter ? "ENTER THE VOID" : currentStep.text}
        </div>

        <div className="text-void-400 text-xs md:text-sm tracking-widest uppercase max-w-md h-6 mb-8 text-amber-glow font-medium">
          {readyToEnter ? "«Nothing was modeled. Everything was generated.»" : currentStep.subtext}
        </div>

        {readyToEnter ? (
          <div className="flex flex-col sm:flex-row items-center gap-3 animate-fade-in">
            <button
              onClick={() => handleEnter(true)}
              className="px-6 py-3 rounded-full bg-void-100 text-void-950 font-bold text-xs tracking-widest hover:bg-ion-cyan transition-all flex items-center gap-2 shadow-[0_0_25px_rgba(200,240,238,0.4)]"
            >
              INITIALIZE WITH AUDIO <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleEnter(false)}
              className="px-6 py-3 rounded-full bg-void-900 border border-void-700 text-void-300 font-medium text-xs tracking-widest hover:bg-void-800 transition-all"
            >
              ENTER SILENTLY
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[10px] text-void-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-ion-cyan animate-ping" />
            SYNTHESIZING MATRIX ({currentStepIndex + 1}/{STEPS.length})
          </div>
        )}
      </div>

      {/* Bottom Footer Philosophy */}
      <div className="flex justify-between items-end text-[10px] text-void-500 tracking-wider">
        <div>MATHEMATICS + CODE + GPU SHADERS</div>
        <div>REALM 01: ORIGIN</div>
      </div>
    </div>
  );
}
