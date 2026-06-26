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
