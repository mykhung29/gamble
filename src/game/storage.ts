import type { BcRecord } from './baicao'
import type { RoundRecord } from './logic'
import type { TxRecord } from './taixiu'

const KEY = 'baucua-save-v1'

export interface SaveData {
  balance: number
  /** lịch sử Bầu Cua */
  history: RoundRecord[]
  txHistory: TxRecord[]
  bcHistory: BcRecord[]
}

export type HistoryKey = 'history' | 'txHistory' | 'bcHistory'

export const emptySave = (): SaveData => ({ balance: 0, history: [], txHistory: [], bcHistory: [] })

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const d = JSON.parse(raw)
      if (typeof d.balance === 'number') {
        return {
          balance: d.balance,
          history: Array.isArray(d.history) ? d.history : [],
          txHistory: Array.isArray(d.txHistory) ? d.txHistory : [],
          bcHistory: Array.isArray(d.bcHistory) ? d.bcHistory : [],
        }
      }
    }
  } catch {
    /* ignore */
  }
  return emptySave()
}

export function persist(d: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch {
    /* ignore */
  }
}
