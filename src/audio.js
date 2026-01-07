import * as Tone from 'tone';

// ═══════════════════════════════════════════════════════════════
//  NES-Style Chiptune Audio System
// ═══════════════════════════════════════════════════════════════

let isStarted = false;

// Start audio context (must be called from user interaction)
export const startAudio = async () => {
  if (isStarted) return;
  await Tone.start();
  isStarted = true;
  Tone.getDestination().volume.value = -10; // Lowered volume
};

// ─────────────────────────────────────────────────────────────────
//  INSTRUMENTS (NES-style)
// ─────────────────────────────────────────────────────────────────

// Pulse wave synth for melody (NES Pulse Channel)
const melodySynth = new Tone.Synth({
  oscillator: { type: 'pulse', width: 0.25 },
  envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.1 }
}).toDestination();
melodySynth.volume.value = -8;

// Pulse wave synth for harmony
const harmonySynth = new Tone.Synth({
  oscillator: { type: 'pulse', width: 0.5 },
  envelope: { attack: 0.01, decay: 0.15, sustain: 0.3, release: 0.1 }
}).toDestination();
harmonySynth.volume.value = -12;

// Triangle wave synth for bass (NES Triangle Channel)
const bassSynth = new Tone.Synth({
  oscillator: { type: 'triangle' },
  envelope: { attack: 0.01, decay: 0.1, sustain: 0.6, release: 0.1 }
}).toDestination();
bassSynth.volume.value = -6;

// Noise synth for drums (NES Noise Channel)
const noiseSynth = new Tone.NoiseSynth({
  noise: { type: 'white' },
  envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
}).toDestination();
noiseSynth.volume.value = -12;

// SFX synths
const sfxSynth = new Tone.Synth({
  oscillator: { type: 'square' },
  envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 }
}).toDestination();
sfxSynth.volume.value = -8;

// Additional SFX synth for layering
const sfxSynth2 = new Tone.Synth({
  oscillator: { type: 'pulse', width: 0.5 },
  envelope: { attack: 0.005, decay: 0.05, sustain: 0.1, release: 0.05 }
}).toDestination();
sfxSynth2.volume.value = -10;

// Victory music synths
const victorySynth = new Tone.Synth({
  oscillator: { type: 'pulse', width: 0.25 },
  envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2 }
}).toDestination();
victorySynth.volume.value = -6;

const victoryBassSynth = new Tone.Synth({
  oscillator: { type: 'triangle' },
  envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.1 }
}).toDestination();
victoryBassSynth.volume.value = -8;

// ─────────────────────────────────────────────────────────────────
//  SOUND EFFECTS
// ─────────────────────────────────────────────────────────────────

