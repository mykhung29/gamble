import { useState } from 'react'
import { AnimatePresence, useAnimate } from 'motion/react'
import { checkPassword } from '../game/password'
import { sfx } from '../game/sound'
import { Button } from './Button'
import { ChangePasswordDialog } from './ChangePasswordDialog'
import { ScreenCard } from './ScreenCard'

export function LoginScreen({ onSuccess, onBack }: { onSuccess: () => void; onBack?: () => void }) {
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [changing, setChanging] = useState(false)
  const [scope, animate] = useAnimate<HTMLFormElement>()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (checkPassword(pw)) {
      sfx.open()
      onSuccess()
    } else {
      sfx.error()
      setError('Sai mật khẩu rồi!')
      setPw('')
      animate(scope.current, { x: [0, -14, 14, -10, 10, -4, 0] }, { duration: 0.45 })
    }
  }

  return (
    <>
    <ScreenCard>
      <form ref={scope} onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold text-amber-100">🔒 Nhập mật khẩu bí mật</label>
        <div className="relative">
          <input
            autoFocus
            type={show ? 'text' : 'password'}
            value={pw}
            onChange={(e) => {
              setPw(e.target.value)
              setError('')
            }}
            placeholder="••••••••"
            className="w-full rounded-xl border-2 border-amber-400/40 bg-black/30 px-4 py-3 pr-12 text-lg text-amber-50 outline-none placeholder:text-amber-200/30 focus:border-amber-300"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-xl opacity-70 hover:opacity-100"
            aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {show ? '🙈' : '👁️'}
          </button>
        </div>
        <p className="h-5 text-sm font-semibold text-red-300">{error}</p>
        <Button type="submit" className="w-full py-3 text-lg" disabled={!pw}>
          Vào sòng
        </Button>
        {onBack && (
          <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
            ← Quay lại bàn chơi
          </Button>
        )}
        <button
          type="button"
          onClick={() => setChanging(true)}
          className="mx-auto block text-sm text-amber-200/70 underline-offset-4 hover:text-amber-100 hover:underline"
        >
          🔑 Đổi mật khẩu
        </button>
      </form>
    </ScreenCard>
    <AnimatePresence>{changing && <ChangePasswordDialog onClose={() => setChanging(false)} />}</AnimatePresence>
    </>
  )
}
