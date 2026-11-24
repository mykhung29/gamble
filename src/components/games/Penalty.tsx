import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { CHIPS, PK_PAYOUT } from '../../config'
import { fmt } from '../../format'
import { BALL0, GOAL, PITCH, PK_LABEL, type PkRecord, type Shot, makeShot, pkPayout } from '../../game/penalty'
import { sfx } from '../../game/sound'
import { Button } from '../Button'
import { Chip } from '../Chip'
import { inputCls } from '../Modal'
import { StatusBanner } from '../StatusBanner'
import { Ball, GoalBack, GoalFront, Keeper, KeeperShadow, Pitch, PitchDefs, Stadium, Vignette } from './PenaltyArt'
import { type GameProps, useReportActive } from './shared'

type PkPhase = 'ready' | 'shooting' | 'result'

/** bóng bay tới khung (ms) — xong mới báo kết quả */
const FLIGHT_MS = 900
/** hiện kết quả bao lâu rồi đặt bóng lại (ms) */
const RESULT_MS = 1900

type Pt = { x: number; y: number }

/** Quỹ đạo bóng theo từng kết quả, kèm bóng đổ dưới đất (sx, sy) */
function ballPath(s: Shot) {
  const { x, y } = s
  const g = GOAL.bottom + 1
  const s0 = BALL0.y + 10
  switch (s.outcome) {
    case 'goal':
      return { x: [BALL0.x, x], y: [BALL0.y, y], scale: [1, 0.55], opacity: [1, 1], sx: [BALL0.x, x], sy: [s0, g], times: [0, 1], duration: 0.5 }
    case 'save': {
      const x2 = x + (x - BALL0.x) * 0.3
      return { x: [BALL0.x, x, x2], y: [BALL0.y, y, y + 75], scale: [1, 0.55, 0.7], opacity: [1, 1, 1], sx: [BALL0.x, x, x2], sy: [s0, g, y + 84], times: [0, 0.55, 1], duration: 0.9 }
    }
    case 'post': {
      const x2 = x + (x < BALL0.x ? 45 : -45)
      return { x: [BALL0.x, x, x2], y: [BALL0.y, y, y + 90], scale: [1, 0.55, 0.75], opacity: [1, 1, 1], sx: [BALL0.x, x, x2], sy: [s0, g, y + 100], times: [0, 0.55, 1], duration: 0.9 }
    }
    case 'miss': {
      const x2 = BALL0.x + (x - BALL0.x) * 1.4
      return { x: [BALL0.x, x2], y: [BALL0.y, y - 30], scale: [1, 0.45], opacity: [1, 0], sx: [BALL0.x, x2], sy: [s0, g - 2], times: [0, 1], duration: 0.65 }
    }
  }
}

