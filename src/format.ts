export const fmt = (n: number) => Math.round(n).toLocaleString('vi-VN')
export const shortChip = (n: number) => (n >= 1000 ? `${n / 1000}K` : String(n))
