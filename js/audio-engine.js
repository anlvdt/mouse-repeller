/**
 * MouseRepeller Audio Engine
 * Core Web Audio API engine for generating high-frequency sounds
 */
export class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.analyser = null;
    this.oscillators = [];
    this.isPlaying = false;
    this.currentPattern = null;
    this.patternInterval = null;
    this.volume = 80;
    this.frequencyRange = { min: 15000, max: 20000 };
    this.waveform = 'sine';
    this._animFrameId = null;
  }

  /**
   * Initialize AudioContext (must be called from user gesture)
   */
  init() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 48000
    });

    // Master gain
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = this.volume / 100;

    // Analyser for visualization
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.85;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
  }

  /**
   * Create and start an oscillator
   */
  createOscillator(frequency, type = 'sine', detune = 0) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
    osc.detune.setValueAtTime(detune, this.audioCtx.currentTime);
    gain.gain.setValueAtTime(1, this.audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    this.oscillators.push({ osc, gain });
    return { osc, gain };
  }

  /**
   * Stop all oscillators
   */
  stopAllOscillators() {
    this.oscillators.forEach(({ osc, gain }) => {
      try {
        gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        osc.stop(this.audioCtx.currentTime + 0.05);
      } catch (e) { /* already stopped */ }
    });
    this.oscillators = [];
  }

  /**
   * Set master volume (0-100)
   */
  setVolume(val) {
    this.volume = Math.max(0, Math.min(100, val));
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(
        this.volume / 100,
        this.audioCtx.currentTime + 0.1
      );
    }
  }

  /**
   * Set frequency range
   */
  setFrequencyRange(min, max) {
    this.frequencyRange = { min, max };
  }

  /**
   * Set waveform type
   */
  setWaveform(type) {
    this.waveform = type;
  }

  /**
   * Get frequency data for visualizer
   */
  getFrequencyData() {
    if (!this.analyser) return new Uint8Array(0);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  /**
   * Get time domain data for waveform visualizer
   */
  getTimeDomainData() {
    if (!this.analyser) return new Uint8Array(0);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }

  /**
   * Get current frequency being played
   */
  getCurrentFrequency() {
    if (this.oscillators.length === 0) return 0;
    return this.oscillators[0].osc.frequency.value;
  }

  /**
   * Start playing with a specific pattern
   */
  start(pattern) {
    this.init();
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    this.stop();
    this.isPlaying = true;
    this.currentPattern = pattern;
    pattern.start(this);
  }

  /**
   * Stop everything
   */
  stop() {
    this.isPlaying = false;
    if (this.currentPattern) {
      this.currentPattern.stop(this);
      this.currentPattern = null;
    }
    this.stopAllOscillators();
    if (this.patternInterval) {
      clearInterval(this.patternInterval);
      this.patternInterval = null;
    }
  }

  /**
   * Get random frequency in current range
   */
  randomFrequency() {
    const { min, max } = this.frequencyRange;
    return min + Math.random() * (max - min);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop();
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
