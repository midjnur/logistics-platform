# Functional Test Checklist — Logistics Platform

**Purpose:** Walk through every built feature for all three roles (Shipper, Carrier, Admin) and confirm it actually works. Report back: what passed, what failed (with exact steps to reproduce), and anything that looked wrong even if not strictly "broken."

**Environment:** Local dev, not deployed anywhere.
- Web app: `http://172.20.10.8:3000` (or `http://localhost:3000` if testing from the same Mac). If neither loads, the LAN IP may have changed since this doc was written — ask the user to run `ipconfig getifaddr en0` and swap it in.
- Backend API: same host, port `4000`.
- All pages are locale-prefixed, e.g. `/en/dashboard`. Default locale is `en`.
- This is a Next.js + NestJS + PostgreSQL app running via Docker Compose (`docker ps` should show `logistics_frontend`, `logistics_backend`, `logistics_postgres`, `logistics_redis`, `logistics_minio` all `Up`). If a container is down, that's a setup problem, not a feature bug — flag it separately.

**How to test:** If you (Claude Desktop) have browser/computer-use access to this machine's local network, drive it directly. If not, narrate each step to the user one at a time and have them report what happened, rather than assuming.

---

## Credentials

| Role | Email | Password |
|---|---|---|
| Shipper | `demo.shipper@logistics.app` | `Demo1234!` |
| Carrier | `demo.carrier@logistics.app` | `Demo1234!` |
| Admin | `demo.admin@logistics.app` | `Demo1234!` |

Registration is also open (`/auth/register`) if you want to create fresh test accounts instead — carrier registration requires first/last name and passport number at minimum.

---

## Known limitations — these are NOT bugs, don't report them as such

- **Only login, register, the homepage, and basic dashboard nav are translated** into German/Georgian/Russian. Everything else (shipment wizard, offers, tracking, reviews, admin) is English-only regardless of language selected — this is intentional, deferred until the rest of the app is feature-complete.
- **Carrier payouts are manual/tracked-only.** The Stripe integration collects payment from the shipper into the platform's account; there's no automatic transfer to the carrier (no Stripe Connect). This was a deliberate scope decision, not a missing feature.
- **No refund flow, no SMS notifications, no dispute-resolution tooling.** None of these were ever in scope.
- **`mobile/carrier`'s background GPS tracking cannot be tested in Expo Go** — it needs a dev-client build (`npx expo run:ios`/`run:android`). If testing via Expo Go, everything except background location should work; don't flag background tracking as broken unless it was tested via a real dev-client build.
- **Resend email is in sandbox mode** — it can only actually deliver to the account owner's own verified email address. Every other recipient will get a logged "would have sent" rejection from Resend, visible in backend logs (`docker logs logistics_backend`), not a real inbox delivery. This is expected, not a bug — confirm the *attempt* happened correctly, not that an email arrived in an arbitrary test account's inbox.
- **Stripe is in test mode.** Use test card `4242 4242 4242 4242`, any future expiry, any CVC. No real money moves.

---

## SHIPPER

### Auth
- [ ] Register a new shipper account (`/auth/register`) — email, phone, password, role=Shipper
- [ ] Log out, log back in with `demo.shipper@logistics.app`
- [ ] Confirm the language switcher (top-right) changes login-page text between EN/DE/KA/RU

### Create a shipment
- [ ] Go to Create Shipment. Step through: Route (pickup + delivery address — type a real address and confirm it geocodes to a map pin, not just accepts raw text), Cargo (type, weight, volume/dimensions), Details (pickup/delivery datetime — delivery must be after pickup), Requirements (temperature control, TIR/CMR/waybill checkboxes, payment terms)
- [ ] Submit — confirm it appears in "My Shipments" with status `OPEN`

### Offers
- [ ] As a **different browser/incognito window**, log in as carrier, submit an offer on that shipment
- [ ] Back as shipper: open the shipment, confirm the offer appears with the carrier's rating badge next to it
- [ ] Try **Counter** — propose a different price, confirm status changes to "Carrier Countered" / shows the countered price
- [ ] As carrier: counter back or accept
- [ ] As shipper: **Accept** an offer — confirm shipment status flips to `ASSIGNED` and the accepted price matches the negotiated amount, and any other pending offers on the same shipment show as rejected

### Tracking
- [ ] Once a carrier has the shipment and is moving it through statuses (see Carrier section), open Active Shipments and switch to **Map view** — confirm a live truck marker appears and updates roughly every 15-30s while the carrier's browser tab (with location sharing granted) stays open

### Delivery, review, payment
- [ ] Progress the shipment (as carrier) all the way to `DELIVERED`
- [ ] As shipper, open the delivered shipment — confirm a **"Rate your carrier"** panel appears; submit a star rating + comment; confirm it becomes read-only afterward and can't be submitted twice
- [ ] Confirm a **Payment panel** appears showing the price and a "Pay Now" button
- [ ] Click Pay Now — confirm it redirects to a real Stripe Checkout page showing the correct route and amount
- [ ] Complete payment with the test card — confirm redirect back to the app shows "Processing" then (within ~15s) flips to "Paid", and the shipment list's payment badge updates from "Payment Pending" to "Paid"

