# Gap Analysis - Implementation vs Requirements

## Summary
Re-audited 2026-09-14 against the actual code in this workspace (entities, controllers, and frontend pages read directly, not inferred). The previous version of this document was written early in the project and is significantly out of date — most "missing" items below were built in the three commits since. This revision reflects ground truth and supersedes it.

---

## ✅ IMPLEMENTED FEATURES

### Core Infrastructure
- [x] Next.js frontend with TypeScript & TailwindCSS
- [x] Nest.js backend with TypeORM
- [x] PostgreSQL database
- [x] Docker setup (PostgreSQL, Redis, MinIO)
- [x] i18n structure (EN, DE complete — see #11, GE/RU still missing)

### Authentication & Users
- [x] User registration (email, phone, password, role)
- [x] JWT-based login
- [x] Protected routes
- [x] User roles (SHIPPER, CARRIER, ADMIN)

### Carrier Registration & Documents — DONE (doc previously said missing)
- [x] Dedicated `/carrier-registration` wizard, separate from shipper signup
- [x] `Carrier` entity captures: bank name/code/account/currency, structured address (line1/2, city, state, postal, country), languages[], passport number + issue date, driver license number, ID card number, company name, tax ID
- [x] `verification_status` (PENDING/VERIFIED/REJECTED) on the carrier
- [x] `Document` entity + `/documents/upload` (multipart → MinIO) covering PASSPORT, LICENSE, INSURANCE, POA, CMR, INVOICE, PACKING_LIST, EXPORT_DECLARATION, CERTIFICATE_OF_ORIGIN, OTHER, each with its own PENDING/VERIFIED/REJECTED status + expiry date
- [x] Admin verification queue at `/admin/verifications`

### Vehicle Management — DONE (doc previously said basic only)
- [x] `Vehicle` entity: type, plate, capacity_kg, volume_m3, length/width/height, `is_refrigerated`, `adr_class`, `features` (curtain/liftgate/etc. as jsonb), VIN, make/model/year, TIR/CMR/waybill flags, loading type, emission class, trailer sub-fields, photos[], insurance/POA/ID doc URLs
- [x] Multiple vehicles per carrier (`VehicleRegistrationWizard.tsx`, `my-vehicles` page)

### Shipment Creation — DONE (doc previously said basic form, hardcoded times)
- [x] Multi-step wizard (`RouteStep`, `CargoStep`, `DetailsStep`, `RequirementsStep`)
- [x] Nominatim geocoding for pickup/delivery address → lat/lng (`RouteStep.tsx`)
- [x] `datetime-local` pickers for pickup/delivery time, with delivery-after-pickup validation
- [x] Dimensions (internal L/W/H), CBM, temperature control, HS code, loading type, TIR/CMR/waybill/export-declaration requirements, shipper/consignee JSON, value of goods + currency, payment terms

### Carrier Workflow — DONE (doc previously said admin-only status updates)
- [x] `ShipmentProgressControl.tsx` lets the assigned carrier drive the status machine forward: OPEN → ASSIGNED → DRIVER_AT_PICKUP → LOADING_STARTED → LOADING_FINISHED → IN_TRANSIT → ARRIVED_DELIVERY → UNLOADING_FINISHED → DELIVERED, via `PATCH /shipments/:id/status`
- [x] `timeline` jsonb column on the shipment records each transition with a timestamp
- [x] `DocumentUpload.tsx` wired into the active-shipment flow for CMR/POD/Invoice uploads

### Offers / Bidding — DONE, including negotiation (implemented 2026-09-14)
- [x] `Offer` entity (shipment_id, carrier_id, offered_price, message, status, expires_at)
- [x] Multiple carriers can submit offers on one shipment (`POST /offers`)
- [x] Shipper reviews offers and accepts/rejects (`PATCH /offers/:id/accept|reject`), now with proper party-based authorization (previously anyone authenticated could accept/reject any offer — fixed)
- [x] Carrier-facing "my offers" list, now with response actions instead of read-only
- [x] **Counter-offers**: either party can propose a new price (`PATCH /offers/:id/counter`), turn-based (`countered_by` tracks whose turn it is to respond), unlimited back-and-forth rounds, accepting a countered offer locks in the negotiated price on the shipment
- [x] **Expiration enforcement**: `expires_at` is checked on every accept/counter (lazy expiry flips the row to `EXPIRED` on access) plus a `@Cron` job every 10 minutes that bulk-expires stale `PENDING`/`COUNTERED` offers
- [x] **Withdraw**: carriers can pull their own open offer (`PATCH /offers/:id/withdraw`, uses the previously-unused `WITHDRAWN` status)
- [x] Race-condition guard: accepting an offer for a shipment already assigned to a different carrier is rejected
- [x] Carrier rating (from the Reviews feature) surfaced on every offer card so shippers can factor trust into acceptance

### Reviews & Ratings — DONE (implemented 2026-09-14, was entirely missing)
- [x] `Review` entity (shipment_id unique, reviewer_id, carrier_id, rating 1–5, comment)
- [x] Shipper can rate a carrier once a shipment reaches `DELIVERED` (`POST /reviews`), one review per shipment enforced
- [x] `GET /reviews/carrier/:id/summary` (average + count) shown on the carrier's own dashboard and on every offer a shipper reviews
- [x] Carrier notified in-app when a review is received

### Real-Time Tracking — DONE (doc previously said none)
- [x] Socket.io gateway (`notifications.gateway.ts`) with JWT-authenticated connections
- [x] Carrier browser emits live GPS via `useLocationTracking` (`navigator.geolocation.watchPosition`) → `location-update` socket event, gated behind `TrackingPermissionModal`
- [x] Gateway caches last-known location per shipment and rebroadcasts as `carrier-location` to all subscribers, including one who joins late
- [x] `LiveTrackingMap.tsx` (Leaflet): animated truck markers, per-status colors/icons, route polylines, searchable shipment filter, connection-state awareness
- [x] In-app notifications: `Notification` entity + gateway push + (per dashboard) notification bell

### Mobile Apps (new — not in original spec scope, found during audit)
- [x] `mobile/shipper` (Expo/React Native): login, dashboard, create/active/history shipments, documents, settings — full screen set mirroring the web shipper dashboard
- [ ] `mobile/carrier` (Expo): scaffolded only (App.tsx + config), no screens built yet — this is the natural home for background GPS tracking, which the current web `watchPosition` approach can't do reliably

### Database Schema
- [x] Users, Carriers (rich), Vehicles (rich), Shipments (rich), Documents, Offers, Notifications

---

## ❌ CONFIRMED STILL MISSING

### 1. Payment System — DONE, checkout confirmed live 2026-09-15, webhook completion pending on the user
**Scope decision (made with the user):** simple collection flow, not a Stripe Connect marketplace — the shipper pays into the platform's own Stripe account via a hosted Checkout Session; carrier payout is tracked in the app but the actual transfer to the carrier happens outside Stripe for now. Charged **after delivery**, against the existing `payment_terms`-derived due date (matches the "Payment Pending / due in N days" UI that already existed on shipment cards).

**Built:**
- [x] `Payment` entity (one per shipment, `PENDING → PROCESSING → PAID/FAILED`, amount, currency, `stripe_checkout_session_id`, `due_date`, `paid_at`)
- [x] `POST /payments/checkout/:shipmentId` — shipper-only, validates shipment is `DELIVERED` and unpaid, creates/reuses the `Payment` row, returns a Stripe Checkout URL
- [x] `POST /payments/webhook` — verifies the Stripe signature against the **raw** request body (required `main.ts` bootstrap change: body parsing is now routed per-path so `/payments/webhook` gets raw bytes while every other route keeps normal JSON parsing — verified both still work), marks the payment `PAID`, notifies both parties
- [x] `GET /payments/shipment/:id`, `GET /payments/my-payments`, `GET /payments/carrier/earnings-summary`
- [x] Frontend: `PaymentPanel` (Pay Now button + live status) on the shipper's shipment detail page, wired to the Stripe success/cancel redirect; `CarrierEarningsBadge` on the carrier dashboard
- [x] Fixed a related inconsistency this surfaced: the existing `/dashboard` "Earnings" stat summed *all delivered shipment prices*, not money actually received — now sums real `PAID` payments, consistent with the new earnings summary
- [x] `ShipmentList.tsx`'s "Payment Pending" badge now reflects real payment status instead of always showing pending
- [x] Verified end-to-end via curl against the running backend: authorization ordering fixed after first test caught it short-circuiting on "Stripe not configured" before checking ownership/status (now validates business rules first, Stripe second); due-date calculation confirmed to exactly match the frontend's existing logic

**Live keys added 2026-09-15:** real `sk_test_...` and `whsec_...` (via Stripe CLI `stripe listen`) are in `backend/.env`. A real Checkout Session was created against the live Stripe test API (`checkout.stripe.com/c/pay/cs_test_...`, not a mock) for an actual delivered test shipment at the negotiated price. The user has the checkout link but hasn't completed the test card payment yet, so the webhook → `PAID` → email-confirmation path is built and wired but not yet observed end-to-end. Pick this back up whenever convenient — not blocking anything else.

**Still by design, not a gap:**
- Carrier payout is manual/tracked-only, not automated (the simple-flow decision made with the user) — revisit if/when a Connect marketplace is wanted
- No refund flow

---

### 2. Languages (GE, RU) — infrastructure fixed 2026-09-14, real coverage still shallow
**What was actually wrong (worse than "files missing"):** `routing.ts` already listed `ge` and `ru` as supported locales — with no message files behind them. Visiting `/ge/*` or `/ru/*` threw an uncaught module-not-found error server-side (a 500, not a graceful fallback). `de.json` was also missing the `Shipper` and `Carrier` namespaces entirely, so German users hitting those pages were already relying on next-intl's fallback behavior.

**Fixed:**
- [x] Renamed the Georgian locale from `ge` to the correct ISO 639-1 tag `ka` (`ge` is the *country* code, not the language code — nothing else in the codebase referenced the string, so this was a safe, one-line rename)
- [x] `de.json` brought to full key parity with `en.json` (added `Shipper`/`Carrier`)
- [x] `ka.json` and `ru.json` created with full translations for all 5 existing namespaces (`HomePage`, `Auth`, `Shipper`, `Carrier`, `Dashboard`) — verified identical key sets across all four files programmatically
- [x] Built `LanguageSwitcher.tsx` (none existed before — the locales were unreachable through the UI) and wired it into the homepage, `AuthLayout` (login/register), and the dashboard header
- [x] Verified live: all four locale homepages and `/auth/login` return 200 and render the correct translated string per language (checked via curl against the running dev server, not just code review)

**Still genuinely incomplete — do not read the above as "the app is localized":** only 25 of 56 frontend components call `useTranslations` at all, across just those 5 namespaces. Everything built in later sessions — the shipment wizard, offers/counter-offers, live tracking, reviews, admin — is hardcoded English with no translation keys. Switching language today translates login/register/homepage/basic nav labels and nothing else. Fully localizing the product would mean adding translation keys through ~30 more components; that's a substantially larger job than "add two JSON files," and is not started.

---

### 3. Admin Dashboard — BUILT 2026-09-15
Scoped from a generic marketplace-admin recommendation list down to what this app's actual data supports — route optimization, chargeback handling, support tickets, and predictive forecasting were all dropped since there's no underlying system for any of them yet.

**Built:**
- [x] `/admin` — platform overview: shipper/carrier/shipment counts, shipments-by-status breakdown, delivery success rate, avg delivery time, revenue paid vs. pending (from real `Payment` records), pending-verification count
- [x] `/admin/users` — directory of every shipper and carrier (search + role filter), showing shipment count, real earnings and rating for carriers, verification status; suspend/reactivate action
- [x] `/admin/shipments` — platform-wide shipment list (search + status filter) with a manual status override for support/edge cases
- [x] `/admin/verifications` — the existing carrier-verification queue, restyled to match, now sitting behind a proper `AdminLayout` with a role-gated redirect (previously reachable, if uselessly, by anyone with the link)
- [x] `POST /admin/broadcast` — send an in-app + email notification to all shippers, all carriers, or everyone, reusing the existing notification/mail pipeline
- [x] All `/admin/*` endpoints behind `RolesGuard` + `@Roles(ADMIN)`, verified via curl that shipper/carrier tokens get 403 and only the admin account gets through

**Two real security gaps found and fixed while building this (not admin-dashboard scope per se, but surfaced by it):**
- `is_active` existed on `User` but was checked *nowhere* — a suspended account could still log in, and an already-issued token kept working forever. Fixed in both `auth.service.ts` (blocks login) and `jwt.strategy.ts` (rejects the token on the very next request, verified live — suspending mid-session immediately 401s their existing token).
- `PATCH /shipments/:id/status` had no ownership check — any authenticated user (not just the assigned carrier) could change any shipment's status. Restricted to the assigned carrier or an admin override; verified a second carrier gets 403.

---

### 4. Email Notifications — DONE, live key confirmed 2026-09-15
`MailService` (Resend) wired directly into `NotificationsService.create()` — every existing in-app/WebSocket notification (offer received/accepted/rejected/countered/withdrawn, review received, payment confirmed/received, shipment status change) also fires a best-effort email, in a small branded HTML template with a link back to the dashboard. Fire-and-forget: an email failure is logged and never breaks the underlying action.

Live `RESEND_API_KEY` added and confirmed working — a real send reached Resend's API and the sandbox rejection message itself confirmed the account's verified address. No SMS (was always marked optional, not built).

---

### 5. Mobile Carrier App — BUILT 2026-09-15
Was an empty scaffold; now a working Expo app with a scope decision made with the user: true background GPS tracking (not just foreground), plus a business rule — once a carrier goes online and picks up a shipment, they're locked online (can't go offline) until it's marked `DELIVERED`.