export const sfx = {
  shoot: () => {
    if (!isStarted) return;
    sfxSynth.triggerAttackRelease('C6', '32n');
    setTimeout(() => sfxSynth.triggerAttackRelease('G5', '32n'), 30);
  },

  enemyHit: () => {
    if (!isStarted) return;
    sfxSynth.triggerAttackRelease('E3', '16n');
    setTimeout(() => sfxSynth.triggerAttackRelease('C3', '16n'), 50);
    setTimeout(() => noiseSynth.triggerAttackRelease('16n'), 80);
  },

  collectDoc: () => {
    if (!isStarted) return;
    const now = Tone.now();
    sfxSynth.triggerAttackRelease('E5', '32n', now);
    sfxSynth.triggerAttackRelease('G5', '32n', now + 0.06);
    sfxSynth.triggerAttackRelease('C6', '32n', now + 0.12);
    sfxSynth.triggerAttackRelease('E6', '16n', now + 0.18);
  },

  playerHit: () => {
    if (!isStarted) return;
    noiseSynth.triggerAttackRelease('8n');
    sfxSynth.triggerAttackRelease('C2', '8n');
  },

  elevator: () => {
    if (!isStarted) return;
    sfxSynth.triggerAttackRelease('G3', '32n');
  },

  win: () => {
    if (!isStarted) return;
    // Trigger victory music
    playVictoryMusic();
  },

  gameOver: () => {
    if (!isStarted) return;
    playGameOverMusic();
  },

  start: () => {
    if (!isStarted) return;
    const now = Tone.now();
    sfxSynth.triggerAttackRelease('C4', '16n', now);
    sfxSynth.triggerAttackRelease('E4', '16n', now + 0.1);
    sfxSynth.triggerAttackRelease('G4', '16n', now + 0.2);
    sfxSynth.triggerAttackRelease('C5', '8n', now + 0.3);
  },

  // New sound effects
  footstep: () => {
    if (!isStarted) return;
    noiseSynth.triggerAttackRelease('64n');
  },

  duck: () => {
    if (!isStarted) return;
    sfxSynth2.triggerAttackRelease('G2', '32n');
    setTimeout(() => sfxSynth2.triggerAttackRelease('E2', '32n'), 40);
  },

  unduck: () => {
    if (!isStarted) return;
    sfxSynth2.triggerAttackRelease('E2', '32n');
    setTimeout(() => sfxSynth2.triggerAttackRelease('G2', '32n'), 40);
  },

  enemySpawn: () => {
    if (!isStarted) return;
    const now = Tone.now();
    sfxSynth2.triggerAttackRelease('C3', '32n', now);
    sfxSynth2.triggerAttackRelease('E3', '32n', now + 0.05);
    sfxSynth2.triggerAttackRelease('G3', '32n', now + 0.1);
  },

  enemyShoot: () => {
    if (!isStarted) return;
    sfxSynth2.triggerAttackRelease('A5', '32n');
    setTimeout(() => sfxSynth2.triggerAttackRelease('F5', '32n'), 25);
  },

  doorOpen: () => {
    if (!isStarted) return;
    const now = Tone.now();
    sfxSynth2.triggerAttackRelease('C4', '32n', now);
    sfxSynth2.triggerAttackRelease('E4', '32n', now + 0.03);
  },

  allDocsCollected: () => {
    if (!isStarted) return;
    const now = Tone.now();
    // Triumphant fanfare
    sfxSynth.triggerAttackRelease('G4', '16n', now);
    sfxSynth.triggerAttackRelease('C5', '16n', now + 0.1);
    sfxSynth.triggerAttackRelease('E5', '16n', now + 0.2);
    sfxSynth.triggerAttackRelease('G5', '8n', now + 0.3);
    sfxSynth2.triggerAttackRelease('C4', '4n', now);
  }
};

// ─────────────────────────────────────────────────────────────────
//  VICTORY MUSIC
// ─────────────────────────────────────────────────────────────────

const playVictoryMusic = () => {
  const now = Tone.now();

  // Victory melody - triumphant fanfare
  const melodyNotes = [
    { note: 'C5', time: 0, duration: '8n' },
    { note: 'E5', time: 0.15, duration: '8n' },
    { note: 'G5', time: 0.3, duration: '8n' },
    { note: 'C6', time: 0.45, duration: '4n' },
    { note: 'G5', time: 0.75, duration: '8n' },
    { note: 'C6', time: 0.9, duration: '4n' },
    // Second phrase
    { note: 'E6', time: 1.3, duration: '8n' },
    { note: 'D6', time: 1.45, duration: '8n' },
    { note: 'C6', time: 1.6, duration: '8n' },
    { note: 'E6', time: 1.75, duration: '4n' },
    { note: 'D6', time: 2.05, duration: '8n' },
    { note: 'E6', time: 2.2, duration: '4n' },
    // Final phrase - big finish
    { note: 'G5', time: 2.6, duration: '8n' },
    { note: 'A5', time: 2.75, duration: '8n' },
    { note: 'B5', time: 2.9, duration: '8n' },
    { note: 'C6', time: 3.05, duration: '8n' },
    { note: 'D6', time: 3.2, duration: '8n' },
    { note: 'E6', time: 3.35, duration: '8n' },
    { note: 'F6', time: 3.5, duration: '8n' },
    { note: 'G6', time: 3.65, duration: '2n' },
  ];

  // Bass notes
  const bassNotes = [
    { note: 'C3', time: 0, duration: '4n' },
    { note: 'G3', time: 0.45, duration: '4n' },
    { note: 'C3', time: 0.9, duration: '4n' },
    { note: 'A2', time: 1.3, duration: '4n' },
    { note: 'G2', time: 1.75, duration: '4n' },
    { note: 'F2', time: 2.2, duration: '4n' },
    { note: 'G2', time: 2.6, duration: '4n' },
    { note: 'C3', time: 3.2, duration: '2n' },
  ];

  // Drums - celebratory pattern
  const drumHits = [0, 0.15, 0.3, 0.45, 0.75, 0.9, 1.3, 1.45, 1.75, 2.05, 2.6, 2.75, 2.9, 3.05, 3.2, 3.35, 3.5, 3.65];

  melodyNotes.forEach(({ note, time, duration }) => {
    victorySynth.triggerAttackRelease(note, duration, now + time);
  });

  bassNotes.forEach(({ note, time, duration }) => {
    victoryBassSynth.triggerAttackRelease(note, duration, now + time);
  });

  drumHits.forEach(time => {
    noiseSynth.triggerAttackRelease('32n', now + time);
  });
};

