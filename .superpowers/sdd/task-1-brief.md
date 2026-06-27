### Task 1: Harden Website B Signature and Checkout Flow

**Files:**
- Modify: `c:\Users\craig\01_Projects\001_Kaggle\Concierge-Agent-website-B\app\api\ap2-sign\route.ts:31-40`
- Modify: `c:\Users\craig\01_Projects\001_Kaggle\Concierge-Agent-website-B\app\page.tsx:174-241`

**Interfaces:**
- Consumes: `/api/ap2-sign` POST endpoint.
- Produces: Signed payload JWS including `transactionId` and `timestamp`.

- [ ] **Step 1: Update validation schema in sign route**
  Modify `c:\Users\craig\01_Projects\001_Kaggle\Concierge-Agent-website-B\app\api\ap2-sign\route.ts` to require `transactionId` and `timestamp` in the signature payload validation checks.
  Replace lines 31-39:
  ```typescript
  const requiredFields = ["item", "quantity", "total", "maxPrice", "transactionId", "timestamp"];
  const missingFields = requiredFields.filter(field => payload[field] === undefined);
  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missingFields.join(", ")}` },
      { status: 400 }
    );
  }
  ```

- [ ] **Step 2: Generate dynamic transactionId and timestamp in checkout page**
  Modify `c:\Users\craig\01_Projects\001_Kaggle\Concierge-Agent-website-B\app\page.tsx` to generate unique transaction IDs and current epoch timestamps during checkout, and pass them as RPC parameters.
  Replace lines 174-213:
  ```typescript
  const triggerAP2Payment = async () => {
    setCheckoutStatus("authorizing");
    
    try {
      const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_AGENT_URL || "http://localhost:3000";
      
      const transactionId = typeof window !== 'undefined' && window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const timestamp = Date.now();
      
      const payload = {
        item: "Michelin Pilot Sport Cup 2",
        quantity: 1,
        maxPrice: 250000,
        total: 205000,
        transactionId,
        timestamp
      };
      
      const signRes = await fetch("/api/ap2-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!signRes.ok) {
        throw new Error("Failed to sign transaction payload");
      }
      
      const { jws } = await signRes.json();
      
      const rpcRes = await fetch(`${storefrontUrl}/api/rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "negotiate_order",
          params: {
            item: "Michelin Pilot Sport Cup 2",
            quantity: 1,
            maxPrice: 250000,
            paymentNote: jws,
            transactionId,
            timestamp
          },
          id: Date.now()
        })
      });
  ```

- [ ] **Step 3: Run ESLint to verify no syntactic issues in Website B**
  Run: `npm run lint` in `c:\Users\craig\01_Projects\001_Kaggle\Concierge-Agent-website-B`
  Expected: PASS

- [ ] **Step 4: Commit Website B changes**
  ```bash
  git add app/api/ap2-sign/route.ts app/page.tsx
  git commit -m "feat: add transactionId and timestamp parameters to payment signing and checkout"
  ```

---

