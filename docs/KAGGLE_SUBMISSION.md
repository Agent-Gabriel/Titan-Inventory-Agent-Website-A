# Kaggle Capstone Project Submission: Project Titan Multi-Agent System (MAS)

This document serves as the official submission report for the **Kaggle Vibecoding Agents Capstone Project**. It details the architecture, security hardening, data privacy compliance, and evaluations for the Project Titan Multi-Agent System.

---

## 🔗 Project Resources

* **Website A (Storefront Agent) Repository**: [Agent-Gabriel/Titan-Inventory-Agent-Website-A](https://github.com/Agent-Gabriel/Titan-Inventory-Agent-Website-A)
* **Website B (Concierge Agent) Repository**: [MrBigleg/Concierge-Agent-website-B](https://github.com/MrBigleg/Concierge-Agent-website-B)
* **Live Google Sheets MCP Ingestion Log**: [Google Sheets Integration Log](https://docs.google.com/spreadsheets/d/1d-1HwUCvG0fHTBojd1Ks8PhGSCCY7H-UE18FeiVMHns/edit?usp=sharing)
* **Design Specification**: [2026-06-27-security-and-evals-design.md](https://github.com/Agent-Gabriel/Titan-Inventory-Agent-Website-A/blob/main/docs/superpowers/specs/2026-06-27-security-and-evals-design.md)
* **Implementation Plan**: [2026-06-27-security-and-evals-plan.md](https://github.com/Agent-Gabriel/Titan-Inventory-Agent-Website-A/blob/main/docs/superpowers/plans/2026-06-27-security-and-evals-plan.md)

---

## 🛠️ Implemented Architecture & Flow

Project Titan integrates two autonomous agents to coordinate tire replacement logistics:
1. **Concierge Agent (Website B)**: Ingests real-time telemetry from Michelin SmartWear sensors. When tread wear is critical, it triggers the Agent-to-Agent (A2A) negotiation.
2. **Storefront Agent (Website A)**: Autonomously matches inventory, offers pricing holds, validates payment signatures, and coordinates dispatch coordinates grounded to Thailand.

```
+-------------------+           A2A JSON-RPC            +-------------------+
|  Concierge Agent  | <===============================> |  Storefront Agent |
|    (Website B)    |       Order Negotiation       |    (Website A)    |
+-------------------+                                   +-------------------+
         ||                                                      ||
   AP2 Sign (RSA)                                          AP2 Verify (RSA)
         ||                                                      ||
         \/                                                      \/
+-------------------+                                   +-------------------+
|  Biometric Auth   |                                   |  In-Memory Nonce  |
|   (Fingerprint)   |                                   |     & Time Cache  |
+-------------------+                                   +-------------------+
                                                                 ||
                                                             MCP Log Sync
                                                                 ||
                                                                 \/
                                                        +-------------------+
                                                        |   Google Sheets   |
                                                        |   Logistics Log   |
                                                        +-------------------+
```

---

## 🔐 Security Hardening & AP2 Payments Protection

To prevent payment tampering, eavesdropping, and double-spending:
* **Asymmetric Signature Cryptography (AP2)**: The Concierge Agent signs transaction payloads using an RSA-2048 private key. The Storefront Agent validates the signature with the public key.
* **Alphabetical Canonicalization**: Payload properties are canonicalized by sorting keys alphabetically prior to base64url encoding and hashing, preventing serialization discrepancies.
* **Replay Attack Protection**: Every payment payload contains a unique `transactionId` (UUID v4) and a millisecond `timestamp`. 
* **Sliding Verification Window**: The server enforces that:
  $$\Delta t = | t_{server} - t_{signature} | \le 300,000 \text{ ms (5 minutes)}$$
* **In-Memory Nonce Cache**: Active nonces are cached and automatically pruned after 5 minutes using `setTimeout` callbacks to prevent memory growth.
* **Strict Schema Bounds**: Express API routes reject malformed quantities (such as negative or floating-point numbers) with JSON-RPC error code `-32602`.

---

## 👤 User & Data Privacy

* **OAuth Token Isolation**: Google Sheets OAuth tokens are synchronized to the server memory only and never written to database logs, debug lines, or persistent storage.
* **Location Privacy**: Dispatch estimations process exact decimal coordinates locally and generalize location names (e.g., `Khon Kaen Province` instead of precise GPS decimals) inside public logs.

---

## 📊 Evals and Testing Framework

### 1. Deterministic Verification Output
An automated verification test suite ([test-security.js](https://github.com/MrBigleg/Concierge-Agent-website-B/blob/main/test-security.js)) is executed on Website B to confirm our implementation's correctness.

Run command:
```bash
node test-security.js
```

Expected output:
```
--- STARTING MULTI-AGENT SECURITY VERIFICATION SUITE ---
Test 1: Valid AP2 payment signing & offline verification: PASS
Test 2: Replay attack prevention check (Second attempt rejected): PASS
Test 3: Signature expiration validation (Older than 5m rejected): PASS
Test 4: Strict schema bounds check (Negative quantities blocked): PASS
--- SECURITY VERIFICATION SUITE COMPLETED ---
```

### 2. Conversational & Agent Evals
* **Anomaly Sensitivity Evals**: The Concierge AI agent correctly parses raw JSON telemetry warnings (Rear-Left wear $\ge 82\%$, pressure $\le 22$ PSI) and prompts the user to book a Michelin replacement.
* **Grounding Context Recall**: Verifies that Google Maps grounding parameters correctly reference Thailand locations (`Khon Kaen: 16.4386 N, 102.8287 E`) without default fallbacks.
