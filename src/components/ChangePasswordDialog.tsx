import { useState } from 'react'
import { useAnimate } from 'motion/react'
import { checkPassword, savePassword } from '../game/password'
import { sfx } from '../game/sound'
import { Button } from './Button'
import { Modal, inputCls } from './Modal'

const MIN_LEN = 4

function Field({ label, value, onChange, autoFocus }: { label: string; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <label className="block">
      <span className="label mb-1.5 block">{label}</span>
      <input
        autoFocus={autoFocus}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
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
  const fail = (msg: string) => {
    sfx.error()
    setError(msg)
    animate(scope.current, { x: [0, -8, 8, -5, 5, 0] }, { duration: 0.35 })
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
    <Modal as="form" formRef={scope} onSubmit={submit} onClose={onClose} title="Đổi mật khẩu" subtitle="Bảo mật" z="z-50">
      {done ? (
        <div className="space-y-4">
          <p className="rounded-sm border border-up/40 bg-up/10 px-3 py-2.5 text-sm text-up">
            Đã đổi mật khẩu. Từ giờ dùng mật khẩu mới để nạp điểm và reset.
          </p>
          <Button type="button" className="h-10 w-full" onClick={onClose}>
            Xong
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Field label="Mật khẩu hiện tại" value={oldPw} onChange={(v) => (setOldPw(v), setError(''))} autoFocus />
          <Field label={`Mật khẩu mới (ít nhất ${MIN_LEN} ký tự)`} value={newPw} onChange={(v) => (setNewPw(v), setError(''))} />
          <Field label="Nhập lại mật khẩu mới" value={confirm} onChange={(v) => (setConfirm(v), setError(''))} />
          <p className="min-h-4 text-xs text-down">{error}</p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" className="flex-[2]" disabled={!oldPw || !newPw || !confirm}>
              Lưu mật khẩu
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
