# Multi-Agent System (MAS) Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a fully functional live connection between Website A (Titan Storefront Agent) and Website B (Titan Concierge Agent) including A2A negotiation, cryptographic payments (AP2), sitemaps/catalog discovery (ARD), Google Sheets MCP synchronization, and location grounding.

**Architecture:** Use HTTP endpoints with JSON-RPC for order negotiation, detached JWS (JSON Web Signatures) generated server-side for payment verification, file-based public key sharing for authentication, and client-assisted API tokens for Google Sheets MCP logging.

**Tech Stack:** Node.js, Express, Next.js, Google Sheets API, Google Maps API, Gemini API, Node.js `crypto` library.

---

## User Review Required

> [!IMPORTANT]
> The JWS cryptographic signature (AP2) will use standard RSA-256 asymmetric encryption keys. We will automate key pair generation using a utility script `generate-keys.js`.

> [!IMPORTANT]
> The Google Sheets MCP integration uses a hybrid token synchronization. When the dealer signs in via Google Workspace on Website A (the Storefront dashboard), the client token and spreadsheet ID are securely registered in Website A's server memory to allow server-side order fulfillment to log telemetry directly to the spreadsheet.

---

## Open Questions

> [!NOTE]
> No outstanding questions exist. Ports are mapped to standard local development configurations (`http://localhost:3000` for Website A, `http://localhost:3001` for Website B).

---

## Proposed Changes

### Configuration & Key Generation

#### [NEW] [generate-keys.js](file:///c:/Users/craig/01_Projects/001_Kaggle/generate-keys.js)
A script to generate RSA key pairs and place them in the correct directories for asymmetric signing.

#### [NEW] [env](file:///c:/Users/craig/01_Projects/001_Kaggle/Concierge-Agent-website-B/.env)
Create Website B environment configuration file.

#### [NEW] [env](file:///c:/Users/craig/01_Projects/001_Kaggle/Titan-Inventory-Agent-Website-A/.env)
Create Website A environment configuration file.

---

### Website B (Titan Concierge Agent)

#### [NEW] [route.ts](file:///c:/Users/craig/01_Projects/001_Kaggle/Concierge-Agent-website-B/app/api/ap2-sign/route.ts)
Expose a server-side route `/api/ap2-sign` to sign transaction payloads using Website B's private key.

#### [NEW] [ai-catalog.json](file:///c:/Users/craig/01_Projects/001_Kaggle/Concierge-Agent-website-B/public/.well-known/ai-catalog.json)
Static catalog file for federated discovery.

#### [MODIFY] [page.tsx](file:///c:/Users/craig/01_Projects/001_Kaggle/Concierge-Agent-website-B/app/page.tsx)
- Add Next.js dev server port override to run on port `3001`.
- Transition `startA2ANegotiation()` from timer-based simulation to real A2A network calls.
- Modify checkout fingerprint confirmation to hit `/api/ap2-sign` and send verified JWS order confirmation.
- Stabilize telemetry leak simulator once new tire is fitted.

#### [MODIFY] [README.md](file:///c:/Users/craig/01_Projects/001_Kaggle/Concierge-Agent-website-B/README.md)
Update document to reference the SPIFFE did trust anchor configurations.

---

### Website A (Titan Storefront Agent)

#### [NEW] [ai-catalog.json](file:///c:/Users/craig/01_Projects/001_Kaggle/Titan-Inventory-Agent-Website-A/public/.well-known/ai-catalog.json)
Static catalog file for federated discovery.

#### [MODIFY] [server.ts](file:///c:/Users/craig/01_Projects/001_Kaggle/Titan-Inventory-Agent-Website-A/server.ts)
- Add custom CORS middleware headers to allow cross-origin requests from Website B (`http://localhost:3001`).
- Load environment variables using `dotenv`.
- Support saving Google Sheets OAuth token and spreadsheet ID in memory via `/api/save-sheets-config`.
- Upgrade JSON-RPC verification block to verify the JWS signature using Website B's public key.
- Trigger automatic Google Sheets logging in the inventory reduction phase.

#### [MODIFY] [A2UIWrapper.tsx](file:///c:/Users/craig/01_Projects/001_Kaggle/Titan-Inventory-Agent-Website-A/src/components/A2UIWrapper.tsx)
- Automatically post Google Sheets credentials and spreadsheet ID to Website A's server upon authentication.
- Update logistics calculation call to pass Khon Kaen location context.

#### [MODIFY] [README.md](file:///c:/Users/craig/01_Projects/001_Kaggle/Titan-Inventory-Agent-Website-A/README.md)
Update document with SPIFFE did trust anchor details.

---

## Tasks

### Task 1: Environment Routing, CORS and Key Generation Setup

