import { HR_RACE_MS, HR_RTP } from '../config'
import { randInt } from './logic'

export interface HorseInfo {
  /** màu áo nài ngựa */
  silk: string
  /** màu lông ngựa */
  coat: string
}

export const HORSES: HorseInfo[] = [
  { silk: '#dc2626', coat: '#8b4a24' },
  { silk: '#2563eb', coat: '#5b3a24' },
  { silk: '#eab308', coat: '#2a2522' },
  { silk: '#16a34a', coat: '#d6d0c6' },
  { silk: '#9333ea', coat: '#a0522d' },
  { silk: '#f97316', coat: '#4a3426' },
]

export interface HrRecord {
  /** tiền cược vào từng ngựa */
  bets?: number[]
  /** bản cũ: chỉ cược 1 ngựa */
  pick?: number
  /** ngựa về nhất */
  winner: number
  /** kèo của ngựa về nhất (ăn 1 được bao nhiêu) */
  odds: number
  /** có cược trúng ngựa về nhất không */
  win: boolean
  bet: number
  net: number
  at: number
}

/** Kèo của 1 ván: xác suất thắng và tỷ lệ trả của từng ngựa */
export interface Field {
  probs: number[]
  odds: number[]
}

/** Kế hoạch chạy: ai về thứ mấy, về đích lúc nào, tốc độ từng đoạn */
export interface RacePlan {
  /** thứ tự về đích (chỉ số ngựa) */
  order: number[]
  /** thời điểm về đích của từng ngựa (ms) */
  finish: number[]
  /** quãng đường đã chạy tại các mốc thời gian đều nhau, từ 0 tới 1 */
  curves: number[][]
}

const rand = () => randInt(1_000_000) / 1_000_000

/** Kèo = RTP / xác suất − 1, làm tròn xuống 0,1 */
export function makeField(): Field {
  const w = HORSES.map(() => 1 + rand() * 3)
  const sum = w.reduce((a, b) => a + b, 0)
  const probs = w.map((x) => x / sum)
  const odds = probs.map((p) => Math.floor((HR_RTP / p - 1) * 10) / 10)
  return { probs, odds }
}

/** Bốc 1 ngựa theo xác suất, bỏ qua các ngựa đã bốc */
function pickWeighted(probs: number[], taken: number[]): number {
  const left = probs.map((p, i) => (taken.includes(i) ? 0 : p))
  let r = rand() * left.reduce((a, b) => a + b, 0)
  for (let i = 0; i < left.length; i++) {
    if (left[i] === 0) continue
    r -= left[i]
    if (r <= 0) return i
  }
  // sai số làm tròn: lấy ngựa cuối cùng còn lại
  for (let i = left.length - 1; i >= 0; i--) if (left[i] > 0) return i
  return 0
}

const SEGMENTS = 12

/** Quyết định kết quả ngay từ đầu, rồi dựng đường chạy cho khớp kết quả */
export function planRace(probs: number[]): RacePlan {
  const order: number[] = []
  while (order.length < probs.length) order.push(pickWeighted(probs, order))

  const finish = new Array<number>(probs.length)
  let t = HR_RACE_MS
  order.forEach((h, k) => {
    if (k > 0) t += 120 + rand() * 520
    finish[h] = t
  })

  // mỗi đoạn chạy nhanh chậm khác nhau -> có lúc vượt lên, có lúc tụt lại
  const curves = probs.map(() => {
    const seg = Array.from({ length: SEGMENTS }, () => 0.6 + rand() * 0.8)
    const total = seg.reduce((a, b) => a + b, 0)
    const pts = [0]
    seg.forEach((s) => pts.push(pts[pts.length - 1] + s / total))
    pts[SEGMENTS] = 1
    return pts
  })

  return { order, finish, curves }
}

/** Quãng đường (0..1) của ngựa h tại thời điểm t (ms tính từ lúc xuất phát) */
export function progressAt(plan: RacePlan, h: number, t: number): number {
  const T = plan.finish[h]
  if (t <= 0) return 0
  if (t >= T) return 1
  const x = (t / T) * SEGMENTS
  const k = Math.floor(x)
  const c = plan.curves[h]
  return c[k] + (c[k + 1] - c[k]) * (x - k)
}

/** Tiền nhận về (gồm gốc) */
export const hrPayout = (bet: number, odds: number, win: boolean) => (win ? Math.floor(bet * (1 + odds)) : 0)

export const fmtOdds = (o: number) => String(o).replace('.', ',')