// ─────────────────────────────────────────────────────────────────
//  GAME OVER MUSIC
// ─────────────────────────────────────────────────────────────────

const playGameOverMusic = () => {
  const now = Tone.now();

  // Sad descending melody
  const melodyNotes = [
    { note: 'E5', time: 0, duration: '4n' },
    { note: 'D5', time: 0.4, duration: '4n' },
    { note: 'C5', time: 0.8, duration: '4n' },
    { note: 'B4', time: 1.2, duration: '4n' },
    { note: 'A4', time: 1.6, duration: '4n' },
    { note: 'G4', time: 2.0, duration: '4n' },
    { note: 'F4', time: 2.4, duration: '4n' },
    { note: 'E4', time: 2.8, duration: '2n' },
  ];

  // Bass - minor feel
  const bassNotes = [
    { note: 'A2', time: 0, duration: '2n' },
    { note: 'E2', time: 0.8, duration: '2n' },
    { note: 'F2', time: 1.6, duration: '2n' },
    { note: 'E2', time: 2.4, duration: '1n' },
  ];

  melodyNotes.forEach(({ note, time, duration }) => {
    sfxSynth.triggerAttackRelease(note, duration, now + time);
  });

  bassNotes.forEach(({ note, time, duration }) => {
    victoryBassSynth.triggerAttackRelease(note, duration, now + time);
  });
};

// ─────────────────────────────────────────────────────────────────
//  BACKGROUND MUSIC
// ─────────────────────────────────────────────────────────────────

// Main theme melody (Elevator Action inspired)
const melodyPattern = [
  // Bar 1
  { note: 'E4', duration: '8n', time: '0:0:0' },
  { note: 'G4', duration: '8n', time: '0:0:2' },
  { note: 'A4', duration: '8n', time: '0:1:0' },
  { note: 'B4', duration: '8n', time: '0:1:2' },
  { note: 'C5', duration: '4n', time: '0:2:0' },
  { note: 'B4', duration: '8n', time: '0:3:0' },
  { note: 'A4', duration: '8n', time: '0:3:2' },
  // Bar 2
  { note: 'G4', duration: '8n', time: '1:0:0' },
  { note: 'E4', duration: '8n', time: '1:0:2' },
  { note: 'D4', duration: '4n', time: '1:1:0' },
  { note: 'E4', duration: '4n', time: '1:2:0' },
  { note: 'G4', duration: '4n', time: '1:3:0' },
  // Bar 3
  { note: 'A4', duration: '8n', time: '2:0:0' },
  { note: 'B4', duration: '8n', time: '2:0:2' },
  { note: 'C5', duration: '8n', time: '2:1:0' },
  { note: 'D5', duration: '8n', time: '2:1:2' },
  { note: 'E5', duration: '4n', time: '2:2:0' },
  { note: 'D5', duration: '8n', time: '2:3:0' },
  { note: 'C5', duration: '8n', time: '2:3:2' },
  // Bar 4
  { note: 'B4', duration: '8n', time: '3:0:0' },
  { note: 'A4', duration: '8n', time: '3:0:2' },
  { note: 'G4', duration: '4n', time: '3:1:0' },
  { note: 'E4', duration: '2n', time: '3:2:0' },
];

