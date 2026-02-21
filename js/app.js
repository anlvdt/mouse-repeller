/**
 * Mouse Repeller - Main Application
 */
import { AudioEngine } from './audio-engine.js';
import { ALL_PATTERNS } from './patterns.js';

class MouseRepellerApp {
    constructor() {
        this.engine = new AudioEngine();
        this.patterns = ALL_PATTERNS;
        this.selectedPatternIndex = 0;
        this.isActive = false;
        this.timerDuration = 0; // 0 = unlimited
        this.timerRemaining = 0;
        this.timerInterval = null;
        this.wakeLock = null;
        this.visualizerRAF = null;

        // Automation state
        this.autoRotateEnabled = false;
        this.autoRotateHours = 1;
        this.autoRotateInterval = null;
        this.scheduleEnabled = false;
        this.scheduleDayPattern = 0;
        this.scheduleNightPattern = 3; // FM Chaos
        this.scheduleNightStart = '22:00';
        this.scheduleDayStart = '06:00';
        this.scheduleCheckInterval = null;

        // Smart Schedule state
        this.smartScheduleEnabled = false;
        this.smartScheduleStart = '19:00';
        this.smartScheduleEnd = '05:30';
        this.smartScheduleInterval = null;
        this.smartScheduleWasAutoActivated = false;
        this.preSmartSettings = null;

        // Advanced mode (false = one-button smart mode)
        this.advancedMode = false;

        // Wake lock visibility handler (stored for cleanup)
        this._wakeLockVisibilityHandler = null;

        this.loadSettings();
        this.initUI();
        this.initAdvancedPanel();
        this.initAutomation();
        this.initVisualizer();
        this.renderResearchData();
    }

