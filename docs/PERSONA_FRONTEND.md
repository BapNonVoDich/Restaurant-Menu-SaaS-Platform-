# Frontend theo vai trò (persona) — ma trận route

Tài liệu rà soát shell (Header / Footer) và hành vi chính.

| Route / nhóm | Header | Footer | Ghi chú |
|----------------|--------|--------|---------|
| `/`, landing marketing | Có (`Header.tsx`) | Có (`Footer.tsx`) | CTA đăng nhập / đăng ký |
| `/auth/*` | Ẩn | Ẩn | Trải nghiệm đăng nhập tập trung |
| `/menu/[slug]` | Ẩn | Ẩn | Menu khách; không link dashboard trong footer |
| `/dashboard/*` | Có (nav dashboard) | Có | Waiter-only: `dashboard/layout.tsx` giới hạn `/dashboard/orders` |
| `/setup/*` | Theo root layout | Có | Có thể rút gọn footer sau nếu cần |

## Biến môi trường

- `NEXT_PUBLIC_APP_URL`: (tuỳ chọn) URL gốc ứng dụng để hiển thị link menu đầy đủ trước khi hydrate; nếu không set, client dùng `window.location.origin`.

## Component liên quan

- `components/Header.tsx` — ẩn trên `/menu/`, `/auth/`
- `components/Footer.tsx` — ẩn trên `/menu/`, `/auth/`
- `components/PublicMenuLinkBlock.tsx` — link đầy đủ, copy, QR cho chủ cửa hàng
