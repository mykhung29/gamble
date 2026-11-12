import { useEffect, useRef, useState } from 'react'
import { BET_SECONDS, NEXT_ROUND_SECONDS } from '../../config'
import { sfx } from '../../game/sound'
import type { Phase } from '../Bowl'

/**
 * Vòng tự động: vào game tự lắc → đếm ngược BET_SECONDS rồi tự khui
 * → chờ NEXT_ROUND_SECONDS rồi tự lắc tiếp. Trả về số giây còn lại.
 * (Chuyển shaking → betting do hàm roll của từng game tự làm.)
 */
export function useAutoRounds(phase: Phase, roll: () => void, reveal: () => void) {
  const [left, setLeft] = useState(0)
  const rollRef = useRef(roll)
  rollRef.current = roll
  const revealRef = useRef(reveal)
  revealRef.current = reveal
  const started = useRef(false)

  useEffect(() => {
    if (phase === 'idle') {
      if (!started.current) {
        started.current = true
        rollRef.current()
      }
      return
    }
    if (phase === 'shaking') return
    const total = phase === 'betting' ? BET_SECONDS : NEXT_ROUND_SECONDS
    const end = Date.now() + total * 1000
    let last = total
    setLeft(total)
    const id = window.setInterval(() => {
      const s = Math.max(0, Math.ceil((end - Date.now()) / 1000))
      if (s !== last) {
        last = s
        setLeft(s)
        if (phase === 'betting' && s > 0 && s <= 5) sfx.tick()
      }
      if (Date.now() >= end) {
        window.clearInterval(id)
        if (phase === 'betting') revealRef.current()
        else rollRef.current()
      }
    }, 200)
    return () => window.clearInterval(id)
  }, [phase])

  return left
}

export interface GameProps<R> {
  balance: number
  setBalance: (fn: (b: number) => number) => void
  history: R[]
  pushHistory: (r: R) => void
  /** báo cho khung ngoài biết đang giữa ván (khoá đổi game / thoát / nạp / reset) */
  onActiveChange: (active: boolean) => void
  onNoMoney: () => void
}

/** Báo trạng thái "đang trong ván" ra ngoài */
export function useReportActive(active: boolean, onActiveChange: (a: boolean) => void) {
  useEffect(() => onActiveChange(active), [active, onActiveChange])
  useEffect(() => () => onActiveChange(false), [onActiveChange])
}

/** Space / Enter = nút chính (bỏ qua khi đang gõ trong ô input hoặc disabled) */
export function useMainKey(action: () => void, disabled: boolean) {
  const ref = useRef(action)
  ref.current = action
  const dis = useRef(disabled)
  dis.current = disabled
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (dis.current || e.target instanceof HTMLInputElement) return
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        ;(document.activeElement as HTMLElement | null)?.blur()
        ref.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
