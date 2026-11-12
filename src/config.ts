// ===== CẤU HÌNH GAME — sửa ở đây =====

/**
 * Mã băm của mật khẩu MẶC ĐỊNH (dùng khi chưa đổi mật khẩu trong game).
 * Mặc định là: baucua2026 — đổi mật khẩu bằng nút “Đổi mật khẩu” ở màn đăng nhập.
 */
export const DEFAULT_PASSWORD_HASH = '17996a7117da137de9513feeae9cced191214d06074455df9aeca88fa157665d'

/** Số điểm tối đa được cấp mỗi lần */
export const MAX_GRANT = 10_000_000

/** Các mức nạp nhanh */
export const GRANT_PRESETS = [1_000, 5_000, 10_000, 50_000, 100_000]

/** Mệnh giá chip đặt cược */
export const CHIPS = [10, 50, 100, 500, 1_000, 5_000]

/** Thời gian lắc bát (ms) */
export const SHAKE_MS = 1400

/** Tài Xỉu: cửa Bão (3 con giống nhau) ăn 1 được bao nhiêu */
export const TX_BAO_PAYOUT = 30

/** Bầu Cua & Tài Xỉu: thời gian đặt cược sau khi lắc (giây), hết giờ tự khui */
export const BET_SECONDS = 30

/** Khui xong chờ bao lâu thì tự lắc ván mới (giây) */
export const NEXT_ROUND_SECONDS = 12
