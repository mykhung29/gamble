import { motion } from 'motion/react'
import { useMemo } from 'react'

/** Mưa tiền khi thắng */
export function CoinRain({ count }: { count: number }) {
  const coins = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        dur: 1.6 + Math.random() * 1.2,
        size: 20 + Math.random() * 22,
        spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 540),
        emoji: Math.random() > 0.3 ? '🪙' : '🧧',
      })),
    [count],
  )
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {coins.map((c, i) => (
        <motion.span
          key={i}
          className="absolute -top-12"
          style={{ left: `${c.left}%`, fontSize: c.size }}
          initial={{ y: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: c.spin, opacity: [1, 1, 0.8] }}
          transition={{ duration: c.dur, delay: c.delay, ease: 'easeIn' }}
        >
          {c.emoji}
        </motion.span>
      ))}
    </div>
  )
}
