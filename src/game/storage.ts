import type { BcRecord } from './baicao'
import type { RoundRecord } from './logic'
import type { TxRecord } from './taixiu'
import type { XsRecord } from './xoso'
import type { PkRecord } from './penalty'
import type { CupRecord } from './cups'
import type { HrRecord } from './horses'

const KEY = 'baucua-save-v1'

export interface SaveData {
  balance: number
  /** lịch sử Bầu Cua */
  history: RoundRecord[]
  txHistory: TxRecord[]
  bcHistory: BcRecord[]
  xsHistory: XsRecord[]
  pkHistory: PkRecord[]
  cupHistory: CupRecord[]
  hrHistory: HrRecord[]
  /**
   * Tiền đang "treo" của ván chưa xong, theo từng game (khoá = lịch sử của game đó).
   * Tải lại trang / tắt tab giữa ván thì lần mở sau sẽ trả số này vào điểm:
   * - chưa có kết quả: refund = tiền đã cược (hoàn cược)
   * - đã có kết quả (đang chạy hiệu ứng): refund = tiền thắng, record = ván đó (ghi lịch sử)
   */
  pending: Partial<Record<HistoryKey, Hold>>
}

export interface Hold<R = unknown> {
  refund: number
  record?: R
}

export type HistoryKey = 'history' | 'txHistory' | 'bcHistory' | 'xsHistory' | 'pkHistory' | 'cupHistory' | 'hrHistory'

export const emptySave = (): SaveData => ({ balance: 0, history: [], txHistory: [], bcHistory: [], xsHistory: [], pkHistory: [], cupHistory: [], hrHistory: [], pending: {} })

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const d = JSON.parse(raw)
      if (typeof d.balance === 'number') {
        const save: SaveData = {
          balance: d.balance,
          history: Array.isArray(d.history) ? d.history : [],
          txHistory: Array.isArray(d.txHistory) ? d.txHistory : [],
          bcHistory: Array.isArray(d.bcHistory) ? d.bcHistory : [],
          xsHistory: Array.isArray(d.xsHistory) ? d.xsHistory : [],
          pkHistory: Array.isArray(d.pkHistory) ? d.pkHistory : [],
          cupHistory: Array.isArray(d.cupHistory) ? d.cupHistory : [],
          hrHistory: Array.isArray(d.hrHistory) ? d.hrHistory : [],
          pending: {},
        }
        return settlePending(save, d.pending)
      }
    }
  } catch {
    /* ignore */
  }
  return emptySave()
}

/** Trả tiền treo của các ván dở dang (do tải lại trang / tắt tab giữa ván) */
function settlePending(save: SaveData, pending: unknown): SaveData {
  if (!pending || typeof pending !== 'object') return save
  const s: Record<string, unknown> & SaveData = { ...save }
  for (const [key, h] of Object.entries(pending as Record<string, Hold>)) {
    if (!h || typeof h.refund !== 'number' || h.refund < 0) continue
    s.balance += h.refund
    const list = s[key]
    if (h.record && Array.isArray(list)) s[key] = [h.record, ...list].slice(0, 30)
  }
  return s
}

export function persist(d: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch {
    /* ignore */
  }
}