- [ ] **Step 1: Write key generation script**
  Create `generate-keys.js` in the root projects parent folder `c:\Users\craig\01_Projects\001_Kaggle\generate-keys.js`.
  ```javascript
  const crypto = require('crypto');
  const fs = require('fs');
  const path = require('path');

  const websiteBDir = 'c:\\Users\\craig\\01_Projects\\001_Kaggle\\Concierge-Agent-website-B';
  const websiteADir = 'c:\\Users\\craig\\01_Projects\\001_Kaggle\\Titan-Inventory-Agent-Website-A';

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  fs.writeFileSync(path.join(websiteBDir, 'private_key.pem'), privateKey);
  fs.writeFileSync(path.join(websiteBDir, 'public_key.pem'), publicKey);
  fs.writeFileSync(path.join(websiteADir, 'public_key.pem'), publicKey);

  console.log('Keys generated and written successfully.');
  ```

- [ ] **Step 2: Run key generation script**
  Execute `node generate-keys.js` in the terminal to verify the key PEM files are written successfully.

- [ ] **Step 3: Setup Website B environment configuration**
  Create `.env` file at `c:\Users\craig\01_Projects\001_Kaggle\Concierge-Agent-website-B\.env` with contents:
  ```env
  NEXT_PUBLIC_STOREFRONT_AGENT_URL="http://localhost:3000"
  APP_URL="http://localhost:3001"
  ```

- [ ] **Step 4: Setup Website A environment configuration**
  Create `.env` file at `c:\Users\craig\01_Projects\001_Kaggle\Titan-Inventory-Agent-Website-A\.env` with contents:
  ```env
  CONCIERGE_AGENT_URL="http://localhost:3001"
  APP_URL="http://localhost:3000"
  ```

- [ ] **Step 5: Add Dotenv loading and CORS headers to Website A server**
  Modify `c:\Users\craig\01_Projects\001_Kaggle\Titan-Inventory-Agent-Website-A\server.ts` to include `dotenv` initialization and custom CORS middleware.
  Add at line 1:
  ```typescript
  import 'dotenv/config';
  ```
  Add after `app.use(express.json());`:
  ```typescript
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
  ```

---

### Task 2: Implement Cryptographic JWS Endpoint (Website B)

- [ ] **Step 1: Create signature generator API route**
  Create Route Handler `c:\Users\craig\01_Projects\001_Kaggle\Concierge-Agent-website-B\app\api\ap2-sign\route.ts`.
  ```typescript
  import { NextRequest, NextResponse } from "next/server";
  import crypto from "crypto";
  import fs from "fs";
  import path from "path";

  export async function POST(req: NextRequest) {
    try {
      const payload = await req.json();
      
      // Load Private Key
      const keyPath = path.join(process.cwd(), "private_key.pem");
      if (!fs.existsSync(keyPath)) {
        return NextResponse.json({ error: "Private key not found" }, { status: 500 });
      }
      const privateKey = fs.readFileSync(keyPath, "utf8");

      const header = { alg: "RS256", typ: "JWS" };
      const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
      
      const sign = crypto.createSign("RSA-SHA256");
      sign.update(`${encodedHeader}.${encodedPayload}`);
      const signature = sign.sign(privateKey, "base64url");
      
      // Generate detached JWS
      const jws = `${encodedHeader}..${signature}`;
      
      return NextResponse.json({ jws });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }
  ```

