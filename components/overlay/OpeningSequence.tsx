"use client";

import React, { useState, useEffect } from "react";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { ArrowRight, FastForward } from "lucide-react";

const STEPS = [
  { text: "VOID", subtext: "Zero-asset procedural WebGL experience", duration: 1200 },
  { text: "Initializing", subtext: "Allocating GPU shader buffers", duration: 900 },
  { text: "Generating Space", subtext: "Evaluating topological continuum", duration: 900 },
  { text: "Generating Matter", subtext: "Solving golden-ratio geodesics", duration: 900 },
  { text: "Generating Motion", subtext: "Computing 3D curl noise fields", duration: 900 },
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
    }, 700);
  };

  const handleSkip = () => {
    handleEnter(false);
  };

  if (isOpeningComplete) return null;

  const currentStep = STEPS[Math.min(currentStepIndex, STEPS.length - 1)];

  return (
    <div
      className={`fixed inset-0 z-40 bg-void-950 flex flex-col justify-between p-6 sm:p-10 font-sans select-none transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        isExiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Top Header & Skip */}
      <div className="flex justify-between items-center text-xs text-void-400">
        <div className="font-medium tracking-tight text-void-300">
          Procedural WebGL Architecture · Zero External Assets
        </div>
        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 text-void-300 hover:text-ion-cyan bg-void-900 hover:bg-void-800 transition-colors duration-200 px-3.5 py-1.5 rounded-full text-xs font-medium active:scale-[0.98]"
        >
          <span>Skip Intro</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Central Cinematic Typography */}
      <div className="flex flex-col items-center justify-center text-center my-auto px-4">
        <h1 className="font-display text-void-100 text-5xl sm:text-7xl font-bold tracking-tight mb-4 [text-wrap:balance] transition-opacity duration-300">
          {readyToEnter ? "Enter the Void" : currentStep.text}
        </h1>

        <p className="text-amber-glow text-sm sm:text-base max-w-md mb-10 font-medium [text-wrap:balance]">
          {readyToEnter
            ? "Nothing was modeled. Everything was generated from mathematics."
            : currentStep.subtext}
        </p>

        {readyToEnter ? (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Double-Bezel & Button-in-Button CTA */}
            <button
              onClick={() => handleEnter(true)}
              className="group pl-6 pr-2 py-2 rounded-full bg-void-100 text-void-950 font-semibold text-sm hover:bg-ion-cyan transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center gap-3 active:scale-[0.98] whitespace-nowrap shrink-0"
            >
              <span>Enter with Audio</span>
              <span className="w-8 h-8 rounded-full bg-void-950/15 flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
            <button
              onClick={() => handleEnter(false)}
              className="px-6 py-3 rounded-full bg-void-900 text-void-200 font-medium text-sm hover:bg-void-800 transition-colors duration-200 active:scale-[0.98] whitespace-nowrap shrink-0"
            >
              Enter Silently
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-void-400 tabular-nums">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-ion-cyan" />
            <span>
              Synthesizing Matrix ({currentStepIndex + 1}/{STEPS.length})
            </span>
          </div>
        )}
      </div>

      {/* Bottom Footer Philosophy */}
      <div className="flex justify-between items-end text-xs text-void-400">
        <div>Mathematics · GLSL Shaders · Web Audio</div>
        <div>Origin Realm</div>
      </div>
    </div>
  );
}
