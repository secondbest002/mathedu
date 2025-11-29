class AudioSynthesizer {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Volume global
        this.masterGain.connect(this.ctx.destination);
        this.enabled = true;
    }

    playTone(freq, type, duration, startTime = 0) {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    }

    playClick() {
        // Suara "Klik" UI: Short high blip
        this.playTone(800, 'sine', 0.1);
    }

    playStep() {
        // Suara langkah kaki/drone: Low tick
        this.playTone(200, 'triangle', 0.05);
    }

    playSlide() {
        // Suara geser/flip: Frequency sweep effect
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playSuccess() {
        // Suara sukses: Major Arpeggio (C - E - G)
        this.playTone(523.25, 'sine', 0.3, 0);
        this.playTone(659.25, 'sine', 0.3, 0.1);
        this.playTone(783.99, 'sine', 0.6, 0.2);
    }

    playError() {
        // Suara error: Descending low buzz
        this.playTone(150, 'sawtooth', 0.3, 0);
        this.playTone(100, 'sawtooth', 0.4, 0.15);
    }
}

// Global Instance
const audioManager = new AudioSynthesizer();

// Helper untuk resume AudioContext (browser memblokir audio sebelum user interaksi pertama)
window.initAudio = function() {
    if (audioManager.ctx.state === 'suspended') {
        audioManager.ctx.resume();
    }
}