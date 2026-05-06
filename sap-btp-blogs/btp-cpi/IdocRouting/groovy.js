// =============================================================================
//  SCRIPT  : IDoc Generic Channel Builder via VM metadata
//  AUTHOR  : Ricardo Viana — SAP BTP Integration Suite Expert
//  VERSION : 1.0.0
//  DATE    : 2026-05-06
// -----------------------------------------------------------------------------
//  DESCRIPTION
//  -----------
//  This script is part of a Generic IDoc Routing architecture on SAP BTP
//  Integration Suite (CPI). It acts as the dynamic routing decision engine
//  inside a generic inbound IDoc iFlow, enabling a single integration
//  endpoint to receive ANY IDoc type from ANY SAP source system and route
//  it to the correct Process Direct channel — without any hardcoded logic.
//
//  PRE-REQUISITES
//  --------------
//  Content Modifier (before this script) must set the following exchange
//  properties using native CPI XPath expressions:
//    IDOC_TYP   ← //*[local-name()='IDOCTYP']/text()
//    IDOC_EXTN  ← //*[local-name()='CIMTYP']/text()
//    MSG_TYP    ← //*[local-name()='MESTYP']/text()
//    SNDSYS     ← //*[local-name()='SNDPRN']/text()
//
//
//  NOTE: Source values in the Value Mapping must match the EXACT case of
//  the values in the IDoc Control Record (typically UPPERCASE for IDOCTYP
//  and the sender system name as registered in SAP).
//
//  PROCESS DIRECT CHANNEL
//  ----------------------
//  The downstream Process Direct receiver channel must be configured with
//  the dynamic address expression: ${property.TARGET_CHANNEL}
//  The base path (e.g. /generic/routing/idoc) is set directly on the
//  listener channel — not in this script.
//
//  FALLBACK BEHAVIOUR
//  ------------------
//  If the composite key is not found in the Value Mapping, TARGET_CHANNEL
//  is set to "unknown" and IS_MAPPED is set to "false". A dedicated Process
//  Direct listener at that address should handle dead-letter alerting.
// =============================================================================

import com.sap.gateway.ip.core.customdev.util.Message
import com.sap.it.api.ITApiFactory
import com.sap.it.api.mapping.ValueMappingApi

