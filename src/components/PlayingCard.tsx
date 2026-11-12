import { motion } from 'motion/react'
import { type Card, RANK_LABEL, SUITS, isRed } from '../game/baicao'

function CardFace({ card }: { card: Card }) {
  const color = isRed(card) ? 'text-red-600' : 'text-zinc-900'
  const rank = RANK_LABEL[card.rank]
  const suit = SUITS[card.suit]
  return (
    <div className={`relative size-full ${color}`}>
      <div className="absolute top-1 left-1.5 flex flex-col items-center leading-none font-extrabold">
        <span className="text-base sm:text-lg">{rank}</span>
        <span className="text-sm">{suit}</span>
      </div>
      <div className="absolute inset-0 grid place-items-center">
        {card.rank >= 11 ? (
          <div className="grid place-items-center rounded-lg border-2 border-current px-2 py-1">
            <span className="font-display text-3xl sm:text-4xl">{rank}</span>
            <span className="-mt-1 text-lg">{suit}</span>
          </div>
        ) : (
          <span className="text-4xl sm:text-5xl">{suit}</span>
        )}
      </div>
      <div className="absolute right-1.5 bottom-1 flex rotate-180 flex-col items-center leading-none font-extrabold">
        <span className="text-base sm:text-lg">{rank}</span>
        <span className="text-sm">{suit}</span>
      </div>
    </div>
  )
}

/** Lá bài lật 3D. Mặt bài chỉ được render khi đã lật (không lộ trong DOM) */
export function PlayingCard({
  card,
  faceUp,
  dealDelay = 0,
  flipDelay = 0,
  glow,
  onClick,
}: {
  card?: Card | null
  faceUp: boolean
  dealDelay?: number
  flipDelay?: number
  glow?: boolean
  onClick?: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      initial={{ y: -160, opacity: 0, rotate: -25, scale: 0.7 }}
      animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
      transition={{ delay: dealDelay, type: 'spring', stiffness: 220, damping: 20 }}
      whileHover={onClick ? { y: -8 } : undefined}
      className={`perspective relative h-28 w-20 shrink-0 sm:h-36 sm:w-24 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <motion.div
        className="preserve-3d relative size-full"
        initial={false}
        animate={{ rotateY: faceUp ? 180 : 0 }}
        transition={{ duration: 0.5, delay: faceUp ? flipDelay : 0 }}
      >
        <div className="backface-hidden card-back absolute inset-0 rounded-xl border-[3px] border-white shadow-lg">
          <div className="absolute inset-1.5 grid place-items-center rounded-lg border border-amber-300/60">
            <span className="text-2xl opacity-80">🧧</span>
          </div>
        </div>
        <div
          className={`backface-hidden flip-y absolute inset-0 rounded-xl border bg-white shadow-lg ${
            glow ? 'border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,.8)]' : 'border-zinc-300'
          }`}
        >
          {faceUp && card && <CardFace card={card} />}
        </div>
      </motion.div>
    </motion.button>
  )
}

/** Ô trống chờ chia bài */
export function CardSlot() {
  return <div className="h-28 w-20 shrink-0 rounded-xl border-2 border-dashed border-white/25 sm:h-36 sm:w-24" />
}
