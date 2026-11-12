import { motion } from 'motion/react'
import { BET_SECONDS, NEXT_ROUND_SECONDS } from '../config'
import type { Phase } from './Bowl'

/** Đồng hồ đếm ngược dạng viên nhỏ, đặt đè lên bát: còn bao lâu thì khui / lắc ván mới */
export function RoundTimer({ phase, left }: { phase: Phase; left: number }) {
  const base = 'relative flex h-10 items-center justify-center gap-2 overflow-hidden rounded-full border-2 px-4 shadow-lg backdrop-blur-sm'

  if (phase === 'idle' || phase === 'shaking') {
    return (
      <div className={`${base} border-amber-400/50 bg-black/70 text-sm font-extrabold text-amber-200`}>
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
    <div className={`${base} min-w-36 ${urgent ? 'border-red-400 bg-red-950/85' : betting ? 'border-yellow-300/80 bg-black/75' : 'border-amber-400/50 bg-black/75'}`}>
      {/* thanh thời gian co lại */}
      <motion.div
        className={`absolute inset-y-0 left-0 ${urgent ? 'bg-red-500/40' : betting ? 'bg-yellow-400/25' : 'bg-white/10'}`}
        initial={false}
        animate={{ width: `${(left / total) * 100}%` }}
        transition={{ duration: 0.3, ease: 'linear' }}
      />
      <span className="relative text-xs font-semibold whitespace-nowrap text-amber-100/85">{betting ? '⏱ Tự khui' : '🔁 Ván mới'}</span>
      <motion.span
        key={left}
        initial={{ scale: urgent ? 1.6 : 1.2, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`relative min-w-9 text-center text-2xl font-extrabold tabular-nums ${urgent ? 'text-red-300' : 'gold-text'}`}
      >
        {left}s
      </motion.span>
    </div>
  )
}
