### Task 2: Implement Replay Protection and Input Validation on Website A

**Files:**
- Modify: `c:\Users\craig\01_Projects\001_Kaggle\Titan-Inventory-Agent-Website-A\server.ts:199-340`

**Interfaces:**
- Consumes: JSON-RPC `/api/rpc` POST request.
- Produces: Signed payment verification, replay checks, and strict parameter bounds validation.

- [ ] **Step 1: Declare nonce cache and validation check in server.ts**
  Modify `c:\Users\craig\01_Projects\001_Kaggle\Titan-Inventory-Agent-Website-A\server.ts` to add the `usedTransactionIds` Set, and integrate time-window and nonce validations in `/api/rpc`.
  Add after line 190 (`let cachedPublicKey: string | null = null;`):
  ```typescript
  const usedTransactionIds = new Set<string>();
  ```
  Replace lines 216-224 (the validation checks before matchedItem lookup):
  ```typescript
        if (!params || params.item === undefined || params.quantity === undefined) {
          const errorResponse = {
            jsonrpc: '2.0',
            error: { code: -32602, message: 'Invalid params: item and quantity are required' },
            id
          };
          addLog('A2A_OUT', 'Sent RPC Parameter Validation Error', errorResponse);
          return res.status(400).json(errorResponse);
        }

        const { item, quantity, maxPrice, paymentNote, transactionId, timestamp } = params;

        // Enforce strict parameter validation
        if (typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
          const errorResponse = {
            jsonrpc: '2.0',
            error: { code: -32602, message: 'Invalid params: quantity must be a positive integer' },
            id
          };
          addLog('A2A_OUT', 'Sent RPC Validation Error (Invalid Quantity)', errorResponse);
          return res.status(400).json(errorResponse);
        }
  ```

- [ ] **Step 2: Add JWS payload verification, timestamp constraint, and replay validation**
  Modify the JWS validation block in `/api/rpc` of `c:\Users\craig\01_Projects\001_Kaggle\Titan-Inventory-Agent-Website-A\server.ts` to enforce the 5-minute window and check/add nonces.
  Replace lines 274-303 (the verification block):
  ```typescript
          if (publicKey && paymentNote) {
            const parts = paymentNote.split('.');
            if (parts.length === 3 && parts[1] === '') {
              const [encodedHeader, _, signature] = parts;
              
              if (!transactionId || !timestamp) {
                addLog('AP2_AUTH', 'AP2 Protocol: Missing transactionId or timestamp in transaction parameters');
                const response = { jsonrpc: '2.0', result: { status: 'rejected', reason: 'Missing transactionId or timestamp' }, id };
                return res.json(response);
              }

              // Check for expired timestamp (5 minutes window)
              const timeDiff = Math.abs(Date.now() - timestamp);
              if (timeDiff > 300000) {
                addLog('AP2_AUTH', `AP2 Protocol: Transaction expired. Age: ${timeDiff}ms`);
                const response = { jsonrpc: '2.0', result: { status: 'rejected', reason: 'Transaction signature has expired' }, id };
                return res.json(response);
              }

              // Check for replay attack
              if (usedTransactionIds.has(transactionId)) {
                addLog('AP2_AUTH', `AP2 Protocol: Replay attack detected for transactionId: ${transactionId}`);
                const response = { jsonrpc: '2.0', result: { status: 'rejected', reason: 'Replay attack detected: transaction already processed' }, id };
                return res.json(response);
              }

              const expectedPayload = {
                item: params.item,
                quantity: params.quantity,
                maxPrice: params.maxPrice,
                total: matchedItem.price * params.quantity + 25000,
                transactionId: params.transactionId,
                timestamp: params.timestamp
              };
              
              const sortedPayload: any = {};
              Object.keys(expectedPayload).sort().forEach(key => {
                sortedPayload[key] = (expectedPayload as any)[key];
              });
              const encodedPayload = Buffer.from(JSON.stringify(sortedPayload)).toString('base64url');
              
              const verify = crypto.createVerify('RSA-SHA256');
              verify.update(`${encodedHeader}.${encodedPayload}`);
              signatureVerified = verify.verify(publicKey, signature, 'base64url');

              if (signatureVerified) {
                // Register transactionId to prevent replay attacks
                usedTransactionIds.add(transactionId);
                setTimeout(() => {
                  usedTransactionIds.delete(transactionId);
                  addLog('INFO', `Pruned transactionId from memory cache: ${transactionId}`);
                }, 300000);
              }
            }
          }
        } catch (e: any) {
          console.error("JWS Verification failed:", e);
        }

        if (!signatureVerified) {
          const response = { jsonrpc: '2.0', result: { status: 'rejected', reason: 'Invalid JWS AP2 cryptographic signature' }, id };
          addLog('A2A_OUT', 'Sent RPC Response (Rejected: Cryptographic Verification Failed)', response);
          return res.json(response);
        }
  ```

- [ ] **Step 3: Verify TypeScript builds successfully on Website A**
  Run: `npm run lint` in `c:\Users\craig\01_Projects\001_Kaggle\Titan-Inventory-Agent-Website-A`
  Expected: PASS

- [ ] **Step 4: Commit Website A changes**
  ```bash
  git add server.ts
  git commit -m "feat: implement payment replay protection and strict input parameter validation on server"
  ```

---

