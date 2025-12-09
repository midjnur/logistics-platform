# Project Requirements & Idea

**Role:** Senior Full-Stack Architect & Expert in Digital Logistics Platforms.

## Core Concept
A modern AI-powered logistics WebApp connecting Shippers and Carriers.

### User Roles

1.  **SHIPPERS**
    *   Customers who HAVE cargo.
    *   Create shipments, receive offers, track delivery, pay.
2.  **CARRIERS**
    *   Drivers/Companies who HAVE vehicles.
    *   Register vehicles, accept shipments, upload docs, update status, get paid.

---

## Core Requirements

### 1. User Roles & Registration
*   **Shippers:** Register with company/individual info, phone, email, address.
*   **Carriers:** Register with full documentation:
    *   First Name, Last Name
    *   Phone, Email
    *   Bank Name, Bank Code, Bank Account, Currency
    *   Address, Languages
    *   Passport Number + Date of Issue
    *   Driver License, ID Card
    *   Insurance Policy
    *   POA (Power of Attorney)
    *   CMR Blank
    *   Other logistics docs
*   **Unified Vehicle System:** Carriers can add multiple vehicles.

### 2. Multi-Language Support
*   English, German, Georgian, Russian.
*   AI-generated i18n structure.

---

## Unified Vehicle System

### 3. Vehicle Management
*   **One universal model** (replacing separate Truck/Trailer IDs).
*   **Fields:**
    *   Vehicle Type (van, truck, trailer, sprinter, refrigerated, platform, tanker, container carrier, etc.)
    *   Registration Number
    *   Capacity (kg/tons)
    *   Volume (m³)
    *   Dimensions (L x W x H)
    *   Refrigerated (Yes/No)
    *   ADR / Special permissions
    *   Load capabilities (curtain, liftgate, hard box, platform, container locks)
    *   Documents (insurance, registration, inspection)

---

## Features

### 4. Shipper Module
*   **Create Shipment:** Pickup/Delivery loc, Cargo type, Weight, Vol/Dims, Vehicle type, Times, Special reqs, Photos/Docs.
*   **AI Cost Estimation.**
*   **AI Matching:** Receive matched carriers.
*   **Actions:** Choose offer, Confirm job, Real-time tracking, Payments, History, Review carriers.

### 5. Carrier Module
*   **Jobs:** Available list, AI-suggested jobs (location, history, vehicle).
*   **Actions:** Accept/Decline.
*   **Status Updates:** "Loaded", "On the Way", "Delivered".
*   **Docs:** Upload CMR, POD, Invoice.
*   **Management:** Vehicles, Earnings/Payouts, Profile/Docs.

---

## AI / Advanced Features

### 6. AI Matching Engine
*   Match based on: Route proximity, Vehicle compatibility, Capacity, Performance history, Availability, Price optimization, Empty run reduction.
*   **Backhaul suggestions.**

### 7. Route Optimization Engine
*   Best route calculation.
*   Fuel/Toll cost estimation.
*   ETA prediction.
*   Real-time delay alerts.
*   Risk detection (traffic, weather, border).

### 8. Logistics Analytics
*   Demand forecasting.
*   Recommended pricing.
*   Carrier performance analysis.
*   Regional load density.
*   Empty-run prediction.

---

## Architecture Requirements

### 9. Tech Stack
*   **Frontend:** Next.js (React), TypeScript, TailwindCSS, i18n (EN/DE/GE/RU).
*   **Backend:** Node.js (Express/Nest), Microservices (separate AI services).
*   **Database:** PostgreSQL (Relational), S3-compatible storage.
*   **Real-time:** WebSockets / Socket.io / Supabase.
*   **Deployment:** Vercel (Frontend), Docker (Backend), Cloud hosting.

### 10. Database Schema
*   Tables: Users, Carriers, Vehicles, Shipments, Documents, Payments, Matches, Notifications, Translations.
*   Output: Field definitions, Relationships, ERD.

### 11. API Specification
*   Auth, Shipper actions, Carrier actions, Vehicle mgmt, Shipment lifecycle, AI matching, Docs, Payments, i18n, Notifications.

---

## UX / UI Structure

### 12. Shipper Screens
*   Dashboard, Create Shipment, Details, AI Pricing, Tracking, Payment, History, Profile.

### 13. Carrier Screens
*   Dashboard, Available Jobs, Job Details, Vehicle Mgmt, Doc Upload, Earnings, Profile.

### 14. Shared Screens
*   Login, Register, Language Selector, Notifications, Help, Terms.

---

## Expected Output
1.  High-level architecture diagram.
2.  Data flow diagram.
3.  Full database schema.
4.  Full API documentation.
5.  UI wireframe descriptions.
6.  Logic flow (AI Matching, Route Opt, Price Est).
7.  Multi-language folder structure.
8.  Optional pseudocode.
