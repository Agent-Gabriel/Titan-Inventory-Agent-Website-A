# Project Titan MAS: Security Hardening & Evals Design Specification

This specification outlines the technical design for security hardening, privacy protections, and the evaluation framework for the Project Titan Multi-Agent System (MAS). These changes ensure the system is secure, resilient against payment/logistics replay attacks, compliant with privacy principles, and rigorously evaluated.

---

## 1. Cryptographic Payments Hardening (AP2)

### Threat Model: Payment Replay Attacks
In the original implementation, the payment JWS payload was static:
```json
{
  "item": "Michelin Pilot Sport Cup 2",
  "quantity": 1,
  "maxPrice": 250000,
  "total": 205000
}
```
If an adversary intercepts this signature, they can replay the exact same `paymentNote` string in a subsequent RPC call to `/api/rpc` to buy another tire without authorization.

### Solution: Nonces and Timestamps
We will extend the signature payload to include:
* `transactionId`: A unique UUID v4 generated on Website B (Concierge) for each checkout attempt.
* `timestamp`: The current epoch timestamp in milliseconds (`Date.now()`) when the signature request was initiated.

#### Target Payload Structure:
```json
{
  "item": "Michelin Pilot Sport Cup 2",
  "quantity": 1,
  "maxPrice": 250000,
  "total": 205000,
  "transactionId": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  "timestamp": 1782523200000
}
```

### Verification Flow (Website A - Storefront):
Upon receiving a JSON-RPC request with a `paymentNote` containing the JWS:
1. **Signature Verification**: Verify the JWS using Website B's public key (sorting payload keys alphabetically first).
2. **Time-Window Check**: Assert that the JWS was generated within the last 5 minutes:
   $$\Delta t = | \text{serverTime} - \text{payload.timestamp} | \le 300,000 \text{ ms}$$
   If $\Delta t > 300,000$, reject the transaction as expired/stale.
3. **Double-Spend Check (Nonce Cache)**: Check if `usedTransactionIds` contains `payload.transactionId`. If yes, reject as a replay attack.
4. **Register Transaction**: If valid, add the `transactionId` to the `usedTransactionIds` set and schedule its deletion after 5 minutes using `setTimeout` to prevent memory leaks:
   ```typescript
   usedTransactionIds.add(payload.transactionId);
   setTimeout(() => usedTransactionIds.delete(payload.transactionId), 300000);
   ```

---

## 2. Input Validation and Error Handling

All JSON-RPC input parameters on Website A must be strictly validated.
* **Quantity**: Must be a positive integer ($> 0$).
* **Price Limits**: Verify that numeric fields are not negative or NaN.
* **Error Sanitization**: Ensure that if an exception occurs in the database sync or JWS verification, the backend does not dump system stack traces or sensitive internal paths to the client. Returns clean JSON-RPC errors instead.

---

## 3. Data & User Privacy

### Google Sheets OAuth Token Security
* **Storage**: In-memory only on Website A (`sheetsConfig`). Never write raw OAuth tokens to database files, debug logs, or console traces.
* **Scoping**: Limit the requested OAuth scopes strictly to Sheets (`/auth/spreadsheets`).
* **Production Recommendation**: Document how a production system uses Workload Identity Federation (SPIFFE mapped to GCP IAM Service Accounts) to avoid passing OAuth tokens directly between nodes.

### Telemetry & Geolocation Privacy
* **Coordinates**: Location GPS coordinates (`16.4386 N, 102.8287 E` for Khon Kaen) are used solely for routing estimates.
* **Logging Privacy**: Sanitization middleware will mask precise coordinate details or truncate them to regional levels (`Khon Kaen Province`) in persistent log streams.

---

## 4. Evaluation (Evals) Framework

To demonstrate system completeness and accuracy for the Kaggle Capstone Project, we define a two-tier evaluation framework:

### Deterministic System Evals
| Metric | Target | Evaluation Method |
| --- | --- | --- |
| **AP2 Signature Verification Rate** | 100% | Valid signatures must verify successfully using public key cryptography. |
| **Replay Rejection Rate** | 100% | Replayed signatures (re-sent after use) must be rejected with code `-32602` or rejected status. |
| **Out-of-Window Rejection Rate** | 100% | Signatures older than 5 minutes must be rejected as expired. |
| **Input Schema Rejection Rate** | 100% | Requests with negative quantities or invalid types must be blocked. |
| **Logistics Sync Reliability** | 100% | Inventory changes must trigger an append action to the active Google Sheet. |

### Agent/LLM-Based Evals (Vibe Evals)
* **Anomaly Identification Accuracy**: Verifying if the Concierge AI agent correctly parses tire telemetry ( wear $\ge 80\%$, PSI $\le 22$) and guides the user to the Michelin Cup 2 R replacement option.
* **Grounding Context Recall**: Confirming that the agent uses Google Maps grounding to return coordinates in Thailand instead of reverting to default mock US coordinates.
* **Context Preservation**: Ensuring the agent maintains SVJ telemetry state throughout the conversation.

---

## 5. Testing & Verification Plan

We will create an automated verification script `test-security.js` that simulates:
1. **Valid Signature Case**: Generating a valid signed payload, verifying it succeeds on Website A.
2. **Replay Attack Case**: Sending the same signature twice; the second attempt must fail.
3. **Expired Signature Case**: Generating a signature with a timestamp older than 5 minutes; the server must reject it.
4. **Invalid Schema Case**: Sending negative quantities or missing fields; the server must reject.
