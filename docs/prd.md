# Product Requirements Document: Website A (UHP Tire Storefront Agent)

## 1. Objective
To deploy a mock e-commerce storefront agent that manages specialized Ultra-High-Performance (UHP) tire inventory and autonomously processes orders from client agents.

## 2. Core Architecture & Protocols

* **A2A Server:** Functions as the remote agent exposing its capabilities over the network. It publishes a standardized "Agent Card" (a JSON metadata document) so the Concierge agent can securely discover its endpoint, authentication methods, and tire inventory skills.
* **Order Negotiation (A2A):** Processes incoming structured JSON-RPC requests from the Concierge. It can enter an "input-required" state if it needs to clarify an order or make a counter-offer. Once agreed, it returns a final artifact, such as an order confirmation or structured invoice.
* **Secure Payment (AP2):** Uses the Agent Payments Protocol (AP2) to verify the digital promissory note from the Concierge agent, ensuring the transaction is fully authorised and blocked from exceeding set guardrails.
* **Inventory Management (MCP):** Connects to internal databases using a private Model Context Protocol (MCP) server to instantly verify real-time stock availability.

## 3. Core Behavior-Driven Development (BDD) Workflow

* **Given** a remote Concierge Agent initiates an A2A task to purchase replacement Lamborghini tires.
* **When** Website A checks its MCP-connected inventory and verifies the AP2 payment authorisation.
* **Then** Website A completes the negotiation and returns the final order confirmation artifact back to the Concierge.