### Notifications
- [ ] Confirm the notification bell shows unread counts for offer/status/payment events and clicking marks them read

---

## CARRIER

### Auth & profile
- [ ] Register a new carrier (`/carrier-registration` or via `/auth/register` with role=Carrier) — confirm it asks for carrier-specific fields (name, passport, bank details, address)
- [ ] Log in as `demo.carrier@logistics.app`
- [ ] Go to My Documents — upload a file against a document type (e.g. Insurance); confirm it appears with status `PENDING`

### Vehicles
- [ ] Add a vehicle — type, plate, capacity, volume, dimensions, refrigerated toggle, ADR class, feature checkboxes (curtain/liftgate/etc.)
- [ ] Confirm it appears in "My Vehicles"

### Jobs & offers
- [ ] Browse Available Jobs — find an `OPEN` shipment, view details, submit an offer with a price and optional message
- [ ] Go to "Offers Sent" — confirm it's listed as Pending
- [ ] If the shipper counters (see Shipper section), confirm you can **Accept**, **Decline**, or **Counter back** from this same page
- [ ] Try **Withdraw** on a still-pending offer you don't want anymore — confirm it disappears/shows Withdrawn and the shipper can no longer accept it

### Active shipment workflow
- [ ] Once an offer is accepted, find the shipment under Active Shipments
- [ ] Step it forward through every status: Driver At Pickup → Loading Started → Loading Finished → In Transit → Arrived At Delivery → Unloading Finished → Delivered. Confirm each button only advances one step and the shipment log/timeline records each transition with a timestamp
- [ ] Confirm you're prompted for location permission at some point in this flow, and that granting it makes the shipper's live map (tested above) actually show your position

### Reviews & earnings
- [ ] After a shipper leaves a review, confirm your average rating updates on your dashboard
- [ ] After the shipper pays, confirm your dashboard's "Earnings" figure increases by the paid amount

---

## ADMIN

Log in as `demo.admin@logistics.app`. Confirm `/admin` is reachable and that logging in as the shipper or carrier demo accounts and trying to visit `/admin` redirects you away (should NOT be able to see admin pages as a non-admin).

### Overview (`/admin`)
- [ ] Confirm stats are real numbers, not placeholders — shipper/carrier counts, shipments-by-status breakdown, delivery success rate, revenue paid vs. pending
- [ ] Use the **Broadcast** panel at the bottom — send a test message to "Shippers" — confirm demo.shipper's notification bell receives it

### Users (`/admin/users`)
- [ ] Search by email, filter by role — confirm results update
- [ ] Pick a non-admin test account and click **Suspend** — confirm:
  - Their status badge flips to "Suspended"
  - If they're logged in elsewhere, their *very next action* fails with an auth error (not just future logins) — this is the important part, it's testing that suspension is enforced live, not just at login
  - They can no longer log in (should get a clear "account suspended" message, not a generic "invalid credentials")
- [ ] Click **Reactivate** — confirm they can log in again

### Shipments (`/admin/shipments`)
- [ ] Confirm you can see shipments across **all** shippers/carriers, not just your own
- [ ] Search and filter by status
- [ ] Use **Change** on a shipment's status to manually override it — confirm it updates immediately

### Verifications (`/admin/verifications`)
- [ ] Confirm any carrier with pending documents shows up here with their uploaded files
- [ ] Approve or reject one — confirm the carrier's verification status updates accordingly (visible on their profile / on the Users page)

---

## MOBILE — `mobile/shipper` (Expo Go)

From the project root: `cd mobile/shipper && npx expo start`, scan the QR with Expo Go.

- [ ] Login screen loads and authenticates against the same backend
- [ ] Dashboard shows real shipment data (not empty/mock)
- [ ] Create a shipment from the mobile app — confirm it appears in the web app's shipment list too (same backend, same data)
- [ ] Active/History/Documents screens load real data

## MOBILE — `mobile/carrier` (needs a dev-client build, NOT Expo Go)

From the project root: `cd mobile/carrier && npx expo run:ios` (phone connected via cable, or use an EAS build). Do not report background-location issues if tested only through plain Expo Go — that path is expected to not support it.

- [ ] Login works
- [ ] **Go Online** — confirm it prompts for location permission (foreground, then "Always Allow" for background)
- [ ] Accept a job, confirm **Go Offline is disabled/blocked** with an explanatory message while a shipment is in progress
- [ ] Minimize the app (or lock the screen) while a shipment is active — confirm the shipper's web live map keeps receiving location updates (check the map, or check `docker logs logistics_backend` for `Location update for shipment ...` lines continuing to appear)
- [ ] Complete the shipment (mark Delivered) — confirm Go Offline becomes available again

---

## Report format

For each item: ✅ pass / ❌ fail (with exact repro steps and what you expected vs. what happened) / ⚠️ works but seems off (explain). Group by section. Flag anything not covered by this checklist that you noticed along the way.