**Built:**
- [x] Same foundation as `mobile/shipper` (`AuthContext`, `expo-secure-store` token, NativeWind) — plus fixed 3 config files (`babel.config.js`, `metro.config.js`, `global.css`) that were missing from the original scaffold, meaning NativeWind styling was never actually wired up before now
- [x] Login, Dashboard (Go Online/Offline + available jobs list), Job Details (submit an offer), Active Shipment (status progression through the same 8-step flow as the web app)
- [x] `TrackingContext`: online/offline state persisted across restarts, polls `/shipments/my-shipments` for an active (non-terminal) shipment, and disables "Go Offline" whenever one exists
- [x] True background location via `expo-location` + `expo-task-manager` — the task is defined at module scope (required so the OS can invoke it while the app is backgrounded) and reads the active shipment ID from `SecureStore` rather than React state, since backgrounded JS has no component tree
- [x] **New backend endpoint** `POST /notifications/location/:shipmentId` — background updates arrive as plain HTTP POSTs, not over the existing WebSocket, because a persistent socket doesn't reliably survive the OS suspending the app. Validated: only the assigned carrier may post to a given shipment (fixed a pre-existing `TODO` — the WebSocket path had never validated this). Reuses the same broadcast-and-cache logic as the web app's live socket path, so shippers see mobile-sourced updates identically.
- [x] `app.json` configured with the iOS/Android permission strings and background modes background location requires
- [x] Also fixed: `mobile/shipper`'s API client was still pointed at a dead tunnel URL from an earlier session — that app couldn't reach the backend at all until this fix

