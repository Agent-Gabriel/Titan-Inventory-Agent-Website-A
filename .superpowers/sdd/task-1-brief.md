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
