import { XS_CANG_PAYOUT, XS_DE_PAYOUT } from '../config'
import { randInt } from './logic'

/** de = 2 số cuối giải đặc biệt · cang = 3 số cuối */
export type XsKind = 'de' | 'cang'

export const XS_KINDS: Record<XsKind, { name: string; digits: number; payout: number }> = {
  de: { name: 'Đề', digits: 2, payout: XS_DE_PAYOUT },
  cang: { name: 'Càng', digits: 3, payout: XS_CANG_PAYOUT },
}

/** Số giải đặc biệt có 6 chữ số */
export const XS_DIGITS = 6

export interface XsTicket {
  kind: XsKind
  /** số đã chọn, đủ chữ số (vd. "07", "123") */
  num: string
  amount: number
}

export interface XsRecord {
  /** giải đặc biệt, 6 chữ số */
  result: string
  bet: number
  net: number
  at: number
}

export interface XsResult {
  /** tiền trả về từng phiếu (gồm cả gốc), cùng thứ tự với danh sách phiếu */
  perTicket: number[]
  payout: number
  totalBet: number
  net: number
}

export const padNum = (n: number | string, digits: number) => String(n).padStart(digits, '0')

/** Quay giải đặc biệt: 000000 – 999999, mỗi số đều như nhau */
export const drawXs = (): string => padNum(randInt(10 ** XS_DIGITS), XS_DIGITS)

export const randomPick = (kind: XsKind) => padNum(randInt(10 ** XS_KINDS[kind].digits), XS_KINDS[kind].digits)

export const ticketWins = (t: XsTicket, result: string) => result.endsWith(t.num)

export const sumTickets = (ts: XsTicket[]) => ts.reduce((s, t) => s + t.amount, 0)

/**
 * Đề: trùng 2 số cuối -> nhận lại X + X·XS_DE_PAYOUT.
 * Càng: trùng 3 số cuối -> nhận lại X + X·XS_CANG_PAYOUT.
 * Không trùng -> mất X.
 */
export function settleXs(tickets: XsTicket[], result: string): XsResult {
  const perTicket = tickets.map((t) => (ticketWins(t, result) ? t.amount * (XS_KINDS[t.kind].payout + 1) : 0))
  const payout = perTicket.reduce((s, n) => s + n, 0)
  const totalBet = sumTickets(tickets)
  return { perTicket, payout, totalBet, net: payout - totalBet }
}
