# 🚀 GDCR – Domain-Centric KVM Reference Model

> Minimal reproducible KVM configuration aligned with the GDCR semantic facade.  
> Deterministic. Vendor-agnostic. Metadata-driven.

This repository demonstrates:

- Domain-centric routing
- Canonical action normalization
- Metadata-based backend resolution
- Immutable proxy + dynamic execution model

---

# 🔵 SALES (O2C)

## Semantic Facade

| ID   | Facade Path                         | Vendor          |
|------|-------------------------------------|-----------------|
| id01 | `/dcrporders/c/id01`           | salesforce      |
| id02 | `/dcrporders/u/id02`           | salesforce-emea |
| id03 | `/dcrpcustomers/s/id03`        | shopify         |
| id04 | `/dcrp/payment/n/id04`         | stripe          |
| id05 | `/dcrporders/c/id05`           | microsoft       |
| id06 | `/dcrpdeliveries/t/id06`       | fedex           |
| id07 | `/dcrpcustomers/s/id07`        | s4hana          |
| id08 | `/dcrppayments/n/id08`         | s4hana          |
| id09 | `/dcrp/invoices/c/id09`         | quickbooks      |
| id10 | `/dcrp/invoices/c/id10`         | s4hana          |
| id11 | `/dcrp/deliveries/t/id11`       | s4hana          |
| id12 | `/dcrp/returns/c/id12`          | shopify         |

---

## KVM Configuration

### KVM Name
cpipackage-nx.sales.o2c.integrations

### Key
kvm.idinterface


### Value

```text
dcrporderscsalesforceid01:http,
dcrpordersusalesforceemeaid02:http,
dcrpcustomerssshopifyid03:http,
dcrppaymentsnstripeid04:http,
dcrporderscmicrosoftid05:cxf,
dcrpdeliveriestfedexid06:http,
dcrpcustomersss4hanaid07:cxf,
dcrppaymentsns4hanaid08:cxf,
dcrpinvoicescquickbooksid09:cxf,
dcrpinvoicescs4hanaid10:cxf,
dcrpdeliveriests4hanaid11:cxf,
dcrpreturnscshopifyid12:http
```

---

# 🟢 PROCUREMENT (P2P)

## Semantic Facade

| ID   | Facade Path                         | Vendor      |
|------|-------------------------------------|------------|
| id01 | `/dcrp/requisitions/c/id01`     | ariba      |
| id02 | `/dcrp/pos/c/id02`              | coupa      |
| id03 | `/dcrp/rfqs/c/id03`             | ariba      |
| id04 | `/dcrp/contracts/s/id04`        | jaggaer    |
| id05 | `/dcrp/invoices/a/id05`         | basware    |
| id06 | `/dcrp/suppliers/s/id06`        | ivalua     |
| id07 | `/dcrp/catalogs/u/id07`         | tradeshift |
| id08 | `/dcrp/grns/c/id08`             | wms        |
| id09 | `/dcrp/buyers/s/id09`           | oracle     |
| id10 | `/dcrp/sourcing/q/id10`         | ariba      |

---

## KVM Configuration

### KVM Name
cpipackage-nx.procurement.p2p.integrations

### Key
kvm.idinterface


### Value

```text
dcrprequisitionscaribaid01:cxf,
dcrpposccoupaid02:http,
dcrprfqscaribaid03:cxf,
dcrpcontractssjaggaerid04:http,
dcrpinvoicesabaswareid05:cxf,
dcrpsupplierssivaluaid06:http,
dcrpcatalogsutradeshiftid07:http,
dcrpgrnscwmsid08:cxf,
dcrpbuyerssoracleid09:http,
dcrpsourcingsqaribaid10:cxf
```

# 🟡 FINANCE (R2R)

## Semantic Facade

| ID   | Facade Path                     | Vendor      |
|------|---------------------------------|------------|
| id01 | `/dcrp/invoices/c/id01`     | quickbooks |
| id02 | `/dcrp/invoices/c/id02`     | s4hana     |
| id03 | `/dcrp/payments/n/id03`     | stripe     |
| id04 | `/dcrp/payments/n/id04`     | s4hana     |
| id05 | `/dcrp/accounts/s/id05`     | xero       |
| id06 | `/dcrp/journals/c/id06`     | sap        |
| id07 | `/dcrp/expenses/c/id07`     | coupa      |
| id08 | `/dcrp/receipts/u/id08`     | concur     |
| id09 | `/dcrp/budgets/s/id09`      | workday    |
| id10 | `/dcrp/taxes/c/id10`        | avalara    |
```text
dcrpinvoicescquickbooksid01:http,
dcrpinvoicescs4hanaid02:cxf,
dcrppaymentsnstripeid03:http,
dcrppaymentns4hanaid04:cxf,
dcrpaccountssxeroid05:http,
dcrpjournalscsapid06:cxf,
dcrpexpensesccoupaid07:http,
dcrpreceiptsuconcurid08:http,
dcrpbudgetssworkdayid09:http,
dcrptaxescavalararid10:http
```
---

# 🟠 LOGISTICS (LE)

## Semantic Facade

| ID   | Facade Path                     | Vendor     |
|------|---------------------------------|-----------|
| id01 | `/dcrp/shipments/c/id01`     | fedex     |
| id02 | `/dcrp/trackings/u/id02`     | ups       |
| id03 | `/dcrp/deliveries/c/id03`    | dhl       |
| id04 | `/dcrp/shipments/q/id04`     | fedex     |
| id05 | `/dcrp/containers/s/id05`    | maersk    |
| id06 | `/dcrp/warehouses/u/id06`    | sf        |
| id07 | `/dcrp/freights/c/id07`      | coyote    |
| id08 | `/dcrp/routes/s/id08`        | project44 |
| id09 | `/dcrp/manifests/c/id09`     | customs   |
| id10 | `/dcrp/inventory/s/id10`     | wms       |

```text
dcrpshipmentscfedexid01:http,
dcrptrackingsuupsid02:http,
dcrpdeliveriescdhlid03:cxf,
dcrpshipmentsqfedexid04:http,
dcrpcontainerssmaerskid05:http,
dcrpwarehousesusfid06:cxf,
dcrpfreightsccoyoteid07:http,
dcrproutessproject44id08:http,
dcrpmanifestsccustomsid09:cxf,
dcrpinventoryswmsid10:cxf
````

---

# Canonical Action Codes

| Code | Meaning   |
|------|----------|
| c    | Create   |
| r    | Read     |
| u    | Update   |
| d    | Delete   |
| s    | Sync     |
| n    | Notify   |
| t    | Transfer |
| a    | Approve  |
| q    | Query    |

---

# Architectural Notes

- Proxy remains immutable.
- Static domain guards enforce entity boundaries.
- Vendor resolution is metadata-only.
- New vendors require KVM insertion only.
- No proxy redeployment required.

---

# Minimal Reproducible Steps

1. Deploy domain proxy.
2. Attach DDCR routing engine.
3. Create KVM with domain-specific name.
4. Insert routing entries.
5. Test semantic facade.

---

> Stable outside. Infinite variability inside.  
> Business intent enters. Metadata decides.

---
## ⚖️ Attribution & Intellectual Property

Gateway Domain-Centric Routing (GDCR) is an original architectural framework authored by **Ricardo Luz Holanda Viana**.

**First Public Disclosure:** February 7, 2026  
**Canonical Version:** v6.0  
**DOI:** 10.5281/zenodo.xxxxx  
**ORCID:** 0009-0009-9549-5862  
**License:** CC BY 4.0  

---
