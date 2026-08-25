# DIS·TRICT

> **Razorpay Buildathon 2025 — Track 01: AI Growth & Agentic Commerce**

An AI-powered streetwear commerce platform where every agent action is **bounded, gated, and auditable** — built to grow merchant revenue and make merchants transactable by AI buyers, end to end, on Razorpay test-mode APIs.

![React](https://img.shields.io/badge/React_19-20232A?style=flat&logo=react&logoColor=61DAFB)
![Express](https://img.shields.io/badge/Express_5-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=flat&logo=razorpay&logoColor=3395FF)
![Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=flat&logo=google&logoColor=white)

---

## What is District?

District is a full-stack e-commerce platform for streetwear and fashion that demonstrates how AI agents can autonomously grow merchant revenue on Razorpay's test-mode APIs — while keeping every money action bounded, explainable, and safe.

Customers get a conversational shopping assistant, AI-powered upsells, a loyalty rewards system (Green Credits), and same-day delivery from local return hubs. Merchants get a real-time dashboard with AI campaign orchestration, autonomous purchasing agents, and a full audit trail of every agent decision.

---

## Five AI Agents

| Agent | Description | Safety Gate |
|---|---|---|
| 🤖 **AI Shopping Assistant** | Conversational in-app checkout. Natural language cart management, voice input, recipe-based grocery ordering, and Razorpay payment — all in one chat panel. | Auth-gated payment |
| ⚡ **AI Upsell Agent** | Powered by Gemini 3.6 Flash. Suggests 2 complementary products with style reasoning after every add-to-cart. Accepted upsells award 20 Green Credits. | Auth required |
| 📊 **Campaign Orchestrator** | Merchant describes a goal in plain English. Agent generates a campaign plan, shows a preview of affected products and margin impact, then applies discounts on activation. | Merchant-gated, preview before activate |
| 🛒 **AI Buyer Agent** | Autonomously discovers products, creates a Razorpay order, and simulates a cryptographically-verified payment. Demonstrates full agent-to-merchant commerce. | Configurable spending limit, HMAC-verified |
| ↩ **Return Processor + ML Scanner** | Camera-based product condition scan with a 4-phase AI animation (camera → preview → scanning → result). An on-device logistic regression model grades item condition (A/B/C) and scores return risk. Orders under ₹3,000 are auto-approved instantly; higher-value returns are ML-graded and queue for merchant review. Auto-approved items are assigned to the nearest District Hub. | ML risk score · threshold-gated · hub assignment |

---

## ML Return Scanner

The return flow uses a trained machine learning model — no cloud API, no Python runtime in production — for real-time fraud and abuse detection.

### How it works

**1. Camera capture (client)**
`ReturnScanModal.jsx` opens the device camera, captures a still, then runs a 10-step animated AI scan sequence simulating computer vision analysis.

**2. Condition grading (client)**
The item is graded A / B / C based on computed risk signals. Grade A = near-mint (approve), Grade C = significant wear (flag).

**3. Risk scoring (server)**
`server/ml/scorer.js` loads the pre-trained model from `model.json` and scores each return request in milliseconds using pure JavaScript — no external dependencies.

**4. Routing decision**
- Risk score < threshold → **auto-approve** → 2-minute refund countdown + nearest District Hub assigned
- Risk score ≥ threshold → **merchant review queue** (always for orders ≥ ₹3,000, or when the ML model flags high risk)

### The model

| Detail | Value |
|---|---|
| Algorithm | Logistic Regression (scikit-learn, exported to JSON) |
| Training data | 3,000 synthetic samples (`generate_and_train.py`) |
| Features | 7 — see table below |
| Training / test split | 80 / 20, stratified |
| Inference runtime | Pure JS (`scorer.js`) — no Python needed in production |
| Decision threshold | P(flag) ≥ 0.50 → manual review |

**Feature set:**

| Feature | Description |
|---|---|
| `order_total` | Order value in INR |
| `return_rate` | User's historical return rate (returns ÷ total orders) |
| `prev_returns` | Count of prior returns by this user |
| `total_orders` | Total lifetime orders |
| `days_since_order` | Days elapsed since order placed (0–7) |
| `num_items` | Items in the order |
| `is_first_order` | 1 if this is the user's very first order |

**Risk signals (human-readable factors returned with every score):**
- Return rate > 40% → high risk
- Order value > ₹12,000 → premium order flag
- 3+ prior returns → serial returner
- First-time buyer with order > ₹5,000 → elevated scrutiny
- Return requested on day 6–7 of the 7-day window → last-minute flag
- Cart of 6+ items → large basket flag

### Files

| File | Purpose |
|---|---|
| `server/ml/generate_and_train.py` | Generates 3,000 synthetic training samples, trains the logistic regression, evaluates on a held-out test set, exports weights to `model.json` |
| `server/ml/model.json` | Frozen model: StandardScaler means/scales, logistic regression coefficients, intercept, threshold, and test-set metrics |
| `server/ml/scorer.js` | Production scorer — loads `model.json`, applies StandardScaler normalization, runs logistic regression + sigmoid, returns `{ riskScore, decision, factors }` |
| `district/src/components/ReturnScanModal.jsx` | 4-phase return UI: camera capture → preview → animated scan → condition grade + routing result |

### Re-training

```bash
cd server/ml
pip install scikit-learn numpy
python generate_and_train.py
# outputs updated model.json — commit and redeploy
```

---

### Green Credits Engine

- **Earn:** 5 GC per ₹100 spent · 50 GC first-purchase bonus · 20 GC per AI upsell accepted
- **Redeem:** Unlock coupons (SAVE5 → PREMIUM15) by spending GC
- **Bound:** Max redemption capped at 20% of order value — enforced server-side

---

## Safety Model

The buildathon requirement: every agent action must be **explainable, bounded, and handle failure gracefully.**

| Guarantee | Implementation |
|---|---|
| 🔒 Spending limits | AI Buyer blocked if `totalAmount > spendingLimit` — checked before Razorpay order is created |
| 🔐 Payment integrity | HMAC-SHA256 signature verified server-side before any order is created |
| 📋 Full audit trail | Every order, payment, return, campaign, credit tx, and AI purchase writes to `AuditEvent` |
| 🚫 Fraud detection | Coupon reuse attempts logged as `FRAUD_ATTEMPT` before rejection |
| ⚖️ Credit cap | Over-redemption requests logged as `BOUND_ENFORCED` before being capped |
| ↩ Return threshold | Only orders < ₹3,000 auto-approved; larger returns require explicit merchant approval |

---

## Tech Stack

**Frontend**
- React 19 SPA with Vite 8
- CSS custom properties (light + dark theme, matches user OS)
- Web Speech API for voice input in the AI assistant

**Backend**
- Express 5 REST API
- MongoDB + Mongoose (Atlas)
- JWT authentication — 7-day customer tokens, 12-hour merchant tokens
- bcryptjs password hashing

**AI & Payments**
- Razorpay test-mode — full checkout modal, HMAC-SHA256 verification, webhooks
- Google Gemini 3.6 Flash — upsell suggestions

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/district.git
cd district

# backend
cd server && npm install

# frontend
cd ../district && npm install
```

### 2. Configure environment

Create `server/.env`:

```env
PORT=5001
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_test_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
GEMINI_API_KEY=your_google_ai_studio_key
```

### 3. Start development servers

```bash
# terminal 1 — backend (port 5001)
cd server && node index.js

# terminal 2 — frontend (port 5173)
cd district && npm run dev
```

Vite proxies `/api/*` to `http://localhost:5001` — no CORS configuration needed locally.

### 4. Seed the database (optional)

```bash
cd server
node seed.js      # seeds the product catalog
node seedHubs.js  # seeds 5 District Hubs across cities
```

> **Coupons are auto-seeded.** The 5 default coupons (SAVE5, FLAT150, SAVE10, FLAT300, PREMIUM15) are inserted automatically on first server start if the collection is empty.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | optional | Server port. Defaults to 5000. |
| `MONGO_URI` | **required** | MongoDB Atlas connection string. |
| `JWT_SECRET` | **required** | Secret for signing JWTs. Use a long random string. |
| `RAZORPAY_KEY_ID` | **required** | Test-mode key ID starting with `rzp_test_`. |
| `RAZORPAY_KEY_SECRET` | **required** | Test-mode secret. Used for HMAC-SHA256 verification. |
| `RAZORPAY_WEBHOOK_SECRET` | optional | Required only if you configure Razorpay webhooks. |
| `GEMINI_API_KEY` | **required** | Google AI Studio key. Powers the upsell agent. |

---

## Project Structure

```
district/                        # Monorepo root
├── district/                    # React frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── AIAssistant.jsx      # Conversational agent UI + Razorpay
│       │   ├── CartPanel.jsx        # Cart, checkout, coupon input
│       │   ├── AccountPanel.jsx     # Orders, returns, return scanner
│       │   ├── ReturnScanModal.jsx  # ML return scanner — camera → scan → grade → result
│       │   ├── MerchantDashboard.jsx  # Full merchant portal (9 tabs)
│       │   ├── HubStrip.jsx         # Instant delivery from local hubs
│       │   ├── ZomatoPage.jsx       # Food & grocery demo page
│       │   ├── PVRInoxPage.jsx      # Movie booking demo page
│       │   └── BluestonePage.jsx    # Jewellery store demo page
│       ├── context/
│       │   ├── AppContext.jsx       # Cart, toast, popup state
│       │   └── AuthContext.jsx      # JWT auth, session restore
│       └── utils/
│           └── aiAgent.js          # NLP intent parser + product resolver
│
└── server/                      # Express 5 API
    ├── ml/
    │   ├── generate_and_train.py # Synthetic data generation + logistic regression training
    │   ├── model.json            # Frozen model weights (scaler, coef, intercept, metrics)
    │   └── scorer.js             # Pure-JS inference — no Python needed at runtime
    ├── models/
    │   ├── User.js               # bcrypt passwords, GC balance, coupons
    │   ├── Order.js              # Orders, returns, agent purchases
    │   ├── Product.js            # Merchant catalog
    │   ├── Campaign.js           # AI campaign plans
    │   ├── CreditLedger.js       # GC earn/burn history
    │   ├── Coupon.js             # Coupon definitions
    │   ├── LocalHub.js           # Hub locations
    │   ├── HubInventory.js       # Items at hubs for instant delivery
    │   ├── UpsellAcceptance.js   # AI upsell tracking
    │   └── AuditEvent.js         # Security & bound enforcement log
    └── routes/
        ├── agent.js              # AI catalog, upsell, campaigns, buyer, audit
        ├── payment.js            # Razorpay create-order + HMAC verify
        ├── auth.js               # Register, login, /me
        ├── orders.js             # CRUD + return requests
        ├── merchant.js           # Merchant-gated routes
        ├── credits.js            # GC balance, history, preview
        ├── coupons.js            # Unlock, apply, consume
        ├── hubs.js               # Hub inventory + sell endpoint
        └── webhook.js            # Razorpay webhook handler
```

---

## API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Create customer account |
| `POST` | `/login` | Get JWT token |
| `GET` | `/me` | Restore session · Auth required |

### Payments — `/api/payment` · Auth required

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/create-order` | Create Razorpay order, apply GC discount |
| `POST` | `/verify` | HMAC-SHA256 verify + create order + award GC |
| `POST` | `/log-failure` | Record payment failure for audit trail |
| `POST` | `/webhook` | Razorpay webhook (raw body, HMAC-verified) |

### AI Agent — `/api/agent`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/catalog` | Public | Agent-readable product catalog |
| `POST` | `/upsell` | Customer | Gemini upsell suggestions |
| `POST` | `/upsell/accept` | Customer | Record acceptance + award 20 GC |
| `POST` | `/campaign` | Merchant | Generate campaign plan from goal |
| `GET` | `/campaigns/:id/preview` | Merchant | Preview impact before activation |
| `PATCH` | `/campaigns/:id/activate` | Merchant | Apply discounts to products |
| `PATCH` | `/campaigns/:id/deactivate` | Merchant | Restore original prices |
| `POST` | `/buy` | Merchant | Autonomous AI purchase (bounded) |
| `GET` | `/audit` | Merchant | Full chronological audit trail |

### Green Credits — `/api/credits` · Auth required

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/balance` | Current GC balance |
| `GET` | `/history` | Last 50 earn/burn transactions |
| `POST` | `/preview` | Max GC applicable to a given order amount |

### Coupons — `/api/coupons`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Customer | Active coupons with unlock status |
| `POST` | `/unlock` | Customer | Spend GC to unlock a coupon |
| `POST` | `/apply` | Customer | Validate coupon at checkout |
| `GET` | `/merchant` | Merchant | All coupons with usage stats |
| `POST` | `/merchant` | Merchant | Create new coupon |
| `PATCH` | `/merchant/:code` | Merchant | Update coupon |
| `DELETE` | `/merchant/:code` | Merchant | Delete coupon |

---

## Demo Credentials

### Merchant Portal

```
Email:    merchant@district.in
Password: District@2025
```

Click **Sign In → Merchant** in the auth modal.

### Customer Account

Register with any email and a password of 6+ characters.

### Razorpay Test Card

```
Card number:  4111 1111 1111 1111
Expiry:       Any future date (e.g. 12/26)
CVV:          Any 3 digits
```

> All payments run in **Razorpay test mode** — no real money is ever charged.

---

## Deploying to Render

A `render.yaml` is included at the project root. The build compiles the frontend and Express serves it in production.

```yaml
buildCommand: >
  npm install --include=dev --prefix district &&
  npm run build --prefix district &&
  npm install --prefix server

startCommand: node server/index.js
```

Set all environment variables in your Render dashboard under **Environment → Environment Variables**. `NODE_ENV=production` is pre-set in `render.yaml`.

---

## Payment & Agent Flow

**Customer checkout:**
```
Cart → POST /api/payment/create-order → Razorpay Modal
     → POST /api/payment/verify (HMAC-SHA256)
     → Order created → GC awarded → Coupon consumed → Audit written
```

**AI Buyer agent:**
```
POST /api/agent/buy → Product discovery → Spend limit check
                    → Razorpay order created → Simulated HMAC payment
                    → District order created → 7-step audit trail saved
```

---

Built for **Razorpay Buildathon 2025** · Track 01: AI Growth & Agentic Commerce
