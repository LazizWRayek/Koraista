/**
 * SoundManager — generates and plays procedural audio SFX using Web Audio API.
 *
 * No external audio files needed — all sounds are synthesized at runtime.
 * This gives us crisp, immediate SFX with zero loading time.
 */

let audioCtx: AudioContext | null = null;
let muted = false;
let sfxVolume = 0.5;
let musicVolume = 0.3;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/** Initialize audio context (call on first user interaction) */
export function initAudio(): void {
  getCtx();
  // Load preferences
  try {
    const savedMuted = localStorage.getItem('koraista_muted');
    if (savedMuted !== null) muted = savedMuted === 'true';
    const savedSfx = localStorage.getItem('koraista_sfx_vol');
    if (savedSfx !== null) sfxVolume = parseFloat(savedSfx);
    const savedMusic = localStorage.getItem('koraista_music_vol');
    if (savedMusic !== null) musicVolume = parseFloat(savedMusic);
  } catch {
    // localStorage unavailable
  }
}

export function isMuted(): boolean {
  return muted;
}

export function toggleMute(): void {
  muted = !muted;
  try {
    localStorage.setItem('koraista_muted', String(muted));
  } catch {
    // unavailable
  }
}

export function setSfxVolume(vol: number): void {
  sfxVolume = Math.max(0, Math.min(1, vol));
  try {
    localStorage.setItem('koraista_sfx_vol', String(sfxVolume));
  } catch {
    // unavailable
  }
}

export function getSfxVolume(): number {
  return sfxVolume;
}

export function setMusicVolume(vol: number): void {
  musicVolume = Math.max(0, Math.min(1, vol));
  try {
    localStorage.setItem('koraista_music_vol', String(musicVolume));
  } catch {
    // unavailable
  }
}

export function getMusicVolume(): number {
  return musicVolume;
}

// --- Synthesized SFX ---

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 1): void {
  if (muted) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = sfxVolume * vol * 0.3;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, vol = 1): void {
  if (muted) return;
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = sfxVolume * vol * 0.15;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

/** Button tap / UI click */
export function playTap(): void {
  playTone(800, 0.08, 'square', 0.3);
}

/** Card draw / slide */
export function playCardDraw(): void {
  if (muted) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
  gain.gain.value = sfxVolume * 0.2;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

/** Correct answer — ascending chime */
export function playCorrect(): void {
  playTone(523, 0.15, 'sine', 0.5);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.5), 100);
  setTimeout(() => playTone(784, 0.2, 'sine', 0.6), 200);
}

/** Wrong answer — descending buzz */
export function playWrong(): void {
  playTone(300, 0.15, 'sawtooth', 0.3);
  setTimeout(() => playTone(200, 0.25, 'sawtooth', 0.3), 120);
}

/** Goal scored — stadium roar approximation */
export function playGoal(): void {
  playNoise(0.6, 1.5);
  playTone(440, 0.1, 'square', 0.4);
  setTimeout(() => playTone(554, 0.1, 'square', 0.4), 80);
  setTimeout(() => playTone(659, 0.15, 'square', 0.5), 160);
  setTimeout(() => playTone(880, 0.3, 'sine', 0.6), 240);
}

/** Save / block — thud */
export function playSave(): void {
  playTone(100, 0.2, 'sine', 0.6);
  playNoise(0.15, 0.5);
}

/** Timer tick (heartbeat) */
export function playTick(): void {
  playTone(120, 0.06, 'sine', 0.4);
}

/** Streak chime — escalating */
export function playStreak(streakCount: number): void {
  const baseFreq = 400 + streakCount * 80;
  playTone(baseFreq, 0.1, 'sine', 0.4);
  setTimeout(() => playTone(baseFreq * 1.25, 0.15, 'sine', 0.5), 80);
}

/** Win fanfare */
export function playWin(): void {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.25, 'sine', 0.5), i * 150);
  });
}

/** Lose / consolation */
export function playLose(): void {
  const notes = [400, 350, 300, 250];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'triangle', 0.3), i * 200);
  });
}

/** Whistle blast */
export function playWhistle(): void {
  if (muted) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2500, ctx.currentTime);
  osc.frequency.setValueAtTime(3000, ctx.currentTime + 0.15);
  osc.frequency.setValueAtTime(2500, ctx.currentTime + 0.3);
  gain.gain.value = sfxVolume * 0.2;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
}

// --- Ambient crowd murmur (looping) ---

let crowdSource: AudioBufferSourceNode | null = null;
let crowdGain: GainNode | null = null;

export function startCrowdAmbience(): void {
  if (muted || crowdSource) return;
  const ctx = getCtx();
  const duration = 3;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Low-pass filtered noise to simulate distant crowd
  let prev = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Simple low-pass filter
    prev = prev * 0.97 + white * 0.03;
    data[i] = prev;
  }

  crowdSource = ctx.createBufferSource();
  crowdSource.buffer = buffer;
  crowdSource.loop = true;

  crowdGain = ctx.createGain();
  crowdGain.gain.value = musicVolume * 0.15;

  crowdSource.connect(crowdGain);
  crowdGain.connect(ctx.destination);
  crowdSource.start();
}

export function stopCrowdAmbience(): void {
  if (crowdSource) {
    crowdSource.stop();
    crowdSource = null;
    crowdGain = null;
  }
}

export function updateCrowdVolume(): void {
  if (crowdGain) {
    crowdGain.gain.value = muted ? 0 : musicVolume * 0.15;
  }
}
