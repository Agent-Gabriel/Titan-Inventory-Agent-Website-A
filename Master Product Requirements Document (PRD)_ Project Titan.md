### Master Product Requirements Document (PRD): Project Titan

#### 1\. Executive Vision & Strategic Alignment

The mission of Project Titan is to deploy a comprehensive AI agent-driven automotive ecosystem that synchronises e-commerce, real-time vehicle telemetry, and logistics optimisation. Project Titan serves as a high-performance demonstration of agentic systems capable of solving complex, multi-stakeholder challenges within the automotive and materials science sectors.This project is strategically aligned with the Kaggle AI Agents hackathon tracks:

* **Website A (Storefront Agent):**  Submitted under the  **"Agents for Business"**  track. Success for this track is benchmarked against the current operational expenditure of ฿10,619,250 per year, with a target reduction of 10.89% through agentic automation.  
* **Website B (Concierge Agent):**  Submitted under the  **"Concierge Agents"**  track, focusing on a personalised, safety-first driving and maintenance experience for individual consumers.The project documentation and system communication shall maintain a technically rigorous and authoritative tone, utilising British English spelling conventions (e.g., "optimisation", "synchronisation", "personalised").

#### 2\. System-Wide Architecture: The Multi-Agent System (MAS)

Project Titan shall be built upon a decentralised Multi-Agent System (MAS) utilising the  **Agent Development Kit (ADK)**  and  **Antigravity**  frameworks. This architecture enables coordination between specialised agents to maintain data integrity across the ecosystem.

##### 2.1 Interaction Models

* **Agent-to-Agent (A2A):**  Used for cross-service communication, specifically for the Concierge Agent to notify the Storefront Agent when telemetry indicates critical tyre wear.  
* **Agent-to-Platform-2 (AP2):**  Used for deep infrastructure integration, granting agents access to compute resources and secure data layers.

##### 2.2 Primary Agent Roles and Responsibilities

Agent Role,Primary Responsibility,Key Interactions  
Storefront Agent,"Automates e-commerce and inventory lookups for ""Connect Ready"" hardware and separate SKUs.",A2A with Concierge; MCP with Google Sheets.  
Concierge Agent,"Acts as a ""Virtual Tyre Engineer,"" monitoring wear via telemetry and managing driving modes.",A2UI for user interaction; MCP with Michelin Telemetry.  
Aurora (Dealer Orchestrator),"Optimises logistics, schedules fittings, and manages heterogeneous fleet routing for dealers.",MCP with Google Maps/Calendar; A2A for order fulfilment.

#### 3\. Website A: Storefront Agent (Business Track)

**Objective:**  Automate the e-commerce lifecycle and inventory synchronisation.

##### 3.1 Inventory Integration

The Storefront Agent shall utilise a  **"Mocked Google Sheets MCP"**  for inventory management. The agent must perform live CSV lookups to verify availability for:

* "Connect Ready" Tyres (Pilot Sport CUP2 Connect).  
* Central Connection Box (Standalone SKU).  
* Tyre Sensors (4-Unit Hardware Kit SKU).

##### 3.2 Core Functionality

* **Product Discovery:**  Recommend hardware based on vehicle compatibility for over 270 "Expert Mode" compatible vehicles.  
* **Price Calculation:**  All totals, including regional taxes and delivery fees, shall be presented in  **Thai Baht (฿)** .  
* **Stock Synchronisation:**  The agent shall automatically restrict transactions if the MCP reports stockouts for any component of the Michelin Track Connect kit.

#### 4\. Website B: Concierge Agent (Personal/Social Track)

**Objective:**  Provide personalised safety and performance advice based on real-time telemetry.

##### 4.1 Telemetry Integration

The agent shall integrate the  **"Michelin SmartWear Telemetry MCP"**  to ingest real-time data streams, including tyre pressure, temperature, and wear consistency. The agent must reference the 7.40-second performance gain logic achieved through optimal thermal management over 15 consecutive laps.

##### 4.2 User Interface (A2UI)

The  **A2UI Tyre Selector**  shall visualise telemetry data, translating sensor inputs into "Virtual Tyre Engineer" advice. It must provide actionable recommendations for pressure adjustments based on track and weather conditions.

##### 4.3 Operational Modes

The Concierge Agent shall support three integration levels:

1. **Leisure Mode:**  Free mode for general enthusiasts; manual pressure tracking and lap recording.  
2. **Expert Mode:**  Requires the "Connect Ready" kit (Connection Box \+ 4 Sensors) for real-time performance optimisation.  
3. **Motorsport Mode:**  High-performance mode for rally/circuit racers; includes automatic slow puncture warnings and race preparation advice.

#### 5\. Dealer Dashboard (Aurora): Operations & Logistics

**Objective:**  Provide dealers with a centralised interface for logistics and appointment synchronisation.

