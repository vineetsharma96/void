"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { Volume2, VolumeX, Sliders } from "lucide-react";

export function AudioToggle() {
  const audioEnabled = useWorldStore((s) => s.audioEnabled);
  const audioVolume = useWorldStore((s) => s.audioVolume);
  const hudCollapsed = useWorldStore((s) => s.hudCollapsed);
  const toggleAudio = useWorldStore((s) => s.actions.toggleAudio);
  const setAudioVolume = useWorldStore((s) => s.actions.setAudioVolume);

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const animRef = useRef<number | null>(null);

  // Sample live frequency bands directly into DOM refs (zero React re-renders per frame)
  useEffect(() => {
    if (!audioEnabled) {
      barRefs.current.forEach((bar) => {
        if (bar) bar.style.transform = "scaleY(0.15)";
      });
      return;
    }

    const updateVisualizer = () => {
      const data = audioEngine.getFrequencyBands();
      for (let i = 0; i < 4; i++) {
        const bar = barRefs.current[i];
        if (bar) {
          const scale = Math.max(0.15, Math.min(1, data[i]));
          bar.style.transform = `scaleY(${scale})`;
        }
      }
      animRef.current = requestAnimationFrame(updateVisualizer);
    };

    animRef.current = requestAnimationFrame(updateVisualizer);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [audioEnabled]);

  const handleToggle = () => {
    const nextState = !audioEnabled;
    toggleAudio(nextState);
    audioEngine.setMuted(!nextState, audioVolume);
    if (nextState) {
      audioEngine.triggerClickFoley();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setAudioVolume(val);
    audioEngine.setVolume(val);
  };

  if (hudCollapsed) return null;

  return (
    <div
      className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto font-sans select-none flex items-center gap-1.5 tabular-nums"
      onMouseEnter={() => setShowVolumeSlider(true)}
      onMouseLeave={() => setShowVolumeSlider(false)}
    >
      <button
        onClick={handleToggle}
        aria-label={audioEnabled ? "Mute procedural audio synthesizer" : "Enable procedural audio synthesizer"}
        aria-pressed={audioEnabled}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:ring-2 focus-visible:ring-amber-glow focus-visible:outline-none ${
          audioEnabled
            ? "bg-void-850 text-amber-glow"
            : "bg-void-900/90 text-void-300 hover:text-void-100 hover:bg-void-800"
        }`}
        title={audioEnabled ? "Mute Procedural Audio" : "Enable Procedural Audio"}
      >
        {audioEnabled ? (
          <>
            <Volume2 className="w-3.5 h-3.5 text-amber-glow" />
            <span className="hidden sm:inline">Audio On</span>
            {/* GPU-safe transform scaleY frequency spectrum bars */}
            <div className="flex items-end gap-0.5 h-3.5 ml-0.5">
              {[0, 1, 2, 3].map((idx) => (
                <span
                  key={idx}
                  ref={(el) => {
                    barRefs.current[idx] = el;
                  }}
                  className="w-0.5 h-3.5 bg-amber-glow origin-bottom transition-transform duration-75 rounded-t"
                  style={{ transform: "scaleY(0.2)" }}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <VolumeX className="w-3.5 h-3.5 text-void-400" />
            <span className="hidden sm:inline">Sound Off</span>
          </>
        )}
      </button>

      {/* Volume Slider Popup on Hover */}
      {audioEnabled && showVolumeSlider ? (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-void-900 rounded-full text-xs text-void-300">
          <Sliders className="w-3 h-3 text-ion-cyan" />
          <input
            type="range"
            min="0.05"
            max="1.0"
            step="0.05"
            value={audioVolume}
            onChange={handleVolumeChange}
            className="w-16 h-1 accent-amber-glow cursor-pointer bg-void-800 rounded appearance-none"
          />
          <span>{Math.round(audioVolume * 100)}%</span>
        </div>
      ) : null}
    </div>
  );
}
