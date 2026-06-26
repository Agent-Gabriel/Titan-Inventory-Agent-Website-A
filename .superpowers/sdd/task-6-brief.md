### Task 6: Readme updates & trust documentation

- [ ] **Step 1: Update Website A README**
  Modify `c:\Users\craig\01_Projects\001_Kaggle\Titan-Inventory-Agent-Website-A\README.md` to append the SPIFFE security implementation:
  ```markdown
  
  ## 🔐 SPIFFE Workload Identity & AP2 Payment Protocol
  This storefront agent validates incoming payments autonomously utilizing JWS cryptographic verification.
  - **Workload Identity SPIFFE ID:** `spiffe://project-titan.com/ns/default/sa/storefront-agent`
  - **Payment Verification Key:** Asymmetric RSA-256 Public Key (`public_key.pem`)
  - **Decoupled Security Anchors:** Published progressively via the Federated ai-catalog endpoint `/.well-known/ai-catalog.json`.
  ```

- [ ] **Step 2: Update Website B README**
  Modify `c:\Users\craig\01_Projects\001_Kaggle\Concierge-Agent-website-B\README.md` to append the SPIFFE security implementation:
  ```markdown
  
  ## 🔐 SPIFFE Workload Identity & AP2 Payment Protocol
  Transactions are secured via asymmetric signature cryptography to prevent invoice tampering.
  - **Workload Identity SPIFFE ID:** `spiffe://project-titan.com/ns/default/sa/concierge-agent`
  - **Transaction Signing Key:** Asymmetric RSA-256 Private Key (`private_key.pem`)
  - **Decoupled Security Anchors:** Exposed via `.well-known/ai-catalog.json` static discovery catalog.
  ```

---

## Verification Plan

### Automated Tests
Run offline signature test script:
`node test-sign.js`

### Manual Verification
1. Start Website A (Storefront Agent):
   Run `npm run dev` in `c:\Users\craig\01_Projects\001_Kaggle\Titan-Inventory-Agent-Website-A`.
2. Start Website B (Concierge Agent):
   Run `npm run dev` in `c:\Users\craig\01_Projects\001_Kaggle\Concierge-Agent-website-B`.
3. In Website A's frontend dashboard:
   - Perform Google Sign-In to establish sheet access token.
   - Click "Create Logistics Spreadsheet" to initialize the spreadsheet.
4. In Website B's dashboard:
   - Open Booking tab, click "START LOGISTICAL NEGOTIATION" to verify the live capabilities check and order negotiation.
   - Click "CONTINUE TO CHECKOUT", hold the fingerprint reader.
   - Confirm JWS is generated server-side, validated by Website A, and checkout updates to "success" with the generated signature.
   - Verify Website B's Rear-Left tire telemetry successfully updates to nominal (35 PSI, 40°C, 0% wear).
   - Check Google Sheets to verify the new logistics log is successfully appended.
