# Task 2 Report: Implement Replay Protection and Input Validation on Website A

## Objective
Implement cryptographic replay protection, JWS timestamp validation (5-minute window), and strict input validation on Website A's `/api/rpc` endpoint.

## Implemented Changes

### 1. Replay Protection & Timestamp Constraints (`server.ts`)
- Added `usedTransactionIds` `Set` to store processed nonces in-memory.
- Integrated timestamp age validation to reject requests older or newer than 5 minutes (300,000ms window relative to the server's current time).
- Implemented checks to detect replay attacks by looking up `transactionId` in `usedTransactionIds`.
- Registered successfully verified transaction IDs in the cache with a 5-minute auto-pruning timeout to prevent memory leaks.
- Sorted and added `transactionId` and `timestamp` parameters into the JWS payload schema to verify digital signature integrity.

### 2. Parameter Bounds Validation (`server.ts`)
- Enforced strict checks to ensure the `quantity` parameter is a positive integer (`typeof quantity === 'number' && quantity > 0 && Number.isInteger(quantity)`).
- Responded with a JSON-RPC Error (`code: -32602`) for invalid parameter values.

## Verification & Status
- **Typecheck & Linter Check**: Executed `npm run lint` (`tsc --noEmit`). Verified that the build passes without errors.
- **Git Commit**: Committed changes to `server.ts` with commit message: `feat: implement payment replay protection and strict input parameter validation on server` (Commit ID: `1c4437e`).

## Next Steps
Proceed to subsequent tasks (Task 3: Integrate and Verify End-to-End Secure Transaction Flow).
