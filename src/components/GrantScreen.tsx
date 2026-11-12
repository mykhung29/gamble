import { useState } from 'react'
import { GRANT_PRESETS, MAX_GRANT } from '../config'
import { fmt } from '../format'
import { Button } from './Button'
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
    <ScreenCard>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-xl bg-black/25 px-4 py-3 text-center">
          <div className="text-xs tracking-wider text-amber-200/70 uppercase">Số điểm hiện có</div>
          <div className="gold-text text-3xl font-extrabold">{fmt(balance)}</div>
        </div>

        <label className="block text-sm font-semibold text-amber-100">Nhập số điểm muốn cấp</label>
        <input
          autoFocus
          inputMode="numeric"
          value={amount ? fmt(amount) : ''}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="0"
          className="w-full rounded-xl border-2 border-amber-400/40 bg-black/30 px-4 py-3 text-right text-2xl font-extrabold text-amber-50 outline-none placeholder:text-amber-200/30 focus:border-amber-300"
        />
        <div className="flex flex-wrap gap-2">
          {GRANT_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setRaw(String(p))}
              className="flex-1 rounded-lg border border-amber-300/30 bg-amber-400/10 px-2 py-1.5 text-sm font-bold text-amber-200 hover:bg-amber-400/25"
            >
              {fmt(p)}
            </button>
          ))}
        </div>
        <p className="h-5 text-sm text-red-300">{tooBig ? `Tối đa ${fmt(MAX_GRANT)} điểm mỗi lần` : ''}</p>

        <Button type="submit" className="w-full py-3 text-lg" disabled={amount <= 0 || tooBig}>
          Cấp {amount > 0 ? fmt(amount) : ''} điểm & chơi
        </Button>
        {onSkip && (
          <Button type="button" variant="ghost" className="w-full" onClick={onSkip}>
            ← Quay lại, không nạp
          </Button>
        )}
      </form>
    </ScreenCard>
  )
}
