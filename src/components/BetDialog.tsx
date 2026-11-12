import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { CHIPS } from '../config'
import { fmt } from '../format'
import { Button } from './Button'
import { Chip } from './Chip'

/** Hộp nhập số tiền cược cho 1 cửa */
export function BetDialog({
  title,
  icon,
  headerClass,
  current,
  available,
  onConfirm,
  onClose,
}: {
  title: string
  icon: ReactNode
  /** class gradient cho phần đầu hộp */
  headerClass: string
  /** số đang cược ở con này */
  current: number
  /** tối đa có thể đặt cho con này (số dư + số đang cược) */
  available: number
  onConfirm: (amount: number) => void
  onClose: () => void
}) {
  const [val, setVal] = useState(current)
  const inputRef = useRef<HTMLInputElement>(null)
  const over = val > available

  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!over) onConfirm(val)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-40 grid place-items-center bg-black/65 px-4 backdrop-blur-sm"
    >
      <motion.form
        onSubmit={submit}
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="pattern w-full max-w-sm rounded-3xl border-2 border-amber-400/60 bg-red-950 p-5 shadow-2xl"
      >
        <div className={`-mx-5 -mt-5 mb-4 flex items-center gap-3 rounded-t-3xl bg-gradient-to-br px-5 py-3 ${headerClass}`}>
          {icon}
          <div>
            <div className="text-xs tracking-wider text-amber-100/80 uppercase">Đặt cược</div>
            <div className="font-display text-3xl text-amber-50 drop-shadow">{title}</div>
          </div>
        </div>

        <label className="mb-1 block text-sm text-amber-100/80">
          Nhập số tiền <span className="text-amber-200/60">(tối đa {fmt(available)})</span>
        </label>
        <input
          ref={inputRef}
          inputMode="numeric"
          value={val ? fmt(val) : ''}
          onChange={(e) => setVal(Number(e.target.value.replace(/\D/g, '')) || 0)}
          placeholder="0"
          className={`w-full rounded-xl border-2 bg-black/30 px-4 py-3 text-right text-3xl font-extrabold text-amber-50 outline-none placeholder:text-amber-200/30 ${
            over ? 'border-red-400' : 'border-amber-400/40 focus:border-amber-300'
          }`}
        />
        <p className="h-5 pt-1 text-sm text-red-300">{over ? 'Không đủ điểm!' : ''}</p>

        <div className="mt-1 flex flex-wrap justify-center gap-2">
          {CHIPS.map((c) => (
            <Chip key={c} value={c} selected={false} disabled={val + c > available} onClick={() => setVal((v) => v + c)} />
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Button type="button" variant="ghost" className="flex-1 text-sm" onClick={() => setVal(0)}>
            Xoá về 0
          </Button>
          <Button type="button" variant="ghost" className="flex-1 text-sm" onClick={() => setVal(available)}>
            🔥 Tất tay
          </Button>
        </div>

        <div className="mt-4 flex gap-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" className="flex-[2] py-3" disabled={over || (val === 0 && current === 0)}>
            {val === 0 && current > 0 ? 'Bỏ cược' : `Đặt ${fmt(val)}`}
          </Button>
        </div>
      </motion.form>
    </motion.div>
  )
}