// Harmony pattern
const harmonyPattern = [
  { note: 'C4', duration: '2n', time: '0:0:0' },
  { note: 'G3', duration: '2n', time: '0:2:0' },
  { note: 'A3', duration: '2n', time: '1:0:0' },
  { note: 'E4', duration: '2n', time: '1:2:0' },
  { note: 'F4', duration: '2n', time: '2:0:0' },
  { note: 'G4', duration: '2n', time: '2:2:0' },
  { note: 'E4', duration: '2n', time: '3:0:0' },
  { note: 'C4', duration: '2n', time: '3:2:0' },
];

// Bass line
const bassPattern = [
  { note: 'C2', duration: '4n', time: '0:0:0' },
  { note: 'C2', duration: '4n', time: '0:1:0' },
  { note: 'G2', duration: '4n', time: '0:2:0' },
  { note: 'G2', duration: '4n', time: '0:3:0' },
  { note: 'A2', duration: '4n', time: '1:0:0' },
  { note: 'A2', duration: '4n', time: '1:1:0' },
  { note: 'E2', duration: '4n', time: '1:2:0' },
  { note: 'E2', duration: '4n', time: '1:3:0' },
  { note: 'F2', duration: '4n', time: '2:0:0' },
  { note: 'F2', duration: '4n', time: '2:1:0' },
  { note: 'G2', duration: '4n', time: '2:2:0' },
  { note: 'G2', duration: '4n', time: '2:3:0' },
  { note: 'A2', duration: '4n', time: '3:0:0' },
  { note: 'G2', duration: '4n', time: '3:1:0' },
  { note: 'C2', duration: '2n', time: '3:2:0' },
];

// Drum pattern
const drumPattern = [
  { time: '0:0:0' }, { time: '0:1:0' }, { time: '0:2:0' }, { time: '0:3:0' },
  { time: '1:0:0' }, { time: '1:1:0' }, { time: '1:2:0' }, { time: '1:3:0' },
  { time: '2:0:0' }, { time: '2:1:0' }, { time: '2:2:0' }, { time: '2:3:0' },
  { time: '3:0:0' }, { time: '3:1:0' }, { time: '3:2:0' }, { time: '3:3:0' },
];

let melodyPart, harmonyPart, bassPart, drumPart;
let musicPlaying = false;

export const startMusic = () => {
  if (!isStarted || musicPlaying) return;

  Tone.getTransport().bpm.value = 140;

  melodyPart = new Tone.Part((time, value) => {
    melodySynth.triggerAttackRelease(value.note, value.duration, time);
  }, melodyPattern).start(0);
  melodyPart.loop = true;
  melodyPart.loopEnd = '4:0:0';

  harmonyPart = new Tone.Part((time, value) => {
    harmonySynth.triggerAttackRelease(value.note, value.duration, time);
  }, harmonyPattern).start(0);
  harmonyPart.loop = true;
  harmonyPart.loopEnd = '4:0:0';

  bassPart = new Tone.Part((time, value) => {
    bassSynth.triggerAttackRelease(value.note, value.duration, time);
  }, bassPattern).start(0);
  bassPart.loop = true;
  bassPart.loopEnd = '4:0:0';

  drumPart = new Tone.Part((time) => {
    noiseSynth.triggerAttackRelease('32n', time);
  }, drumPattern).start(0);
  drumPart.loop = true;
  drumPart.loopEnd = '4:0:0';

  Tone.getTransport().start();
  musicPlaying = true;
};

export const stopMusic = () => {
  if (!musicPlaying) return;

  Tone.getTransport().stop();
  Tone.getTransport().position = 0;

  melodyPart?.dispose();
  harmonyPart?.dispose();
  bassPart?.dispose();
  drumPart?.dispose();

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
