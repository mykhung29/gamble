import { fmt } from '../format'

/** Nút mệnh giá: phẳng, gọn, không bóng */
export function Chip({ value, disabled, onClick }: { value: number; selected?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-9 min-w-0 flex-1 rounded-sm border border-line bg-panel-2 text-sm font-semibold text-ink tabular-nums transition-colors hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-30"
      aria-label={`Thêm ${value}`}
    >
      +{fmt(value)}
    </button>
  )
}
