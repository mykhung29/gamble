let ctx: AudioContext | null = null
let muted = false
let noiseBuf: AudioBuffer | null = null

function ac() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.15, delay = 0) {
  if (muted) return
  const c = ac()
  const o = c.createOscillator()
  const g = c.createGain()
  const t = c.currentTime + delay
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + dur + 0.05)
}

function rattle(delay: number) {
  if (muted) return
  const c = ac()
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.06), c.sampleRate)
    const data = noiseBuf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  }
  const src = c.createBufferSource()
  src.buffer = noiseBuf
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = 1800 + Math.random() * 2500
  f.Q.value = 3
  const g = c.createGain()
  g.gain.value = 0.5
  src.connect(f).connect(g).connect(c.destination)
  src.start(c.currentTime + delay)
}

export const sfx = {
  chip() {
    tone(1400, 0.05, 'triangle', 0.12)
    tone(2100, 0.05, 'triangle', 0.06, 0.025)
  },
  remove() {
    tone(700, 0.06, 'triangle', 0.1)
  },
  shake(ms: number) {
    const n = Math.floor((ms / 1000) * 16)
    for (let i = 0; i < n; i++) rattle(i / 16 + Math.random() * 0.03)
  },
  open() {
    tone(500, 0.12, 'sine', 0.12)
    tone(750, 0.15, 'sine', 0.1, 0.06)
  },
  win(big = false) {
    const notes = big ? [523, 659, 784, 1047, 1319, 1568] : [523, 659, 784, 1047]
    notes.forEach((f, i) => tone(f, 0.3, 'triangle', 0.14, i * 0.08))
  },
  lose() {
    tone(260, 0.3, 'sawtooth', 0.05)
    tone(185, 0.45, 'sawtooth', 0.05, 0.18)
  },
  flip() {
    rattle(0)
    tone(900, 0.05, 'triangle', 0.08)
  },
  deal() {
    for (let i = 0; i < 6; i++) rattle(i * 0.09)
  },
  tick() {
    tone(1000, 0.05, 'square', 0.05)
  },
  error() {
    tone(160, 0.15, 'square', 0.06)
  },
  setMuted(m: boolean) {
    muted = m
  },
}
