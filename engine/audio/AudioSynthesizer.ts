import { RealmId } from "../state/useWorldStore";

/**
 * VOID Multi-Layer Procedural Web Audio Engine
 * Zero external audio files (.mp3 / .wav).
 * 100% synthesized in real time via Web Audio API oscillators, noise generators,
 * algorithmic biquad filter graphs, FM modulation, and real-time spectrum analysis.
 */
class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> | null = null;

  // Drone oscillators
  private subOsc: OscillatorNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;

  // Procedural Noise generator
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;

  // Ocean Tidal Modulation
  private oceanSwellOsc: OscillatorNode | null = null;
  private oceanSwellGain: GainNode | null = null;

  // Machine FM Synthesizer
  private fmCarrier: OscillatorNode | null = null;
  private fmModulator: OscillatorNode | null = null;
  private fmModGain: GainNode | null = null;
  private fmOutputGain: GainNode | null = null;

  // Forest Procedural Chime Interval
  private chimeTimer: ReturnType<typeof setInterval> | null = null;
  private currentRealm: RealmId = "origin";

  // Resonance filters
  private mainFilter: BiquadFilterNode | null = null;

  // Initialized state
  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized || typeof window === "undefined") return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output & AnalyserNode
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64; // 32 frequency bins
      this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // Main lowpass filter
      this.mainFilter = this.ctx.createBiquadFilter();
      this.mainFilter.type = "lowpass";
      this.mainFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
      this.mainFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);
      this.mainFilter.connect(this.masterGain);

      // 1. Sub Bass Oscillator (Fundamental: 43.65 Hz -> Low F)
      this.subOsc = this.ctx.createOscillator();
      this.subOsc.type = "sine";
      this.subOsc.frequency.setValueAtTime(43.65, this.ctx.currentTime);
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.42, this.ctx.currentTime);
      this.subOsc.connect(subGain);
      subGain.connect(this.mainFilter);
      this.subOsc.start();

      // 2. Harmonic Drone Oscillator (Fifth overtone: 65.4 Hz -> C)
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = "triangle";
      this.droneOsc1.frequency.setValueAtTime(65.4, this.ctx.currentTime);
      const droneGain1 = this.ctx.createGain();
      droneGain1.gain.setValueAtTime(0.2, this.ctx.currentTime);
      this.droneOsc1.connect(droneGain1);
      droneGain1.connect(this.mainFilter);
      this.droneOsc1.start();

      // 3. Shimmer Drone Oscillator (High subtle octave: 130.8 Hz)
      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = "sine";
      this.droneOsc2.frequency.setValueAtTime(130.8, this.ctx.currentTime);
      const droneGain2 = this.ctx.createGain();
      droneGain2.gain.setValueAtTime(0.1, this.ctx.currentTime);
      this.droneOsc2.connect(droneGain2);
      droneGain2.connect(this.mainFilter);
      this.droneOsc2.start();

      // 4. Procedural White Noise Buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      this.noiseFilter = this.ctx.createBiquadFilter();
      this.noiseFilter.type = "bandpass";
      this.noiseFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.noiseFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.noiseNode.connect(this.noiseFilter);
      this.noiseFilter.connect(this.noiseGain);
      this.noiseGain.connect(this.mainFilter);
      this.noiseNode.start();

      // 5. Ocean Tidal Swell LFO (modulates noise during ocean realm)
      this.oceanSwellOsc = this.ctx.createOscillator();
      this.oceanSwellOsc.frequency.setValueAtTime(0.14, this.ctx.currentTime); // ~7 sec wave cycle
      this.oceanSwellGain = this.ctx.createGain();
      this.oceanSwellGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // active in ocean
      this.oceanSwellOsc.connect(this.oceanSwellGain);
      this.oceanSwellGain.connect(this.noiseGain.gain);
      this.oceanSwellOsc.start();

      // 6. Machine Metallic FM Synthesizer
      this.fmModulator = this.ctx.createOscillator();
      this.fmModulator.frequency.setValueAtTime(116.54, this.ctx.currentTime);
      this.fmModGain = this.ctx.createGain();
      this.fmModGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // modulated in machine
      this.fmModulator.connect(this.fmModGain);

      this.fmCarrier = this.ctx.createOscillator();
      this.fmCarrier.type = "sawtooth";
      this.fmCarrier.frequency.setValueAtTime(58.27, this.ctx.currentTime);
      this.fmModGain.connect(this.fmCarrier.frequency);

      this.fmOutputGain = this.ctx.createGain();
      this.fmOutputGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.fmCarrier.connect(this.fmOutputGain);
      this.fmOutputGain.connect(this.mainFilter);

      this.fmModulator.start();
      this.fmCarrier.start();

      this.isInitialized = true;
      this.startChimeLoop();
    } catch (e) {
      console.warn("Web Audio initialization skipped:", e);
    }
  }

  public setMuted(mute: boolean, volume: number = 0.7) {
    this.isMuted = mute;
    if (!this.isInitialized) {
      if (!mute) this.init();
      else return;
    }

    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === "suspended" && !mute) {
      this.ctx.resume();
    }

    const targetGain = mute ? 0.0001 : Math.max(0.0001, volume * 0.42);
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(targetGain, this.ctx.currentTime + 0.8);
  }

  public setVolume(volume: number) {
    if (!this.isInitialized || !this.ctx || !this.masterGain || this.isMuted) return;
    const targetGain = Math.max(0.0001, volume * 0.42);
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.2);
  }

  /**
   * Adapts the procedural sound generators to match the cosmological archetype
   */
  public setRealmProfile(realm: RealmId) {
    this.currentRealm = realm;
    if (!this.isInitialized || !this.ctx || !this.subOsc || !this.mainFilter) return;

    const t = this.ctx.currentTime;

    // Reset specialized layers
    if (this.oceanSwellGain) this.oceanSwellGain.gain.linearRampToValueAtTime(0.0, t + 1.0);
    if (this.fmOutputGain) this.fmOutputGain.gain.linearRampToValueAtTime(0.0, t + 1.0);
    if (this.fmModGain) this.fmModGain.gain.linearRampToValueAtTime(0.0, t + 1.0);

    switch (realm) {
      case "origin":
        this.subOsc.frequency.exponentialRampToValueAtTime(43.65, t + 1.2);
        this.mainFilter.frequency.exponentialRampToValueAtTime(280, t + 1.2);
        this.mainFilter.Q.exponentialRampToValueAtTime(3.5, t + 1.2);
        if (this.droneOsc1) {
          this.droneOsc1.type = "triangle";
          this.droneOsc1.frequency.exponentialRampToValueAtTime(65.4, t + 1.2);
        }
        if (this.noiseFilter) this.noiseFilter.frequency.exponentialRampToValueAtTime(450, t + 1.2);
        if (this.noiseGain) this.noiseGain.gain.linearRampToValueAtTime(0.06, t + 1.2);
        break;

      case "forest":
        this.subOsc.frequency.exponentialRampToValueAtTime(55.0, t + 1.2); // A
        this.mainFilter.frequency.exponentialRampToValueAtTime(520, t + 1.2);
        this.mainFilter.Q.exponentialRampToValueAtTime(2.2, t + 1.2);
        if (this.droneOsc1) {
          this.droneOsc1.type = "sine";
          this.droneOsc1.frequency.exponentialRampToValueAtTime(110.0, t + 1.2);
        }
        if (this.noiseFilter) this.noiseFilter.frequency.exponentialRampToValueAtTime(780, t + 1.2);
        if (this.noiseGain) this.noiseGain.gain.linearRampToValueAtTime(0.12, t + 1.2);
        break;

      case "ocean":
        this.subOsc.frequency.exponentialRampToValueAtTime(38.89, t + 1.2); // Eb
        this.mainFilter.frequency.exponentialRampToValueAtTime(360, t + 1.2);
        this.mainFilter.Q.exponentialRampToValueAtTime(1.8, t + 1.2);
        if (this.noiseFilter) this.noiseFilter.frequency.exponentialRampToValueAtTime(280, t + 1.2);
        if (this.noiseGain) this.noiseGain.gain.linearRampToValueAtTime(0.16, t + 1.2);
        if (this.oceanSwellGain) this.oceanSwellGain.gain.linearRampToValueAtTime(0.08, t + 1.2);
        break;

      case "machine":
        this.subOsc.frequency.exponentialRampToValueAtTime(58.27, t + 1.2); // Bb
        this.mainFilter.frequency.exponentialRampToValueAtTime(680, t + 1.2);
        this.mainFilter.Q.exponentialRampToValueAtTime(4.2, t + 1.2);
        if (this.droneOsc1) {
          this.droneOsc1.type = "sawtooth";
          this.droneOsc1.frequency.exponentialRampToValueAtTime(87.3, t + 1.2);
        }
        if (this.fmOutputGain) this.fmOutputGain.gain.linearRampToValueAtTime(0.14, t + 1.2);
        if (this.fmModGain) this.fmModGain.gain.linearRampToValueAtTime(120.0, t + 1.2);
        break;

      case "void":
        this.subOsc.frequency.exponentialRampToValueAtTime(32.7, t + 1.5); // Infrasonic low C1
        this.mainFilter.frequency.exponentialRampToValueAtTime(160, t + 1.5);
        this.mainFilter.Q.exponentialRampToValueAtTime(5.0, t + 1.5);
        if (this.droneOsc2) this.droneOsc2.frequency.exponentialRampToValueAtTime(261.63, t + 1.5);
        if (this.noiseGain) this.noiseGain.gain.linearRampToValueAtTime(0.04, t + 1.5);
        break;
    }
  }

  /**
   * Modulates filter resonance sweep during inter-world transition
   * @param progress Transition interpolation progress (0.0 to 1.0)
   */
  public setTransitionSweep(progress: number) {
    if (!this.isInitialized || !this.ctx || !this.mainFilter || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Resonant opening flare at peak velocity (progress ~ 0.5)
    const sweepIntensity = Math.sin(progress * Math.PI);
    const targetFreq = 280 + sweepIntensity * 2800; // Opens up to 3080 Hz
    const targetQ = 3.0 + sweepIntensity * 4.0;

    this.mainFilter.frequency.cancelScheduledValues(t);
    this.mainFilter.frequency.setValueAtTime(targetFreq, t);
    this.mainFilter.Q.cancelScheduledValues(t);
    this.mainFilter.Q.setValueAtTime(targetQ, t);
  }

  /**
   * Acoustic impulse triggered when initiating a realm transition
   */
  public triggerRealmTransition() {
    this.triggerShockwaveImpulse(1.2);
    this.setTransitionSweep(0.4);
  }

  /**
   * Machine Stage 1: Resonant metallic turbine torque spin-up
   */
  public triggerMachineGearEngagement() {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 1.2);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);
      else gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.45);
    } catch {
      // Audio interrupted
    }
  }

  /**
   * Machine Stage 2: Hydraulic high-pressure steam pulse
   */
  public triggerPistonPressureSurge() {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      this.triggerShockwaveImpulse(1.4);

      // Filtered noise steam release
      const bufferSize = this.ctx.sampleRate * 0.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-4.0 * (i / bufferSize));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(3.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

      noise.connect(filter);
      filter.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);
      else gain.connect(this.ctx.destination);

      noise.start(now);
    } catch {
      // Audio interrupted
    }
  }

  /**
   * Machine Stage 3: High-voltage electrical harmonic capacitor discharge
   */
  public triggerCapacitorDischarge() {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      this.triggerShockwaveImpulse(1.6);

      // 1. Ascending harmonic resonance arpeggio
      const notes = [220.0, 330.0, 440.0, 660.0, 880.0];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.0001, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.09, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.8);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);
        else gain.connect(this.ctx!.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.85);
      });

      // 2. High-voltage electrostatic arc crackle
      const bufferSize = this.ctx.sampleRate * 0.6;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-3.5 * (i / bufferSize));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const sparkFilter = this.ctx.createBiquadFilter();
      sparkFilter.type = "bandpass";
      sparkFilter.frequency.setValueAtTime(2800, now);
      sparkFilter.Q.setValueAtTime(6.0, now);

      const sparkGain = this.ctx.createGain();
      sparkGain.gain.setValueAtTime(0.18, now);
      sparkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      noise.connect(sparkFilter);
      sparkFilter.connect(sparkGain);
      if (this.masterGain) sparkGain.connect(this.masterGain);
      else sparkGain.connect(this.ctx.destination);

      noise.start(now);
    } catch {
      // Audio interrupted
    }
  }

  /**
   * Forest Realm: Generative Algorithmic Pentatonic Chimes
   */
  private startChimeLoop() {
    if (this.chimeTimer) clearInterval(this.chimeTimer);

    // Pentatonic scale frequencies (D4, E4, G4, A4, B4, D5)
    const notes = [293.66, 329.63, 392.0, 440.0, 493.88, 587.33];

    this.chimeTimer = setInterval(() => {
      if (this.currentRealm !== "forest" || this.isMuted || !this.ctx || !this.isInitialized) {
        return;
      }

      // Random chance trigger every 3s
      if (Math.random() < 0.65) {
        const note = notes[Math.floor(Math.random() * notes.length)];
        this.triggerChimeTone(note);
      }
    }, 3200);
  }

  private triggerChimeTone(frequency: number) {
    if (!this.ctx || !this.mainFilter || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();

      chimeOsc.type = "sine";
      chimeOsc.frequency.setValueAtTime(frequency, now);

      // Fast crystalline attack, long gentle ringing decay
      chimeGain.gain.setValueAtTime(0.0001, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.mainFilter);

      chimeOsc.start(now);
      chimeOsc.stop(now + 2.25);
    } catch {
      // Ignore if audio is suspended
    }
  }

  /**
   * Subtle foley click synthesized on interactive HUD hover / click
   */
  public triggerClickFoley() {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.045);
    } catch {
      // Ignore if interrupted
    }
  }

  /**
   * Subtle UI hover beep synthesized on camera mode / button hover
   */
  public triggerUIHoverBeep() {
    this.triggerClickFoley();
  }

  /**
   * Physical shockwave impulse synthesized on pointer click/tap
   */
  public triggerShockwaveImpulse(strength: number = 1.0) {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const duration = 0.45;

      // 1. Sub-bass compression drop oscillator
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(160, now);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + duration);

      const subVol = Math.min(0.35, 0.18 * strength);
      subGain.gain.setValueAtTime(subVol, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      subOsc.connect(subGain);
      if (this.masterGain) subGain.connect(this.masterGain);
      else subGain.connect(this.ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + duration);

      // 2. Resonant high-pass dispersion chirp
      const chirpOsc = this.ctx.createOscillator();
      const chirpFilter = this.ctx.createBiquadFilter();
      const chirpGain = this.ctx.createGain();

      chirpOsc.type = "triangle";
      chirpOsc.frequency.setValueAtTime(540, now);
      chirpOsc.frequency.exponentialRampToValueAtTime(80, now + duration * 0.7);

      chirpFilter.type = "bandpass";
      chirpFilter.frequency.setValueAtTime(600, now);
      chirpFilter.Q.setValueAtTime(4.0, now);

      chirpGain.gain.setValueAtTime(0.08 * strength, now);
      chirpGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

      chirpOsc.connect(chirpFilter);
      chirpFilter.connect(chirpGain);
      if (this.masterGain) chirpGain.connect(this.masterGain);
      else chirpGain.connect(this.ctx.destination);

      chirpOsc.start(now);
      chirpOsc.stop(now + duration * 0.7);
    } catch {
      // Ignore if audio is interrupted
    }
  }

  /**
   * Ascending 4-tone algorithmic data chirp sequence when seed is re-randomized
   */
  public triggerDataRegenArpeggio() {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    try {
      const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      frequencies.forEach((freq, index) => {
        if (!this.ctx) return;
        const noteTime = now + index * 0.055;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.0001, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.05, noteTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.12);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);
        else gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.13);
      });
    } catch {
      // Ignore if interrupted
    }
  }

  /**
   * Real-time spectrum analysis for visualizers
   * Returns [Sub, Low, Mid, High] normalized amplitudes (0.0 to 1.0)
   */
  public getFrequencyBands(): [number, number, number, number] {
    if (!this.analyser || !this.freqData || this.isMuted) {
      return [0, 0, 0, 0];
    }

    this.analyser.getByteFrequencyData(this.freqData as unknown as Uint8Array<ArrayBuffer>);

    // Bins: 0-3 (Sub), 4-9 (Low), 10-18 (Mid), 19-31 (High)
    const sub = this.averageBins(0, 3) / 255;
    const low = this.averageBins(4, 9) / 255;
    const mid = this.averageBins(10, 18) / 255;
    const high = this.averageBins(19, 31) / 255;

    return [sub, low, mid, high];
  }

  private averageBins(start: number, end: number): number {
    if (!this.freqData) return 0;
    let sum = 0;
    const count = end - start + 1;
    for (let i = start; i <= end; i++) {
      sum += this.freqData[i] || 0;
    }
    return sum / count;
  }
}

export const audioEngine = new ProceduralAudioEngine();
