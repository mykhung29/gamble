import { useState } from 'react'
import { GRANT_PRESETS, MAX_GRANT } from '../config'
import { fmt } from '../format'
import { Button } from './Button'
import { inputCls } from './Modal'
import { ScreenCard } from './ScreenCard'

export function GrantScreen({
  balance,
  onGrant,
  onSkip,
}: {
  balance: number
  onGrant: (n: number) => void
  onSkip?: () => void
}) {
  const [raw, setRaw] = useState('')
  const amount = Number(raw.replace(/\D/g, '')) || 0
  const tooBig = amount > MAX_GRANT

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (amount > 0 && !tooBig) onGrant(amount)
  }

  return (
    <ScreenCard title="Cấp điểm" subtitle="Nạp điểm" onBack={onSkip}>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-center justify-between rounded-sm border border-line bg-bg px-3 py-2.5">
          <span className="label">Số dư hiện tại</span>
          <span className="text-lg font-semibold text-gold tabular-nums">{fmt(balance)}</span>
        </div>

        <label className="label block pt-2">Số điểm cấp thêm</label>
        <input
          autoFocus
          inputMode="numeric"
          value={amount ? fmt(amount) : ''}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="0"
          className={`${inputCls} text-left text-xl font-semibold tabular-nums ${tooBig ? 'border-down' : ''}`}
        />
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
          {GRANT_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setRaw(String(p))}
              className={`h-8 rounded-sm border text-xs font-medium tabular-nums transition-colors ${
                amount === p ? 'border-gold text-gold' : 'border-line text-mute hover:border-line-strong hover:text-ink'
              }`}
            >
              {fmt(p)}
            </button>
          ))}
        </div>
        <p className="h-4 text-xs text-down">{tooBig ? `Tối đa ${fmt(MAX_GRANT)} điểm mỗi lần` : ''}</p>

        <Button type="submit" className="h-11 w-full" disabled={amount <= 0 || tooBig}>
          Cấp {amount > 0 ? fmt(amount) : ''} điểm
        </Button>
      </form>
    </ScreenCard>
  )
}
