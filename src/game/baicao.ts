import { randInt } from './logic'

export const SUITS = ['♠', '♣', '♦', '♥'] as const
export const RANK_LABEL = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

export interface Card {
  /** 1 = A … 13 = K */
  rank: number
  suit: 0 | 1 | 2 | 3
}

export const isRed = (c: Card) => c.suit >= 2

export interface HandScore {
  /** 3 = Sáp, 2 = Ba Tây, 1 = tính nút */
  tier: 1 | 2 | 3
  points: number
  label: string
}

export interface BcRecord {
  player: string
  dealer: string
  outcome: 'win' | 'lose' | 'tie'
  bet: number
  net: number
  at: number
}

/** Bộ 52 lá đã xáo (Fisher–Yates, random bằng crypto) */
export function newDeck(): Card[] {
  const deck: Card[] = []
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ rank: r, suit: s as Card['suit'] })
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randInt(i + 1)
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

/** A = 1, 2–9 = số, 10/J/Q/K = 0 */
export const cardPoint = (c: Card) => (c.rank >= 10 ? 0 : c.rank)

export function scoreHand(cards: Card[]): HandScore {
  if (cards.every((c) => c.rank === cards[0].rank)) return { tier: 3, points: 10, label: 'Sáp' }
  if (cards.every((c) => c.rank >= 11)) return { tier: 2, points: 10, label: 'Ba Tây' }
  const points = cards.reduce((s, c) => s + cardPoint(c), 0) % 10
  return { tier: 1, points, label: points === 0 ? 'Bù' : `${points} nút` }
}

/** 1 = người chơi thắng, -1 = thua, 0 = hoà */
export function compareHands(player: HandScore, dealer: HandScore): 1 | 0 | -1 {
  if (player.tier !== dealer.tier) return player.tier > dealer.tier ? 1 : -1
  if (player.tier === 1 && player.points !== dealer.points) return player.points > dealer.points ? 1 : -1
  return 0
}
