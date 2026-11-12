import { DEFAULT_PASSWORD_HASH } from '../config'

/*
 * Mật khẩu KHÔNG lưu dạng chữ, chỉ lưu mã băm SHA-256 (kèm "muối").
 * Tự cài SHA-256 vì crypto.subtle không chạy khi mở qua http:// trong mạng LAN.
 */

const SALT = 'gvv-salt::'
const STORE_KEY = 'gvv-pw'

// Hằng số SHA-256: phần lẻ của căn bậc 3 / bậc 2 của các số nguyên tố đầu tiên
const PRIMES: number[] = []
for (let n = 2; PRIMES.length < 64; n++) if (PRIMES.every((p) => n % p !== 0)) PRIMES.push(n)
const frac32 = (x: number) => ((x - Math.floor(x)) * 2 ** 32) >>> 0
const K = PRIMES.map((p) => frac32(Math.cbrt(p)))
const H0 = PRIMES.slice(0, 8).map((p) => frac32(Math.sqrt(p)))

const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n))

export function sha256(msg: string): string {
  const bytes = new TextEncoder().encode(msg)
  const len = bytes.length
  const buf = new Uint8Array(((len + 9 + 63) >> 6) << 6)
  buf.set(bytes)
  buf[len] = 0x80
  const dv = new DataView(buf.buffer)
  const bits = len * 8
  dv.setUint32(buf.length - 8, Math.floor(bits / 2 ** 32))
  dv.setUint32(buf.length - 4, bits >>> 0)

  const h = [...H0]
  const w = new Uint32Array(64)
  for (let off = 0; off < buf.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4)
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3)
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10)
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0
    }
    let [a, b, c, d, e, f, g, hh] = h
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0
      hh = g
      g = f
      f = e
      e = (d + t1) >>> 0
      d = c
      c = b
      b = a
      a = (t1 + t2) >>> 0
    }
    ;[a, b, c, d, e, f, g, hh].forEach((v, i) => (h[i] = (h[i] + v) >>> 0))
  }
  return h.map((x) => x.toString(16).padStart(8, '0')).join('')
}

export const hashPassword = (pw: string) => sha256(SALT + pw)

function currentHash(): string {
  try {
    return localStorage.getItem(STORE_KEY) || DEFAULT_PASSWORD_HASH
  } catch {
    return DEFAULT_PASSWORD_HASH
  }
}

export const checkPassword = (pw: string) => hashPassword(pw) === currentHash()

/** Lưu mật khẩu mới. Trả về false nếu trình duyệt không cho lưu. */
export function savePassword(pw: string): boolean {
  try {
    localStorage.setItem(STORE_KEY, hashPassword(pw))
    return localStorage.getItem(STORE_KEY) === hashPassword(pw)
  } catch {
    return false
  }
}
