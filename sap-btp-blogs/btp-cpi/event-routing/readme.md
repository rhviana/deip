
# SAP CI — Immutable Event Routing per Domain with Metadata-Driven Consumer Orchestration

Reference implementation for immutable event routing inside SAP Cloud Integration using:

- One Kafka Sender Adapter
- One immutable Smart Router per domain
- Metadata-driven consumer orchestration
- Value Mapping resolution
- ProcessDirect dispatching
- SDIA / ODCP / EDCP governance principles

---

# Included Files

This repository contains:

- SAP CPI Router iFlow
- SAP CPI Processing iFlow template
- Value Mapping export
- Groovy scripts used in the blog
- Architecture diagrams

---

# What This Demonstrates

The pattern allows:

```text
One Topic
→ One Immutable Router
→ N Consumers resolved dynamically via metadata
```

without:

- changing the producer
- changing the adapter
- redeploying the router

---

# Architectural Scope

This repository is a reference implementation and proof of concept.

The goal is to demonstrate:

- immutable inbound routing
- metadata-driven orchestration
- domain-centric governance
- transport-agnostic event routing principles

This is not intended to be a production-ready framework.

---

# External Components Required

The following components must be configured externally by the implementing team:

- Kafka Broker / Confluent Cloud
- Topics
- Credentials
- Schema Registry (optional)
- Postman or event publisher
- Security hardening
- Retry/DLQ operational strategy

The sample payload and AVRO schema are already documented in the SAP Community blog.

---

# Tested Scenario

Validated with:

- SAP Integration Suite (Cloud Integration)
- Kafka Sender Adapter
- Confluent Cloud
- Apache AVRO 1.12.1
- ProcessDirect dispatching
- Value Mapping orchestration

---

# Pattern Principles

The implementation follows these invariants:

```text
Inbound Event
→ Metadata Resolution
→ Consumer Strategy
→ Domain Processing
```

The transport changes.

The routing principle does not.

---

# Routing States

| State | Behavior |
|---|---|
| SINGLE | Direct ProcessDirect |
| XCONS | Splitter + Loop |
| BOTH | Parallel Multicast |
| FALLBACK | Error End Event |

---

# Governance Model

This implementation follows:

- SDIA — Semantic Domain Integration Architecture
- ODCP — Orchestration Domain-Centric Pattern
- EDCP — Event Domain-Centric Pattern

If your organization uses different naming standards, adapt:

- topic names
- package names
- Value Mappings
- ProcessDirect paths
- credentials

The routing principle itself remains unchanged.

---

# Important Notes

- The router validates semantic metadata, not physical ProcessDirect existence
- Kafka acts as the retry engine (offset retention)
- The router remains immutable
- Only metadata evolves

---

# Related SAP Community Blogs

- Immutable Kafka Topic Routing
- Immutable IDOC Routing
- GDCR / DDCR for SAP API Management

---

# Author

Ricardo Luz Holanda Viana

Independent Solo Researcher  
Enterprise Integration Architect  
SAP BTP Integration Suite Expert  

Creator of:
- SDIA
- GDCR
- DDCR
- ODCP
- EDCP
- DDCP

ORCID:
0009-0009-9549-5862

---

# License

Reference implementation for educational and architectural demonstration purposes.
