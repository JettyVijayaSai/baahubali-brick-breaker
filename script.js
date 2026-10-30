/**
 * Baahubali: The Brick Breaker - Mahishmati Metal Smasher
 * Pure Vanilla JavaScript, HTML5 Canvas, Web Audio API & Speech Synthesis Engine
 */

(function () {
  'use strict';

  // ==========================================================================
  // CONFIGURATION & CONSTANTS
  // ==========================================================================
  const CANVAS_WIDTH = 1280;
  const CANVAS_HEIGHT = 720;

  const CHARACTERS = [
    {
      id: 'char1',
      name: 'AMARENDRA BAAHUBALI',
      shortName: 'BAAHUBALI',
      title: 'The Rightful King',
      primaryColor: '#f5b027',
      auraColor: 'rgba(245, 176, 39, 0.8)',
      imageSrc: 'assets/char1.png',
      dialogues: [
        { text: "JAI MAHISHMATI!", audioSrc: 'assets/char1_audio1.mp3' },
        { text: "NAA MAATAE SHASANAM!", audioSrc: 'assets/char1_audio2.mp3' },
        { text: "EVADRA MAA RAJYAM JOLIKI VACHEDI!", audioSrc: 'assets/char1_audio3.mp3' }
      ]
    },
    {
      id: 'char2',
      name: 'BHALLALADEVA',
      shortName: 'BHALLALADEVA',
      title: 'Fierce Destroyer',
      primaryColor: '#ff4757',
      auraColor: 'rgba(255, 71, 87, 0.8)',
      imageSrc: 'assets/char2.png',
      dialogues: [
        { text: "EE MAHISHMATI NAAKAE SOWNTHAM!", audioSrc: 'assets/char2_audio1.mp3' },
        { text: "GADHA THO MUKKALU CHESTHA!", audioSrc: 'assets/char2_audio2.mp3' },
        { text: "NANNU EVADU AAPALEDU!", audioSrc: 'assets/char2_audio3.mp3' }
      ]
    },
    {
      id: 'char3',
      name: 'KATTAPPA',
      shortName: 'KATTAPPA',
      title: 'Loyal Commander',
      primaryColor: '#2ed573',
      auraColor: 'rgba(46, 213, 115, 0.8)',
      imageSrc: 'assets/char3.png',
      dialogues: [
        { text: "RAAJU GAARI AAGNA!", audioSrc: 'assets/char3_audio1.mp3' },
        { text: "MAHISHMATI SIMHASANAM KOSAME NAA PRANAM!", audioSrc: 'assets/char3_audio2.mp3' },
        { text: "AYYA BAAHUBALI!", audioSrc: 'assets/char3_audio3.mp3' }
      ]
    }
  ];

  // Metal Bar Tiers (Destructible Targets)
  const METAL_TIERS = {
    BRONZE: {
      hits: 1,
      points: 100,
      name: 'Bronze Ingot',
      colorTop: '#e69555',
      colorMid: '#cd7f32',
      colorBot: '#8c4a16',
      bevelLight: '#ffd1a4',
      bevelDark: '#4a2408',
      screenShake: 0
    },
    SILVER: {
      hits: 2,
      points: 250,
      name: 'Iron/Silver Ingot',
      colorTop: '#e8edf3',
      colorMid: '#a4b0be',
      colorBot: '#57606f',
      bevelLight: '#ffffff',
      bevelDark: '#2f3542',
      screenShake: 3.5
    },
    GOLD: {
      hits: 3,
      points: 500,
      name: 'Royal Gold Ingot',
      colorTop: '#fff2a3',
      colorMid: '#f1c40f',
      colorBot: '#b78103',
      bevelLight: '#ffffff',
      bevelDark: '#5a3d00',
      screenShake: 7.0
    }
  };

  // ==========================================================================
  // AUDIO MANAGER (Dual Engine: HTML5 Audio Pool + Web Audio API Synthesis)
  // ==========================================================================
  class AudioManager {
    constructor() {
      this.isMuted = localStorage.getItem('baahubali_brick_muted') === 'true';
      this.audioCtx = null;
      this.audioElements = {};
      this.lastDialogueTime = 0;
      this.dialogueCooldown = 1800; // ms between voice lines
      this.speechSynth = window.speechSynthesis || null;

      // Procedural BGM Drum loop timer
      this.drumTimer = null;
      this.drumBeatStep = 0;
      this.droneOsc = null;
      this.droneGain = null;

      this.initContext();
      this.preloadAssets();
    }

    initContext() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext && !this.audioCtx) {
          this.audioCtx = new AudioContext();
        }
      } catch (e) {
        console.warn('Web Audio API not supported:', e);
      }
    }

    resumeContext() {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      localStorage.setItem('baahubali_brick_muted', this.isMuted);

      if (this.isMuted) {
        this.stopBGM();
        if (this.speechSynth) this.speechSynth.cancel();
      } else if (game && game.state === 'PLAYING') {
        this.playBGM();
      }
      return this.isMuted;
    }

    preloadAssets() {
      const audioList = [
        { key: 'bgm', src: 'assets/bgm.mp3', loop: true, volume: 0.4 },
        { key: 'transform', src: 'assets/transform.mp3', volume: 0.85 },
        { key: 'game_over', src: 'assets/game_over.mp3', volume: 0.9 },
        { key: 'victory', src: 'assets/victory.mp3', volume: 0.9 },
        // Character 1 Clips
        { key: 'char1_1', src: 'assets/char1_audio1.mp3', volume: 1.0 },
        { key: 'char1_2', src: 'assets/char1_audio2.mp3', volume: 1.0 },
        { key: 'char1_3', src: 'assets/char1_audio3.mp3', volume: 1.0 },
        // Character 2 Clips
        { key: 'char2_1', src: 'assets/char2_audio1.mp3', volume: 1.0 },
        { key: 'char2_2', src: 'assets/char2_audio2.mp3', volume: 1.0 },
        { key: 'char2_3', src: 'assets/char2_audio3.mp3', volume: 1.0 },
        // Character 3 Clips
        { key: 'char3_1', src: 'assets/char3_audio1.mp3', volume: 1.0 },
        { key: 'char3_2', src: 'assets/char3_audio2.mp3', volume: 1.0 },
        { key: 'char3_3', src: 'assets/char3_audio3.mp3', volume: 1.0 }
      ];

      audioList.forEach(item => {
        const audio = new Audio();
        audio.src = item.src;
        audio.preload = 'auto';
        audio.loop = !!item.loop;
        audio.volume = item.volume;
        audio.addEventListener('error', () => {
          audio._failed = true;
        });
        this.audioElements[item.key] = audio;
      });
    }

    play(key, synthFallbackFn) {
      if (this.isMuted) return;
      this.resumeContext();

      const audio = this.audioElements[key];
      if (audio && !audio._failed) {
        // Multi-voice overlapping playback without clipping or delay
        const clone = audio.cloneNode();
        clone.volume = audio.volume;
        const promise = clone.play();
        if (promise !== undefined) {
          promise.catch(() => {
            if (synthFallbackFn) synthFallbackFn();
          });
        }
      } else {
        if (synthFallbackFn) synthFallbackFn();
      }
    }

    playBGM() {
      if (this.isMuted) return;
      this.resumeContext();

      const bgm = this.audioElements['bgm'];
      if (bgm && !bgm._failed) {
        const promise = bgm.play();
        if (promise !== undefined) {
          promise.catch(() => {
            this.startProceduralWarDrums();
          });
        }
      } else {
        this.startProceduralWarDrums();
      }
    }

    stopBGM() {
      const bgm = this.audioElements['bgm'];
      if (bgm) {
        bgm.pause();
        bgm.currentTime = 0;
      }
      this.stopProceduralWarDrums();
    }

    // Procedural Mahishmati War Drums BGM Fallback
    startProceduralWarDrums() {
      if (this.drumTimer || this.isMuted || !this.audioCtx) return;
      this.resumeContext();

      const ctx = this.audioCtx;

      // Low battle drone
      try {
        this.droneOsc = ctx.createOscillator();
        this.droneGain = ctx.createGain();
        this.droneOsc.type = 'sawtooth';
        this.droneOsc.frequency.setValueAtTime(55, ctx.currentTime); // Low A

        // Lowpass filter for deep brass rumble
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, ctx.currentTime);

        this.droneGain.gain.setValueAtTime(0.04, ctx.currentTime);
        this.droneOsc.connect(filter);
        filter.connect(this.droneGain);
        this.droneGain.connect(ctx.destination);
        this.droneOsc.start();
      } catch (e) {
        // Ignore audio init race
      }

      // Rhythmic War Drum cadence (Mahishmati Battle March)
      this.drumBeatStep = 0;
      this.drumTimer = setInterval(() => {
        if (this.isMuted || (game && game.state !== 'PLAYING')) return;
        this.playDrumBeat(this.drumBeatStep);
        this.drumBeatStep = (this.drumBeatStep + 1) % 8;
      }, 340);
    }

    stopProceduralWarDrums() {
      if (this.drumTimer) {
        clearInterval(this.drumTimer);
        this.drumTimer = null;
      }
      if (this.droneOsc) {
        try {
          this.droneOsc.stop();
          this.droneOsc.disconnect();
        } catch (e) {}
        this.droneOsc = null;
      }
    }

    playDrumBeat(step) {
      if (!this.audioCtx) return;
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Heavy Taiko Kick on steps 0, 3, 4, 6
      if (step === 0 || step === 3 || step === 4 || step === 6) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const isAccent = (step === 0 || step === 4);

        osc.frequency.setValueAtTime(isAccent ? 140 : 110, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.28);

        gain.gain.setValueAtTime(isAccent ? 0.25 : 0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
      }

      // Metallic War Horn / Shield Rattle on step 2 & 7
      if (step === 2 || step === 7) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    }

    // Play Character Dialogue (Strictly tied to active character)
    playCharacterDialogue(characterIndex) {
      if (this.isMuted) return;
      const now = performance.now();
      if (now - this.lastDialogueTime < this.dialogueCooldown) return;
      this.lastDialogueTime = now;

      const char = CHARACTERS[characterIndex];
      const randIdx = Math.floor(Math.random() * 3);
      const dialogue = char.dialogues[randIdx];
      const audioKey = `${char.id}_${randIdx + 1}`;

      // Show onscreen subtitle toast
      showDialogueToast(char.shortName, dialogue.text);

      // Play audio file or fallback to synthesized speech
      this.play(audioKey, () => {
        this.synthSpeech(dialogue.text, characterIndex);
      });
    }

    // Web Speech API Voice Synthesis Fallback
    synthSpeech(text, charIndex) {
      if (this.isMuted || !this.speechSynth) return;
      try {
        this.speechSynth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        if (charIndex === 0) {
          // Baahubali: Heroic, deep, strong
          utterance.pitch = 0.85;
          utterance.rate = 1.05;
        } else if (charIndex === 1) {
          // Bhallaladeva: Fierce, deeper, aggressive
          utterance.pitch = 0.65;
          utterance.rate = 1.1;
        } else {
          // Kattappa: Resolute warrior commander
          utterance.pitch = 0.95;
          utterance.rate = 0.95;
        }
        utterance.volume = 0.9;
        this.speechSynth.speak(utterance);
      } catch (e) {
        this.synthTransformTone();
      }
    }

    // ========================================================================
    // PROCEDURAL WEB AUDIO SYNTHESIZERS
    // ========================================================================
    synthMetalHit(tier) {
      if (this.isMuted || !this.audioCtx) return;
      this.resumeContext();

      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      let freq = 1100;
      let decay = 0.12;

      if (tier === METAL_TIERS.BRONZE) {
        freq = 980;
        decay = 0.14;
        osc.type = 'triangle';
      } else if (tier === METAL_TIERS.SILVER) {
        freq = 1450;
        decay = 0.22;
        osc.type = 'sine';
      } else if (tier === METAL_TIERS.GOLD) {
        freq = 1920;
        decay = 0.35;
        osc.type = 'sine';
      }

      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + decay);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay);
    }

    synthSwordParry() {
      if (this.isMuted || !this.audioCtx) return;
      this.resumeContext();

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(420, now);
      osc1.frequency.exponentialRampToValueAtTime(180, now + 0.18);

      osc2.frequency.setValueAtTime(1600, now);
      osc2.frequency.exponentialRampToValueAtTime(800, now + 0.25);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.25);
      osc2.stop(now + 0.25);
    }

    synthTransformTone() {
      if (this.isMuted || !this.audioCtx) return;
      this.resumeContext();

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.4, now + 0.22);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    }

    synthGameOver() {
      if (this.isMuted || !this.audioCtx) return;
      this.resumeContext();

      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.85);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.85);
    }

    synthVictory() {
      if (this.isMuted || !this.audioCtx) return;
      this.resumeContext();

      const ctx = this.audioCtx;
      const chord = [440, 554.37, 659.25, 880];
      chord.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.11;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
      });
    }
  }

  // ==========================================================================
  // IMAGE ASSET MANAGER WITH PROCEDURAL FALLBACKS
  // ==========================================================================
  class AssetManager {
    constructor() {
      this.images = {};
      this.loaded = {};

      this.load('bg', 'assets/bg.jpg');
      this.load('sword', 'assets/sword.png');
      this.load('char1', 'assets/char1.png');
      this.load('char2', 'assets/char2.png');
      this.load('char3', 'assets/char3.png');
    }

    load(key, src) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        this.loaded[key] = true;
      };
      img.onerror = () => {
        this.loaded[key] = false;
      };
      this.images[key] = img;
    }

    isReady(key) {
      return !!this.loaded[key];
    }

    getImage(key) {
      return this.images[key];
    }
  }

  // ==========================================================================
  // PARTICLE SYSTEM (Sparks, Metallic Debris, Shockwaves)
  // ==========================================================================
  class Particle {
    constructor(x, y, color, speed, size, life, isSpark = true) {
      this.x = x;
      this.y = y;
      const angle = Math.random() * Math.PI * 2;
      this.vx = Math.cos(angle) * speed * (0.6 + Math.random() * 0.8);
      this.vy = Math.sin(angle) * speed * (0.6 + Math.random() * 0.8);
      this.color = color;
      this.size = size;
      this.life = life;
      this.maxLife = life;
      this.isSpark = isSpark;
      this.gravity = isSpark ? 0.22 : 0.42;
      this.rotation = Math.random() * Math.PI * 2;
      this.vRot = (Math.random() - 0.5) * 0.25;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.vx *= 0.98;
      this.rotation += this.vRot;
      this.life--;
    }

    draw(ctx) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      if (this.isSpark) {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 1.8, this.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(-this.size, -this.size);
        ctx.lineTo(this.size, -this.size * 0.5);
        ctx.lineTo(this.size * 0.7, this.size);
        ctx.lineTo(-this.size * 0.5, this.size * 0.8);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }

  class Shockwave {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.radius = 8;
      this.maxRadius = 150;
      this.life = 26;
      this.maxLife = 26;
    }

    update() {
      this.radius += (this.maxRadius - this.radius) * 0.18;
      this.life--;
    }

    draw(ctx) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 6 * alpha;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.restore();
    }
  }

  class FloatingText {
    constructor(x, y, text, color) {
      this.x = x;
      this.y = y;
      this.text = text;
      this.color = color;
      this.vy = -1.8;
      this.life = 40;
      this.maxLife = 40;
    }

    update() {
      this.y += this.vy;
      this.vy *= 0.94;
      this.life--;
    }

    draw(ctx) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 22px "Cinzel", Georgia, serif';
      ctx.fillStyle = this.color;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.fillText(this.text, this.x, this.y);
      ctx.restore();
    }
  }

  // ==========================================================================
  // METALLIC INGOT TARGET
  // ==========================================================================
  class MetalBar {
    constructor(x, y, width, height, tier) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.tier = tier;
      this.maxHits = tier.hits;
      this.hitsLeft = tier.hits;
      this.destroyed = false;
    }

    takeHit() {
      this.hitsLeft--;
      if (this.hitsLeft <= 0) {
        this.destroyed = true;
      }
      return this.destroyed;
    }

    draw(ctx) {
      if (this.destroyed) return;

      const { x, y, width, height, tier, hitsLeft, maxHits } = this;
      const damageRatio = (maxHits - hitsLeft) / maxHits;

      ctx.save();

      // Outer metallic bevel shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;

      // Ingot Body Gradient (metallic luster sheen)
      const grad = ctx.createLinearGradient(x, y, x, y + height);
      grad.addColorStop(0, tier.colorTop);
      grad.addColorStop(0.3, tier.bevelLight);
      grad.addColorStop(0.5, tier.colorMid);
      grad.addColorStop(1, tier.colorBot);

      ctx.fillStyle = grad;
      ctx.beginPath();
      const r = 4;
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + width - r, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + r);
      ctx.lineTo(x + width, y + height - r);
      ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      ctx.lineTo(x + r, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();

      // Ingot top highlight ridge (trapezoid shine)
      ctx.shadowColor = 'transparent';
      const bevelGrad = ctx.createLinearGradient(x, y, x + width, y);
      bevelGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
      bevelGrad.addColorStop(0.5, 'rgba(255,255,255,0.8)');
      bevelGrad.addColorStop(1, 'rgba(255,255,255,0.2)');

      ctx.fillStyle = bevelGrad;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 2);
      ctx.lineTo(x + width - 4, y + 2);
      ctx.lineTo(x + width - 8, y + 6);
      ctx.lineTo(x + 8, y + 6);
      ctx.closePath();
      ctx.fill();

      // Dark bottom bevel ridge
      ctx.fillStyle = tier.bevelDark;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + height - 2);
      ctx.lineTo(x + width - 4, y + height - 2);
      ctx.lineTo(x + width - 8, y + height - 6);
      ctx.lineTo(x + 8, y + height - 6);
      ctx.closePath();
      ctx.fill();

      // Royal Ingot Hallmark Stamp
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + width * 0.25, y + height * 0.3, width * 0.5, height * 0.4);

      // Cracks / Dent Overlay after hit
      if (damageRatio > 0) {
        ctx.strokeStyle = 'rgba(20, 20, 20, 0.88)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();

        if (damageRatio >= 0.3) {
          ctx.moveTo(x + width * 0.3, y);
          ctx.lineTo(x + width * 0.36, y + height * 0.5);
          ctx.lineTo(x + width * 0.28, y + height);
        }
        if (damageRatio >= 0.6) {
          ctx.moveTo(x + width * 0.68, y);
          ctx.lineTo(x + width * 0.6, y + height * 0.45);
          ctx.lineTo(x + width * 0.74, y + height * 0.8);
          ctx.lineTo(x + width * 0.8, y + height);

          // Chipped dent mark
          ctx.fillStyle = 'rgba(10, 10, 10, 0.7)';
          ctx.beginPath();
          ctx.arc(x + width * 0.6, y + height * 0.45, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // ==========================================================================
  // PADDLE (BAAHUBALI'S SWORD)
  // ==========================================================================
  class Paddle {
    constructor() {
      this.width = 180;
      this.height = 36;
      this.x = (CANVAS_WIDTH - this.width) / 2;
      this.y = CANVAS_HEIGHT - 65;
      this.speed = 15;
      this.targetX = this.x;
      this.prevX = this.x;
      this.velocity = 0;
    }

    update(keys) {
      this.prevX = this.x;

      if (keys['ArrowLeft'] || keys['KeyA']) {
        this.targetX -= this.speed;
      }
      if (keys['ArrowRight'] || keys['KeyD']) {
        this.targetX += this.speed;
      }

      this.targetX = Math.max(0, Math.min(CANVAS_WIDTH - this.width, this.targetX));
      this.x += (this.targetX - this.x) * 0.38;
      this.velocity = this.x - this.prevX;
    }

    moveTo(canvasX) {
      this.targetX = canvasX - this.width / 2;
      this.targetX = Math.max(0, Math.min(CANVAS_WIDTH - this.width, this.targetX));
    }

    draw(ctx, assetMgr) {
      ctx.save();

      if (assetMgr.isReady('sword')) {
        const swordImg = assetMgr.getImage('sword');
        ctx.drawImage(swordImg, this.x, this.y, this.width, this.height);
      } else {
        this.drawProceduralSword(ctx);
      }

      ctx.restore();
    }

    drawProceduralSword(ctx) {
      const { x, y, width, height } = this;
      const bladeLength = width * 0.82;
      const hiltLength = width * 0.18;

      ctx.save();

      // Blade Glow
      ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
      ctx.shadowBlur = 10;

      // Steel Double-Edged Blade
      const bladeGrad = ctx.createLinearGradient(x + hiltLength, y, x + hiltLength, y + height);
      bladeGrad.addColorStop(0, '#e5ecf5');
      bladeGrad.addColorStop(0.45, '#ffffff');
      bladeGrad.addColorStop(0.5, '#4b5563'); // Fuller groove
      bladeGrad.addColorStop(0.55, '#ffffff');
      bladeGrad.addColorStop(1, '#9ca3af');

      ctx.fillStyle = bladeGrad;
      ctx.beginPath();
      ctx.moveTo(x + hiltLength, y + height * 0.2);
      ctx.lineTo(x + width - 12, y + height * 0.2);
      ctx.lineTo(x + width, y + height * 0.5); // Spear tip
      ctx.lineTo(x + width - 12, y + height * 0.8);
      ctx.lineTo(x + hiltLength, y + height * 0.8);
      ctx.closePath();
      ctx.fill();

      // Golden Fuller Inlay
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(x + hiltLength + 10, y + height * 0.5);
      ctx.lineTo(x + width - 20, y + height * 0.5);
      ctx.stroke();

      // Royal Crossguard (Carved Gold)
      const guardGrad = ctx.createLinearGradient(x + hiltLength - 10, y, x + hiltLength + 6, y);
      guardGrad.addColorStop(0, '#d4af37');
      guardGrad.addColorStop(0.5, '#fff0a6');
      guardGrad.addColorStop(1, '#996515');

      ctx.fillStyle = guardGrad;
      ctx.beginPath();
      ctx.roundRect(x + hiltLength - 8, y + 2, 14, height - 4, 3);
      ctx.fill();

      // Hilt (Crimson-wrapped leather)
      ctx.fillStyle = '#6d1313';
      ctx.beginPath();
      ctx.roundRect(x + 12, y + height * 0.3, hiltLength - 20, height * 0.4, 2);
      ctx.fill();

      // Gold hilt wire wraps
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const wx = x + 16 + i * 5;
        ctx.beginPath();
        ctx.moveTo(wx, y + height * 0.3);
        ctx.lineTo(wx, y + height * 0.7);
        ctx.stroke();
      }

      // Ruby Pommel
      ctx.fillStyle = '#b71c1c';
      ctx.beginPath();
      ctx.arc(x + 8, y + height * 0.5, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }
  }

  // ==========================================================================
  // BALL WITH CHARACTER ROTATION & TRAIL
  // ==========================================================================
  class Ball {
    constructor() {
      this.radius = 18;
      this.baseSpeed = 8.5;
      this.maxSpeed = 16;
      this.speed = this.baseSpeed;
      this.reset();
      this.rotation = 0;
      this.trail = [];
      this.maxTrail = 10;
    }

    reset(paddle) {
      this.x = paddle ? paddle.x + paddle.width / 2 : CANVAS_WIDTH / 2;
      this.y = paddle ? paddle.y - this.radius - 2 : CANVAS_HEIGHT - 90;
      this.speed = this.baseSpeed;

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;
      this.rotation = 0;
      this.trail = [];
    }

    update() {
      this.trail.unshift({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrail) {
        this.trail.pop();
      }

      this.x += this.vx;
      this.y += this.vy;

      // Rotate continuously based on horizontal velocity
      this.rotation += this.vx * 0.045;

      // Wall Collisions
      if (this.x - this.radius <= 0) {
        this.x = this.radius;
        this.vx = Math.abs(this.vx);
      } else if (this.x + this.radius >= CANVAS_WIDTH) {
        this.x = CANVAS_WIDTH - this.radius;
        this.vx = -Math.abs(this.vx);
      }

      if (this.y - this.radius <= 0) {
        this.y = this.radius;
        this.vy = Math.abs(this.vy);
      }
    }

    increaseSpeed(factor = 1.016) {
      const currentSpeed = Math.hypot(this.vx, this.vy);
      if (currentSpeed < this.maxSpeed) {
        const newSpeed = Math.min(this.maxSpeed, currentSpeed * factor);
        const ratio = newSpeed / currentSpeed;
        this.vx *= ratio;
        this.vy *= ratio;
      }
    }

    draw(ctx, currentChar, assetMgr) {
      const charConfig = CHARACTERS[currentChar];

      // Draw Motion Trail (Spark/Flame Blur)
      for (let i = 0; i < this.trail.length; i++) {
        const pos = this.trail[i];
        const alpha = (1 - i / this.trail.length) * 0.45;
        const trailRadius = this.radius * (1 - i / (this.trail.length * 1.4));

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = charConfig.primaryColor;
        ctx.shadowColor = charConfig.auraColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, trailRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Main Character Ball
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      // Outer Aura Glow Ring
      ctx.shadowColor = charConfig.primaryColor;
      ctx.shadowBlur = 16;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Circular Clipping Mask for Character Sprite
      ctx.beginPath();
      ctx.arc(0, 0, this.radius - 1.5, 0, Math.PI * 2);
      ctx.clip();

      if (assetMgr.isReady(charConfig.id)) {
        const img = assetMgr.getImage(charConfig.id);
        ctx.drawImage(img, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
      } else {
        this.drawProceduralAvatar(ctx, currentChar, charConfig);
      }

      ctx.restore();
    }

    drawProceduralAvatar(ctx, charIndex, charConfig) {
      const r = this.radius;

      const bg = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
      bg.addColorStop(0, charConfig.primaryColor);
      bg.addColorStop(1, '#1b0e06');
      ctx.fillStyle = bg;
      ctx.fillRect(-r, -r, r * 2, r * 2);

      ctx.fillStyle = '#22140d';
      ctx.beginPath();
      ctx.arc(0, 2, r * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Royal Red Tilak
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.2, 2.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Distinct Warrior Emblem Initial
      ctx.font = '900 15px "Cinzel", serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initials = ['B', 'BH', 'K'];
      ctx.fillText(initials[charIndex], 0, 3);
    }
  }

  // ==========================================================================
  // MAIN GAME ENGINE
  // ==========================================================================
  class GameEngine {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');

      this.audio = new AudioManager();
      this.assets = new AssetManager();

      this.state = 'START'; // 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY'
      this.score = 0;
      this.highScore = parseInt(localStorage.getItem('baahubali_brick_high') || '0', 10);
      this.lives = 3;

      this.consecutivePaddleHits = 0;
      this.maxStreak = 0;
      this.currentCharIndex = 0; // 0: Baahubali, 1: Bhallaladeva, 2: Kattappa

      this.paddle = new Paddle();
      this.ball = new Ball();
      this.bars = [];
      this.particles = [];
      this.shockwaves = [];
      this.floatingTexts = [];

      this.keys = {};
      this.screenShakeIntensity = 0;

      this.initDomElements();
      this.setupEventListeners();
      this.buildLevel();
      this.updateHUD();

      this.lastFrameTime = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }

    initDomElements() {
      this.dom = {
        scoreVal: document.getElementById('score-val'),
        highScoreVal: document.getElementById('high-score-val'),
        streakVal: document.getElementById('streak-val'),
        heroImg: document.getElementById('hud-hero-img'),
        heroFallback: document.getElementById('hud-hero-fallback'),
        heroName: document.getElementById('hero-name'),
        swapMeter: document.getElementById('swap-meter-fill'),
        swapCounterTxt: document.getElementById('swap-counter-txt'),
        livesIcons: document.querySelectorAll('#lives-icons .shield-icon'),
        muteBtn: document.getElementById('mute-btn'),
        muteIcon: document.getElementById('mute-icon'),
        startScreen: document.getElementById('start-screen'),
        gameOverScreen: document.getElementById('game-over-screen'),
        victoryScreen: document.getElementById('victory-screen'),
        startBtn: document.getElementById('start-btn'),
        restartBtn: document.getElementById('restart-btn'),
        playAgainBtn: document.getElementById('play-again-btn'),
        finalScore: document.getElementById('final-score'),
        finalStreak: document.getElementById('final-streak'),
        finalHighScore: document.getElementById('final-high-score'),
        winScore: document.getElementById('win-score'),
        winStreak: document.getElementById('win-streak'),
        winHighScore: document.getElementById('win-high-score')
      };

      this.dom.muteIcon.textContent = this.audio.isMuted ? '🔇' : '🔊';
      this.dom.highScoreVal.textContent = this.highScore;
    }

    setupEventListeners() {
      window.addEventListener('keydown', (e) => {
        this.keys[e.code] = true;

        if (e.code === 'Space') {
          e.preventDefault();
          this.handleActionTrigger();
        } else if (e.code === 'KeyM') {
          this.toggleMute();
        }
      });

      window.addEventListener('keyup', (e) => {
        this.keys[e.code] = false;
      });

      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const canvasX = (e.clientX - rect.left) * scaleX;
        this.paddle.moveTo(canvasX);
      });

      this.canvas.addEventListener('click', () => {
        if (this.state === 'START') {
          this.startGame();
        }
      });

      const handleTouch = (e) => {
        if (e.touches && e.touches[0]) {
          const rect = this.canvas.getBoundingClientRect();
          const scaleX = CANVAS_WIDTH / rect.width;
          const canvasX = (e.touches[0].clientX - rect.left) * scaleX;
          this.paddle.moveTo(canvasX);
        }
      };

      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.audio.resumeContext();
        if (this.state === 'START') {
          this.startGame();
        } else {
          handleTouch(e);
        }
      }, { passive: false });

      this.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        handleTouch(e);
      }, { passive: false });

      this.dom.muteBtn.addEventListener('click', () => this.toggleMute());
      this.dom.startBtn.addEventListener('click', () => this.startGame());
      this.dom.restartBtn.addEventListener('click', () => this.restartGame());
      this.dom.playAgainBtn.addEventListener('click', () => this.restartGame());
    }

    toggleMute() {
      const isMuted = this.audio.toggleMute();
      this.dom.muteIcon.textContent = isMuted ? '🔇' : '🔊';
    }

    handleActionTrigger() {
      if (this.state === 'START') {
        this.startGame();
      } else if (this.state === 'GAMEOVER' || this.state === 'VICTORY') {
        this.restartGame();
      }
    }

    buildLevel() {
      this.bars = [];
      const cols = 10;
      const rows = 5;
      const barWidth = 104;
      const barHeight = 32;
      const paddingX = 14;
      const paddingY = 12;

      const totalGridWidth = cols * barWidth + (cols - 1) * paddingX;
      const startX = (CANVAS_WIDTH - totalGridWidth) / 2;
      const startY = 85;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let tier = METAL_TIERS.BRONZE;

          if (r === 0) {
            tier = METAL_TIERS.GOLD;
          } else if (r === 1 || (r === 2 && (c === 0 || c === cols - 1 || c === 4 || c === 5))) {
            tier = METAL_TIERS.SILVER;
          } else {
            tier = METAL_TIERS.BRONZE;
          }

          const x = startX + c * (barWidth + paddingX);
          const y = startY + r * (barHeight + paddingY);
          this.bars.push(new MetalBar(x, y, barWidth, barHeight, tier));
        }
      }
    }

    startGame() {
      this.audio.resumeContext();
      this.state = 'PLAYING';
      this.dom.startScreen.classList.add('hidden');
      this.dom.gameOverScreen.classList.add('hidden');
      this.dom.victoryScreen.classList.add('hidden');
      this.audio.playBGM();
      this.ball.reset(this.paddle);
    }

    restartGame() {
      this.score = 0;
      this.lives = 3;
      this.consecutivePaddleHits = 0;
      this.currentCharIndex = 0;
      this.buildLevel();
      this.updateHUD();
      this.startGame();
    }

    // ========================================================================
    // CHARACTER SWAP (ROTATES EVERY 3 CONSECUTIVE PADDLE HITS)
    // ========================================================================
    handlePaddleHit() {
      this.consecutivePaddleHits++;
      if (this.consecutivePaddleHits > this.maxStreak) {
        this.maxStreak = this.consecutivePaddleHits;
      }

      // Check for character transformation at multiples of 3
      if (this.consecutivePaddleHits > 0 && this.consecutivePaddleHits % 3 === 0) {
        this.triggerCharacterSwap();
      } else {
        if (Math.random() < 0.45) {
          this.audio.playCharacterDialogue(this.currentCharIndex);
        }
      }

      this.updateHUD();
    }

    triggerCharacterSwap() {
      // Rotate character: char1 -> char2 -> char3 -> char1
      this.currentCharIndex = (this.currentCharIndex + 1) % CHARACTERS.length;
      const nextChar = CHARACTERS[this.currentCharIndex];

      // Play Transform SFX
      this.audio.play('transform', () => this.audio.synthTransformTone());

      // Trigger shockwave & flash ring
      this.shockwaves.push(new Shockwave(this.ball.x, this.ball.y, nextChar.primaryColor));
      this.shockwaves.push(new Shockwave(this.paddle.x + this.paddle.width / 2, this.paddle.y, '#ffd700'));

      // Transform particle aura burst
      for (let i = 0; i < 35; i++) {
        this.particles.push(new Particle(this.ball.x, this.ball.y, nextChar.primaryColor, 6 + Math.random() * 5, 4, 35, true));
      }

      // Floating Banner Announcement
      showSwapFlashBanner(nextChar.name);

      // Trigger dialogue tied strictly to the newly active hero
      setTimeout(() => {
        this.audio.playCharacterDialogue(this.currentCharIndex);
      }, 250);

      this.updateHUD();
    }

    // ========================================================================
    // METAL BAR IMPACT & SCREEN SHAKE
    // ========================================================================
    handleBarHit(bar) {
      // Metallic ping sound
      this.audio.synthMetalHit(bar.tier);

      // Bright Spark Particle Burst
      const sparkCount = bar.tier === METAL_TIERS.GOLD ? 28 : bar.tier === METAL_TIERS.SILVER ? 20 : 14;
      for (let i = 0; i < sparkCount; i++) {
        const isSpark = Math.random() < 0.7;
        const color = isSpark ? (Math.random() < 0.5 ? '#ffffff' : '#ffd700') : bar.tier.colorMid;
        this.particles.push(new Particle(this.ball.x, this.ball.y, color, 4 + Math.random() * 5, 3 + Math.random() * 3, 25, isSpark));
      }

      const isDestroyed = bar.takeHit();

      if (isDestroyed) {
        this.score += bar.tier.points;
        if (this.score > this.highScore) {
          this.highScore = this.score;
          localStorage.setItem('baahubali_brick_high', this.highScore);
        }

        // Screen shake for silver and gold bars
        if (bar.tier.screenShake > 0) {
          this.screenShakeIntensity = Math.max(this.screenShakeIntensity, bar.tier.screenShake);
        }

        // Floating combat score popup
        this.floatingTexts.push(new FloatingText(bar.x + bar.width / 2, bar.y, `+${bar.tier.points}`, bar.tier.bevelLight));

        // Gradually increase ball velocity for tension
        this.ball.increaseSpeed(1.018);

        // Character dialogue on bar smash
        if (Math.random() < 0.38) {
          this.audio.playCharacterDialogue(this.currentCharIndex);
        }

        // Check Victory
        const remaining = this.bars.filter(b => !b.destroyed);
        if (remaining.length === 0) {
          this.triggerVictory();
        }
      }

      this.updateHUD();
    }

    // ========================================================================
    // DIRECTIONAL BOUNCE PHYSICS
    // ========================================================================
    checkCollisions() {
      const ball = this.ball;
      const paddle = this.paddle;

      // 1. Paddle Collision (Directional Bounce)
      if (
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.height &&
        ball.x >= paddle.x - 6 &&
        ball.x <= paddle.x + paddle.width + 6 &&
        ball.vy > 0
      ) {
        const hitOffset = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        const clampedOffset = Math.max(-0.95, Math.min(0.95, hitOffset));

        // Outer edges reflect ball at sharper horizontal angle (up to ~65 degrees from vertical)
        // Center/hilt reflects more vertically
        const maxAngle = Math.PI * 0.36; // ~65 deg
        const bounceAngle = -Math.PI / 2 + clampedOffset * maxAngle;

        const currentSpeed = Math.hypot(ball.vx, ball.vy);
        ball.vx = Math.sin(clampedOffset * maxAngle) * currentSpeed + paddle.velocity * 0.22;
        ball.vy = -Math.abs(Math.cos(clampedOffset * maxAngle) * currentSpeed);

        ball.y = paddle.y - ball.radius;

        this.audio.synthSwordParry();

        for (let i = 0; i < 12; i++) {
          this.particles.push(new Particle(ball.x, paddle.y, '#ffd700', 3 + Math.random() * 4, 3, 20, true));
        }

        this.handlePaddleHit();
      }

      // 2. Target Metal Bars Collision
      for (const bar of this.bars) {
        if (bar.destroyed) continue;

        const closestX = Math.max(bar.x, Math.min(ball.x, bar.x + bar.width));
        const closestY = Math.max(bar.y, Math.min(ball.y, bar.y + bar.height));

        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const distSquared = distX * distX + distY * distY;

        if (distSquared < ball.radius * ball.radius) {
          const overlapLeft = Math.abs((ball.x + ball.radius) - bar.x);
          const overlapRight = Math.abs((ball.x - ball.radius) - (bar.x + bar.width));
          const overlapTop = Math.abs((ball.y + ball.radius) - bar.y);
          const overlapBottom = Math.abs((ball.y - ball.radius) - (bar.y + bar.height));

          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

          if (minOverlap === overlapLeft || minOverlap === overlapRight) {
            ball.vx = -ball.vx;
          } else {
            ball.vy = -ball.vy;
          }

          this.handleBarHit(bar);
          break;
        }
      }

      // 3. Fall into Bottom Abyss
      if (ball.y - ball.radius > CANVAS_HEIGHT) {
        this.handleBallLost();
      }
    }

    handleBallLost() {
      this.lives--;
      this.consecutivePaddleHits = 0;

      if (this.lives > 0) {
        this.ball.reset(this.paddle);
        this.updateHUD();
      } else {
        this.triggerGameOver();
      }
    }

    triggerGameOver() {
      this.state = 'GAMEOVER';
      this.audio.stopBGM();
      this.audio.play('game_over', () => this.audio.synthGameOver());

      this.dom.finalScore.textContent = this.score;
      this.dom.finalStreak.textContent = this.maxStreak;
      this.dom.finalHighScore.textContent = this.highScore;
      this.dom.gameOverScreen.classList.remove('hidden');
    }

    triggerVictory() {
      this.state = 'VICTORY';
      this.audio.stopBGM();
      this.audio.play('victory', () => this.audio.synthVictory());

      this.dom.winScore.textContent = this.score;
      this.dom.winStreak.textContent = this.maxStreak;
      this.dom.winHighScore.textContent = this.highScore;
      this.dom.victoryScreen.classList.remove('hidden');
    }

    // ========================================================================
    // HUD & UI UPDATES
    // ========================================================================
    updateHUD() {
      this.dom.scoreVal.textContent = this.score;
      this.dom.highScoreVal.textContent = this.highScore;
      this.dom.streakVal.textContent = `${this.consecutivePaddleHits} 🔥`;

      this.dom.livesIcons.forEach((icon, idx) => {
        if (idx < this.lives) {
          icon.classList.add('active');
        } else {
          icon.classList.remove('active');
        }
      });

      const char = CHARACTERS[this.currentCharIndex];
      this.dom.heroName.textContent = char.name;
      this.dom.heroFallback.textContent = char.shortName.charAt(0);
      this.dom.heroImg.src = char.imageSrc;

      const currentStep = this.consecutivePaddleHits % 3;
      const progressPercent = (currentStep / 3) * 100;
      this.dom.swapMeter.style.width = `${progressPercent}%`;

      const hitsRemaining = 3 - currentStep;
      this.dom.swapCounterTxt.textContent = `SWAP IN ${hitsRemaining} ${hitsRemaining === 1 ? 'HIT' : 'HITS'}`;
    }

    // ========================================================================
    // MAIN RENDER LOOP
    // ========================================================================
    loop() {
      this.update();
      this.render();
      requestAnimationFrame(this.loop.bind(this));
    }

    update() {
      if (this.state === 'PLAYING') {
        this.paddle.update(this.keys);
        this.ball.update();
        this.checkCollisions();

        if (this.screenShakeIntensity > 0) {
          this.screenShakeIntensity *= 0.88;
          if (this.screenShakeIntensity < 0.2) this.screenShakeIntensity = 0;
        }
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.update();
        if (p.life <= 0) this.particles.splice(i, 1);
      }

      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.update();
        if (sw.life <= 0) this.shockwaves.splice(i, 1);
      }

      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.update();
        if (ft.life <= 0) this.floatingTexts.splice(i, 1);
      }
    }

    render() {
      const ctx = this.ctx;

      ctx.save();

      // Screen Shake Transform on Heavy Metal Destruction
      if (this.screenShakeIntensity > 0) {
        const dx = (Math.random() - 0.5) * this.screenShakeIntensity * 4;
        const dy = (Math.random() - 0.5) * this.screenShakeIntensity * 4;
        ctx.translate(dx, dy);
      }

      // 1. Background
      if (this.assets.isReady('bg')) {
        ctx.drawImage(this.assets.getImage('bg'), 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        this.drawProceduralBackground(ctx);
      }

      // 2. Destructible Metallic Bars
      for (const bar of this.bars) {
        bar.draw(ctx);
      }

      // 3. Paddle (Baahubali's Sword)
      this.paddle.draw(ctx, this.assets);

      // 4. Ball with Rotating Character Avatar
      this.ball.draw(ctx, this.currentCharIndex, this.assets);

      // 5. Shockwaves
      for (const sw of this.shockwaves) {
        sw.draw(ctx);
      }

      // 6. Spark Particles
      for (const p of this.particles) {
        p.draw(ctx);
      }

      // 7. Floating Text Popups
      for (const ft of this.floatingTexts) {
        ft.draw(ctx);
      }

      ctx.restore();
    }

    drawProceduralBackground(ctx) {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      bgGrad.addColorStop(0, '#120b08');
      bgGrad.addColorStop(0.4, '#23140c');
      bgGrad.addColorStop(0.7, '#160d08');
      bgGrad.addColorStop(1, '#080504');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = 'rgba(10, 6, 4, 0.6)';
      ctx.fillRect(0, 0, 80, CANVAS_HEIGHT);
      ctx.fillRect(CANVAS_WIDTH - 80, 0, 80, CANVAS_HEIGHT);

      ctx.strokeStyle = 'rgba(245, 176, 39, 0.08)';
      ctx.lineWidth = 3;
      for (let i = 1; i <= 4; i++) {
        const archX = i * (CANVAS_WIDTH / 5);
        ctx.beginPath();
        ctx.arc(archX, 360, 110, Math.PI, 0);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255, 140, 0, 0.15)';
      for (let i = 0; i < 20; i++) {
        const ex = (i * 64 + (Date.now() * 0.02 * (i + 1))) % CANVAS_WIDTH;
        const ey = (CANVAS_HEIGHT - ((Date.now() * 0.03 * (i + 1)) % CANVAS_HEIGHT));
        ctx.beginPath();
        ctx.arc(ex, ey, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ==========================================================================
  // FLOATING UI TOAST HELPERS
  // ==========================================================================
  let dialogueTimeout = null;
  function showDialogueToast(speaker, text) {
    const banner = document.getElementById('dialogue-banner');
    const speakerEl = document.getElementById('dialogue-speaker');
    const textEl = document.getElementById('dialogue-text');

    if (!banner || !speakerEl || !textEl) return;

    speakerEl.textContent = speaker;
    textEl.textContent = `"${text}"`;
    banner.classList.remove('hidden');

    if (dialogueTimeout) clearTimeout(dialogueTimeout);
    dialogueTimeout = setTimeout(() => {
      banner.classList.add('hidden');
    }, 2800);
  }

  let swapFlashTimeout = null;
  function showSwapFlashBanner(heroName) {
    const banner = document.getElementById('swap-flash-banner');
    const subEl = document.getElementById('swap-flash-sub');

    if (!banner || !subEl) return;

    subEl.textContent = `${heroName} UNLEASHED!`;
    banner.classList.remove('hidden');

    if (swapFlashTimeout) clearTimeout(swapFlashTimeout);
    swapFlashTimeout = setTimeout(() => {
      banner.classList.add('hidden');
    }, 900);
  }

  // ==========================================================================
  // INITIALIZATION ON DOM LOAD
  // ==========================================================================
  let game = null;
  window.addEventListener('DOMContentLoaded', () => {
    game = new GameEngine();
  });

})();
