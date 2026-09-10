# VOID — Flagship Procedural WebGL Universe

> *«Nothing was modeled. Everything was generated.»*

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r182-black?style=flat-square&logo=three.js)](https://threejs.org/)
[![GLSL](https://img.shields.io/badge/Shaders-GLSL%203.0-orange?style=flat-square)](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language)
[![Web Audio](https://img.shields.io/badge/Sound-Web%20Audio%20API-green?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Zero Assets](https://img.shields.io/badge/Assets-0%20KB%20External-purple?style=flat-square)](#the-zero-asset-guarantee)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 🌌 The Zero-Asset Guarantee

**VOID** is an interactive cosmological web experience built upon an uncompromising creative constraint:

$$\text{External 3D Models} = 0 \quad (\text{.glb}, \text{.gltf}, \text{.obj}, \text{.fbx})$$
$$\text{External Texture Bitmaps} = 0 \quad (\text{.png}, \text{.jpg}, \text{.webp}, \text{.hdr})$$
$$\text{External Audio Samples} = 0 \quad (\text{.mp3}, \text{.wav}, \text{.ogg})$$

Every single vertex, normal, UV coordinate, color spectrum, atmospheric particle, planetary surface, light reflection, audio frequency, sound wave, and physical force is synthesized entirely in real time through **pure mathematics, procedural algorithms, custom GLSL shaders, and the Web Audio API**.

---

## 🏛️ The Five Cosmological Realms

### 01. ORIGIN — The Golden Ratio Core
- **Geometry**: Concentric golden ratio geodesic icosahedrons with dual counter-rotating torus knots.
- **Surface**: Procedural 3D Simplex displacement with dynamic Fresnel iridescence.
- **Atmosphere**: 45,000+ GPU points drifting through divergence-free curl-noise turbulence.
- **Acoustics**: Sub-harmonic 43.65 Hz foundation with warm triangle drone harmonics.

### 02. FOREST — The Procedural Canopy
- **Terrain**: Fractional Brownian Motion (fBm) multi-octave heightfield with slope-dependent color strata.
- **Arbor Architecture**: Recursive 3D L-System tree branching with golden-ratio angle divergence:
  $$\alpha = \pi (3 - \sqrt{5}) \approx 137.5^\circ$$
- **Foliage**: GPU-instanced 10,000-leaflet canopy oscillating under dynamic procedural wind equations.
- **Acoustics**: Algorithmic pentatonic crystalline chimes (D-E-G-A-B) drifting across resonant filter sweeps.

### 03. OCEAN — The Gerstner Fluid Field
- **Surface Simulation**: 4-octave Gerstner wave displacement equations calculating exact non-linear crest sharpening:
  $$\vec{P} = \left( x + \sum Q_i A_i D_{i,x} \cos(\vec{D}_i \cdot \vec{x} - \omega_i t), \; \sum A_i \sin(\vec{D}_i \cdot \vec{x} - \omega_i t), \; z + \sum Q_i A_i D_{i,z} \cos(\vec{D}_i \cdot \vec{x} - \omega_i t) \right)$$
- **Optics**: Beer-Lambert absorption law simulating deep-water light attenuation and peak foam jacobian thresholds.
- **Atmosphere**: Sea spray mist particles driven by wind velocity and orbital sea surface turbulence.
- **Acoustics**: Low $E\flat$ subterranean undertow with periodic white-noise tidal surf swells.

### 04. MACHINE — The Synchronized Kinematic Engine
- **Epicyclic Gear Train**: Exact $2:1$ mathematical pitch radius meshing with synchronized angular velocity matching:
  $$\omega_{\text{planet}} = -\omega_{\text{sun}} \left( \frac{r_{\text{sun}}}{r_{\text{planet}}} \right)$$
- **Quadrature Pistons**: Reciprocating mechanical shafts driven by sinusoidal slider-crank kinematics with $90^\circ$ phase offsets.
- **Atmosphere**: Mechanical spark vortex with tangential acceleration and gravity decay.
- **Acoustics**: Dual-operator Frequency Modulation (FM) synthesis with dynamic metallic modulation index.

### 05. VOID — The Gravitational Singularity
- **Negative Space Core**: A pure raymarched event horizon casting total gravitational absorption.
- **Relativistic Accretion Disk**: High-speed particle disk featuring relativistic Doppler beaming:
  $$I_{\text{observed}} = I_{\text{rest}} \left( \frac{\sqrt{1 - \beta^2}}{1 - \beta \cos\theta} \right)^3$$
- **Photon Ring**: Thin gravitational lensing boundary glowing at the photon sphere threshold ($r = 1.5 r_s$).
- **Acoustics**: Infrasonic 32.7 Hz sub-drone with resonant ring modulations and cosmic gravitational drag.

---

## ⚡ Inter-World Warp & Camera Choreography

- **Dynamic Warp Flight**: Seamless GSAP camera choreography driving Bezier spline paths through hyperspace.
- **FOV Warp Flare**: Camera Field of View dynamically accelerates from $55^\circ$ up to $79^\circ$ during peak transition velocity, accompanied by a 3,500 streaming photon warp tunnel.
- **Acoustic Filter Sweep**: Audio engine opens a high-resonance biquad bandpass filter up to 3,080 Hz during peak world transition.

---

## 🖐️ Interaction Engine & Procedural Physics

- **Deterministic Force Accumulators**:
  - **Cursor Repulsion / Attraction**: Inverse-square deflection of ambient particles.
  - **Shockwave Detonation**: Pressing `Space` or clicking detonates an expanding radial shockwave pulse with Hooke's law spring-damper returns.
- **Multi-Touch Gestures**:
  - Two-finger pinch to Dolly Zoom the camera.
  - Horizontal swipe for realm paging.
- **Device Orientation / Mobile Gyro**:
  - Real-time device tilt maps to parallax camera rotation angles.

---

## 🔊 Native Procedural Web Audio Engine

- Built with 100% native Web Audio API (zero audio files loaded).
- Real-time `AnalyserNode` frequency spectrum visualizer rendered in the HUD.
- Algorithmic generative chimes, sub-bass drones, FM synthesis, and interactive foley clicks.

---

## 🚀 Adaptive Performance Governor

The engine continuously tracks frame delta times and hardware thermals:
- **Tiers**: Ultra (45K particles, DPR 2.0), High (25K particles, DPR 1.5), Medium (14K particles, DPR 1.0), Low (6K particles, DPR 0.85), VOID LITE (Pure 2D Canvas Fallback).
- **Thermal Hysteresis**: 3-second sustained drop before downgrading; 5-second sustained stability before upgrading.
- **Auto / Locked Mode**: Easily lock to any tier or allow the governor to auto-tune.

---

## ♿ Accessibility & VOID LITE Fallback

- **VOID LITE**: Pure HTML5 2D Canvas fallback with procedural sine weaves, concentric rings, and 2D shockwaves for low-end hardware or users with hardware acceleration disabled.
- **`prefers-reduced-motion` Compliance**: Automatically detected; halts idle camera drift, disables warp banking roll, and reduces transitions to gentle 150ms cross-fades.
- **WCAG 2.1 AA Screen Reader Announcements**: Live `aria-live="polite"` region verbally announces realm changes, seed regenerations, and shockwaves.
- **Keyboard Shortcuts**:
  - `1` - `5`: Direct jump to realms (Origin, Forest, Ocean, Machine, Void)
  - `←` / `→`: Previous / Next realm
  - `Space`: Detonate procedural shockwave
  - `R`: Regenerate cosmological seed
  - `S`: Copy deep-link URL to clipboard
  - `M`: Toggle procedural audio
  - `L`: Toggle VOID LITE 2D Fallback

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18.18+ or 20+
- npm, pnpm, or yarn

### Installation
```bash
git clone https://github.com/your-username/void.git
cd void
npm install
```

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

---

## 📜 Technology Stack

- **Framework**: Next.js 15 (App Router, Turbopack ready)
- **Language**: TypeScript (Strict Mode)
- **3D Graphics**: Three.js, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`)
- **Shaders**: Raw GLSL 3.0 (Simplex 3D, Curl noise, Gerstner waves, Beer-Lambert absorption, Fresnel iridescence)
- **Sound**: Native Web Audio API (Oscillators, BiquadFilters, GainNodes, Analysers)
- **State Engine**: Zustand
- **Motion Orchestration**: GSAP
- **Styling**: Tailwind CSS + Custom CSS Variables

---

## 📄 License

MIT License. Crafted with procedural precision.
