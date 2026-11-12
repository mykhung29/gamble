import { TX_BAO_PAYOUT } from '../config'
import { randInt } from './logic'

export type TxSide = 'tai' | 'xiu' | 'chan' | 'le' | 'bao'
export type TxBets = Record<TxSide, number>
export type TxDice = [number, number, number]

export interface TxRecord {
  dice: TxDice
  bet: number
  net: number
  at: number
}

export interface TxResult {
  sum: number
  triple: boolean
  win: Record<TxSide, boolean>
  perSide: TxBets
  payout: number
  totalBet: number
  net: number
}

export const emptyTxBets = (): TxBets => ({ tai: 0, xiu: 0, chan: 0, le: 0, bao: 0 })
export const sumTx = (b: TxBets) => b.tai + b.xiu + b.chan + b.le + b.bao

export const rollTx = (): TxDice => [randInt(6) + 1, randInt(6) + 1, randInt(6) + 1]

export const isTriple = (d: TxDice) => d[0] === d[1] && d[1] === d[2]
export const diceSum = (d: TxDice) => d[0] + d[1] + d[2]

/** Kết quả ván: 'tai' | 'xiu' | 'bao' */
export const txOutcome = (d: TxDice): TxSide => (isTriple(d) ? 'bao' : diceSum(d) >= 11 ? 'tai' : 'xiu')

/** Chẵn/Lẻ của tổng (không tính bão) */
export const txParity = (d: TxDice): 'chan' | 'le' | null => (isTriple(d) ? null : diceSum(d) % 2 === 0 ? 'chan' : 'le')

/**
 * Tài (11–17) / Xỉu (4–10): ăn 1 được 1, ra bão thì cả hai thua.
 * Chẵn / Lẻ (theo tổng): ăn 1 được 1, ra bão thì cả hai thua.
 * Bão (3 con giống nhau): ăn 1 được TX_BAO_PAYOUT.
 */
export function settleTx(bets: TxBets, dice: TxDice): TxResult {
  const sum = diceSum(dice)
  const triple = isTriple(dice)
  const win = { tai: !triple && sum >= 11, xiu: !triple && sum <= 10, chan: !triple && sum % 2 === 0, le: !triple && sum % 2 === 1, bao: triple }
  const perSide: TxBets = {
    tai: win.tai ? bets.tai * 2 : 0,
    xiu: win.xiu ? bets.xiu * 2 : 0,
    chan: win.chan ? bets.chan * 2 : 0,
    le: win.le ? bets.le * 2 : 0,
    bao: win.bao ? bets.bao * (TX_BAO_PAYOUT + 1) : 0,
  }
  const payout = sumTx(perSide)
  const totalBet = sumTx(bets)
  return { sum, triple, win, perSide, payout, totalBet, net: payout - totalBet }
}
