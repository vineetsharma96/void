"use client";

import React, { useState } from "react";
import { useWorldStore, QualityTier } from "@/engine/state/useWorldStore";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { performanceGovernor } from "@/engine/performance/PerformanceMonitor";
import { Sliders, Check, Zap, Lock, Sparkles } from "lucide-react";

const TIERS: { id: QualityTier; label: string; desc: string }[] = [
  { id: "ultra", label: "Ultra", desc: "45K particles · DPR 2.0" },
  { id: "high", label: "High", desc: "25K particles · DPR 1.5" },
  { id: "medium", label: "Medium", desc: "14K particles · DPR 1.0" },
  { id: "low", label: "Low", desc: "6K particles · DPR 0.85" },
  { id: "lite", label: "Void Lite", desc: "Pure 2D Canvas Fallback" },
];

export function QualitySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const quality = useWorldStore((s) => s.quality);
  const adaptiveQuality = useWorldStore((s) => s.adaptiveQuality);
  const postProcessingEnabled = useWorldStore((s) => s.postProcessingEnabled);
  const hudCollapsed = useWorldStore((s) => s.hudCollapsed);
  const setQuality = useWorldStore((s) => s.actions.setQuality);
  const toggleAdaptiveQuality = useWorldStore((s) => s.actions.toggleAdaptiveQuality);
  const togglePostProcessing = useWorldStore((s) => s.actions.togglePostProcessing);

  const handleSelectTier = (tier: QualityTier) => {
    audioEngine.triggerClickFoley();
    setQuality(tier);
    performanceGovernor.resetCooldown();
    setIsOpen(false);
  };

  const handleToggleAdaptive = () => {
    audioEngine.triggerClickFoley();
    toggleAdaptiveQuality();
  };

  const handleTogglePostProcessing = () => {
    audioEngine.triggerClickFoley();
    togglePostProcessing();
  };

  if (hudCollapsed) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-5 right-3 sm:right-5 z-20 pointer-events-auto font-sans text-xs select-none">
      <div className="relative">
        <button
          onClick={() => {
            audioEngine.triggerClickFoley();
            setIsOpen(!isOpen);
          }}
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label="Engine Performance and Quality Settings"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-void-900/95 hover:bg-void-800 text-void-300 hover:text-void-100 transition-colors duration-200 active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:ring-2 focus-visible:ring-ion-cyan focus-visible:outline-none"
        >
          <Sliders className="w-3.5 h-3.5 text-ion-cyan" />
          <span className="font-medium capitalize flex items-center gap-1.5">
            {adaptiveQuality ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span>Auto · {quality}</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-void-500" />
                <span>{quality}</span>
              </>
            )}
          </span>
        </button>

        {isOpen ? (
          <div className="absolute bottom-full right-0 mb-2 w-60 bg-void-900/95 p-1.5 rounded-[1.25rem]">
            <div className="bg-void-850 rounded-[calc(1.25rem-0.375rem)] p-2.5 flex flex-col gap-1.5 text-xs">
              <div className="px-2 py-1 text-void-400 font-medium">
                Adaptive Engine Quality
              </div>

              {/* Auto Adaptive Governor Toggle */}
              <button
                onClick={handleToggleAdaptive}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors duration-200 active:scale-[0.98] ${
                  adaptiveQuality
                    ? "bg-void-900 text-green-400"
                    : "bg-void-900/60 text-void-300 hover:text-void-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className={`w-3.5 h-3.5 ${adaptiveQuality ? "text-green-400" : "text-void-500"}`} />
                  <span className="font-medium">Auto Governor</span>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    adaptiveQuality ? "bg-void-800 text-green-300" : "bg-void-800 text-void-500"
                  }`}
                >
                  {adaptiveQuality ? "On" : "Off"}
                </span>
              </button>

              {/* Optical Post-Processing Toggle */}
              <button
                onClick={handleTogglePostProcessing}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors duration-200 active:scale-[0.98] ${
                  postProcessingEnabled
                    ? "bg-void-900 text-amber-glow"
                    : "bg-void-900/60 text-void-300 hover:text-void-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-3.5 h-3.5 ${postProcessingEnabled ? "text-amber-glow" : "text-void-500"}`} />
                  <span className="font-medium">Optical Post-FX</span>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    postProcessingEnabled ? "bg-void-800 text-amber-glow" : "bg-void-800 text-void-500"
                  }`}
                >
                  {postProcessingEnabled ? "On" : "Off"}
                </span>
              </button>

              <div className="pt-1 flex flex-col gap-1">
                {TIERS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTier(t.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors duration-200 active:scale-[0.98] ${
                      quality === t.id
                        ? "bg-void-800 text-ion-cyan font-semibold"
                        : "text-void-300 hover:bg-void-900 hover:text-void-100"
                    }`}
                  >
                    <div>
                      <div>{t.label}</div>
                      <div className="text-[11px] text-void-400 font-normal tabular-nums">{t.desc}</div>
                    </div>
                    {quality === t.id ? <Check className="w-3.5 h-3.5 text-ion-cyan shrink-0" /> : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
