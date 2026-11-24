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

/** Xổ Số: Đề (đoán 2 số cuối giải đặc biệt) ăn 1 được bao nhiêu */
export const XS_DE_PAYOUT = 80

/** Xổ Số: Càng (đoán 3 số cuối giải đặc biệt) ăn 1 được bao nhiêu */
export const XS_CANG_PAYOUT = 700

/** Xổ Số: tối đa bao nhiêu phiếu cược mỗi kỳ */
export const XS_MAX_TICKETS = 20

/** Penalty: sút vào (qua thủ môn) thì ăn 1 được bao nhiêu. Bóng trúng khung thì thủ môn bắt 50% */
export const PK_PAYOUT = 0.9

/** Đoán Ly: đoán đúng ly có bóng thì ăn 1 được bao nhiêu (đoán bừa trúng 1/3) */
export const CUP_PAYOUT = 1.8

/** Đoán Ly: số lần tráo ly mỗi ván, và thời gian mỗi lần tráo (ms) — càng nhiều/càng nhanh càng khó theo dõi */
export const CUP_SWAPS = 22
export const CUP_SWAP_MS = 90
