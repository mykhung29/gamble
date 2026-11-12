import { useEffect, useRef, useState } from 'react'
import { motion, useAnimate } from 'motion/react'
import { checkPassword, savePassword } from '../game/password'
import { sfx } from '../game/sound'
import { Button } from './Button'

const MIN_LEN = 4

function Field({ label, value, onChange, autoFocus }: { label: string; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-amber-100/80">{label}</span>
      <input
        autoFocus={autoFocus}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border-2 border-amber-400/40 bg-black/30 px-4 py-2.5 text-lg text-amber-50 outline-none focus:border-amber-300"
      />
    </label>
  )
}

export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [scope, animate] = useAnimate<HTMLFormElement>()
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const fail = (msg: string) => {
    sfx.error()
    setError(msg)
    animate(scope.current, { x: [0, -14, 14, -10, 10, -4, 0] }, { duration: 0.45 })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkPassword(oldPw)) {
      setOldPw('')
      return fail('Mật khẩu cũ không đúng!')
    }
    if (newPw.length < MIN_LEN) return fail(`Mật khẩu mới phải có ít nhất ${MIN_LEN} ký tự`)
    if (newPw !== confirm) return fail('Nhập lại mật khẩu mới không khớp')
    if (newPw === oldPw) return fail('Mật khẩu mới phải khác mật khẩu cũ')
    if (!savePassword(newPw)) return fail('Trình duyệt không cho lưu (đang ở chế độ ẩn danh?)')
    sfx.win()
    setDone(true)
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
        className="w-full max-w-sm space-y-3 rounded-3xl border-2 border-amber-400/60 bg-red-950 p-6 shadow-2xl"
      >
        <div className="text-center text-5xl">🔑</div>
        <h2 className="gold-text text-center font-display text-3xl">Đổi mật khẩu</h2>

        {done ? (
          <>
            <p className="rounded-xl bg-emerald-600/30 px-4 py-3 text-center font-semibold text-emerald-100">
              ✅ Đã đổi mật khẩu! Từ giờ dùng mật khẩu mới để vào game, nạp điểm và reset.
            </p>
            <Button type="button" className="w-full py-3" onClick={onClose}>
              Xong
            </Button>
          </>
        ) : (
          <>
            <Field label="Mật khẩu hiện tại" value={oldPw} onChange={(v) => (setOldPw(v), setError(''))} autoFocus />
            <Field label={`Mật khẩu mới (ít nhất ${MIN_LEN} ký tự)`} value={newPw} onChange={(v) => (setNewPw(v), setError(''))} />
            <Field label="Nhập lại mật khẩu mới" value={confirm} onChange={(v) => (setConfirm(v), setError(''))} />
            <p className="min-h-5 text-sm font-semibold text-red-300">{error}</p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                Huỷ
              </Button>
              <Button type="submit" className="flex-[2]" disabled={!oldPw || !newPw || !confirm}>
                Đổi mật khẩu
              </Button>
            </div>
          </>
        )}
      </motion.form>
    </motion.div>
  )
}
