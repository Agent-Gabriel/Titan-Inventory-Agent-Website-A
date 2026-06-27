### Task 4: Comprehensive Hardening & Evals Documentation

**Files:**
- Modify: `c:\Users\craig\01_Projects\001_Kaggle\Titan-Inventory-Agent-Website-A\README.md`
- Modify: `c:\Users\craig\01_Projects\001_Kaggle\Concierge-Agent-website-B\README.md`

**Interfaces:**
- Consumes: Markdown documentation layouts.
- Produces: Beautiful, informative, and sustainable project specifications in the README.

- [ ] **Step 1: Document hardening & evals in Website A README**
  Modify `c:\Users\craig\01_Projects\001_Kaggle\Titan-Inventory-Agent-Website-A\README.md` to document architectural changes, privacy controls, and evaluation outcomes.
  Replace lines 733-743 with:
  ```markdown
  
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
  ```

- [ ] **Step 2: Document hardening & evals in Website B README**
  Modify `c:\Users\craig\01_Projects\001_Kaggle\Concierge-Agent-website-B\README.md` to document the matching client-side hardening and evaluation frameworks.
  Replace lines 744-754 with:
  ```markdown
  
  ## 🔐 Security Hardening & AP2 Payments Protection
  - **Asymmetric Transaction Signing**: Generates JWS detached signatures (`header..signature`) using RSA-2048 keys. Payload parameters are canonicalized by sorting keys alphabetically before hashing.
  - **Transaction Identification**: Inject unique `transactionId` (UUID) and `timestamp` values to prevent signature eavesdropping and replay attacks.
  - **Validation Suite**: Evaluated via `test-security.js` verifying proper signing structures and prevention of double-spending or replay attacks.
  
  ## 👤 Data & User Privacy Architecture
  - **Telemetry Privacy**: Car sensor telemetry remains local to the dashboard client, only package dimensions and order metrics are transmitted during A2A negotiation.
  - **Credential Safety**: SPIFFE workload identities (`spiffe://project-titan.com/...`) are mapped to static catalog manifests to ensure zero credential disclosure during federated discovery.
  
  ## 📊 Evals and Testing Framework (Kaggle Capstone)
  This project is evaluated against:
  1. **Deterministic Evals**: Validating payment signature validity and rejection of replayed/expired notes.
  2. **Agent / LLM Evals**: Measuring the Concierge's accuracy in recommending Michelin replacements based on real telemetry anomalies.
  ```

- [ ] **Step 3: Commit documentation updates**
  ```bash
  git add c:\Users\craig\01_Projects\001_Kaggle\Titan-Inventory-Agent-Website-A\README.md c:\Users\craig\01_Projects\001_Kaggle\Concierge-Agent-website-B\README.md
  git commit -m "docs: enrich project READMEs with security hardening, privacy practices, and evals frameworks"
  ```
