/**
 * Anti-Habituation Sound Patterns
 * Each pattern implements start(engine) and stop(engine)
 */

// ─── LINEAR SWEEP ───────────────────────────────────────────────
// Quét tuyến tính từ min → max → min liên tục
export class LinearSweepPattern {
    constructor() {
        this.id = 'linear-sweep';
        this.name = 'Linear Sweep';
        this.nameVi = 'Quét Tuyến Tính';
        this.icon = 'trending-up';
        this.description = 'Quét tần số liên tục từ thấp đến cao rồi lặp lại. Hiệu quả nhất cho diện tích rộng.';
        this.color = '#00d4ff';
        this._timeout = null;
    }

    start(engine) {
        const { min, max } = engine.frequencyRange;
        const duration = 3; // seconds per sweep
        const { osc } = engine.createOscillator(min, engine.waveform);

        const sweep = () => {
            if (!engine.isPlaying) return;
            const now = engine.audioCtx.currentTime;
            osc.frequency.setValueAtTime(min, now);
            osc.frequency.linearRampToValueAtTime(max, now + duration);
            osc.frequency.linearRampToValueAtTime(min, now + duration * 2);
            this._timeout = setTimeout(sweep, duration * 2 * 1000);
        };
        sweep();
    }

    stop(engine) {
        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
    }
}

// ─── RANDOM JUMP ────────────────────────────────────────────────
// Nhảy ngẫu nhiên giữa các tần số
export class RandomJumpPattern {
    constructor() {
        this.id = 'random-jump';
        this.name = 'Random Jump';
        this.nameVi = 'Nhảy Ngẫu Nhiên';
        this.icon = 'shuffle';
        this.description = 'Nhảy ngẫu nhiên giữa các tần số khác nhau. Chuột khó quen nhất với pattern này.';
        this.color = '#ff6b35';
        this._interval = null;
    }

    start(engine) {
        const { osc } = engine.createOscillator(engine.randomFrequency(), engine.waveform);

        this._interval = setInterval(() => {
            if (!engine.isPlaying) return;
            const freq = engine.randomFrequency();
            const now = engine.audioCtx.currentTime;
            osc.frequency.exponentialRampToValueAtTime(freq, now + 0.05);
        }, 150 + Math.random() * 350); // 150-500ms intervals
    }

    stop(engine) {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
    }
}

// ─── PULSE BURST ────────────────────────────────────────────────
// Phát xung ngắn, nghỉ ngẫu nhiên
export class PulseBurstPattern {
    constructor() {
        this.id = 'pulse-burst';
        this.name = 'Pulse Burst';
        this.nameVi = 'Xung Liên Tục';
        this.icon = 'zap';
        this.description = 'Phát xung âm thanh ngắn với khoảng nghỉ ngẫu nhiên. Gây giật mình cho chuột.';
        this.color = '#ff2d78';
        this._timeout = null;
    }

    start(engine) {
        const pulse = () => {
            if (!engine.isPlaying) return;
            const freq = engine.randomFrequency();
            const { osc, gain } = engine.createOscillator(freq, engine.waveform);
            const now = engine.audioCtx.currentTime;
            const burstDuration = 0.1 + Math.random() * 0.4; // 100-500ms
            const restDuration = 0.05 + Math.random() * 0.3; // 50-300ms

            // Fade in
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(1, now + 0.01);
            // Fade out
            gain.gain.setValueAtTime(1, now + burstDuration - 0.02);
            gain.gain.linearRampToValueAtTime(0, now + burstDuration);

            try { osc.stop(now + burstDuration + 0.05); } catch (e) { }

            this._timeout = setTimeout(() => {
                // Remove stopped oscillator
                engine.oscillators = engine.oscillators.filter(o => o.osc !== osc);
                pulse();
            }, (burstDuration + restDuration) * 1000);
        };
        pulse();
    }

    stop(engine) {
        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
    }
}

// ─── FM CHAOS ───────────────────────────────────────────────────
// Modulation tần số phức tạp
export class FMChaosPattern {
    constructor() {
        this.id = 'fm-chaos';
        this.name = 'FM Chaos';
        this.nameVi = 'Hỗn Loạn FM';
        this.icon = 'orbit';
        this.description = 'Điều chế tần số phức tạp tạo âm thanh biến đổi liên tục. Khó đoán nhất.';
        this.color = '#a855f7';
        this._interval = null;
    }