##### 5.1 MCP App Integration

* **Google Maps MCP:**  Embed Maps via A2UI to track dealer locations and provide routing.  
* **Google Calendar MCP:**  Automate scheduling for tyre fitting and sensor installation based on dealer availability.

##### 5.2 Logistics Optimisation (VRP)

The system  **SHALL**  implement the  **Adaptive Large Neighbourhood Search (ALNS)**  algorithm to solve the Heterogeneous Fleets Vehicle Routing Problem (VRP). ALNS is mandated over Differential Evolution (DE) due to its 1.01% superior cost-efficiency in escaping local optima.

* **Asymmetric Constraints:**  The system must account for asymmetric distance matrices caused by one-way roads and construction.  
* **Excessive Demand:**  The algorithm must allow multiple visits to a single pickup point (e.g., a warehouse or bus stop) when demand exceeds individual vehicle capacity.  
* **Time Windows:**  All routes must be constrained to the "Longest Travelling Time" limit (60 to 90 minutes).

#### 6\. Agentic Resource Discovery (ARD) & Security

##### 6.1 Protocol Adoption

All agentic resources must adhere to the ai-catalog standard for federated discovery. The host shall advertise resources via a well-known static manifest located at: /.well-known/ai-catalog.json.

##### 6.2 Technical Specification: ai-catalog.json

{  
  "specVersion": "1.0",  
  "host": {  
    "displayName": "Project Titan Automotive Hub",  
    "id": "did:web:project-titan.com"  
  },  
  "entries": \[  
    {  
      "id": "storefront-agent-001",  
      "name": "Titan Inventory Agent",  
      "trustManifest": {  
        "workloadIdentity": "did:web:project-titan.com:agents:storefront",  
        "compliance": \["https://project-titan.com/compliance/pdpa"\]  
      }  
    }  
  \]  
}

##### 6.3 Security Requirements

* **Workload Identity:**  All resources must be bound to  **SPIFFE IDs**  or  **DIDs** . This implementation must be visible in the public repository’s README.  
* **Cryptographic Signatures:**  Use  **JWS (JSON Web Signatures)**  for detached signatures to prevent manifest tampering.  
* **Progressive Trust:**  Decouple security metadata from discovery data via the trustManifest object.

#### 7\. Regulatory Compliance: Thailand PDPA

##### 7.1 Data Privacy & Auditing

The system shall operate in strict compliance with the Thailand  **Personal Data Protection Act (PDPA)** . The agents must maintain a "Consent Log" compatible with  **Personal Data Protection Committee (PDPC)**  audits.

##### 7.2 Consent Management

The agentic interface shall manage "Informed Consent" for the following categories:

* **Strictly Necessary:**  Essential functionality (exempt from consent).  
* **Preference:**  User settings (e.g., regional units).  
* **Analytics:**  Performance and telemetry monitoring.  
* **Marketing:**  Personalised tracking and recommendations.

#### 8\. Knowledge Management: The LLM Wiki Pattern

Project Titan shall apply the  **Karpathy "LLM Wiki" pattern**  for compounding internal memory.

##### 8.1 The Three Layers

1. **Raw Sources:**  Immutable logs, CSV inventory data, and telemetry streams.  
2. **The Wiki:**  LLM-generated Markdown files (entity pages, summaries, cross-references).  
3. **The Schema:**  The AGENTS.md file, defining maintenance rules and knowledge ingestion invariants.

##### 8.2 Operational Tasks

* **Ingest:**  The Orchestrator Agent shall read new sources, update 10-15 relevant wiki pages, and append state changes to the transaction log.  
* **Log:**  The system must maintain log.md as a chronological, append-only record. Every entry  **MUST**  start with a consistent, Unix-parseable prefix: \#\# YYYY-MM-DD ingest | Title.  
* **Lint:**  The agent shall perform periodic contradiction detection, specifically flagging when newer telemetry logs contradict established wear summaries.

#### 9\. Evaluation & Deployment Criteria

##### 9.1 Technical Concept Checklist

1. **Multi-Agent System (ADK):**  Demonstrated in the public code via Storefront, Concierge, and Aurora interactions.  
2. **MCP Servers:**  Functional implementation of Google Sheets (Inventory), Michelin (Telemetry), and Google Maps/Calendar.  
3. **Antigravity:**  Functional demonstration of trajectory control required in the Video.  
4. **Security:**  SPIFFE/DID implementation visible in the repository README.

##### 9.2 Mandatory Assets for Submission

* **Kaggle Writeup:**  Analysis of the agentic architecture (max 2,500 words).  
* **Media Gallery:**  High-quality images and a required cover image.  
* **Public Repository:**  Codebase with setup instructions and security documentation.  
* **Video Demonstration:**  A YouTube video (≤ 5 minutes) showing the problem statement, MAS architecture, and a functional demo including Antigravity trajectory control.

