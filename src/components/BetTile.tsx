import { AnimatePresence, motion } from 'motion/react'
import { fmt } from '../format'
import type { SymbolInfo } from '../game/symbols'

export function BetTile({
  sym,
  amount,
  hits,
  payout,
  revealed,
  locked,
  onAdd,
  onRemove,
}: {
  sym: SymbolInfo
  amount: number
  hits: number
  payout: number
  revealed: boolean
  locked: boolean
  onAdd: () => void
  onRemove: () => void
}) {
  const won = revealed && hits > 0
  const lost = revealed && amount > 0 && hits === 0

  return (
    <motion.button
      onClick={onAdd}
      onContextMenu={(e) => {
        e.preventDefault()
        onRemove()
      }}
      whileHover={locked ? undefined : { y: -4 }}
      whileTap={locked ? undefined : { scale: 0.96 }}
      animate={won ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={won ? { duration: 0.5, repeat: 2 } : undefined}
      className={`relative aspect-[10/9] overflow-hidden rounded-xl border-2 bg-black sm:rounded-2xl sm:border-4 shadow-xl transition-[filter,opacity,box-shadow] ${
        won ? 'z-10 border-yellow-300 shadow-[0_0_35px_rgba(250,204,21,.75)]' : 'border-amber-200/30'
      } ${lost ? 'opacity-45 grayscale-[.7]' : ''} ${locked ? 'cursor-default' : 'cursor-pointer'}`}
      aria-label={`Đặt cược ${sym.name}`}
    >
      <img src={sym.img} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent pt-3 pb-0.5 text-center font-display text-base text-amber-50 drop-shadow sm:text-xl">
        {sym.name}
      </span>

      {won && (
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: -8 }}
          className="absolute top-2 left-2 rounded-lg bg-yellow-300 px-2 py-0.5 text-sm font-extrabold text-red-900 shadow"
        >
          ×{hits}
        </motion.div>
      )}

      <AnimatePresence>
        {amount > 0 && (
          <motion.div
            key={amount}
            initial={{ scale: 1.5, y: -6 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute top-2 right-2 flex items-center gap-1 rounded-full border-2 border-amber-200 bg-zinc-900/85 py-0.5 pr-2.5 pl-1 text-sm font-extrabold text-amber-300 shadow-lg"
          >
            <span className="size-4 rounded-full border-2 border-dashed border-amber-300 bg-red-600" />
            {fmt(amount)}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {won && payout > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: [0, 1, 1, 0], y: -40 }}
            transition={{ duration: 1.8, delay: 0.5 }}
            className="pointer-events-none absolute inset-x-0 top-1/3 text-center text-2xl font-extrabold text-yellow-200 drop-shadow-[0_2px_2px_rgba(0,0,0,.8)]"
          >
            +{fmt(payout)}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
