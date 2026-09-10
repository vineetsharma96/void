"use client";

import React, { useState } from "react";
import { useWorldStore, QualityTier } from "@/engine/state/useWorldStore";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { performanceGovernor } from "@/engine/performance/PerformanceMonitor";
import { Sliders, Check, Zap, Lock, Sparkles } from "lucide-react";

const TIERS: { id: QualityTier; label: string; desc: string }[] = [
  { id: "ultra", label: "ULTRA", desc: "45K particles, DPR 2.0" },
  { id: "high", label: "HIGH", desc: "25K particles, DPR 1.5" },
  { id: "medium", label: "MEDIUM", desc: "14K particles, DPR 1.0" },
  { id: "low", label: "LOW", desc: "6K particles, DPR 0.85" },
  { id: "lite", label: "VOID LITE", desc: "Pure 2D Canvas Fallback" },
];

export function QualitySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const quality = useWorldStore((s) => s.quality);
  const adaptiveQuality = useWorldStore((s) => s.adaptiveQuality);
  const postProcessingEnabled = useWorldStore((s) => s.postProcessingEnabled);
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

  return (
    <div className="fixed bottom-14 sm:bottom-6 right-2 sm:right-6 z-20 pointer-events-auto font-mono text-xs select-none">
      <div className="relative">
        <button
          onClick={() => {
            audioEngine.triggerClickFoley();
            setIsOpen(!isOpen);
          }}
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label="Engine Performance & Quality Settings"
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-void-950/85 border border-void-800 text-void-400 hover:text-void-100 hover:border-void-600 backdrop-blur-md transition-all shadow-xl focus-visible:ring-2 focus-visible:ring-ion-cyan focus-visible:outline-none"
        >
          <Sliders className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-ion-cyan" />
          <span className="text-[9px] sm:text-[10px] tracking-wider uppercase font-medium flex items-center gap-1 sm:gap-1.5">
            {adaptiveQuality ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                AUTO: {quality}
              </>
            ) : (
              <>
                <Lock className="w-2.5 h-2.5 text-void-500" />
                {quality}
              </>
            )}
          </span>
        </button>

        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-56 bg-void-950/95 border border-void-700/80 rounded-lg p-2.5 shadow-2xl backdrop-blur-xl flex flex-col gap-1.5 text-[11px]">
            <div className="px-2 py-1 text-[9px] text-void-500 uppercase tracking-widest border-b border-void-800/80 flex justify-between items-center">
              <span>ADAPTIVE ENGINE QUALITY</span>
            </div>

            {/* Auto Adaptive Governor Toggle */}
            <button
              onClick={handleToggleAdaptive}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded transition-colors ${
                adaptiveQuality
                  ? "bg-void-900 border border-green-500/40 text-green-400"
                  : "bg-void-900/60 border border-void-800 text-void-400 hover:text-void-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className={`w-3.5 h-3.5 ${adaptiveQuality ? "text-green-400" : "text-void-500"}`} />
                <span className="font-medium text-[10px]">AUTO GOVERNOR</span>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                adaptiveQuality ? "bg-green-500/20 text-green-300" : "bg-void-800 text-void-500"
              }`}>
                {adaptiveQuality ? "ON" : "OFF"}
              </span>
            </button>

            {/* Optical Post-Processing Toggle */}
            <button
              onClick={handleTogglePostProcessing}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded transition-colors ${
                postProcessingEnabled
                  ? "bg-void-900 border border-amber-glow/40 text-amber-glow"
                  : "bg-void-900/60 border border-void-800 text-void-400 hover:text-void-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className={`w-3.5 h-3.5 ${postProcessingEnabled ? "text-amber-glow" : "text-void-500"}`} />
                <span className="font-medium text-[10px]">OPTICAL POST-FX</span>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                postProcessingEnabled ? "bg-amber-dim/30 text-amber-glow" : "bg-void-800 text-void-500"
              }`}>
                {postProcessingEnabled ? "ON" : "OFF"}
              </span>
            </button>

            <div className="border-t border-void-800/60 my-0.5" />

            {TIERS.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTier(t.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors ${
                  quality === t.id
                    ? "bg-void-800 text-ion-cyan font-bold"
                    : "text-void-400 hover:bg-void-900 hover:text-void-200"
                }`}
              >
                <div>
                  <div className="tracking-wider">{t.label}</div>
                  <div className="text-[9px] text-void-500 font-normal">{t.desc}</div>
                </div>
                {quality === t.id && <Check className="w-3.5 h-3.5 text-ion-cyan shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
