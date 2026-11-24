import { useEffect, useRef, type ReactNode } from 'react'
import { motion } from 'motion/react'

/** Khung hộp thoại dùng chung: nền tối, panel góc vuông nhẹ, Esc / bấm ra ngoài để đóng */
export function Modal({
  title,
  subtitle,
  onClose,
  children,
  as = 'div',
  onSubmit,
  formRef,
  accent,
  z = 'z-40',
}: {
  title: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
  as?: 'div' | 'form'
  onSubmit?: (e: React.FormEvent) => void
  formRef?: React.Ref<HTMLFormElement>
  /** vạch màu bên trái tiêu đề */
  accent?: string
  z?: string
}) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const Panel = as === 'form' ? motion.form : motion.div
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      className={`fixed inset-0 ${z} grid place-items-center bg-black/40 px-4`}
    >
      <Panel
        ref={formRef as never}
        onSubmit={onSubmit}
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 8, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-sm rounded-md border border-line bg-panel shadow-[0_20px_50px_rgba(16,24,40,.18)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {accent && <span className="h-8 w-1 shrink-0 rounded-xs" style={{ background: accent }} />}
            <div className="min-w-0">
              {subtitle && <div className="label">{subtitle}</div>}
              <h2 className="truncate text-base font-semibold">{title}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="-mr-1 grid size-7 place-items-center rounded-sm text-mute hover:bg-panel-3 hover:text-ink" aria-label="Đóng">
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </Panel>
    </motion.div>
  )
}

/** Ô nhập chuẩn */
export const inputCls =
  'w-full h-11 rounded-sm border bg-bg px-3 text-ink outline-none placeholder:text-dim transition-colors border-line focus:border-gold'
