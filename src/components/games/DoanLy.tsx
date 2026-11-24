import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import chenImg from '../../assets/baucua/chen.webp'
import { CHIPS, CUP_PAYOUT, CUP_SWAP_MS } from '../../config'
import { fmt } from '../../format'
import { type CupRecord, applySwap, cupPayout, makeSwaps } from '../../game/cups'
import { randInt } from '../../game/logic'
import { sfx } from '../../game/sound'
import { Button } from '../Button'
import { Chip } from '../Chip'
import { inputCls } from '../Modal'
import { StatusBanner } from '../StatusBanner'
import { type GameProps, useMainKey, useReportActive } from './shared'

/** betting: nhập cược (ly có bóng đang mở) · lowering: hạ ly xuống · shuffling: đang tráo · picking: chờ chọn · revealed: mở kết quả */
type CupPhase = 'betting' | 'lowering' | 'shuffling' | 'picking' | 'revealed'

/** thời gian hạ ly xuống trước khi tráo */
const LOWER_MS = 380
const SETTLE_MS = 40
const NEXT_MS = 2200

const slotLeft = (slot: number) => `${2 + slot * 33}%`

function Ball() {
  return (
    <svg viewBox="0 0 40 40" className="size-full drop-shadow-[0_3px_3px_rgba(0,0,0,.35)]" aria-hidden>
      <defs>
        <radialGradient id="cup-ball" cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#fff7d6" />
          <stop offset="0.35" stopColor="#f2c94c" />
          <stop offset="1" stopColor="#a8731a" />
        </radialGradient>
      </defs>
      <circle cx={20} cy={20} r={18} fill="url(#cup-ball)" />
    </svg>
  )
}