def Message processData(Message message) {

    // =========================================================================
    //  SECTION 1 — VALUE MAPPING COORDINATES
    //  These four constants are the only configuration point in this script.
    //  All routing logic lives exclusively in the Value Mapping artifact.
    //  Update these values only if the VM artifact is renamed or restructured.
    // =========================================================================
    def VM_AGENCY_SRC = 'sap.idoc'        // Agency that owns the IDoc type codes (SAP source)
    def VM_ID_SRC     = 'idoc.control.type'   // Identifier: composite key IDOCTYP.SNDPRN
    def VM_AGENCY_TGT = 'enterprise.integration'    // Agency that owns the routing target
    def VM_ID_TGT     = 'pd.routing.channel'  // Identifier: full Process Direct channel address
    def FALLBACK      = 'unknown'        // Dead-letter value when no VM entry is found


    // =========================================================================
    //  SECTION 2 — READ EXCHANGE PROPERTIES
    //  Retrieve values set by the upstream Content Modifier via native XPath.
    //  Using direct map access (props[key]) is faster than getProperty(key)
    //  because it avoids the overhead of the generic property resolution chain.
    //  RAW variables preserve the original case for the Value Mapping lookup.
    //  Normalised variables are lowercased for downstream process consistency.
    // =========================================================================
    def props = message.getProperties()

    // Preserve original case — required to match VM entries (e.g. "ORDERS05")
    def idocTypRaw = (props['IDOC_TYP'] as String)?.trim() ?: ''
    def mandSys  = (props['MANDT']   as String)?.trim() ?: ''
    def sndSysRaw  = (props['SNDSYS']   as String)?.trim() ?: ''

    // =========================================================================
    //  SECTION 3 — COMPOSITE KEY ASSEMBLY
    //  The lookup key is built by concatenating IDOCTYP and SNDPRN with a dot
    //  separator. This strategy enables per-division routing using a single
    //  Value Mapping group, without requiring separate VM artifacts per division.
    //
    //  Format  : {IDOCTYP}.{SNDPRN}.{MANDT}
    //  Examples: ORDERS05.ERP1402.100  |  INVOIC02.SAP849.001  |  DELVRY07.ERP1402.150
    //
    //  Both components retain their original case to match the VM entries
    //  exactly — the Value Mapping API performs a case-sensitive comparison.
    // =========================================================================
    def vmKey = "${idocTypRaw}.${sndSysRaw}.${mandSys}"


    // =========================================================================
    //  SECTION 4 — VALUE MAPPING LOOKUP
    //  Single API call resolves the composite key to the full Process Direct
    //  channel address. Using ITApiFactory.getApi() is the recommended and
    //  most performant way to access CPI APIs in Groovy scripts — the runtime
    //  caches the API instance, so repeated calls within the same worker thread
    //  do not incur object creation overhead.
    //  On lookup failure (key not found or VM not deployed), the script does
    //  NOT throw — it falls back gracefully and logs the failure detail.
    // =========================================================================
    def targetChannel = FALLBACK
    def vmError       = ''

    try {
        def vmApi  = ITApiFactory.getApi(ValueMappingApi.class, null)
        def mapped = vmApi.getMappedValue(
            VM_AGENCY_SRC, VM_ID_SRC, vmKey,   // source: composite key
            VM_AGENCY_TGT, VM_ID_TGT           // target: Process Direct address
        )

        // Assign only if the VM returned a non-blank value
        if (mapped?.trim()) targetChannel = mapped.trim()

    } catch (Exception e) {
        // Capture the error message for MPL logging — never propagate the
        // exception so the iFlow can route to the dead-letter channel instead
        // of generating a hard technical fault
        vmError = e.message ?: 'unknown error'
    }


    // =========================================================================
    //  SECTION 5 — SET OUTPUT PROPERTIES
    //  TARGET_CHANNEL  : consumed by the Process Direct receiver channel via
    //                    the dynamic address expression ${property.TARGET_CHANNEL}
    //  IS_MAPPED       : flag for downstream Router steps or monitoring alerts
    //  VM_KEY          : stored for full traceability in the MPL and alerting
    // =========================================================================
    props.put('TARGET_CHANNEL', targetChannel)
    props.put('IS_MAPPED',      (targetChannel != FALLBACK).toString())
    props.put('VM_KEY',         vmKey)


    // =========================================================================
    //  SECTION 6 — MPL OBSERVABILITY LOG
    //  Writes a structured attachment to the Message Processing Log visible
    //  in the CPI Operations Monitor. Provides full routing traceability:
    //  input values, composite key used, VM outcome, and final decision.
    //  The logger null-check avoids failures when trace level is not active.
    // =========================================================================
    messageLogFactory.getMessageLog(message)?.addAttachmentAsString(
        'IDoc Channel Builder — Routing Decision',
        """\
╔══════════════════════════════════════════════════════╗
║         IDoc Generic Channel Builder  v2.0.0         ║
║         Ricardo Viana — SAP BTP Integration Expert   ║
╚══════════════════════════════════════════════════════╝

── INPUT (from Content Modifier) ────────────────────────
  IDOC_TYP  (raw)  : ${idocTypRaw}

── VALUE MAPPING LOOKUP ──────────────────────────────────
  Agency  (source) : ${VM_AGENCY_SRC}
  Identif.(source) : ${VM_ID_SRC}
  Composite key    : ${vmKey}
  Agency  (target) : ${VM_AGENCY_TGT}
  Identif.(target) : ${VM_ID_TGT}
  VM error         : ${vmError ?: 'none'}

── ROUTING DECISION ──────────────────────────────────────
  TARGET_CHANNEL   : ${targetChannel}
  IS_MAPPED        : ${targetChannel != FALLBACK}
─────────────────────────────────────────────────────────
""",
        'text/plain'
    )

    return message
}
