import { CUP_PAYOUT, CUP_SWAPS } from '../config'
import { randInt } from './logic'

export interface CupRecord {
  win: boolean
  bet: number
  net: number
  at: number
}

/** Mỗi bước tráo: đổi chỗ 2 vị trí (slot) */
export type Swap = [number, number]

/** Chuỗi tráo ngẫu nhiên. Mỗi bước đổi 2 vị trí khác nhau */
export function makeSwaps(n = CUP_SWAPS): Swap[] {
  return Array.from({ length: n }, () => {
    const a = randInt(3)
    const b = (a + 1 + randInt(2)) % 3
    return [a, b] as Swap
  })
}

/** Áp 1 bước tráo: slots[cup] = vị trí hiện tại của ly */
export function applySwap(slots: number[], [a, b]: Swap): number[] {
  return slots.map((s) => (s === a ? b : s === b ? a : s))
}

/** Tiền nhận về (gồm gốc) */
export const cupPayout = (bet: number, win: boolean) => (win ? Math.floor(bet * (1 + CUP_PAYOUT)) : 0)
