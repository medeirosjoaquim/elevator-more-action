import * as Tone from 'tone';

// ═══════════════════════════════════════════════════════════════
//  NES-Style Chiptune Audio System (Fixed timing)
// ═══════════════════════════════════════════════════════════════

let isStarted = false;

// Start audio context (must be called from user interaction)
export const startAudio = async () => {
  if (isStarted) return;
  await Tone.start();
  isStarted = true;
  Tone.getDestination().volume.value = -10;
};

// ─────────────────────────────────────────────────────────────────
//  INSTRUMENTS (NES-style) - Multiple instances to avoid conflicts
// ─────────────────────────────────────────────────────────────────

// Create synth pool to avoid timing conflicts
const createSynth = (type = 'square', volume = -8) => {
  const synth = new Tone.Synth({
    oscillator: { type },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 }
  }).toDestination();
  synth.volume.value = volume;
  return synth;
};

const createPulseSynth = (width = 0.25, volume = -8) => {
  const synth = new Tone.Synth({
    oscillator: { type: 'pulse', width },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.1 }
  }).toDestination();
  synth.volume.value = volume;
  return synth;
};

const createNoiseSynth = (volume = -12) => {
  const synth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
  }).toDestination();
  synth.volume.value = volume;
  return synth;
};

// SFX synth pool (multiple to avoid conflicts)
const sfxSynths = [createSynth('square', -8), createSynth('square', -8), createSynth('square', -8)];
const pulseSynths = [createPulseSynth(0.25, -8), createPulseSynth(0.5, -10)];
const noiseSynths = [createNoiseSynth(-12), createNoiseSynth(-12)];
const bassSynth = createSynth('triangle', -6);

let synthIndex = 0;
const getNextSynth = () => {
  synthIndex = (synthIndex + 1) % sfxSynths.length;
  return sfxSynths[synthIndex];
};

let noiseIndex = 0;
const getNextNoise = () => {
  noiseIndex = (noiseIndex + 1) % noiseSynths.length;
  return noiseSynths[noiseIndex];
};

// ─────────────────────────────────────────────────────────────────
//  SOUND EFFECTS (simplified to avoid timing issues)
// ─────────────────────────────────────────────────────────────────

export const sfx = {
  shoot: () => {
    if (!isStarted) return;
    try {
      getNextSynth().triggerAttackRelease('C6', '32n');
    } catch (e) { /* ignore timing errors */ }
  },

  enemyHit: () => {
    if (!isStarted) return;
    try {
      getNextSynth().triggerAttackRelease('C3', '16n');
      getNextNoise().triggerAttackRelease('8n');
    } catch (e) { /* ignore timing errors */ }
  },

  collectDoc: () => {
    if (!isStarted) return;
    try {
      const synth = getNextSynth();
      synth.triggerAttackRelease('E5', '16n');
    } catch (e) { /* ignore timing errors */ }
  },

  playerHit: () => {
    if (!isStarted) return;
    try {
      getNextNoise().triggerAttackRelease('8n');
      getNextSynth().triggerAttackRelease('C2', '8n');
    } catch (e) { /* ignore timing errors */ }
  },

  elevator: () => {
    if (!isStarted) return;
    try {
      getNextSynth().triggerAttackRelease('G3', '32n');
    } catch (e) { /* ignore timing errors */ }
  },

  win: () => {
    if (!isStarted) return;
    playVictoryMusic();
  },

  gameOver: () => {
    if (!isStarted) return;
    playGameOverMusic();
  },

  start: () => {
    if (!isStarted) return;
    try {
      getNextSynth().triggerAttackRelease('C5', '8n');
    } catch (e) { /* ignore timing errors */ }
  },

  footstep: () => {
    if (!isStarted) return;
    try {
      getNextNoise().triggerAttackRelease('64n');
    } catch (e) { /* ignore timing errors */ }
  },

  duck: () => {
    if (!isStarted) return;
    try {
      getNextSynth().triggerAttackRelease('G2', '32n');
    } catch (e) { /* ignore timing errors */ }
  },

  unduck: () => {
    if (!isStarted) return;
    try {
      getNextSynth().triggerAttackRelease('E3', '32n');
    } catch (e) { /* ignore timing errors */ }
  },

  enemySpawn: () => {
    if (!isStarted) return;
    try {
      pulseSynths[0].triggerAttackRelease('C3', '16n');
    } catch (e) { /* ignore timing errors */ }
  },

  enemyShoot: () => {
    if (!isStarted) return;
    try {
      pulseSynths[1].triggerAttackRelease('A5', '32n');
    } catch (e) { /* ignore timing errors */ }
  },

  allDocsCollected: () => {
    if (!isStarted) return;
    try {
      getNextSynth().triggerAttackRelease('G5', '8n');
    } catch (e) { /* ignore timing errors */ }
  }
};

