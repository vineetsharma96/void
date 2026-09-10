"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { Volume2, VolumeX, Sliders } from "lucide-react";

export function AudioToggle() {
  const audioEnabled = useWorldStore((s) => s.audioEnabled);
  const audioVolume = useWorldStore((s) => s.audioVolume);
  const toggleAudio = useWorldStore((s) => s.actions.toggleAudio);
  const setAudioVolume = useWorldStore((s) => s.actions.setAudioVolume);

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [bands, setBands] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const animRef = useRef<number | null>(null);

  // Sample live frequency bands for the real-time visualizer
  useEffect(() => {
    if (!audioEnabled) {
      setBands([0, 0, 0, 0]);
      return;
    }

    const updateVisualizer = () => {
      const data = audioEngine.getFrequencyBands();
      setBands(data);
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

  return (
    <div
      className="fixed top-3 sm:top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto font-mono select-none flex items-center gap-1 sm:gap-2"
      onMouseEnter={() => setShowVolumeSlider(true)}
      onMouseLeave={() => setShowVolumeSlider(false)}
    >
      <button
        onClick={handleToggle}
        aria-label={audioEnabled ? "Mute procedural audio synthesizer" : "Enable procedural audio synthesizer"}
        aria-pressed={audioEnabled}
        className={`flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border text-[10px] sm:text-xs tracking-wider transition-all backdrop-blur-md focus-visible:ring-2 focus-visible:ring-amber-glow focus-visible:outline-none ${
          audioEnabled
            ? "bg-void-950/80 border-amber-glow/60 text-amber-glow shadow-[0_0_15px_rgba(229,169,60,0.2)]"
            : "bg-void-950/60 border-void-800 text-void-400 hover:text-void-200"
        }`}
        title={audioEnabled ? "Mute Procedural Audio" : "Enable Procedural Audio"}
      >
        {audioEnabled ? (
          <>
            <Volume2 className="w-3.5 h-3.5 text-amber-glow" />
            <span className="text-[10px] font-medium hidden sm:inline">AUDIO ON</span>
            {/* Live real-time AnalyserNode frequency spectrum bars */}
            <div className="flex items-end gap-0.5 h-3.5 ml-0.5 sm:ml-1">
              <span
                className="w-0.5 bg-amber-glow transition-all duration-75 rounded-t"
                style={{ height: `${Math.max(2, bands[0] * 14)}px` }}
              />
              <span
                className="w-0.5 bg-amber-glow transition-all duration-75 rounded-t"
                style={{ height: `${Math.max(2, bands[1] * 14)}px` }}
              />
              <span
                className="w-0.5 bg-amber-glow transition-all duration-75 rounded-t"
                style={{ height: `${Math.max(2, bands[2] * 14)}px` }}
              />
              <span
                className="w-0.5 bg-amber-glow transition-all duration-75 rounded-t"
                style={{ height: `${Math.max(2, bands[3] * 14)}px` }}
              />
            </div>
          </>
        ) : (
          <>
            <VolumeX className="w-3.5 h-3.5 text-void-500" />
            <span className="text-[10px] hidden sm:inline">SOUND OFF</span>
          </>
        )}
      </button>

      {/* Volume Slider Popup on Hover */}
      {audioEnabled && showVolumeSlider && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-void-950/80 border border-void-800 backdrop-blur-md rounded-full text-[9px] text-void-300">
          <Sliders className="w-2.5 h-2.5 text-ion-cyan" />
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
      )}
    </div>
  );
}
