import { useState } from 'react'
import { AnimatePresence, useAnimate } from 'motion/react'
import { checkPassword } from '../game/password'
import { sfx } from '../game/sound'
import { Button } from './Button'
import { ChangePasswordDialog } from './ChangePasswordDialog'
import { inputCls } from './Modal'
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
      setError('Mật khẩu không đúng')
      setPw('')
      animate(scope.current, { x: [0, -8, 8, -5, 5, 0] }, { duration: 0.35 })
    }
  }

  return (
    <>
      <ScreenCard title="Xác thực quản trị" subtitle="Nạp điểm" onBack={onBack}>
        <form ref={scope} onSubmit={submit} className="space-y-3">
          <label className="label block">Mật khẩu</label>
          <div className="relative">
            <input
              autoFocus
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={(e) => {
                setPw(e.target.value)
                setError('')
              }}
              placeholder="Nhập mật khẩu"
              className={`${inputCls} pr-16 ${error ? 'border-down' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm px-2 py-1 text-xs text-mute hover:text-ink"
              aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {show ? 'Ẩn' : 'Hiện'}
            </button>
          </div>
          <p className="h-4 text-xs text-down">{error}</p>
          <Button type="submit" className="h-11 w-full" disabled={!pw}>
            Tiếp tục
          </Button>
          <div className="flex items-center justify-end pt-1 text-xs">
            <button type="button" onClick={() => setChanging(true)} className="text-mute hover:text-ink">
              Đổi mật khẩu
            </button>
          </div>
        </form>
      </ScreenCard>
      <AnimatePresence>{changing && <ChangePasswordDialog onClose={() => setChanging(false)} />}</AnimatePresence>
    </>
  )
}