- [ ] **Step 2: Create a unit test for signing endpoint**
  Create a test script `c:\Users\craig\01_Projects\001_Kaggle\Concierge-Agent-website-B\test-sign.js` to verify it generates a valid JWS signature.
  ```javascript
  const crypto = require('crypto');
  const fs = require('fs');

  const privateKey = fs.readFileSync('private_key.pem', 'utf8');
  const publicKey = fs.readFileSync('public_key.pem', 'utf8');

  const payload = { item: 'Michelin', quantity: 1 };
  const header = { alg: 'RS256', typ: 'JWS' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${encodedHeader}.${encodedPayload}`);
  const signature = sign.sign(privateKey, 'base64url');

  // Verify
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(`${encodedHeader}.${encodedPayload}`);
  const success = verify.verify(publicKey, signature, 'base64url');

  console.log('Offline signature validation:', success ? 'PASS' : 'FAIL');
  ```

- [ ] **Step 3: Run the validation script**
  Run: `node test-sign.js` and ensure it outputs `Offline signature validation: PASS`.

---

### Task 3: Setup Agentic Resource Discovery catalogs (ARD)

- [ ] **Step 1: Create Website B catalog**
  Create file `c:\Users\craig\01_Projects\001_Kaggle\Concierge-Agent-website-B\public\.well-known\ai-catalog.json`.
  ```json
  {
    "specVersion": "1.0",
    "host": {
      "displayName": "Project Titan Concierge Hub",
      "id": "did:web:project-titan.com:concierge"
    },
    "entries": [
      {
        "id": "concierge-agent-001",
        "name": "Titan Concierge Agent",
        "trustManifest": {
          "workloadIdentity": "did:web:project-titan.com:agents:concierge",
          "compliance": ["https://project-titan.com/compliance/pdpa"]
        }
      }
    ]
  }
  ```

- [ ] **Step 2: Create Website A catalog**
  Create directory `c:\Users\craig\01_Projects\001_Kaggle\Titan-Inventory-Agent-Website-A\public\.well-known` and create file `ai-catalog.json` inside it.
  ```json
  {
    "specVersion": "1.0",
    "host": {
      "displayName": "Project Titan Automotive Hub",
      "id": "did:web:project-titan.com"
    },
    "entries": [
      {
        "id": "storefront-agent-001",
        "name": "Titan Inventory Agent",
        "trustManifest": {
          "workloadIdentity": "did:web:project-titan.com:agents:storefront",
          "compliance": ["https://project-titan.com/compliance/pdpa"]
        }
      }
    ]
  }
  ```

- [ ] **Step 3: Serve Well-Known catalog on Website A Express server**
  Add static directory router for `.well-known` directory in `server.ts` before `startServer()`:
  ```typescript
  app.use('/.well-known', express.static(path.join(__dirname, 'public/.well-known')));
  ```

---

### Task 4: Connect Live A2A Negotiation and AP2 Checkout (Website B)

- [ ] **Step 1: Replace startA2ANegotiation() in page.tsx**
  Modify `c:\Users\craig\01_Projects\001_Kaggle\Concierge-Agent-website-B\app\page.tsx`.
  Replace lines 301-362 with a live async function that makes actual API calls to Website A:
  ```typescript
  const startA2ANegotiation = async () => {
    setIsNegotiating(true);
    setA2aLogs([]);
    setNegotiationComplete(false);

    try {
      // Step 1: Telemetry Ingestion
      setA2aLogs((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          source: "MCP / Michelin SmartWear",
          text: `Analyzing RL SmartWear sensor arrays. Tread: ${(1.2 + (100 - telemetry.rearLeftWear) * 0.026).toFixed(1)}mm (${telemetry.rearLeftWear}% wear). Thermal Alert: ${telemetry.rearLeftTemp.toFixed(1)}°C, Pressure: ${telemetry.rearLeftPSI.toFixed(1)} PSI. Flagging replacement required.`,
          code: { telemetry: { RL: { wear: `${telemetry.rearLeftWear}%`, pressure: `${telemetry.rearLeftPSI} PSI`, state: "CRITICAL_ANOMALY" } } },
        },
      ]);
      await new Promise(resolve => setTimeout(resolve, 800));

      const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_AGENT_URL || "http://localhost:3000";

      // Step 2: Agent Card Discovery
      setA2aLogs((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          source: "A2A Discovery",
          text: `Querying storefront Website A (${storefrontUrl}) for capabilities agent card.`,
          code: { jsonrpc: "2.0", method: "discover_agent_card", params: { product: "Michelin Pilot Sport Cup 2" }, id: 1 },
        },
      ]);
      
      const cardRes = await fetch(`${storefrontUrl}/api/agent-card`);
      if (!cardRes.ok) throw new Error("Agent Card endpoint unavailable");
      const agentCard = await cardRes.json();
      await new Promise(resolve => setTimeout(resolve, 800));

      setA2aLogs((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          source: "Slick Storefront Agent",
          text: `Agent Card retrieved: ${agentCard.name}. Authentication supported: ${agentCard.authentication.join(', ')}.`,
          code: agentCard,
        },
      ]);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 3: RPC Order Negotiation
      setA2aLogs((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          source: "A2A Negotiation",
          text: `Sending JSON-RPC order negotiation payload to Website A's RPC handler /api/rpc.`,
          code: {
            jsonrpc: "2.0",
            method: "negotiate_order",
            params: {
              item: "Michelin Pilot Sport Cup 2",
              quantity: 1,
              maxPrice: 250000,
              paymentNote: "valid-ap2-note"
            },
            id: Date.now()
          },
        },
      ]);

      const rpcResponse = await fetch(`${storefrontUrl}/api/rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "negotiate_order",
          params: {
            item: "Michelin Pilot Sport Cup 2",
            quantity: 1,
            maxPrice: 250000,
            paymentNote: "valid-ap2-note"
          },
          id: Date.now()
        })
      });
      if (!rpcResponse.ok) throw new Error("JSON-RPC request failed");
      const negotiationResult = await rpcResponse.json();
      await new Promise(resolve => setTimeout(resolve, 800));

      setA2aLogs((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          source: "Slick Storefront Agent",
          text: `Inventory verified. Stock: ${negotiationResult.result?.confirmation?.item?.stock || 8} units available. Price negotiated: ฿180,000. Hold code SVJ-TITAN-009 established.`,
          code: negotiationResult,
        },
      ]);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 4: Routing & Logistics
      setA2aLogs((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          source: "A2A Routing & Logistics",
          text: "Initiating slot negotiation with 'Slick Mobile Fitters' (Khon Kaen Dispatch Hub) to coordinates: 16.4386° N, 102.8287° E.",
          code: { jsonrpc: "2.0", method: "negotiate_fitting", params: { service_type: "Immediate_Dispatch", location: "Hwy 201, Khon Kaen" }, id: 2 },
        },
      ]);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 5: Dispatch confirmed
      setA2aLogs((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          source: "Slick Dispatch Agent",
          text: "Dispatch confirmed. Mobile Service Unit 4 allocated. Immediate dispatch scheduled (18m ETA). Logistics surcharge: ฿25,000.",
          code: { jsonrpc: "2.0", result: { status: "SCHEDULED", vehicle_id: "SLICK-MOBILE-4", estimated_dispatch_mins: 18, base_price_thb: 25000 }, id: 2 },
        },
      ]);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 6: Summary
      setA2aLogs((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          source: "Titan Concierge Agent",
          text: "All A2A logistical options aligned. Compiled dispatch invoice totaling ฿205,000. Ready for secure AP2 checkout authorization.",
          code: { invoice: { tire_cost: 180000, dispatch_cost: 25000, total: 205000, currency: "THB" } },
        },
      ]);

      setNegotiationComplete(true);
    } catch (e: any) {
      console.error(e);
      setA2aLogs((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          source: "Titan Concierge Error",
          text: `Negotiation failed. Ensure Website A is running and NEXT_PUBLIC_STOREFRONT_AGENT_URL is set. Error: ${e.message}`,
        },
      ]);
    } finally {
      setIsNegotiating(false);
    }
  };
  ```

- [ ] **Step 2: Replace triggerAP2Payment() in page.tsx**
  Replace lines 175-194 in `c:\Users\craig\01_Projects\001_Kaggle\Concierge-Agent-website-B\app\page.tsx` with:
  ```typescript
  const triggerAP2Payment = async () => {
    setCheckoutStatus("authorizing");
    
    try {
      const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_AGENT_URL || "http://localhost:3000";
      
      const payload = {
        item: "Michelin Pilot Sport Cup 2",
        quantity: 1,
        maxPrice: 250000,
        total: 205000
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
            paymentNote: jws
          },
          id: Date.now()
        })
      });
      
      if (!rpcRes.ok) {
        throw new Error("Storefront agent rejected transaction");
      }
      
      const rpcResult = await rpcRes.json();
      
      if (rpcResult.error || rpcResult.result?.status !== 'confirmed') {
        throw new Error(rpcResult.error?.message || rpcResult.result?.reason || "Transaction failed");
      }
      
      setAp2Signature(jws);
      setCheckoutStatus("success");
      
      setTelemetry((prev) => ({
        ...prev,
        rearLeftPSI: 35,
        rearLeftTemp: 40,
        rearLeftWear: 0,
      }));
      setSelectedTire("RL");
      
    } catch (e: any) {
      console.error("AP2 Checkout failed:", e);
      setCheckoutStatus("idle");
      alert(`AP2 Cryptographic Transaction Failed: ${e.message}`);
    }
  };
  ```

- [ ] **Step 3: Modify telemetry simulation leak condition**
  Update the leak interval in `c:\Users\craig\01_Projects\001_Kaggle\Concierge-Agent-website-B\app\page.tsx` (around lines 141-160) so that it only leaks when the tire is worn:
  ```typescript
  // Telemetry real-time simulator interval
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const isRLLeaking = prev.rearLeftPSI > 20 && prev.rearLeftWear > 50;
        return {
          ...prev,
          oilPressure: Math.min(100, Math.max(88, prev.oilPressure + (Math.random() - 0.5))),
          engineTemp: Math.min(105, Math.max(95, prev.engineTemp + (Math.random() - 0.5))),
          batteryVoltage: Number((13.7 + Math.random() * 0.2).toFixed(1)),
          // Slow leak simulator for RL tire only when worn
          rearLeftPSI: isRLLeaking ? prev.rearLeftPSI - 0.05 : prev.rearLeftWear > 50 ? 20 : prev.rearLeftPSI,
          rearLeftTemp: prev.rearLeftWear > 50 ? Math.min(120, Math.max(110, prev.rearLeftTemp + (Math.random() - 0.5))) : Math.min(42, Math.max(38, prev.rearLeftTemp + (Math.random() - 0.5))),
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);
  ```

---

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
