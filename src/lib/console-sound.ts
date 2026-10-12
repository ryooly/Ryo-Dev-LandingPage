type ToneLib = typeof import("tone");
type BlipVoice = InstanceType<ToneLib["Synth"]>;
type ThudVoice = InstanceType<ToneLib["MembraneSynth"]>;
type ClickVoice = InstanceType<ToneLib["NoiseSynth"]>;

export type ConsoleSound = "press" | "move" | "start" | "deny" | "open" | "close";

const STORAGE_KEY = "rio-console-sound";
const MASTER_GAIN = 0.5;

type Step = {
  voice: "blip" | "thud" | "click";
  note?: string;
  at: number;
  dur: number;
  vel: number;
};

const recipes: Record<ConsoleSound, Step[]> = {
  press: [
    { voice: "blip", note: "A4", at: 0, dur: 0.05, vel: 0.5 },
    { voice: "click", at: 0, dur: 0.014, vel: 0.24 },
  ],
  move: [
    { voice: "thud", note: "C2", at: 0, dur: 0.07, vel: 0.42 },
    { voice: "click", at: 0, dur: 0.012, vel: 0.2 },
  ],
  start: [
    { voice: "blip", note: "C5", at: 0, dur: 0.07, vel: 0.55 },
    { voice: "blip", note: "E5", at: 0.075, dur: 0.07, vel: 0.55 },
    { voice: "blip", note: "G5", at: 0.15, dur: 0.07, vel: 0.55 },
    { voice: "blip", note: "C6", at: 0.225, dur: 0.2, vel: 0.6 },
  ],
  deny: [
    { voice: "blip", note: "A2", at: 0, dur: 0.09, vel: 0.5 },
    { voice: "blip", note: "G2", at: 0.12, dur: 0.13, vel: 0.48 },
  ],
  open: [
    { voice: "blip", note: "G4", at: 0, dur: 0.06, vel: 0.45 },
    { voice: "blip", note: "D6", at: 0.06, dur: 0.1, vel: 0.45 },
  ],
  close: [
    { voice: "blip", note: "D6", at: 0, dur: 0.06, vel: 0.45 },
    { voice: "blip", note: "G4", at: 0.06, dur: 0.1, vel: 0.45 },
  ],
};

type Rig = {
  tone: ToneLib;
  blip: BlipVoice;
  thud: ThudVoice;
  click: ClickVoice;
};

let rig: Rig | null = null;
let booting: Promise<Rig | null> | null = null;

let toneLib: ToneLib | null = null;

function readMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "off";
  } catch {
    return false;
  }
}

let muted = readMuted();

async function ensureTone(): Promise<ToneLib | null> {
  if (toneLib) return toneLib;
  try {
    toneLib = await import("tone");
    return toneLib;
  } catch {
    return null;
  }
}

async function buildRig(): Promise<Rig | null> {
  const tone = await ensureTone();
  if (!tone) return null;

  await tone.start();
  if (tone.getContext().state !== "running") return null;

  const limiter = new tone.Limiter(-6).toDestination();
  const master = new tone.Gain(MASTER_GAIN);
  master.connect(limiter);

  const blip = new tone.Synth({
    oscillator: { type: "square" },
    envelope: { attack: 0.001, decay: 0.045, sustain: 0, release: 0.04 },
  });
  blip.connect(master);

  const thud = new tone.MembraneSynth({
    octaves: 3,
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 },
  });
  thud.connect(master);

  const click = new tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.018, sustain: 0, release: 0.008 },
  });
  click.connect(master);

  return { tone, blip, thud, click };
}

function boot(): Promise<Rig | null> {
  if (rig) return Promise.resolve(rig);
  if (!booting) {
    booting = buildRig()
      .then((next) => {
        if (next) {
          rig = next;

          detachAudioUnlock();
        } else {
          booting = null;
        }
        return next;
      })
      .catch(() => {
        booting = null;
        return null;
      });
  }
  return booting;
}

let unlockAttached = false;

function onFirstGesture(): void {
  if (muted) return;
  if (toneLib) void toneLib.start();
  void boot();
}

export function attachAudioUnlock(): void {
  if (typeof window === "undefined" || unlockAttached) return;
  unlockAttached = true;
  void ensureTone();
  window.addEventListener("pointerdown", onFirstGesture);
  window.addEventListener("keydown", onFirstGesture);
  window.addEventListener("touchstart", onFirstGesture, { passive: true });
}

export function detachAudioUnlock(): void {
  if (typeof window === "undefined" || !unlockAttached) return;
  unlockAttached = false;
  window.removeEventListener("pointerdown", onFirstGesture);
  window.removeEventListener("keydown", onFirstGesture);
  window.removeEventListener("touchstart", onFirstGesture);
}

export function unlockConsoleAudio(): void {
  onFirstGesture();
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(nextMuted: boolean): void {
  muted = nextMuted;
  try {
    window.localStorage.setItem(STORAGE_KEY, nextMuted ? "off" : "on");
  } catch {}
  if (!nextMuted) {
    if (toneLib) void toneLib.start();
    void boot();
  }
}

export async function playConsoleSound(sound: ConsoleSound): Promise<void> {
  if (muted) return;
  const active = await boot();
  if (!active) return;

  if (active.tone.getContext().state !== "running") {
    booting = null;
    rig = null;
    return;
  }

  const origin = active.tone.now();
  for (const step of recipes[sound]) {
    const voice = active[step.voice];
    if (step.voice === "click") {
      voice.triggerAttackRelease(step.dur, origin + step.at, step.vel);
    } else {
      voice.triggerAttackRelease(step.note ?? "C4", step.dur, origin + step.at, step.vel);
    }
  }
}
