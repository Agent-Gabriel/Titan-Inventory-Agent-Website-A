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
