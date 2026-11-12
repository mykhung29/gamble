export const SYMBOL_IDS = ['nai', 'bau', 'ga', 'ca', 'cua', 'tom'] as const
export type SymbolId = (typeof SYMBOL_IDS)[number]
export type Bets = Record<SymbolId, number>
export type Dice = [SymbolId, SymbolId, SymbolId]

export interface RoundRecord {
  dice: Dice
  bet: number
  net: number
  at: number
}

export interface SettleResult {
  counts: Record<SymbolId, number>
  /** số điểm trả về cho từng ô (gồm cả tiền gốc) */
  perSymbol: Record<SymbolId, number>
  payout: number
  totalBet: number
  net: number
}

export const emptyBets = (): Bets => ({ nai: 0, bau: 0, ga: 0, ca: 0, cua: 0, tom: 0 })

export const sumBets = (b: Bets) => SYMBOL_IDS.reduce((s, id) => s + b[id], 0)

/** Random không lệch, dùng crypto */
export function randInt(n: number): number {
  const buf = new Uint32Array(1)
  const limit = Math.floor(0x1_0000_0000 / n) * n
  let x: number
  do {
    crypto.getRandomValues(buf)
    x = buf[0]
  } while (x >= limit)
  return x % n
}

export const rollDice = (): Dice => [
  SYMBOL_IDS[randInt(6)],
  SYMBOL_IDS[randInt(6)],
  SYMBOL_IDS[randInt(6)],
]

/**
 * Luật Bầu Cua: đặt X vào 1 con, ra k mặt con đó (k ≥ 1) -> nhận lại X + X·k.
 * Không ra -> mất X.
 */
export function settle(bets: Bets, dice: Dice): SettleResult {
  const counts = emptyBets()
  dice.forEach((d) => counts[d]++)
  const perSymbol = emptyBets()
  let payout = 0
  for (const id of SYMBOL_IDS) {
    if (bets[id] > 0 && counts[id] > 0) {
      perSymbol[id] = bets[id] * (counts[id] + 1)
      payout += perSymbol[id]
    }
  }
  const totalBet = sumBets(bets)
  return { counts, perSymbol, payout, totalBet, net: payout - totalBet }
}
