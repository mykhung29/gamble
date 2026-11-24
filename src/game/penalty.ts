import { PK_PAYOUT } from '../config'
import { randInt } from './logic'

/** goal = vào · save = thủ môn bắt · miss = ra ngoài / vọt xà · post = trúng cột, xà */
export type PkOutcome = 'goal' | 'save' | 'miss' | 'post'

export interface PkRecord {
  outcome: PkOutcome
  bet: number
  net: number
  at: number
}

export const PK_LABEL: Record<PkOutcome, string> = {
  goal: 'Vào!',
  save: 'Thủ môn bắt',
  miss: 'Ra ngoài',
  post: 'Trúng cột',
}

/* Hệ toạ độ sân (viewBox 400 x 320) */
export const PITCH = { w: 400, h: 320 }
export const GOAL = { x1: 80, x2: 320, top: 40, bottom: 140 }
export const BALL0 = { x: 200, y: 285, r: 13 }
/** ranh giới 3 cột khung thành (trái / giữa / phải) */
export const COL_EDGES = [160, 240]
export const COL_CENTERS = [120, 200, 280]
/** ranh giới sệt / bổng */
export const ROW_EDGE = 90

export interface Shot {
  /** điểm bóng tới (toạ độ sân) */
  x: number
  y: number
  outcome: PkOutcome
  /** cột bóng tới (0 trái, 1 giữa, 2 phải), -1 nếu ra ngoài */
  col: number
  /** cột thủ môn bay */
  keeperCol: number
  keeperHigh: boolean
}

/**
 * Từ cú vuốt (toạ độ sân) ra cú sút:
 *  - hướng vuốt -> bóng lệch trái/phải
 *  - tốc độ vuốt -> độ cao (chậm = sệt, nhanh = bổng, quá nhanh = vọt xà)
 * Bóng trúng khung thì thủ môn bắt được 50%, không phụ thuộc hướng bóng.
 */
export function makeShot(dx: number, dy: number, dtMs: number): Shot {
  const x = BALL0.x + (dx / -dy) * (BALL0.y - ROW_EDGE)
  const speed = Math.hypot(dx, dy) / Math.max(dtMs, 16)
  // ~0.3 đơn vị/ms = sệt sát cỏ, ~3 = sát xà, nhanh hơn nữa thì vọt xà
  const h = Math.max(0, (speed - 0.3) / 2.6)
  const y = GOAL.bottom - 4 - h * 92

  const keeperHigh = randInt(2) === 0

  const wide = x < GOAL.x1 - 6 || x > GOAL.x2 + 6
  const over = y < GOAL.top - 6
  const hitPost = Math.abs(x - GOAL.x1) <= 6 || Math.abs(x - GOAL.x2) <= 6 || (Math.abs(y - GOAL.top) <= 6 && x > GOAL.x1 && x < GOAL.x2)
  if (wide || over) return { x, y, outcome: 'miss', col: -1, keeperCol: randInt(3), keeperHigh }
  if (hitPost) return { x, y, outcome: 'post', col: -1, keeperCol: randInt(3), keeperHigh }

  const col = x < COL_EDGES[0] ? 0 : x < COL_EDGES[1] ? 1 : 2
  // Bóng trúng khung: thủ môn bắt được đúng 50%, không phụ thuộc hướng sút.
  // Bắt được -> bay đúng cột bóng; không -> bay sang 1 trong 2 cột còn lại.
  const saved = randInt(2) === 0
  const keeperCol = saved ? col : (col + 1 + randInt(2)) % 3
  return { x, y, outcome: saved ? 'save' : 'goal', col, keeperCol, keeperHigh: saved ? y < ROW_EDGE : keeperHigh }
}

/** Tiền nhận về (gồm gốc) */
export const pkPayout = (bet: number, o: PkOutcome) => (o === 'goal' ? Math.floor(bet * (1 + PK_PAYOUT)) : 0)