    // ─── SETTINGS ───────────────────────────────────────────────
    loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem('mouseRepellerSettings') || '{}');
            if (saved.volume !== undefined) this.engine.volume = saved.volume;
            if (saved.freqMin !== undefined) this.engine.frequencyRange.min = saved.freqMin;
            if (saved.freqMax !== undefined) this.engine.frequencyRange.max = saved.freqMax;
            if (saved.waveform) this.engine.waveform = saved.waveform;
            if (saved.pattern !== undefined) this.selectedPatternIndex = saved.pattern;
            if (saved.timer !== undefined) this.timerDuration = saved.timer;
            if (saved.autoRotateEnabled !== undefined) this.autoRotateEnabled = saved.autoRotateEnabled;
            if (saved.autoRotateHours !== undefined) this.autoRotateHours = saved.autoRotateHours;
            if (saved.scheduleEnabled !== undefined) this.scheduleEnabled = saved.scheduleEnabled;
            if (saved.scheduleDayPattern !== undefined) this.scheduleDayPattern = saved.scheduleDayPattern;
            if (saved.scheduleNightPattern !== undefined) this.scheduleNightPattern = saved.scheduleNightPattern;
            if (saved.scheduleNightStart) this.scheduleNightStart = saved.scheduleNightStart;
            if (saved.scheduleDayStart) this.scheduleDayStart = saved.scheduleDayStart;
            if (saved.smartScheduleEnabled !== undefined) this.smartScheduleEnabled = saved.smartScheduleEnabled;
            if (saved.smartScheduleStart) this.smartScheduleStart = saved.smartScheduleStart;
            if (saved.smartScheduleEnd) this.smartScheduleEnd = saved.smartScheduleEnd;
            if (saved.advancedMode !== undefined) this.advancedMode = saved.advancedMode;
        } catch (e) { }
    }

    saveSettings() {
        localStorage.setItem('mouseRepellerSettings', JSON.stringify({
            volume: this.engine.volume,
            freqMin: this.engine.frequencyRange.min,
            freqMax: this.engine.frequencyRange.max,
            waveform: this.engine.waveform,
            pattern: this.selectedPatternIndex,
            timer: this.timerDuration,
            autoRotateEnabled: this.autoRotateEnabled,
            autoRotateHours: this.autoRotateHours,
            scheduleEnabled: this.scheduleEnabled,
            scheduleDayPattern: this.scheduleDayPattern,
            scheduleNightPattern: this.scheduleNightPattern,
            scheduleNightStart: this.scheduleNightStart,
            scheduleDayStart: this.scheduleDayStart,
            smartScheduleEnabled: this.smartScheduleEnabled,
            smartScheduleStart: this.smartScheduleStart,
            smartScheduleEnd: this.smartScheduleEnd,
            advancedMode: this.advancedMode,
        }));
    }

    // ─── UI INIT ────────────────────────────────────────────────
    initUI() {
        // Power button
        this.powerBtn = document.getElementById('power-btn');
        this.powerBtn.addEventListener('click', () => this.togglePower());

        // Status text
        this.statusText = document.getElementById('status-text');
        this.freqDisplay = document.getElementById('freq-display');

        // Pattern cards
        this.renderPatternCards();

        // Volume slider
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeValue = document.getElementById('volume-value');
        this.volumeSlider.value = this.engine.volume;
        this.volumeValue.textContent = this.engine.volume + '%';
        this.volumeSlider.addEventListener('input', (e) => {
            this.engine.setVolume(parseInt(e.target.value));
            this.volumeValue.textContent = e.target.value + '%';
            this.saveSettings();
        });

        // Frequency range sliders
        this.freqMinSlider = document.getElementById('freq-min');
        this.freqMaxSlider = document.getElementById('freq-max');
        this.freqMinValue = document.getElementById('freq-min-value');
        this.freqMaxValue = document.getElementById('freq-max-value');

        this.freqMinSlider.value = this.engine.frequencyRange.min;
        this.freqMaxSlider.value = this.engine.frequencyRange.max;
        this.freqMinValue.textContent = this.formatFreq(this.engine.frequencyRange.min);
        this.freqMaxValue.textContent = this.formatFreq(this.engine.frequencyRange.max);

        this.freqMinSlider.addEventListener('input', (e) => {
            let val = parseInt(e.target.value);
            if (val >= parseInt(this.freqMaxSlider.value)) {
                val = parseInt(this.freqMaxSlider.value) - 100;
                e.target.value = val;
            }
            this.engine.frequencyRange.min = val;
            this.freqMinValue.textContent = this.formatFreq(val);
            this.saveSettings();
        });

        this.freqMaxSlider.addEventListener('input', (e) => {
            let val = parseInt(e.target.value);
            if (val <= parseInt(this.freqMinSlider.value)) {
                val = parseInt(this.freqMinSlider.value) + 100;
                e.target.value = val;
            }
            this.engine.frequencyRange.max = val;
            this.freqMaxValue.textContent = this.formatFreq(val);
            this.saveSettings();
        });

        // Waveform selector
        this.waveformBtns = document.querySelectorAll('.waveform-btn');
        this.waveformBtns.forEach(btn => {
            if (btn.dataset.wave === this.engine.waveform) btn.classList.add('active');
            btn.addEventListener('click', () => {
                this.waveformBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.engine.setWaveform(btn.dataset.wave);
                this.saveSettings();
                if (this.isActive) this.restart();
            });
        });

        // Timer
        this.timerSelect = document.getElementById('timer-select');
        this.timerDisplay = document.getElementById('timer-display');
        this.timerSelect.value = this.timerDuration;
        this.timerSelect.addEventListener('change', (e) => {
            this.timerDuration = parseInt(e.target.value);
            this.saveSettings();
        });

        // Pet warning toggle
        this.petWarning = document.getElementById('pet-warning');
        this.petToggle = document.getElementById('pet-toggle');
        this.petToggle.addEventListener('change', () => {
            this.petWarning.classList.toggle('show', this.petToggle.checked);
        });

        // Tab navigation for info section
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.add('active');
            });
        });

        // Research modal
        this.researchModal = document.getElementById('research-modal');
        const openBtn = document.getElementById('open-research');
        const closeBtn = document.getElementById('close-research');
        const backdrop = this.researchModal?.querySelector('.modal-backdrop');

        if (openBtn) {
            openBtn.addEventListener('click', () => this.openResearchModal());
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeResearchModal());
        }
        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeResearchModal());
        }
        // ESC key closes modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.researchModal?.classList.contains('open')) {
                this.closeResearchModal();
            }
        });
    }

    // ─── ADVANCED PANEL ─────────────────────────────────────────
    initAdvancedPanel() {
        const panel = document.getElementById('advanced-panel');
        const gearBtn = document.getElementById('advanced-gear-btn');
        if (!panel) return;

        // Advanced panel always starts closed
        panel.removeAttribute('open');

        // Gear button toggles the details panel
        if (gearBtn) {
            gearBtn.addEventListener('click', () => {
                if (panel.hasAttribute('open')) {
                    panel.removeAttribute('open');
                } else {
                    panel.setAttribute('open', '');
                    // Scroll to show advanced content
                    setTimeout(() => {
                        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            });
        }

        // When panel is opened, user enters advanced mode
        panel.addEventListener('toggle', () => {
            const isOpen = panel.hasAttribute('open');
            localStorage.setItem('mouseRepellerAdvancedOpen', isOpen);

            if (isOpen && !this.advancedMode) {
                this.advancedMode = true;
                this.saveSettings();
            }

            // Re-init Lucide icons for newly visible elements
            if (isOpen && window.lucide) lucide.createIcons();
        });
    }

    // ─── RESEARCH MODAL ──────────────────────────────────────────
    openResearchModal() {
        if (!this.researchModal) return;
        this.researchModal.classList.add('open');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
            this.researchModal.classList.add('visible');
        });
    }

    closeResearchModal() {
        if (!this.researchModal) return;
        this.researchModal.classList.remove('visible');
        setTimeout(() => {
            this.researchModal.classList.remove('open');
            document.body.style.overflow = '';
        }, 300);
    }

    // ─── PATTERN CARDS ──────────────────────────────────────────
    renderPatternCards() {
        const container = document.getElementById('pattern-cards');
        container.innerHTML = '';
        this.patterns.forEach((p, i) => {
            const card = document.createElement('div');
            card.className = `pattern-card ${i === this.selectedPatternIndex ? 'active' : ''}`;
            card.style.setProperty('--card-color', p.color);
            card.innerHTML = `
        <div class="pattern-icon"><i data-lucide="${p.icon}"></i></div>
        <div class="pattern-name">${p.nameVi}</div>
        <div class="pattern-desc">${p.description}</div>
      `;
            card.addEventListener('click', () => this.selectPattern(i));
            container.appendChild(card);
        });
        // Activate Lucide icons in newly rendered cards
        if (window.lucide) lucide.createIcons();
    }

    selectPattern(index) {
        this.selectedPatternIndex = index;
        document.querySelectorAll('.pattern-card').forEach((c, i) => {
            c.classList.toggle('active', i === index);
        });
        this.saveSettings();
        if (this.isActive) this.restart();
    }

    // ─── POWER ──────────────────────────────────────────────────
    togglePower() {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }

    activate() {
        // In default (non-advanced) mode, auto-apply optimal settings
        if (!this.advancedMode && !this.preSmartSettings) {
            this.applyOptimalSettings();
            // Also auto-enable Smart Schedule if not already
            if (!this.smartScheduleEnabled) {
                this.smartScheduleEnabled = true;
                const smartToggle = document.getElementById('smart-schedule-toggle');
                if (smartToggle) smartToggle.checked = true;
                const smartOptions = document.getElementById('smart-schedule-options');
                if (smartOptions) smartOptions.classList.remove('hidden');
                this.startSmartSchedule();
            }
        }

        this.isActive = true;
        this.engine.start(this.patterns[this.selectedPatternIndex]);
        this.powerBtn.classList.add('active');
        this.statusText.textContent = 'ĐANG HOẠT ĐỘNG';
        this.statusText.classList.add('active');
        document.body.classList.add('active-state');

        // Show freq, visualizer, and chase animation
        const viz = document.querySelector('.visualizer-container');
        const chase = document.querySelector('.chase-scene');
        const freq = document.getElementById('freq-display');
        if (freq) freq.style.display = '';
        if (viz) viz.style.display = '';
        if (chase) chase.style.display = '';

        // Resize canvas now that container is visible
        this.resizeCanvas();

        // Request wake lock
        this.requestWakeLock();

        // Start timer if set
        if (this.timerDuration > 0) {
            this.timerRemaining = this.timerDuration * 60;
            this.startTimer();
        }

        this.startVisualizer();
        this.saveSettings();
    }

    deactivate() {
        this.isActive = false;
        this.engine.stop();
        this.powerBtn.classList.remove('active');
        this.statusText.textContent = 'BẤM ĐỂ BẬT';
        this.statusText.classList.remove('active');
        document.body.classList.remove('active-state');

        // Hide freq, visualizer, and chase animation
        const viz = document.querySelector('.visualizer-container');
        const chase = document.querySelector('.chase-scene');
        const freq = document.getElementById('freq-display');
        if (freq) freq.style.display = 'none';
        if (viz) viz.style.display = 'none';
        if (chase) chase.style.display = 'none';

        this.releaseWakeLock();
        this.stopTimer();
        this.stopVisualizer();
    }

    restart() {
        if (this.isActive) {
            this.engine.stop();
            this.engine.start(this.patterns[this.selectedPatternIndex]);
        }
    }

    // ─── TIMER ──────────────────────────────────────────────────
    startTimer() {
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            this.timerRemaining--;
            this.updateTimerDisplay();
            if (this.timerRemaining <= 0) {
                this.deactivate();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerDisplay.textContent = '';
    }

    updateTimerDisplay() {
        const m = Math.floor(this.timerRemaining / 60);
        const s = this.timerRemaining % 60;
        this.timerDisplay.textContent = `${m}:${s.toString().padStart(2, '0')} còn lại`;
    }

    // ─── WAKE LOCK ──────────────────────────────────────────────
    async requestWakeLock() {
        if (!('wakeLock' in navigator)) return;
        try {
            this.wakeLock = await navigator.wakeLock.request('screen');

            // Re-acquire when tab becomes visible again (OS may release it when hidden)
            if (!this._wakeLockVisibilityHandler) {
                this._wakeLockVisibilityHandler = async () => {
                    if (document.visibilityState === 'visible' && this.isActive) {
                        try {
                            this.wakeLock = await navigator.wakeLock.request('screen');
                        } catch (e) { /* Silently ignore */ }
                    }
                };
                document.addEventListener('visibilitychange', this._wakeLockVisibilityHandler);
            }
        } catch (e) { /* Not supported or permission denied */ }
    }

    releaseWakeLock() {
        if (this.wakeLock) {
            this.wakeLock.release().catch(() => { });
            this.wakeLock = null;
        }
        // Remove the visibility listener when the repeller is turned off
        if (this._wakeLockVisibilityHandler) {
            document.removeEventListener('visibilitychange', this._wakeLockVisibilityHandler);
            this._wakeLockVisibilityHandler = null;
        }
    }

    // ─── VISUALIZER ─────────────────────────────────────────────
    initVisualizer() {
        this.canvas = document.getElementById('visualizer');
        this.canvasCtx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        // Draw idle state
        this.drawIdle();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    startVisualizer() {
        const draw = () => {
            if (!this.isActive) return;
            this.visualizerRAF = requestAnimationFrame(draw);

            const width = this.canvas.width;
            const height = this.canvas.height;
            const ctx = this.canvasCtx;

            // Get frequency data
            const dataArray = this.engine.getTimeDomainData();
            const bufferLength = dataArray.length;

            // Clear with transparency
            ctx.clearRect(0, 0, width, height);

            // Draw waveform
            ctx.lineWidth = 3;

            // Gradient stroke
            const gradient = ctx.createLinearGradient(0, 0, width, 0);
            const pattern = this.patterns[this.selectedPatternIndex];
            gradient.addColorStop(0, pattern.color + '80');
            gradient.addColorStop(0.5, pattern.color);
            gradient.addColorStop(1, pattern.color + '80');
            ctx.strokeStyle = gradient;

            ctx.beginPath();
            const sliceWidth = width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * height) / 2;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                x += sliceWidth;
            }

            ctx.lineTo(width, height / 2);
            ctx.stroke();

            // Draw glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = pattern.color;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Update frequency display
            const freq = this.engine.getCurrentFrequency();
            if (freq > 0 && this.freqDisplay) {
                this.freqDisplay.textContent = this.formatFreq(freq);
            }
        };
        draw();
    }

    stopVisualizer() {
        if (this.visualizerRAF) {
            cancelAnimationFrame(this.visualizerRAF);
            this.visualizerRAF = null;
        }
        this.drawIdle();
        if (this.freqDisplay) {
            this.freqDisplay.textContent = '---';
        }
    }

    drawIdle() {
        const ctx = this.canvasCtx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        ctx.clearRect(0, 0, width, height);

        // Draw flat line
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
    }

    // ─── RESEARCH DATA ──────────────────────────────────────────
    renderResearchData() {
        // This is rendered via HTML, but we add interactivity here
        const accordions = document.querySelectorAll('.accordion-header');
        accordions.forEach(header => {
            header.addEventListener('click', () => {
                const item = header.parentElement;
                item.classList.toggle('open');
            });
        });
    }

    // ─── AUTOMATION ──────────────────────────────────────────────
    initAutomation() {
        // --- Auto-rotate ---
        const rotateToggle = document.getElementById('auto-rotate-toggle');
        const rotateOptions = document.getElementById('auto-rotate-options');
        const rotateChips = document.querySelectorAll('.auto-chip[data-rotate]');

        rotateToggle.checked = this.autoRotateEnabled;
        rotateOptions.classList.toggle('hidden', !this.autoRotateEnabled);
        rotateChips.forEach(c => c.classList.toggle('active', parseInt(c.dataset.rotate) === this.autoRotateHours));

        rotateToggle.addEventListener('change', () => {
            this.autoRotateEnabled = rotateToggle.checked;
            rotateOptions.classList.toggle('hidden', !rotateToggle.checked);
            if (rotateToggle.checked) {
                // Disable other automations
                this.scheduleEnabled = false;
                document.getElementById('schedule-toggle').checked = false;
                document.getElementById('schedule-options').classList.add('hidden');
                this.stopSchedule();
                this.smartScheduleEnabled = false;
                if (document.getElementById('smart-schedule-toggle')) document.getElementById('smart-schedule-toggle').checked = false;
                if (document.getElementById('smart-schedule-options')) document.getElementById('smart-schedule-options').classList.add('hidden');
                this.stopSmartSchedule();
                // Auto-activate audio if not already playing
                if (!this.isActive) this.activate();
                this.startAutoRotate();
            } else {
                this.stopAutoRotate();
            }
            this.saveSettings();
        });

        rotateChips.forEach(chip => {
            chip.addEventListener('click', () => {
                rotateChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.autoRotateHours = parseInt(chip.dataset.rotate);
                if (this.autoRotateEnabled) this.startAutoRotate();
                this.saveSettings();
            });
        });

        // --- Day/Night Schedule ---
        const scheduleToggle = document.getElementById('schedule-toggle');
        const scheduleOptions = document.getElementById('schedule-options');
        const daySelect = document.getElementById('schedule-day-pattern');
        const nightSelect = document.getElementById('schedule-night-pattern');
        const nightStart = document.getElementById('schedule-night-start');
        const dayStart = document.getElementById('schedule-day-start');

        // Populate pattern selects
        this.patterns.forEach((p, i) => {
            daySelect.add(new Option(p.nameVi, i));
            nightSelect.add(new Option(p.nameVi, i));
        });
        daySelect.value = this.scheduleDayPattern;
        nightSelect.value = this.scheduleNightPattern;
        nightStart.value = this.scheduleNightStart;
        dayStart.value = this.scheduleDayStart;
        scheduleToggle.checked = this.scheduleEnabled;
        scheduleOptions.classList.toggle('hidden', !this.scheduleEnabled);

        scheduleToggle.addEventListener('change', () => {
            this.scheduleEnabled = scheduleToggle.checked;
            scheduleOptions.classList.toggle('hidden', !scheduleToggle.checked);
            if (scheduleToggle.checked) {
                // Disable other automations
                this.autoRotateEnabled = false;
                rotateToggle.checked = false;
                rotateOptions.classList.add('hidden');
                this.stopAutoRotate();
                this.smartScheduleEnabled = false;
                if (document.getElementById('smart-schedule-toggle')) document.getElementById('smart-schedule-toggle').checked = false;
                if (document.getElementById('smart-schedule-options')) document.getElementById('smart-schedule-options').classList.add('hidden');
                this.stopSmartSchedule();
                // Auto-activate audio if not already playing
                if (!this.isActive) this.activate();
                this.startSchedule();
            } else {
                this.stopSchedule();
            }
            this.saveSettings();
        });

        [daySelect, nightSelect, nightStart, dayStart].forEach(el => {
            el.addEventListener('change', () => {
                this.scheduleDayPattern = parseInt(daySelect.value);
                this.scheduleNightPattern = parseInt(nightSelect.value);
                this.scheduleNightStart = nightStart.value;
                this.scheduleDayStart = dayStart.value;
                if (this.scheduleEnabled) this.applyScheduleNow();
                this.saveSettings();
            });
        });

        // Restore active automations on page load (auto-activate audio)
        if (this.autoRotateEnabled) {
            if (!this.isActive) this.activate();
            this.startAutoRotate();
        }
        if (this.scheduleEnabled) {
            if (!this.isActive) this.activate();
            this.startSchedule();
        }

        // --- Smart Schedule ---
        const smartToggle = document.getElementById('smart-schedule-toggle');
        const smartOptions = document.getElementById('smart-schedule-options');
        const smartStartTime = document.getElementById('smart-start-time');
        const smartEndTime = document.getElementById('smart-end-time');

        if (smartToggle) {
            smartToggle.checked = this.smartScheduleEnabled;
            if (smartOptions) smartOptions.classList.toggle('hidden', !this.smartScheduleEnabled);
            if (smartStartTime) smartStartTime.value = this.smartScheduleStart;
            if (smartEndTime) smartEndTime.value = this.smartScheduleEnd;

            smartToggle.addEventListener('change', () => {
                this.smartScheduleEnabled = smartToggle.checked;
                if (smartOptions) smartOptions.classList.toggle('hidden', !smartToggle.checked);
                if (smartToggle.checked) {
                    // Disable other automations for clarity (Smart Schedule is all-in-one)
                    this.autoRotateEnabled = false;
                    rotateToggle.checked = false;
                    rotateOptions.classList.add('hidden');
                    this.stopAutoRotate();
                    this.scheduleEnabled = false;
                    scheduleToggle.checked = false;
                    scheduleOptions.classList.add('hidden');
                    this.stopSchedule();
                    this.startSmartSchedule();
                } else {
                    this.stopSmartSchedule();
                }
                this.saveSettings();
            });

            [smartStartTime, smartEndTime].forEach(el => {
                if (!el) return;
                el.addEventListener('change', () => {
                    if (smartStartTime) this.smartScheduleStart = smartStartTime.value;
                    if (smartEndTime) this.smartScheduleEnd = smartEndTime.value;
                    if (this.smartScheduleEnabled) this.applySmartScheduleNow();
                    this.saveSettings();
                });
            });

            // Restore if was active
            if (this.smartScheduleEnabled) this.startSmartSchedule();
        }

        // Init Lucide for new automation icons
        if (window.lucide) lucide.createIcons();
    }

    startAutoRotate() {
        this.stopAutoRotate();
        const ms = this.autoRotateHours * 60 * 60 * 1000;
        const status = document.getElementById('rotate-status');
        const nextName = this.patterns[(this.selectedPatternIndex + 1) % this.patterns.length].nameVi;
        status.innerHTML = `${this._icon('rotate-cw', 'var(--accent-primary)')} Đổi mỗi ${this.autoRotateHours}h — tiếp: ${nextName}`;

        this.autoRotateInterval = setInterval(() => {
            if (!this.isActive) return;
            const next = (this.selectedPatternIndex + 1) % this.patterns.length;
            this.selectPattern(next);
            this.restart();
            const nxt = this.patterns[(next + 1) % this.patterns.length].nameVi;
            status.innerHTML = `${this._icon('rotate-cw', 'var(--accent-primary)')} Đổi mỗi ${this.autoRotateHours}h — tiếp: ${nxt}`;
        }, ms);
    }

    stopAutoRotate() {
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
            this.autoRotateInterval = null;
        }
        const status = document.getElementById('rotate-status');
        if (status) status.textContent = '';
    }

    startSchedule() {
        this.stopSchedule();
        this.applyScheduleNow();
        // Check every minute
        this.scheduleCheckInterval = setInterval(() => {
            if (this.scheduleEnabled) this.applyScheduleNow();
        }, 60000);
    }

    applyScheduleNow() {
        const now = new Date();
        const hhmm = now.getHours() * 60 + now.getMinutes();
        const [nh, nm] = this.scheduleNightStart.split(':').map(Number);
        const [dh, dm] = this.scheduleDayStart.split(':').map(Number);
        const nightMinutes = nh * 60 + nm;
        const dayMinutes = dh * 60 + dm;

        let isNight;
        if (nightMinutes > dayMinutes) {
            isNight = hhmm >= nightMinutes || hhmm < dayMinutes;
        } else {
            isNight = hhmm >= nightMinutes && hhmm < dayMinutes;
        }

        const targetPattern = isNight ? this.scheduleNightPattern : this.scheduleDayPattern;
        const status = document.getElementById('schedule-status');
        const icon = isNight
            ? this._icon('moon', 'var(--accent-secondary)')
            : this._icon('sun', 'var(--accent-warning)');
        const label = isNight ? 'Đêm' : 'Ngày';
        status.innerHTML = `${icon} ${label} — ${this.patterns[targetPattern].nameVi}`;

        if (targetPattern !== this.selectedPatternIndex) {
            this.selectPattern(targetPattern);
            if (this.isActive) this.restart();
        }
    }

    stopSchedule() {
        if (this.scheduleCheckInterval) {
            clearInterval(this.scheduleCheckInterval);
            this.scheduleCheckInterval = null;
        }
        const status = document.getElementById('schedule-status');
        if (status) status.textContent = '';
    }

    // ─── SMART SCHEDULE ──────────────────────────────────────────
    startSmartSchedule() {
        this.stopSmartSchedule();
        this.applySmartScheduleNow();
        // Check every minute
        this.smartScheduleInterval = setInterval(() => {
            if (this.smartScheduleEnabled) this.applySmartScheduleNow();
        }, 60000);
    }

    applySmartScheduleNow() {
        const now = new Date();
        const hhmm = now.getHours() * 60 + now.getMinutes();
        const [sh, sm] = this.smartScheduleStart.split(':').map(Number);
        const [eh, em] = this.smartScheduleEnd.split(':').map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;

        let isActiveTime;
        if (startMin > endMin) {
            // Crosses midnight (e.g. 19:00 – 05:30)
            isActiveTime = hhmm >= startMin || hhmm < endMin;
        } else {
            isActiveTime = hhmm >= startMin && hhmm < endMin;
        }

        const status = document.getElementById('smart-schedule-status');

        if (isActiveTime && !this.isActive) {
            // AUTO-ACTIVATE with optimized settings
            this.applyOptimalSettings();
            this.activate();
            this.smartScheduleWasAutoActivated = true;
            if (status) status.innerHTML = `${this._icon('check-circle', 'var(--accent-success)')} Đang hoạt động — Đã tối ưu hóa`;
        } else if (isActiveTime && this.isActive) {
            if (status) status.innerHTML = `${this._icon('check-circle', 'var(--accent-success)')} Đang hoạt động — Đã tối ưu hóa`;
        } else if (!isActiveTime && this.isActive && this.smartScheduleWasAutoActivated) {
            // AUTO-DEACTIVATE and restore settings
            this.deactivate();
            this.restorePreSmartSettings();
            this.smartScheduleWasAutoActivated = false;
            const nextStart = this.smartScheduleStart;
            if (status) status.innerHTML = `${this._icon('clock', 'var(--accent-warning)')} Đang chờ — Bật lúc ${nextStart}`;
        } else if (!isActiveTime) {
            const nextStart = this.smartScheduleStart;
            if (status) status.innerHTML = `${this._icon('clock', 'var(--accent-warning)')} Đang chờ — Bật lúc ${nextStart}`;
        }
    }

    applyOptimalSettings() {
        // Save current user settings first
        this.preSmartSettings = {
            volume: this.engine.volume,
            freqMin: this.engine.frequencyRange.min,
            freqMax: this.engine.frequencyRange.max,
            waveform: this.engine.waveform,
            pattern: this.selectedPatternIndex,
        };

        // Apply optimal settings for maximum effectiveness
        this.engine.volume = 100;
        this.engine.frequencyRange.min = 15000;
        this.engine.frequencyRange.max = 20000;
        this.engine.waveform = 'square';
        // FM Chaos = index 3 (best anti-habituation)
        const fmChaosIndex = this.patterns.findIndex(p => p.id === 'fm-chaos');
        if (fmChaosIndex >= 0) this.selectPattern(fmChaosIndex);

        // Update UI to reflect optimized values
        const volumeSlider = document.getElementById('volume-slider');
        const volumeValue = document.getElementById('volume-value');
        const freqMinSlider = document.getElementById('freq-min');
        const freqMinValue = document.getElementById('freq-min-value');
        const freqMaxSlider = document.getElementById('freq-max');
        const freqMaxValue = document.getElementById('freq-max-value');

        if (volumeSlider) { volumeSlider.value = 100; }
        if (volumeValue) { volumeValue.textContent = '100%'; }
        if (freqMinSlider) { freqMinSlider.value = 15000; }
        if (freqMinValue) { freqMinValue.textContent = this.formatFreq(15000); }
        if (freqMaxSlider) { freqMaxSlider.value = 20000; }
        if (freqMaxValue) { freqMaxValue.textContent = this.formatFreq(20000); }

        // Update waveform buttons
        document.querySelectorAll('.waveform-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.wave === 'square');
            btn.setAttribute('aria-pressed', btn.dataset.wave === 'square' ? 'true' : 'false');
        });
    }

    restorePreSmartSettings() {
        if (!this.preSmartSettings) return;
        const s = this.preSmartSettings;

        this.engine.volume = s.volume;
        this.engine.frequencyRange.min = s.freqMin;
        this.engine.frequencyRange.max = s.freqMax;
        this.engine.waveform = s.waveform;
        this.selectPattern(s.pattern);

        // Restore UI
        const volumeSlider = document.getElementById('volume-slider');
        const volumeValue = document.getElementById('volume-value');
        const freqMinSlider = document.getElementById('freq-min');
        const freqMinValue = document.getElementById('freq-min-value');
        const freqMaxSlider = document.getElementById('freq-max');
        const freqMaxValue = document.getElementById('freq-max-value');

        if (volumeSlider) { volumeSlider.value = s.volume; }
        if (volumeValue) { volumeValue.textContent = s.volume + '%'; }
        if (freqMinSlider) { freqMinSlider.value = s.freqMin; }
        if (freqMinValue) { freqMinValue.textContent = this.formatFreq(s.freqMin); }
        if (freqMaxSlider) { freqMaxSlider.value = s.freqMax; }
        if (freqMaxValue) { freqMaxValue.textContent = this.formatFreq(s.freqMax); }

        document.querySelectorAll('.waveform-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.wave === s.waveform);
            btn.setAttribute('aria-pressed', btn.dataset.wave === s.waveform ? 'true' : 'false');
        });

        this.preSmartSettings = null;
        this.saveSettings();
    }

    stopSmartSchedule() {
        if (this.smartScheduleInterval) {
            clearInterval(this.smartScheduleInterval);
            this.smartScheduleInterval = null;
        }
        // If it was auto-activated, deactivate and restore
        if (this.smartScheduleWasAutoActivated && this.isActive) {
            this.deactivate();
            this.restorePreSmartSettings();
            this.smartScheduleWasAutoActivated = false;
        }
        const status = document.getElementById('smart-schedule-status');
        if (status) status.textContent = '';
    }

    // ─── HELPERS ────────────────────────────────────────────────
    /**
     * Returns a tiny inline SVG icon string for use in innerHTML status labels.
     * Uses Lucide icon paths directly. color is a CSS color string.
     */
    _icon(name, color = 'currentColor') {
        const s = '13';
        const base = `width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;flex-shrink:0"`;
        const paths = {
            'rotate-cw': '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
            'moon': '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
            'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
            'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
            'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        };
        return `<svg xmlns="http://www.w3.org/2000/svg" ${base}>${paths[name] ?? ''}</svg>`;
    }

    formatFreq(hz) {
        if (hz >= 1000) {
            return (hz / 1000).toFixed(1) + ' kHz';
        }
        return hz + ' Hz';
    }

}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MouseRepellerApp();
});
