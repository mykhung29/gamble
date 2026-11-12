import { motion } from 'motion/react'
import { shortChip } from '../format'

const CHIP_STYLE: Record<number, string> = {
  10: 'bg-slate-100 text-slate-800 border-slate-400',
  50: 'bg-red-500 text-white border-red-200',
  100: 'bg-blue-600 text-white border-blue-200',
  500: 'bg-emerald-600 text-white border-emerald-200',
  1000: 'bg-zinc-900 text-amber-300 border-amber-400',
  5000: 'bg-purple-700 text-amber-200 border-amber-300',
}

export function chipClass(v: number) {
  return CHIP_STYLE[v] ?? 'bg-amber-500 text-red-950 border-amber-200'
}

export function Chip({ value, selected, disabled, onClick }: { value: number; selected: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      animate={{ y: selected ? -10 : 0, scale: selected ? 1.12 : 1 }}
      whileHover={disabled ? undefined : { y: selected ? -12 : -4 }}
      whileTap={{ scale: 0.92 }}
      className={`relative grid size-12 shrink-0 place-items-center rounded-full border-4 border-dashed text-sm font-extrabold shadow-lg sm:size-14 ${chipClass(value)} ${
        selected ? 'ring-4 ring-yellow-300/80' : ''
      } disabled:opacity-35`}
      aria-label={`Chip ${value}`}
    >
      <span className="grid size-8 place-items-center rounded-full bg-black/10 sm:size-9">{shortChip(value)}</span>
    </motion.button>
  )
}
