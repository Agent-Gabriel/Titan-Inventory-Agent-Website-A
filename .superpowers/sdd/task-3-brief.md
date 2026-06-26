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
