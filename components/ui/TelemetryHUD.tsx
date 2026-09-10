"use client";

import React, { useState } from "react";
import { useWorldStore } from "@/engine/state/useWorldStore";
import { audioEngine } from "@/engine/audio/AudioSynthesizer";
import { RefreshCw, Activity, Cpu, Layers, Share2, Check, Edit3 } from "lucide-react";

export function TelemetryHUD() {
  const telemetry = useWorldStore((s) => s.activeTelemetry);
  const currentRealm = useWorldStore((s) => s.currentRealm);
  const seed = useWorldStore((s) => s.seed);
  const quality = useWorldStore((s) => s.quality);
  const isLiteFallback = useWorldStore((s) => s.isLiteFallback);
  const showTelemetry = useWorldStore((s) => s.showTelemetry);
  const pointerVelocity = useWorldStore((s) => s.pointerVelocity);
  const gyro = useWorldStore((s) => s.gyro);
  const dollyOffset = useWorldStore((s) => s.dollyOffset);
  const randomizeSeed = useWorldStore((s) => s.actions.randomizeSeed);
  const setSeed = useWorldStore((s) => s.actions.setSeed);
  const toggleTelemetry = useWorldStore((s) => s.actions.toggleTelemetry);

  const [isEditingSeed, setIsEditingSeed] = useState(false);
  const [seedInput, setSeedInput] = useState(seed.toString());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const realmNumberMap: Record<string, string> = {
    origin: "01",
    forest: "02",
    ocean: "03",
    machine: "04",
    void: "05",
  };

  const handleRandomize = () => {
    audioEngine.triggerDataRegenArpeggio();
    randomizeSeed();
  };

  const handleSaveSeed = () => {
    const num = parseInt(seedInput, 10);
    if (!isNaN(num) && num > 0) {
      setSeed(num);
      audioEngine.triggerDataRegenArpeggio();
    }
    setIsEditingSeed(false);
  };

  const handleSeedKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveSeed();
    } else if (e.key === "Escape") {
      setSeedInput(seed.toString());
      setIsEditingSeed(false);
    }
  };

  const handleShare = () => {
    audioEngine.triggerClickFoley();
    if (typeof window === "undefined") return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?seed=${seed}&realm=${currentRealm}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setToastMessage("COSMOS DEEP LINK COPIED");
      setTimeout(() => setToastMessage(null), 2400);
    }).catch(() => {
      setToastMessage("COSMOS LINK: " + shareUrl);
      setTimeout(() => setToastMessage(null), 3000);
    });
  };

  // Collapse telemetry by default on mobile screens
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      if (showTelemetry) toggleTelemetry();
    }
  }, []);

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 sm:top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none font-mono text-[10px] tracking-widest uppercase bg-void-900/95 border border-amber-glow/60 text-amber-glow px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-[0_0_20px_rgba(229,169,60,0.3)] backdrop-blur-md animate-bounce flex items-center gap-2">
          <Check className="w-3 h-3 text-amber-glow" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Responsive Top Bar */}
      <div className="pointer-events-none fixed inset-x-0 top-0 p-3 sm:p-6 z-20 flex justify-between items-center font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-void-400 select-none">
        {/* Left: Identity & Realm Moniker */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 pointer-events-auto">
          <span className="text-void-100 font-bold text-xs sm:text-sm tracking-wider flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-glow animate-pulse" />
            VOID
          </span>
          <span className="text-void-600">//</span>
          <span className="text-ion-cyan font-medium text-[9px] sm:text-[11px]">
            {realmNumberMap[currentRealm] || "01"} {currentRealm}
          </span>
          {isLiteFallback && (
            <span className="bg-amber-dim/30 border border-amber-glow/40 text-amber-glow px-1 py-0.5 text-[8px] sm:text-[9px] rounded">
              2D
            </span>
          )}
        </div>

        {/* Right: Telemetry Expand/Collapse Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={toggleTelemetry}
            aria-label={showTelemetry ? "Hide Telemetry HUD" : "Show Telemetry HUD"}
            className="text-[9px] sm:text-[10px] text-void-400 hover:text-void-100 border border-void-800 bg-void-950/80 px-2 sm:px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 backdrop-blur-md shadow-lg focus-visible:ring-1 focus-visible:ring-amber-glow focus-visible:outline-none"
          >
            <Activity className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-amber-glow" />
            <span>{showTelemetry ? "HIDE" : "DATA"}</span>
          </button>
        </div>
      </div>

      {/* Unified Telemetry Drawer (Fits cleanly on mobile and desktop) */}
      {showTelemetry && (
        <div className="pointer-events-auto fixed top-12 sm:top-16 inset-x-3 sm:inset-x-auto sm:left-6 max-w-sm sm:max-w-md z-20 mx-auto sm:mx-0 bg-void-950/90 border border-void-700/80 backdrop-blur-xl p-3 sm:p-4 rounded-xl shadow-2xl flex flex-col gap-2 text-[10px] sm:text-[11px]">
          {/* Top Row: Real-time GPU & Engine Metrics */}
          <div className="flex items-center justify-between border-b border-void-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-amber-glow" />
              <span>
                FPS:{" "}
                <strong
                  className={
                    telemetry.fps >= 50
                      ? "text-green-400"
                      : telemetry.fps >= 30
                      ? "text-amber-300"
                      : "text-red-400"
                  }
                >
                  {telemetry.fps}
                </strong>
              </span>
              <span className="text-void-600">|</span>
              <span className="text-ion-cyan font-bold">{quality.toUpperCase()}</span>
            </div>

            <div className="flex items-center gap-2 text-void-400">
              <Layers className="w-3 h-3 text-ion-cyan" />
              <span>{telemetry.drawCalls} DRAWS</span>
              <span className="text-void-600">|</span>
              <span>{(telemetry.triangles / 1000).toFixed(1)}K TRIS</span>
            </div>
          </div>

          {/* Seed Controls */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-ion-cyan" />
              <span className="text-void-500">SEED:</span>
              {isEditingSeed ? (
                <input
                  type="number"
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  onKeyDown={handleSeedKeyDown}
                  onBlur={handleSaveSeed}
                  autoFocus
                  className="w-20 bg-void-900 border border-amber-glow text-void-100 px-1 py-0.5 text-[10px] rounded outline-none font-bold"
                />
              ) : (
                <button
                  onClick={() => {
                    setSeedInput(seed.toString());
                    setIsEditingSeed(true);
                  }}
                  className="text-void-100 font-bold hover:text-ion-cyan transition-colors flex items-center gap-1"
                  title="Click to manually edit seed"
                >
                  <span>{seed}</span>
                  <Edit3 className="w-2.5 h-2.5 text-void-600" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleRandomize}
                aria-label="Regenerate Cosmic Seed"
                className="text-void-400 hover:text-amber-glow transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-void-900 text-[9px]"
              >
                <RefreshCw className="w-2.5 h-2.5" /> RE-GEN
              </button>
              <button
                onClick={handleShare}
                aria-label="Copy Deep-Link to Clipboard"
                className="text-void-400 hover:text-ion-cyan transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-void-900 text-[9px]"
              >
                <Share2 className="w-2.5 h-2.5" /> SHARE
              </button>
            </div>
          </div>

          {/* Physics & Input Dynamics */}
          <div className="flex items-center justify-between text-[9px] text-void-500 border-t border-void-800/80 pt-1.5">
            <span>VEL: <span className="text-void-300">{Math.round(pointerVelocity.speed)} PX/S</span></span>
            <span>GYRO: <span className={gyro.active ? "text-green-400 font-bold" : "text-void-600"}>{gyro.active ? "SYNC" : "OFF"}</span></span>
            <span>DOLLY: <span className="text-amber-glow">{dollyOffset > 0 ? `+${dollyOffset.toFixed(1)}` : dollyOffset.toFixed(1)}</span></span>
          </div>
        </div>
      )}
    </>
  );
}
