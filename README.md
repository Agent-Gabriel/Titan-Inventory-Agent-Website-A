# UHP Tire Storefront Agent (Website A)

This repository contains the UHP Tire Storefront Agent, a mock e-commerce storefront designed to manage specialized Ultra-High-Performance (UHP) tire inventory and autonomously process orders from client agents.

## Core Features

* **Agent-to-Agent (A2A) Server:** Exposes agent capabilities over the network via a standardized "Agent Card" (JSON metadata).
* **Order Negotiation (A2A):** Processes incoming structured JSON-RPC requests, handling stock verification, price matching, and dynamic counter-offers (Input-Required states).
* **Secure Payment (AP2):** Integrates the Agent Payments Protocol (AP2) to verify digital promissory notes from concierge agents, ensuring transactions are authorized.
* **Inventory Management (MCP):** Connects to a mock private Model Context Protocol (MCP) server for real-time stock verification.
* **Calendar Scheduling (A2UI):** Integrates Google Calendar via Firebase Auth to securely schedule mobile fitting appointments inside a secure iframe wrapper.
* **Logistics Estimate (A2UI):** Uses Gemini Maps Grounding via the Gemini API to provide real-time distance, traffic, and delivery estimates within a sandboxed UI component.
* **Editorial Dashboard:** A real-time monitoring interface styled with an elegant, high-contrast editorial aesthetic to observe agent transactions.

## Architecture

* **Frontend:** React, Tailwind CSS (Editorial Theme), Framer Motion
* **Backend:** Express.js (Node.js) handling JSON-RPC negotiation and state management
* **Build Tool:** Vite + ESBuild

## Development

The application is built to run in a containerized environment with a unified Vite + Express server.

To start the development server:

```bash
npm run dev
```

To build for production:

## GitHub Deployment

Since this application utilizes a custom Node.js backend (Express) to handle A2A communications and A2UI mockups, it must be deployed to a Node.js-compatible hosting provider (e.g., Google Cloud Run, Render, Railway, or Heroku) rather than static hosting.

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Configure Environment Secrets
When deploying, ensure your host has the correct configuration:
* **GEMINI_API_KEY:** Required for the A2UI logistics estimate feature (Maps Grounding). Set this in your hosting provider's environment variables.
* If your `firebase-applet-config.json` contains sensitive service account data, do not commit it. Instead, inject it via environment variables in your hosting provider's dashboard.
* If using standard public Firebase configurations, ensure the domain of your hosted application is added to the **Authorized Domains** in your Firebase Authentication settings.

### 3. Build & Start Commands
Configure your hosting provider with the following commands:
* **Build Command:** `npm install && npm run build`
* **Start Command:** `npm run start` (Executes the compiled `dist/server.cjs`)

## 🔐 Security Hardening & AP2 Payments Protection
To achieve bank-grade machine-to-machine payment verification, the storefront agent utilizes:
- **Asymmetric Signature Cryptography (AP2)**: Order details are signed by the Concierge Agent using its RSA-2048 private key (`private_key.pem`) and verified by the Storefront Agent via `public_key.pem`.
- **Replay Attack Protection**: Every payment note includes a UUID `transactionId` and a millisecond `timestamp`. The server caches used transaction IDs and enforces a strict 5-minute validity window ($|t_{server} - t_{signature}| \le 300,000\text{ ms}$). Replayed or stale signatures are blocked.
- **Input Sanitization & Schema Bounds**: Schema validation blocks negative tire quantities or invalid parameter types, returning structured JSON-RPC error codes.

## 👤 Data & User Privacy Architecture
- **OAuth Token Separation**: Google Sheets API authorization tokens are cached in-memory only. They are never written to database files, persistent logs, or terminal streams.
- **Geographic Generalization**: Location GPS coordinates are processed local-only for travel estimates, ensuring user routing details are never leaked.

## 📊 Evals and Testing Framework (Kaggle Capstone)
This project implements a complete evaluations framework:
1. **Deterministic Evals**: Measured via an automated test suite (`test-security.js`) verifying signature validity, replay rejection, expired signature blocking, and parameter safety bounds.
2. **Agent / LLM Evals**: grading the Concierge's anomaly sensitivity (identifying high tire temps or low pressure from raw telemetry) and Maps Grounding context accuracy.
