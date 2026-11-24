import { useState } from 'react'
import { useAnimate } from 'motion/react'
import { checkPassword } from '../game/password'
import { sfx } from '../game/sound'
import { Button } from './Button'
import { Modal, inputCls } from './Modal'

/** Hộp hỏi mật khẩu trước khi làm thao tác nhạy cảm */
export function PasswordDialog({
  title,
  message,
  confirmLabel,
  onSuccess,
  onClose,
}: {
  title: string
  message: string
  confirmLabel: string
  onSuccess: () => void
  onClose: () => void
}) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [scope, animate] = useAnimate<HTMLFormElement>()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (checkPassword(pw)) {
      onSuccess()
    } else {
      sfx.error()
      setError('Mật khẩu không đúng')
      setPw('')
      animate(scope.current, { x: [0, -8, 8, -5, 5, 0] }, { duration: 0.35 })
    }
  }

  return (
    <Modal as="form" formRef={scope} onSubmit={submit} onClose={onClose} title={title} subtitle="Xác nhận" accent="var(--color-down)" z="z-50">
      <p className="mb-4 text-sm text-mute">{message}</p>
      <input
        autoFocus
        type="password"
        value={pw}
        onChange={(e) => {
          setPw(e.target.value)
          setError('')
        }}
        placeholder="Mật khẩu"
        className={`${inputCls} ${error ? 'border-down' : ''}`}
      />
      <p className="h-5 pt-1 text-xs text-down">{error}</p>
      <div className="mt-2 flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
          Huỷ
        </Button>
        <Button type="submit" variant="red" className="flex-1" disabled={!pw}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