// ─────────────────────────────────────────────────────────────────
//  VICTORY MUSIC (using setTimeout for safety)
// ─────────────────────────────────────────────────────────────────

const playVictoryMusic = () => {
  const melody = [
    { note: 'C5', delay: 0 },
    { note: 'E5', delay: 150 },
    { note: 'G5', delay: 300 },
    { note: 'C6', delay: 450 },
    { note: 'E6', delay: 600 },
    { note: 'G6', delay: 750 },
    { note: 'C7', delay: 900 },
  ];

  melody.forEach(({ note, delay }) => {
    setTimeout(() => {
      try {
        getNextSynth().triggerAttackRelease(note, '8n');
      } catch (e) { /* ignore */ }
    }, delay);
  });
};

const playGameOverMusic = () => {
  const melody = [
    { note: 'E4', delay: 0 },
    { note: 'D4', delay: 300 },
    { note: 'C4', delay: 600 },
    { note: 'B3', delay: 900 },
  ];

  melody.forEach(({ note, delay }) => {
    setTimeout(() => {
      try {
        getNextSynth().triggerAttackRelease(note, '4n');
      } catch (e) { /* ignore */ }
    }, delay);
  });
};

// ─────────────────────────────────────────────────────────────────
//  BACKGROUND MUSIC (simplified and safer)
// ─────────────────────────────────────────────────────────────────

// Music synths (separate from SFX)
const melodySynth = createPulseSynth(0.25, -10);
const harmSynth = createPulseSynth(0.5, -14);
const musicBassSynth = createSynth('triangle', -8);

let musicLoop = null;
let musicPlaying = false;

const melodyNotes = ['E4', 'G4', 'A4', 'B4', 'C5', 'B4', 'A4', 'G4', 'E4', 'D4', 'E4', 'G4'];
const bassNotes = ['C2', 'G2', 'A2', 'E2', 'F2', 'G2', 'C2'];

export const startMusic = () => {
  if (!isStarted || musicPlaying) return;

  let melodyIdx = 0;
  let bassIdx = 0;
  let beat = 0;

  musicLoop = setInterval(() => {
    try {
      // Melody every 2 beats
      if (beat % 2 === 0) {
        melodySynth.triggerAttackRelease(melodyNotes[melodyIdx % melodyNotes.length], '8n');
        melodyIdx++;
      }

      // Bass every 4 beats
      if (beat % 4 === 0) {
        musicBassSynth.triggerAttackRelease(bassNotes[bassIdx % bassNotes.length], '4n');
        bassIdx++;
      }

      // Harmony every 8 beats
      if (beat % 8 === 0) {
        harmSynth.triggerAttackRelease('C4', '2n');
      }

      beat++;
    } catch (e) {
      // Ignore timing errors
    }
  }, 150); // 150ms per beat = 100 BPM

  musicPlaying = true;
};

export const stopMusic = () => {
  if (!musicPlaying) return;

  if (musicLoop) {
    clearInterval(musicLoop);
    musicLoop = null;
  }

  musicPlaying = false;
};

export const isMusicPlaying = () => musicPlaying;

// Mute toggle
let muted = false;
export const toggleMute = () => {
  muted = !muted;
  Tone.getDestination().mute = muted;
  return muted;
};

export const isMuted = () => muted;
