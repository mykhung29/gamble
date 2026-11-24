import { motion } from 'motion/react'
import { BET_SECONDS, NEXT_ROUND_SECONDS } from '../config'
import type { Phase } from './Bowl'

/** Thanh trạng thái vòng: còn bao lâu thì khui / lắc ván mới */
export function RoundTimer({ phase, left, labels }: { phase: Phase; left: number; labels?: { shaking?: string; betting?: string; next?: string } }) {
  const shaking = phase === 'idle' || phase === 'shaking'
  const betting = phase === 'betting'
  const total = betting ? BET_SECONDS : NEXT_ROUND_SECONDS
  const urgent = betting && left <= 10
  const label = shaking ? (labels?.shaking ?? 'Đang lắc') : betting ? (labels?.betting ?? 'Nhận cược') : (labels?.next ?? 'Ván mới sau')

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className={`size-1.5 rounded-full ${shaking ? 'animate-pulse bg-mute' : betting ? (urgent ? 'bg-down' : 'bg-up') : 'bg-dim'}`} />
          <span className="label">{label}</span>
        </span>
        {!shaking && <span className={`text-sm font-semibold tabular-nums ${urgent ? 'text-down' : 'text-ink'}`}>00:{String(left).padStart(2, '0')}</span>}
      </div>
      <div className="mt-2 h-0.5 w-full overflow-hidden bg-line">
        {!shaking && (
          <motion.div
            className={`h-full ${urgent ? 'bg-down' : betting ? 'bg-gold' : 'bg-dim'}`}
            initial={false}
            animate={{ width: `${(left / total) * 100}%` }}
            transition={{ duration: 0.3, ease: 'linear' }}
          />
        )}
      </div>
    </div>
  )
}
