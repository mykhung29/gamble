import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CHIPS } from '../config'
import { fmt } from '../format'
import { Button } from './Button'
import { Chip } from './Chip'
import { Modal, inputCls } from './Modal'

/** Hộp nhập số tiền cược cho 1 cửa */
export function BetDialog({
  title,
  icon,
  accent,
  current,
  available,
  onConfirm,
  onClose,
}: {
  title: string
  icon?: ReactNode
  /** màu vạch nhấn cạnh tiêu đề */
  accent?: string
  /** số đang cược ở cửa này */
  current: number
  /** tối đa có thể đặt cho cửa này (số dư + số đang cược) */
  available: number
  onConfirm: (amount: number) => void
  onClose: () => void
}) {
  const [val, setVal] = useState(current)
  const inputRef = useRef<HTMLInputElement>(null)
  const over = val > available

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!over) onConfirm(val)
  }

  return (
    <Modal
      as="form"
      onSubmit={submit}
      onClose={onClose}
      subtitle="Đặt cược"
      accent={icon ? undefined : accent}
      title={
        <span className="flex items-center gap-2.5">
          {icon}
          {title}
        </span>
      }
    >
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="label">Số tiền</label>
        <span className="text-xs text-dim tabular-nums">Tối đa {fmt(available)}</span>
      </div>
      <input
        ref={inputRef}
        inputMode="numeric"
        value={val ? fmt(val) : ''}
        onChange={(e) => setVal(Number(e.target.value.replace(/\D/g, '')) || 0)}
        placeholder="0"
        className={`${inputCls} h-12 text-left text-2xl font-semibold tabular-nums ${over ? 'border-down focus:border-down' : ''}`}
      />
      <p className="h-5 pt-1 text-xs text-down">{over ? 'Vượt quá số dư' : ''}</p>

      <div className="grid grid-cols-3 gap-1.5">
        {CHIPS.map((c) => (
          <Chip key={c} value={c} disabled={val + c > available} onClick={() => setVal((v) => v + c)} />
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        <Button type="button" variant="ghost" className="h-8 text-xs" onClick={() => setVal(0)}>
          Xoá
        </Button>
        <Button type="button" variant="ghost" className="h-8 text-xs" onClick={() => setVal(available)}>
          Tối đa
        </Button>
      </div>

      <div className="mt-4 flex gap-2 border-t border-line pt-4">
        <Button type="button" variant="ghost" className="h-10 flex-1" onClick={onClose}>
          Huỷ
        </Button>
        <Button type="submit" className="h-10 flex-[2]" disabled={over || (val === 0 && current === 0)}>
          {val === 0 && current > 0 ? 'Bỏ cược' : `Xác nhận ${fmt(val)}`}
        </Button>
      </div>
    </Modal>
  )
}
