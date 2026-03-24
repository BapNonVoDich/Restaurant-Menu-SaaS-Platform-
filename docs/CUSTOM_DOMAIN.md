# Custom domain cho menu công khai

## Luồng tổng quan

1. Trong **Cài đặt cửa hàng**, nhập hostname (ví dụ `menu.nhahang.com`) và bấm **Lưu tên miền**.
2. Tại DNS của tên miền, thêm bản ghi **TXT** trên **chính hostname đó** với giá trị hiển thị trong ứng dụng (dạng `restaurant-saas-verify=<token>`).
3. Bấm **Kiểm tra DNS**. Khi thành công, trạng thái **đã xác minh** được lưu trong catalog.
4. Trỏ **A** hoặc **CNAME** của hostname về địa chỉ IP hoặc load balancer nơi chạy **Next.js frontend**.
5. Bật **HTTPS** (TLS) trên reverse proxy (nginx, Caddy, Traefik, v.v.) — Let's Encrypt hoặc chứng chỉ do nhà cung cấp cấp.

## Middleware Next.js

File `frontend/middleware.ts` gọi API công khai:

`GET /api/catalog/stores/resolve-host?host=<Host-header>`

Nếu có cửa hàng với `custom_domain` khớp (không phân biệt hoa thường) và `domain_verified = true`, response trả `slug` và middleware **rewrite** request sang `/menu/[slug]`.

## Biến môi trường (frontend)

| Biến | Mô tả |
|------|--------|
| `NEXT_PUBLIC_API_URL` | Base URL gateway (vd. `https://api.example.com/api`) — dùng cho middleware và client. |
| `NEXT_PUBLIC_PLATFORM_HOSTS` | Danh sách host nền tảng, phân tách bằng dấu phẩy (mặc định `localhost,127.0.0.1`). Trên các host này middleware **không** rewrite theo custom domain. |
| `NEXT_PUBLIC_APP_DOMAIN` | (Tuỳ chọn) Host chính của app (vd. `app.dichvu.com`) nếu khác với platform hosts. |

## Ghi chú

- Xác minh TXT dùng Google DNS-over-HTTPS từ **catalog-service**; cần catalog có thể ra internet.
- Mỗi hostname chỉ gắn với một cửa hàng (ràng buộc unique trên `stores.custom_domain`).
- Sau khi đổi hostname trong cài đặt, cần xác minh lại TXT (token mới).