    start(engine) {
        const { min, max } = engine.frequencyRange;
        const centerFreq = (min + max) / 2;

        // Carrier oscillator
        const carrier = engine.audioCtx.createOscillator();
        carrier.type = engine.waveform;
        carrier.frequency.setValueAtTime(centerFreq, engine.audioCtx.currentTime);

        // Modulator (LFO)
        const modulator = engine.audioCtx.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.setValueAtTime(2, engine.audioCtx.currentTime); // 2 Hz modulation

        // Modulation depth
        const modGain = engine.audioCtx.createGain();
        modGain.gain.setValueAtTime((max - min) / 2, engine.audioCtx.currentTime);

        // Connect: modulator → modGain → carrier.frequency
        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        // Carrier → master gain
        const carrierGain = engine.audioCtx.createGain();
        carrierGain.gain.setValueAtTime(1, engine.audioCtx.currentTime);
        carrier.connect(carrierGain);
        carrierGain.connect(engine.masterGain);

        carrier.start();
        modulator.start();

        engine.oscillators.push({ osc: carrier, gain: carrierGain });
        engine.oscillators.push({ osc: modulator, gain: modGain });

        // Periodically change modulation rate for extra chaos
        this._interval = setInterval(() => {
            if (!engine.isPlaying) return;
            const newRate = 0.5 + Math.random() * 8; // 0.5-8.5 Hz
            const newDepth = (max - min) * (0.3 + Math.random() * 0.7);
            const now = engine.audioCtx.currentTime;
            modulator.frequency.linearRampToValueAtTime(newRate, now + 0.5);
            modGain.gain.linearRampToValueAtTime(newDepth, now + 0.5);
        }, 2000);
    }

    stop(engine) {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
    }
}

// ─── HARMONIC STACK ─────────────────────────────────────────────
// Nhiều oscillator đồng thời
export class HarmonicStackPattern {
    constructor() {
        this.id = 'harmonic-stack';
        this.name = 'Harmonic Stack';
        this.nameVi = 'Chồng Sóng Hài';
        this.icon = 'audio-lines';
        this.description = 'Phát nhiều tần số cùng lúc tạo phổ âm rộng. Bao phủ nhiều dải tần số nhất.';
        this.color = '#10b981';
        this._interval = null;
    }

    start(engine) {
        const { min, max } = engine.frequencyRange;
        const numOsc = 5;
        const step = (max - min) / (numOsc - 1);
        const waveforms = ['sine', 'square', 'sawtooth', 'triangle', 'sine'];

        for (let i = 0; i < numOsc; i++) {
            const freq = min + step * i;
            const { osc, gain } = engine.createOscillator(freq, waveforms[i]);
            gain.gain.setValueAtTime(1 / numOsc, engine.audioCtx.currentTime);
        }

        // Slowly drift frequencies
        this._interval = setInterval(() => {
            if (!engine.isPlaying) return;
            engine.oscillators.forEach(({ osc }, i) => {
                const baseFreq = min + step * i;
                const drift = (Math.random() - 0.5) * 500;
                const newFreq = Math.max(min, Math.min(max, baseFreq + drift));
                osc.frequency.linearRampToValueAtTime(newFreq, engine.audioCtx.currentTime + 1);
            });
        }, 3000);
    }

    stop(engine) {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
    }
}

// ─── PREDATOR MIMICRY ───────────────────────────────────────────
// Mô phỏng tiếng stress/distress calls
export class PredatorMimicryPattern {
    constructor() {
        this.id = 'predator-mimicry';
        this.name = 'Predator Mimicry';
        this.nameVi = 'Giả Tiếng Thiên Địch';
        this.icon = 'shield-alert';
        this.description = 'Mô phỏng tín hiệu stress 20kHz của chuột. Kích hoạt bản năng sợ hãi tự nhiên.';
        this.color = '#ef4444';
        this._timeout = null;
    }

    start(engine) {
        const stressFreqs = [18000, 19000, 19500, 20000, 19000, 18500];
        let idx = 0;

        const emit = () => {
            if (!engine.isPlaying) return;
            engine.stopAllOscillators();

            const freq = stressFreqs[idx % stressFreqs.length];
            const { osc, gain } = engine.createOscillator(freq, 'sine');
            const now = engine.audioCtx.currentTime;

            // Rapid amplitude modulation (tremolo) to mimic vocal quality
            const tremolo = engine.audioCtx.createOscillator();
            const tremoloGain = engine.audioCtx.createGain();
            tremolo.type = 'sine';
            tremolo.frequency.setValueAtTime(30 + Math.random() * 20, now); // 30-50 Hz tremolo
            tremoloGain.gain.setValueAtTime(0.3, now);
            tremolo.connect(tremoloGain);
            tremoloGain.connect(gain.gain);
            tremolo.start();
            engine.oscillators.push({ osc: tremolo, gain: tremoloGain });

            // Duration varies
            const duration = 0.5 + Math.random() * 1.5;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.8, now + 0.05);
            gain.gain.setValueAtTime(0.8, now + duration - 0.1);
            gain.gain.linearRampToValueAtTime(0, now + duration);

            const rest = 0.2 + Math.random() * 0.8;
            idx++;

            this._timeout = setTimeout(emit, (duration + rest) * 1000);
        };
        emit();
    }

    stop(engine) {
        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
    }
}

// Export all patterns
export const ALL_PATTERNS = [
    new LinearSweepPattern(),
    new RandomJumpPattern(),
    new PulseBurstPattern(),
    new FMChaosPattern(),
    new HarmonicStackPattern(),
    new PredatorMimicryPattern(),
];
