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
          <div className="grid place-items-center rounded-xs border border-current px-2 py-1">
            <span className="text-3xl font-bold sm:text-4xl">{rank}</span>
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
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: dealDelay, duration: 0.3, ease: 'easeOut' }}
      whileHover={onClick ? { y: -4 } : undefined}
      className={`perspective relative h-28 w-20 shrink-0 sm:h-36 sm:w-24 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <motion.div
        className="preserve-3d relative size-full"
        initial={false}
        animate={{ rotateY: faceUp ? 180 : 0 }}
        transition={{ duration: 0.5, delay: faceUp ? flipDelay : 0 }}
      >
        <div className="backface-hidden card-back absolute inset-0 rounded-md border border-[#3a4560] shadow-md">
          <div className="absolute inset-1.5 rounded-sm border border-gold/30" />
        </div>
        <div
          className={`backface-hidden flip-y absolute inset-0 rounded-md border bg-[#fafaf8] shadow-md ${
            glow ? 'border-gold ring-2 ring-gold' : 'border-zinc-300'
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
  return <div className="h-28 w-20 shrink-0 rounded-md border border-dashed border-white/15 sm:h-36 sm:w-24" />
}