export function Penalty({ balance, setBalance, history, pushHistory, hold, onActiveChange, onNoMoney }: GameProps<PkRecord>) {
  const [phase, setPhase] = useState<PkPhase>('ready')
  const [bet, setBet] = useState(() => Math.min(100, balance))
  const [lockedBet, setLockedBet] = useState(0)
  const [shot, setShot] = useState<Shot | null>(null)
  const [shotId, setShotId] = useState(0)
  const [drag, setDrag] = useState<{ start: Pt; cur: Pt; t: number } | null>(null)
  const [hint, setHint] = useState('')
  const svgRef = useRef<SVGSVGElement>(null)
  const pending = useRef<{ payout: number; record: PkRecord } | null>(null)
  const timers = useRef<number[]>([])

  // cú sút chưa tới 1 giây, rời màn hình giữa chừng vẫn được trả tiền (finalize) -> không cần khoá nút về sảnh
  useReportActive(false, onActiveChange)

  /** Trả tiền + ghi lịch sử (khi bóng tới khung, hoặc ngay khi rời màn hình) */
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

  /** đổi toạ độ màn hình -> toạ độ sân */
  const toPitch = (e: React.PointerEvent): Pt | null => {
    const svg = svgRef.current
    const m = svg?.getScreenCTM()
    if (!svg || !m) return null
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return { x: p.x, y: p.y }
  }

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (phase !== 'ready') return
    const p = toPitch(e)
    if (!p) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* trình duyệt không cho bắt con trỏ: vẫn chơi được */
    }
    setDrag({ start: p, cur: p, t: performance.now() })
    setHint('')
  }

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag) return
    const p = toPitch(e)
    if (p) setDrag({ ...drag, cur: p })
  }

  const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag) return
    const p = toPitch(e) ?? drag.cur
    const dx = p.x - drag.start.x
    const dy = p.y - drag.start.y
    const dt = performance.now() - drag.t
    setDrag(null)
    if (dy > -30) return setHint('Vuốt lên phía khung thành để sút')
    shoot(dx, dy, dt)
  }

  const shoot = (dx: number, dy: number, dt: number) => {
    if (phase !== 'ready') return
    if (bet <= 0 || bet > balance) {
      setHint(bet <= 0 ? 'Nhập tiền cược trước khi sút' : '')
      return onNoMoney()
    }
    const s = makeShot(dx, dy, dt)
    const payout = pkPayout(bet, s.outcome)
    setBalance((b) => b - bet)
    setLockedBet(bet)
    setShot(s)
    setShotId((n) => n + 1)
    setPhase('shooting')
    sfx.chip()
    pending.current = { payout, record: { outcome: s.outcome, bet, net: payout - bet, at: Date.now() } }
    hold({ refund: payout, record: pending.current.record })

    timers.current.push(
      window.setTimeout(() => {
        finalize()
        setPhase('result')
        if (s.outcome === 'goal') sfx.win()
        else sfx.lose()
      }, FLIGHT_MS),
      window.setTimeout(() => {
        setShot(null)
        setPhase('ready')
        setBet((b) => Math.min(b, Math.max(0, balance - bet + payout)))
      }, FLIGHT_MS + RESULT_MS),
    )
  }

  const path = shot ? ballPath(shot) : null
  const result = phase === 'result' && shot ? { net: pkPayout(lockedBet, shot.outcome) - lockedBet, label: PK_LABEL[shot.outcome] } : null

  return (
    <div className="grid w-full items-start gap-2 lg:grid-cols-[1fr_20rem]">
      {/* Sân */}
      <section className="flex flex-col gap-2 rounded-md border border-line bg-panel p-2">
        <div className="relative overflow-hidden rounded-sm">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${PITCH.w} ${PITCH.h}`}
            className={`block w-full touch-none select-none ${phase === 'ready' ? 'cursor-grab active:cursor-grabbing' : ''}`}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={() => setDrag(null)}
          >
            <PitchDefs />
            <Stadium />
            <Pitch />
            <GoalBack key={`net-${shotId}`} ripple={phase === 'result' && shot?.outcome === 'goal'} />
            <KeeperShadow shot={phase === 'ready' ? null : shot} />
            <Keeper shot={phase === 'ready' ? null : shot} />
            <GoalFront />

            {/* vệt vuốt */}
            {drag && (
              <line
                x1={drag.start.x}
                y1={drag.start.y}
                x2={drag.cur.x}
                y2={drag.cur.y}
                stroke="#ffffff"
                strokeOpacity={0.8}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="2 7"
              />
            )}

            {/* bóng + bóng đổ */}
            {path ? (
              <>
                <motion.ellipse
                  key={`sh-${shotId}`}
                  rx={12}
                  ry={3.2}
                  fill="#000000"
                  fillOpacity={0.3}
                  initial={{ x: BALL0.x, y: BALL0.y + 10, scale: 1, opacity: 1 }}
                  animate={{ x: path.sx, y: path.sy, scale: path.scale, opacity: path.opacity }}
                  transition={{ duration: path.duration, times: path.times, ease: 'easeOut' }}
                />
                <motion.g
                  key={`b-${shotId}`}
                  initial={{ x: BALL0.x, y: BALL0.y, scale: 1, opacity: 1 }}
                  animate={{ x: path.x, y: path.y, scale: path.scale, opacity: path.opacity }}
                  transition={{ duration: path.duration, times: path.times, ease: 'easeOut' }}
                >
                  <Ball />
                </motion.g>
              </>
            ) : (
              <>
                <ellipse cx={BALL0.x} cy={BALL0.y + 10} rx={12} ry={3.2} fill="#000000" fillOpacity={0.3} />
                <g transform={`translate(${BALL0.x} ${BALL0.y})`}>
                  <Ball />
                </g>
              </>
            )}

            <Vignette />

            {/* gợi ý */}
            {phase === 'ready' && !drag && (
              <g transform={`translate(${BALL0.x} ${BALL0.y + 27})`} pointerEvents="none">
                <rect x={-58} y={-9} width={116} height={16} rx={8} fill="#000000" fillOpacity={0.35} />
                <text y={2.5} textAnchor="middle" fontSize={9.5} fontWeight={600} fill="#ffffff">
                  {hint || 'Vuốt lên để sút'}
                </text>
              </g>
            )}
          </svg>
        </div>
        <StatusBanner result={result} text="" delay={0} />
      </section>

      <div className="flex flex-col gap-2">
        {/* Tiền cược */}
        <section className="flex flex-col rounded-md border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="label">Đặt cược</span>
            <span className="text-xs text-dim tabular-nums">1:{String(PK_PAYOUT).replace('.', ',')}</span>
          </div>
          <div className="flex flex-col gap-2 p-3">
            <input
              inputMode="numeric"
              value={bet ? fmt(bet) : ''}
              disabled={phase !== 'ready'}
              onChange={(e) => setBet(Number(e.target.value.replace(/\D/g, '')) || 0)}
              placeholder="0"
              className={`${inputCls} h-12 text-2xl font-semibold tabular-nums disabled:opacity-60 ${bet > balance ? 'border-down focus:border-down' : ''}`}
            />
            <p className="h-4 text-xs text-down">{bet > balance ? 'Vượt quá số dư' : ''}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {CHIPS.map((c) => (
                <Chip key={c} value={c} disabled={phase !== 'ready' || bet + c > balance} onClick={() => setBet((b) => b + c)} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Button variant="ghost" className="h-8 text-xs" disabled={phase !== 'ready'} onClick={() => setBet(0)}>
                Xoá
              </Button>
              <Button variant="ghost" className="h-8 text-xs" disabled={phase !== 'ready'} onClick={() => setBet(balance)}>
                Tối đa
              </Button>
            </div>
            {bet > 0 && bet <= balance && (
              <p className="text-right text-xs text-mute tabular-nums">
                Vào nhận <span className="font-semibold text-up">{fmt(pkPayout(bet, 'goal'))}</span>
              </p>
            )}
          </div>
        </section>

        {/* Lịch sử */}
        <section className="rounded-md border border-line bg-panel">
          <div className="border-b border-line px-3 py-2">
            <span className="label">Lịch sử</span>
          </div>
          {history.length === 0 ? (
            <p className="px-3 py-3 text-sm text-dim">Chưa có cú sút nào.</p>
          ) : (
            <div className="max-h-72 divide-y divide-line overflow-y-auto">
              {history.map((h) => (
                <div key={h.at} className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs">
                  <span className={h.outcome === 'goal' ? 'font-semibold text-up' : 'text-mute'}>{PK_LABEL[h.outcome]}</span>
                  <span className={`text-sm font-semibold tabular-nums ${h.net > 0 ? 'text-up' : h.net < 0 ? 'text-down' : 'text-mute'}`}>
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
