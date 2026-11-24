import { motion } from 'motion/react'
import type { ReactNode } from 'react'

/** Khung chung cho màn hình mật khẩu / cấp điểm */
export function ScreenCard({ title, subtitle, onBack, children }: { title: string; subtitle?: string; onBack?: () => void; children: ReactNode }) {
  return (
    <motion.div
      className="relative flex min-h-screen items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="absolute top-3 left-3 flex h-8 items-center gap-1.5 rounded-sm border border-line bg-panel px-2.5 text-xs font-medium text-mute transition-colors hover:border-line-strong hover:text-ink sm:top-4 sm:left-5"
        >
          <span aria-hidden>‹</span> Quay lại
        </button>
      )}
      <div className="w-full max-w-sm">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-sm bg-gold text-sm font-bold text-white">G</span>
          <span className="text-sm font-semibold tracking-wide uppercase">Game Vui Vẻ</span>
        </div>
        <div className="rounded-md border border-line bg-panel">
          <div className="border-b border-line px-4 py-3">
            {subtitle && <div className="label">{subtitle}</div>}
            <h1 className="text-base font-semibold">{title}</h1>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </motion.div>
  )
}
