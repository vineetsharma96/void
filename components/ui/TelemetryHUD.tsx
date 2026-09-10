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

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none font-mono text-[10px] tracking-widest uppercase bg-void-900/95 border border-amber-glow/60 text-amber-glow px-4 py-2 rounded-full shadow-[0_0_20px_rgba(229,169,60,0.3)] backdrop-blur-md animate-bounce flex items-center gap-2">
          <Check className="w-3 h-3 text-amber-glow" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="pointer-events-none fixed inset-x-0 top-0 p-6 z-20 flex justify-between items-start font-mono text-[11px] uppercase tracking-widest text-void-400 select-none">
        {/* Left Telemetry: Identity & World Status */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="flex items-center gap-3">
            <span className="text-void-100 font-bold text-sm tracking-wider flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-glow animate-pulse" />
              VOID
            </span>
            <span className="text-void-600">//</span>
            <span className="text-ion-cyan font-medium">
              REALM {realmNumberMap[currentRealm] || "01"} — {currentRealm}
            </span>
            {isLiteFallback && (
              <span className="bg-amber-dim/30 border border-amber-glow/40 text-amber-glow px-1.5 py-0.5 text-[9px]">
                LITE 2D
              </span>
            )}
          </div>

          {showTelemetry && (
            <div className="bg-void-950/70 border border-void-700/60 backdrop-blur-md px-3 py-2.5 rounded flex flex-col gap-1.5 shadow-2xl">
              {/* Seed Line with Inline Edit & Share */}
              <div className="flex items-center gap-3 text-void-300">
                <span className="text-void-500 flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-ion-cyan" /> SEED:
                </span>

                {isEditingSeed ? (
                  <input
                    type="number"
                    value={seedInput}
                    onChange={(e) => setSeedInput(e.target.value)}
                    onKeyDown={handleSeedKeyDown}
                    onBlur={handleSaveSeed}
                    autoFocus
                    className="w-24 bg-void-900 border border-amber-glow text-void-100 px-1 py-0.5 text-[11px] rounded outline-none font-bold"
                  />
                ) : (
                  <button
                    onClick={() => {
                      setSeedInput(seed.toString());
                      setIsEditingSeed(true);
                    }}
                    className="text-void-100 font-bold hover:text-ion-cyan transition-colors flex items-center gap-1 group"
                    title="Click to manually edit seed"
                  >
                    <span>{seed}</span>
                    <Edit3 className="w-2.5 h-2.5 text-void-600 group-hover:text-ion-cyan" />
                  </button>
                )}

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={handleRandomize}
                    aria-label="Regenerate Cosmic Seed"
                    className="text-void-400 hover:text-amber-glow transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-void-900 focus-visible:ring-1 focus-visible:ring-amber-glow focus-visible:outline-none"
                    title="Regenerate World Seed"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> RE-GEN
                  </button>

                  <button
                    onClick={handleShare}
                    aria-label="Copy Deep-Link to Clipboard"
                    className="text-void-400 hover:text-ion-cyan transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-void-900 focus-visible:ring-1 focus-visible:ring-ion-cyan focus-visible:outline-none"
                    title="Copy Deep-Link to Clipboard"
                  >
                    <Share2 className="w-2.5 h-2.5" /> SHARE
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-void-400 border-t border-void-800/80 pt-1.5 gap-3">
                <span>VEL: <span className="text-void-200">{Math.round(pointerVelocity.speed)} PX/S</span></span>
                <span>GYRO: <span className={gyro.active ? "text-green-400 font-bold" : "text-void-500"}>{gyro.active ? "SYNC" : "OFF"}</span></span>
                <span>DOLLY: <span className="text-amber-glow">{dollyOffset > 0 ? `+${dollyOffset.toFixed(1)}` : dollyOffset.toFixed(1)}</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Right Telemetry: Hardware Engine Metrics */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <button
            onClick={toggleTelemetry}
            aria-label={showTelemetry ? "Hide Telemetry HUD" : "Show Telemetry HUD"}
            className="text-[10px] text-void-500 hover:text-void-200 border border-void-800 bg-void-950/60 px-2 py-1 rounded transition-colors focus-visible:ring-1 focus-visible:ring-void-400 focus-visible:outline-none"
          >
            {showTelemetry ? "[ HIDE TELEMETRY ]" : "[ SHOW TELEMETRY ]"}
          </button>

          {showTelemetry && (
            <div className="bg-void-950/70 border border-void-700/60 backdrop-blur-md px-3 py-2 rounded flex flex-col gap-1 text-right shadow-2xl">
              <div className="flex items-center justify-end gap-2 text-void-300">
                <span className="text-void-500 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-amber-glow" /> FPS:
                </span>
                <span
                  className={`font-bold ${
                    telemetry.fps >= 50
                      ? "text-green-400"
                      : telemetry.fps >= 30
                      ? "text-amber-300"
                      : "text-red-400"
                  }`}
                >
                  {telemetry.fps}
                </span>
                <span className="text-void-600">|</span>
                <span className="text-void-400">{quality.toUpperCase()}</span>
              </div>

              <div className="flex items-center justify-end gap-2 text-[10px] text-void-400">
                <span className="text-void-500 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-ion-cyan" /> DRAWS:
                </span>
                <span>{telemetry.drawCalls}</span>
                <span className="text-void-600">|</span>
                <span>{(telemetry.triangles / 1000).toFixed(1)}K TRIS</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