export function DoanLy({ balance, setBalance, history, pushHistory, hold, onActiveChange, onNoMoney }: GameProps<CupRecord>) {
  const [phase, setPhase] = useState<CupPhase>('betting')
  const [bet, setBet] = useState(() => Math.min(100, balance))
  const [lockedBet, setLockedBet] = useState(0)
  /** slots[cup] = vị trí hiện tại của ly đó (0 trái, 1 giữa, 2 phải) */
  const [slots, setSlots] = useState([0, 1, 2])
  /** ly đang úp bóng */
  const [ballCup] = useState(() => randInt(3))
  /** bước tráo hiện tại, và 2 vị trí vừa đổi (để vẽ đường vòng) */
  const [step, setStep] = useState(0)
  const [moving, setMoving] = useState<[number, number] | null>(null)
  const [picked, setPicked] = useState<number | null>(null)
  const [roundId, setRoundId] = useState(0)
  const timers = useRef<number[]>([])
  const pending = useRef<{ payout: number; record: CupRecord } | null>(null)

  const busy = phase === 'lowering' || phase === 'shuffling' || phase === 'picking'
  useReportActive(busy, onActiveChange)

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  const finalize = () => {
    const p = pending.current
    if (!p) return
    pending.current = null
    hold(null)
    if (p.payout) setBalance((b) => b + p.payout)
    pushHistory(p.record)
  }
  const finalizeRef = useRef(finalize)
  finalizeRef.current = finalize
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
      finalizeRef.current()
    },
    [],
  )

  /** Bắt đầu ván: trừ tiền, cho xem bóng, rồi tráo */
  const start = () => {
    if (phase !== 'betting' && phase !== 'revealed') return
    if (bet <= 0 || bet > balance) return onNoMoney()
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    setBalance((b) => b - bet)
    hold({ refund: bet })
    setLockedBet(bet)
    // giữ nguyên vị trí ly và bóng của ván trước: tráo tiếp từ đó
    setPicked(null)
    setMoving(null)
    setStep(0)
    setRoundId((r) => r + 1)
    setPhase('lowering')
    sfx.chip()

    const swaps = makeSwaps()
    later(() => setPhase('shuffling'), LOWER_MS)
    swaps.forEach((sw, i) => {
      later(
        () => {
          setSlots((s) => applySwap(s, sw))
          setMoving(sw)
          setStep((n) => n + 1)
          if (i % 3 === 0) sfx.tick()
        },
        LOWER_MS + SETTLE_MS + i * CUP_SWAP_MS,
      )
    })
    later(
      () => {
        setMoving(null)
        setPhase('picking')
      },
      LOWER_MS + SETTLE_MS + swaps.length * CUP_SWAP_MS + 150,
    )
  }

  /** Chọn ly */
  const pick = (cup: number) => {
    if (phase !== 'picking') return
    const win = cup === ballCup
    const payout = cupPayout(lockedBet, win)
    setPicked(cup)
    setPhase('revealed')
    sfx.open()
    pending.current = { payout, record: { win, bet: lockedBet, net: payout - lockedBet, at: Date.now() } }
    hold({ refund: payout, record: pending.current.record })
    later(() => {
      finalize()
      if (win) sfx.win()
      else sfx.lose()
    }, 450)
    later(() => setBet((b) => Math.min(b, balance - lockedBet + payout)), NEXT_MS)
  }

  /** phím 1 / 2 / 3 chọn ly theo vị trí trái → phải; Space/Enter = chơi ván mới */
  useEffect(() => {
    if (phase !== 'picking') return
    const onKey = (e: KeyboardEvent) => {
      const slot = ['1', '2', '3'].indexOf(e.key)
      if (slot >= 0) pick(slots.indexOf(slot))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  useMainKey(start, busy)

  const win = phase === 'revealed' && picked !== null && picked === ballCup
  const result = phase === 'revealed' && picked !== null ? { net: cupPayout(lockedBet, win) - lockedBet, label: win ? 'Đoán đúng' : 'Đoán sai' } : null

  /** chờ cược: mở sẵn ly có bóng · mở kết quả: mở ly đã chọn + ly có bóng · còn lại úp hết */
  const lifted = (cup: number) => (phase === 'betting' && cup === ballCup) || (phase === 'revealed' && (cup === picked || cup === ballCup))

  return (
    <div className="grid w-full items-start gap-2 lg:grid-cols-[1fr_20rem]">
      {/* Bàn */}
      <section className="flex flex-col gap-2 rounded-md border border-line bg-panel p-2">
        <div className="relative aspect-[16/8] w-full overflow-hidden rounded-sm bg-[radial-gradient(ellipse_at_50%_70%,#f6efe3,#e7dccb_70%)] sm:aspect-[16/7]">
          {/* mép bàn */}
          <div className="absolute inset-x-0 bottom-0 h-[16%] bg-gradient-to-b from-[#d9c9b0] to-[#cdbb9f]" />

          {[0, 1, 2].map((cup) => {
            const slot = slots[cup]
            const isMoving = phase === 'shuffling' && moving && (slot === moving[0] || slot === moving[1])
            // ly đi sang phải vòng phía sau (lên), đi sang trái vòng phía trước (xuống)
            const goingRight = moving ? slot === Math.max(moving[0], moving[1]) : false
            const canPick = phase === 'picking'
            const isPicked = picked === cup
            return (
              <motion.div
                key={cup}
                className="absolute bottom-[10%] w-[30%]"
                initial={false}
                animate={{ left: slotLeft(slot), zIndex: isMoving ? (goingRight ? 1 : 3) : 2 }}
                transition={{ duration: (CUP_SWAP_MS * 0.9) / 1000, ease: 'linear' }}
              >
                <motion.div
                  key={`${roundId}-${step}`}
                  initial={{ y: 0, scale: 1 }}
                  animate={isMoving ? { y: [0, goingRight ? -14 : 10, 0], scale: [1, goingRight ? 0.94 : 1.05, 1] } : { y: 0, scale: 1 }}
                  transition={{ duration: (CUP_SWAP_MS * 0.9) / 1000, ease: 'linear' }}
                  className={`relative ${phase === 'shuffling' ? 'blur-[1.5px]' : ''}`}
                >
                  {/* bóng đổ */}
                  <div className="absolute inset-x-[8%] -bottom-[4%] h-[16%] rounded-[50%] bg-black/20 blur-[3px]" />
                  {/* bóng (chỉ có khi ly đang nhấc) */}
                  {lifted(cup) && cup === ballCup && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute bottom-[2%] left-1/2 w-[30%] -translate-x-1/2"
                    >
                      <Ball />
                    </motion.div>
                  )}
                  <motion.button
                    type="button"
                    disabled={!canPick}
                    onClick={() => pick(cup)}
                    animate={{ y: lifted(cup) ? '-62%' : '0%' }}
                    whileHover={canPick ? { y: '-6%' } : undefined}
                    transition={{ duration: 0.32, ease: 'easeOut' }}
                    className={`relative block w-full ${canPick ? 'cursor-pointer' : 'cursor-default'}`}
                    aria-label={`Ly ${slot + 1}`}
                  >
                    <img
                      src={chenImg}
                      alt=""
                      draggable={false}
                      className={`w-full drop-shadow-[0_8px_10px_rgba(0,0,0,.25)] transition-[filter] ${
                        phase === 'revealed' && isPicked ? (win ? 'drop-shadow-[0_0_14px_rgba(63,178,127,.9)]' : 'brightness-90') : ''
                      }`}
                    />
                  </motion.button>
                </motion.div>
              </motion.div>
            )
          })}

          {/* gợi ý chọn */}
          {phase === 'picking' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pointer-events-none absolute inset-x-0 top-[6%] text-center text-xs font-semibold tracking-wide text-mute uppercase"
            >
              Chọn ly có bóng
            </motion.div>
          )}
        </div>
        <StatusBanner result={result} text="" delay={0.45} />
      </section>

      <div className="flex flex-col gap-2">
        {/* Cược */}
        <section className="flex flex-col rounded-md border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="label">Đặt cược</span>
            <span className="text-xs text-dim tabular-nums">1:{String(CUP_PAYOUT).replace('.', ',')}</span>
          </div>
          <div className="flex flex-col gap-2 p-3">
            <input
              inputMode="numeric"
              value={bet ? fmt(bet) : ''}
              disabled={busy}
              onChange={(e) => setBet(Number(e.target.value.replace(/\D/g, '')) || 0)}
              placeholder="0"
              className={`${inputCls} h-12 text-2xl font-semibold tabular-nums disabled:opacity-60 ${bet > balance ? 'border-down focus:border-down' : ''}`}
            />
            <p className="h-4 text-xs text-down">{bet > balance && !busy ? 'Vượt quá số dư' : ''}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {CHIPS.map((c) => (
                <Chip key={c} value={c} disabled={busy || bet + c > balance} onClick={() => setBet((b) => b + c)} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Button variant="ghost" className="h-8 text-xs" disabled={busy} onClick={() => setBet(0)}>
                Xoá
              </Button>
              <Button variant="ghost" className="h-8 text-xs" disabled={busy} onClick={() => setBet(balance)}>
                Tối đa
              </Button>
            </div>
            <Button className="mt-1 h-11" disabled={busy || bet <= 0 || bet > balance} onClick={start}>
              {phase === 'lowering' || phase === 'shuffling' ? 'Đang tráo...' : phase === 'picking' ? 'Chọn 1 ly' : `Chơi · ${fmt(bet)}`}
            </Button>
          </div>
        </section>

        {/* Lịch sử */}
        <section className="rounded-md border border-line bg-panel">
          <div className="border-b border-line px-3 py-2">
            <span className="label">Lịch sử</span>
          </div>
          {history.length === 0 ? (
            <p className="px-3 py-3 text-sm text-dim">Chưa có ván nào.</p>
          ) : (
            <div className="max-h-72 divide-y divide-line overflow-y-auto">
              {history.map((h) => (
                <div key={h.at} className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs">
                  <span className={h.win ? 'font-semibold text-up' : 'text-mute'}>{h.win ? 'Đoán đúng' : 'Đoán sai'}</span>
                  <span className={`text-sm font-semibold tabular-nums ${h.net > 0 ? 'text-up' : 'text-down'}`}>
                    {h.net > 0 ? '+' : ''}
                    {fmt(h.net)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
