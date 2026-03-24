# Smoke Test Checklist

## Upload (Cloudinary)
- [ ] Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` before `docker-compose up`.
- [ ] Owner uploads menu background image from dashboard menu page.
- [ ] Uploaded image appears on public menu immediately after refresh.
- [ ] Delete uploaded image from dashboard; verify image is removed in UI and Cloudinary.
- [ ] Upload a PDF/raw menu file; delete it; verify no 500 error and file is removed.

## Staff Access and Role Redirect
- [ ] Login with `testwaiter / Test1234!` and verify redirect to `/staff`.
- [ ] From `/staff`, open order handling page and update order status (confirm/done/cancel).
- [ ] Login with `testowner / Test1234!` and verify redirect to `/dashboard`.
- [ ] Ensure owner can access bill actions (export/complete/cancel) and staff management.
- [ ] Ensure waiter cannot call owner-only bill/staff actions (server should reject).

## Owner Add Staff Flow
- [ ] Owner opens dashboard settings, searches by username/email, selects waiter, adds to store.
- [ ] Verify added waiter appears in store staff list.
- [ ] Remove waiter and verify list updates.
- [ ] Try adding a non-existing UUID via API and verify validation error is returned.

## CORS
- [ ] Set `CORS_ALLOWED_ORIGINS` and restart gateway.
- [ ] Verify frontend origin in list can call API with credentials.
- [ ] Verify an unlisted origin is blocked by CORS policy.

## VNPay & subscription
- [ ] Complete sandbox payment; verify `subStatus` becomes **ACTIVE** in catalog after return/IPN.
- [ ] Open `/payment/return` with valid VNPay query params and confirm UX (success/failure).

## Table ordering
- [ ] In settings, enable **Đặt món theo bàn**; save; open public `/menu/{slug}?table=5` and place an order with table filled.
- [ ] Dashboard **Đơn hàng**: column **Bàn** and filter **Lọc theo bàn** return matching orders.

## Custom domain
- [ ] Set custom hostname in settings; add TXT `restaurant-saas-verify=<token>`; **Kiểm tra DNS** until verified.
- [ ] Point A/CNAME to frontend; visit custom host — middleware should show the correct public menu (`/menu/{slug}` rewrite).
- [ ] Set `NEXT_PUBLIC_PLATFORM_HOSTS` / `NEXT_PUBLIC_APP_DOMAIN` so the main app host is not rewritten by mistake.
