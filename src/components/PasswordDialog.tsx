import { useEffect, useRef, useState } from 'react'
import { motion, useAnimate } from 'motion/react'
import { checkPassword } from '../game/password'
import { sfx } from '../game/sound'
import { Button } from './Button'

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
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (checkPassword(pw)) {
      onSuccess()
    } else {
      sfx.error()
      setError('Sai mật khẩu rồi!')
      setPw('')
      animate(scope.current, { x: [0, -14, 14, -10, 10, -4, 0] }, { duration: 0.45 })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-sm"
    >
      <motion.form
        ref={scope}
        onSubmit={submit}
        initial={{ scale: 0.85 }}
        animate={{ scale: 1 }}
        className="w-full max-w-sm rounded-3xl border-2 border-red-400/60 bg-red-950 p-6 shadow-2xl"
      >
        <div className="text-center text-5xl">⚠️</div>
        <h2 className="gold-text mt-2 text-center font-display text-3xl">{title}</h2>
        <p className="mt-2 mb-4 text-center text-sm text-amber-100/80">{message}</p>
        <input
          autoFocus
          type="password"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value)
            setError('')
          }}
          placeholder="Nhập mật khẩu bí mật"
          className="w-full rounded-xl border-2 border-amber-400/40 bg-black/30 px-4 py-3 text-lg text-amber-50 outline-none placeholder:text-amber-200/30 focus:border-amber-300"
        />
        <p className="h-6 pt-1 text-sm font-semibold text-red-300">{error}</p>
        <div className="mt-2 flex gap-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" variant="red" className="flex-1" disabled={!pw}>
            {confirmLabel}
          </Button>
        </div>
      </motion.form>
    </motion.div>
  )
}
