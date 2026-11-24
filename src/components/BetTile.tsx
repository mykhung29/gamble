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
    <button
      onClick={onAdd}
      onContextMenu={(e) => {
        e.preventDefault()
        onRemove()
      }}
      className={`group relative flex flex-col overflow-hidden rounded-sm border bg-panel-2 text-left transition-[border-color,opacity,filter] ${
        won ? 'border-gold ring-1 ring-gold' : amount > 0 ? 'border-line-strong' : 'border-line'
      } ${lost ? 'opacity-40 grayscale' : ''} ${revealed && !won && !lost ? 'opacity-60' : ''} ${locked ? 'cursor-default' : 'cursor-pointer hover:border-gold/70'}`}
      aria-label={`Đặt cược ${sym.name}`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-black">
        <img src={sym.img} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
        {won && <span className="absolute top-1.5 left-1.5 rounded-xs bg-gold px-1.5 py-0.5 text-xs font-bold text-white">×{hits}</span>}
        <AnimatePresence>
          {won && payout > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: [0, 1, 1, 0], y: -18 }}
              transition={{ duration: 1.6, delay: 0.4 }}
              className="pointer-events-none absolute inset-x-0 top-1/3 text-center text-xl font-bold text-gold-hi drop-shadow-[0_1px_2px_rgba(0,0,0,.9)]"
            >
              +{fmt(payout)}
            </motion.div>
          )}
        </AnimatePresence>
        {amount > 0 && (
          <motion.span
            key={amount}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className="absolute right-1.5 bottom-1.5 max-w-[calc(100%-12px)] truncate rounded-xs border border-gold/60 bg-black/80 px-1.5 py-0.5 text-xs font-semibold text-gold tabular-nums sm:text-sm"
          >
            {fmt(amount)}
          </motion.span>
        )}
      </div>
    </button>
  )
}
