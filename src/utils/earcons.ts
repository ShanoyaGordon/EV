let audioCtx: AudioContext | null = null;
let unlocked = false;
let earconsEnabled = true;
let hapticsEnabled = true;
let earconVolume = 0.15;

export function configureEarcons(options: {
  enableEarcons?: boolean;
  enableHaptics?: boolean;
  volume?: number;
}) {
  if (options.enableEarcons !== undefined) earconsEnabled = options.enableEarcons;
  if (options.enableHaptics !== undefined) hapticsEnabled = options.enableHaptics;
  if (options.volume !== undefined) earconVolume = Math.max(0, Math.min(1, options.volume));
}

export function initEarconsViaGesture() {
  try {
    if (unlocked) return;
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.01);
    unlocked = true;
  } catch {}
}

function playTone(frequency: number, durationMs: number, volume = earconVolume) {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    osc.start(now);
    osc.stop(now + durationMs / 1000);
  } catch {}
}

export type PriorityLevel = 'high' | 'medium' | 'low';

export function playEarcon(priority: PriorityLevel) {
  try {
    if (hapticsEnabled && navigator.vibrate) {
      if (priority === 'high') navigator.vibrate([0, 80, 60, 80]);
      else if (priority === 'medium') navigator.vibrate([0, 60]);
      else navigator.vibrate(30);
    }
  } catch {}

  if (!earconsEnabled) return;
  if (priority === 'high') {
    playTone(1400, 100);
    setTimeout(() => playTone(1400, 100), 160);
  } else if (priority === 'medium') {
    playTone(900, 120);
  } else {
    playTone(600, 90, Math.min(earconVolume, 0.1));
  }
}


