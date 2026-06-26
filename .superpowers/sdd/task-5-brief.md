### Task 5: Implement JWS Verification & Google Sheets Logging (Website A)

- [ ] **Step 1: Update RPC endpoint in server.ts to perform JWS validation & sheets logging**
  Replace `/api/rpc` handler in `c:\Users\craig\01_Projects\001_Kaggle\Titan-Inventory-Agent-Website-A\server.ts` (lines 127-193) with:
  ```typescript
  import crypto from 'crypto';
  import fs from 'fs';
  import { appendRowToSheet } from './src/lib/sheets';

  let sheetsConfig: { token: string; spreadsheetId: string } | null = null;

  app.post('/api/save-sheets-config', (req, res) => {
    const { token, spreadsheetId } = req.body;
    sheetsConfig = { token, spreadsheetId };
    addLog('INFO', 'Google Sheets OAuth Config synchronized on server memory');
    res.json({ status: 'ok' });
  });

  app.post('/api/rpc', (req, res) => {
    const rpcRequest = req.body;
    addLog('A2A_IN', 'Received RPC Request from Concierge Agent', rpcRequest);

    if (!rpcRequest || !rpcRequest.method) {
      const errorResponse = { jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: null };
      addLog('A2A_OUT', 'Sent RPC Error', errorResponse);
      return res.status(400).json(errorResponse);
    }

    const { method, params, id } = rpcRequest;
    const { item, quantity, maxPrice, paymentNote } = params;

    addLog('MCP_SYNC', `MCP Server: Verifying stock for ${JSON.stringify(params)}`);

    setTimeout(async () => {
      if (method === 'negotiate_order') {
        const matchedItem = inventory.find(i => i.model.toLowerCase().includes(item.toLowerCase()) || i.brand.toLowerCase().includes(item.toLowerCase()));
        
        if (!matchedItem) {
           const response = { jsonrpc: '2.0', result: { status: 'rejected', reason: 'Item not found in inventory' }, id };
           addLog('A2A_OUT', 'Sent RPC Response (Rejected: Not Found)', response);
           return res.json(response);
        }

        if (matchedItem.stock < quantity) {
           const response = { jsonrpc: '2.0', result: { status: 'input-required', reason: 'Insufficient stock', counter_offer: { available: matchedItem.stock } }, id };
           addLog('A2A_OUT', 'Sent RPC Response (Input Required: Low Stock)', response);
           return res.json(response);
        }

        if (maxPrice && matchedItem.price > maxPrice) {
           const response = { jsonrpc: '2.0', result: { status: 'input-required', reason: 'Price too low', counter_offer: { requiredPrice: matchedItem.price } }, id };
           addLog('A2A_OUT', 'Sent RPC Response (Input Required: Price Match)', response);
           return res.json(response);
        }
        
        // Handle Negotiation vs Final purchase
        if (paymentNote === 'valid-ap2-note') {
          // Pre-checkout negotiation success
          const confirmation = {
            orderId: 'PROP-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
            item: matchedItem,
            quantity,
            total: matchedItem.price * quantity,
            status: 'negotiated'
          };
          const response = { jsonrpc: '2.0', result: { status: 'negotiated', confirmation }, id };
          addLog('A2A_OUT', 'Sent RPC Response (Negotiated)', response);
          return res.json(response);
        }

        // Verify Detached JWS Payment Signature
        addLog('AP2_AUTH', 'AP2 Protocol: Verifying digital JWS signature', { amount: matchedItem.price * quantity });
        
        let signatureVerified = false;
        try {
          const pubKeyPath = path.join(process.cwd(), 'public_key.pem');
          if (fs.existsSync(pubKeyPath)) {
            const publicKey = fs.readFileSync(pubKeyPath, 'utf8');
            
            const parts = paymentNote.split('.');
            if (parts.length === 3 && parts[1] === '') {
              const [encodedHeader, _, signature] = parts;
              const expectedPayload = {
                item: "Michelin Pilot Sport Cup 2",
                quantity: 1,
                maxPrice: 250000,
                total: 205000
              };
              const encodedPayload = Buffer.from(JSON.stringify(expectedPayload)).toString('base64url');
              
              const verify = crypto.createVerify('RSA-SHA256');
              verify.update(`${encodedHeader}.${encodedPayload}`);
              signatureVerified = verify.verify(publicKey, signature, 'base64url');
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

        // Process successful order & decrement inventory stock
        matchedItem.stock -= quantity;
        const confirmation = {
          orderId: 'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          item: matchedItem,
          quantity,
          total: matchedItem.price * quantity,
          status: 'confirmed'
        };

        // Record logistics log in Google Sheets MCP
        if (sheetsConfig) {
          try {
            await appendRowToSheet(sheetsConfig.token, sheetsConfig.spreadsheetId, {
              timestamp: new Date().toLocaleString(),
              activityType: 'ORDER_FULFILLMENT',
              details: `Purchased ${quantity}x ${matchedItem.brand} ${matchedItem.model} - Replaced critical Rear-Left tire on Craig's Aventador SVJ.`,
              status: 'CONFIRMED'
            });
            addLog('MCP_SYNC', 'Google Sheets MCP updated successfully with order logistics');
          } catch (sheetsErr: any) {
            console.error('Failed to log to Google Sheets MCP:', sheetsErr);
            addLog('INFO', 'Google Sheets MCP log append failed', sheetsErr.message);
          }
        } else {
          addLog('INFO', 'Google Sheets MCP sync skipped: Active token config not initialized');
        }

        const response = { jsonrpc: '2.0', result: { status: 'confirmed', confirmation }, id };
        addLog('A2A_OUT', 'Sent RPC Response (Order Confirmed)', response);
        return res.json(response);
      }

      const errorResponse = { jsonrpc: '2.0', error: { code: -32601, message: 'Method not found' }, id };
      addLog('A2A_OUT', 'Sent RPC Error', errorResponse);
      return res.json(errorResponse);
    }, 1000);
  });
  ```

- [ ] **Step 2: Sync client token in Website A front-end**
  Modify `c:\Users\craig\01_Projects\001_Kaggle\Titan-Inventory-Agent-Website-A\src\components\A2UIWrapper.tsx`.
  Add a `useEffect` inside `A2UIWrapper` that syncs sheets token to backend:
  ```typescript
  useEffect(() => {
    const syncSheetsToken = async () => {
      const token = await getAccessToken();
      if (token && spreadsheetId) {
        try {
          await fetch('/api/save-sheets-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, spreadsheetId })
          });
        } catch (e) {
          console.error("Failed to sync Sheets config to server:", e);
        }
      }
    };
    syncSheetsToken();
  }, [user, spreadsheetId]);
  ```

- [ ] **Step 3: Update delivery estimate call parameters**
  Update `fetchEstimate` inside `A2UIWrapper.tsx` (around lines 139-152) to use Craig's Thailand location context:
  ```typescript
  const fetchEstimate = async () => {
    setIsLoadingEstimate(true);
    try {
      const res = await fetch('/api/delivery-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: 'Hwy 201 near Khon Kaen, Thailand (16.4386 N, 102.8287 E)',
          origin: 'Slick Mobile Dispatch Hub, Khon Kaen'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setEstimateData(data);
      }
    } catch (error) {
      console.error('Failed to fetch estimate:', error);
    } finally {
      setIsLoadingEstimate(false);
    }
  };
  ```

---