**Verified without a physical device (the honest limit of what's checkable from here):**
- Full TypeScript compile, clean
- Metro bundler actually built the app for both iOS and Android targets (1,427 / 1,429 modules, zero errors) — catches real bundling/config problems `tsc` alone wouldn't
- `expo config` confirms the location plugin and all permission strings resolve correctly into the native config

**Cannot be verified from here — needs the user's phone:** actual background execution behavior, the real iOS/Android permission prompts, whether location keeps flowing with the screen locked, and battery impact. Also: background location doesn't work in plain Expo Go (Expo removed that support) — testing this specific feature requires a development build (`npx expo run:ios` / `run:android`, or an EAS build), not just scanning a QR code.

---

## Items from the original doc now fully resolved (no action needed)
Carrier registration & documents · Vehicle management (volume/dims/refrigerated/ADR/features/docs/multi-vehicle) · Shipment creation fields (dims, times, geocoding) · Carrier status updates & shipment doc upload · Real-time tracking (WebSocket, GPS, live map) · Geocoding & maps (Nominatim + Leaflet) · Offers/bidding, counter-offers & expiration · Reviews & ratings · Notifications (in-app/WebSocket) · Admin dashboard (stats, users, shipments, verifications, broadcast) · Payments (Stripe checkout) · Email (Resend) · Mobile carrier app (background tracking).

---

## 📊 PRIORITY RECOMMENDATIONS

### Everything originally scoped is done (2026-09-15)
Reviews & ratings, offer negotiation, admin dashboard, Stripe payments, Resend email, and the mobile carrier app (background tracking) all shipped this pass — see above for what's built vs. what only the user's own testing can confirm (the Stripe webhook completion, on-device background location behavior).

### What's actually left
1. **Deep i18n** — 30+ components (shipment wizard, offers, tracking, reviews, admin) are still hardcoded English. Deliberately deferred until the rest of the app is feature-complete, per the user's call on 2026-09-15 ("let's translate everything at once at the end").
2. **On-device verification** — the user completing the Stripe test payment, and testing the carrier app's background GPS on a real phone via a dev-client build (not Expo Go).

### Not started, out of current scope unless requested
AI services (price estimation, carrier matching, route optimization) and analytics/forecasting — the original doc's Phase 3. These still make sense only after enough real performance/earnings history exists to train or filter on. Also not requested: Stripe Connect payouts, refunds, SMS notifications, dispute resolution tooling.

---
