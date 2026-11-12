import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { SYMBOL_IDS } from '../game/logic'
import { SymbolIcon } from '../game/symbols'

/** Khung chung cho màn hình mật khẩu / cấp điểm, có các con vật bay lơ lửng phía sau */
export function ScreenCard({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
    >
      {SYMBOL_IDS.map((id, i) => (
        <motion.div
          key={id}
          className="pointer-events-none absolute opacity-20"
          style={{ left: `${8 + i * 15}%`, top: `${i % 2 ? 70 : 12}%` }}
          animate={{ y: [0, -24, 0], rotate: [0, i % 2 ? 12 : -12, 0] }}
          transition={{ duration: 4 + i * 0.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <SymbolIcon id={id} size={72} />
        </motion.div>
      ))}
      <motion.div
        initial={{ y: 30, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="pattern relative w-full max-w-md rounded-3xl border-2 border-amber-400/60 bg-red-950/80 p-6 shadow-2xl backdrop-blur sm:p-8"
      >
        <h1 className="gold-text text-center font-display text-5xl drop-shadow sm:text-6xl">Game Vui Vẻ</h1>
        <p className="mb-6 mt-1 text-center text-sm tracking-[0.15em] text-amber-200/70 uppercase">Bầu Cua · Tài Xỉu · Bài Cào</p>
        {children}
      </motion.div>
    </motion.div>
  )
}
