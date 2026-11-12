import { motion } from 'motion/react'
import { BET_SECONDS, NEXT_ROUND_SECONDS } from '../config'
import type { Phase } from './Bowl'

/** Đồng hồ đếm ngược thay cho nút bấm: còn bao lâu thì khui / lắc ván mới */
export function RoundTimer({ phase, left }: { phase: Phase; left: number }) {
  if (phase === 'idle' || phase === 'shaking') {
    return (
      <div className="flex h-16 w-full items-center justify-center rounded-2xl border-2 border-amber-400/30 bg-black/30 text-lg font-extrabold text-amber-200">
        <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity }}>
          🎲 Đang lắc...
        </motion.span>
      </div>
    )
  }

  const betting = phase === 'betting'
  const total = betting ? BET_SECONDS : NEXT_ROUND_SECONDS
  const urgent = betting && left <= 10

  return (
    <div
      className={`relative h-16 w-full overflow-hidden rounded-2xl border-2 ${
        urgent ? 'border-red-400 bg-red-950/70' : betting ? 'border-yellow-300/80 bg-black/30' : 'border-amber-400/30 bg-black/30'
      }`}
    >
      {/* thanh thời gian co lại */}
      <motion.div
        className={`absolute inset-y-0 left-0 ${urgent ? 'bg-red-500/40' : betting ? 'bg-yellow-400/25' : 'bg-white/10'}`}
        initial={false}
        animate={{ width: `${(left / total) * 100}%` }}
        transition={{ duration: 0.3, ease: 'linear' }}
      />
      <div className="relative flex h-full items-center justify-center gap-3">
        <span className="text-sm font-semibold text-amber-100/80">{betting ? '⏱ Tự khui sau' : '🔁 Ván mới sau'}</span>
        <motion.span
          key={left}
          initial={{ scale: urgent ? 1.6 : 1.2, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`min-w-12 text-center text-3xl font-extrabold tabular-nums ${urgent ? 'text-red-300' : 'gold-text'}`}
        >
          {left}s
        </motion.span>
      </div>
    </div>
  )
}
