// Sound and speech for the player (design §2): Web Audio starts only after a tap, so `unlock()` runs on the session's
// Start tap. Every cue is also on screen, because the ring/silent switch may mute the tones.

export type Tone = 'tick' | 'start' | 'end' | 'done'

const TONES: Record<Tone, { hz: number; ms: number; repeat?: number }> = {
  tick: { hz: 660, ms: 120 },
  start: { hz: 990, ms: 300 },
  end: { hz: 520, ms: 450 },
  done: { hz: 880, ms: 180, repeat: 3 },
}

let ctx: AudioContext | null = null

function audioContext(): AudioContext | null {
  if (ctx) return ctx
  const Ctor =
    typeof window === 'undefined'
      ? undefined
      : (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
  if (!Ctor) return null
  ctx = new Ctor()
  return ctx
}

/** Call from a tap: resumes the audio context and plays a silent buffer, which unlocks sound on iOS. */
export function unlockAudio(): void {
  const c = audioContext()
  if (!c) return
  void c.resume().catch(() => undefined)
  const buffer = c.createBuffer(1, 1, 22050)
  const src = c.createBufferSource()
  src.buffer = buffer
  src.connect(c.destination)
  src.start(0)
}

export function playTone(tone: Tone): void {
  const c = audioContext()
  if (c?.state !== 'running') return
  const { hz, ms, repeat = 1 } = TONES[tone]
  for (let i = 0; i < repeat; i++) {
    const at = c.currentTime + (i * (ms + 80)) / 1000
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.frequency.value = hz
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.4, at + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + ms / 1000)
    osc.connect(gain).connect(c.destination)
    osc.start(at)
    osc.stop(at + ms / 1000 + 0.05)
  }
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** A spoken cue in the phone's own voice; it needs no network. Interrupts the previous cue. */
export function speak(text: string): void {
  if (!canSpeak()) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en'
  u.rate = 1
  window.speechSynthesis.speak(u)
}

const SPOKEN_KEY = 'tortoise.spokenCues'

/** The spoken-cue switch is a per-phone convenience, kept in localStorage (D-040). */
export function spokenCuesOn(): boolean {
  try {
    return localStorage.getItem(SPOKEN_KEY) === '1'
  } catch {
    return false
  }
}

export function setSpokenCues(on: boolean): void {
  try {
    localStorage.setItem(SPOKEN_KEY, on ? '1' : '0')
  } catch {
    // private mode: the switch lasts for this session only
  }
}
