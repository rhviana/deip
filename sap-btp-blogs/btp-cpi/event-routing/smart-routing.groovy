// =============================================================================
//  SAP Community Blog
//  title   : Kafka Topic Routing Mechanism Using SDIA with ODCP for SAP CPI
//  author  : Ricardo Viana — SAP BTP Integration Architect | SDIA Creator
//  version : 2.0.0
//  date    : 2026-05-23
// -----------------------------------------------------------------------------
//  pattern : SDIA — Semantic Domain Integration Architecture · ODCP Layer 3
//  purpose : domain-scoped kafka topic router
//            single consumer    — direct ProcessDirect
//            xconsumer          — splitter + loop
//            both               — multicast parallel (single + xconsumer)
//            fallback           — structured error payload
// -----------------------------------------------------------------------------
//  routing states:
//    SINGLE   → is_single=true  · is_xconsumer=false
//    XCONS    → is_single=false · is_xconsumer=true
//    BOTH     → is_single=true  · is_xconsumer=true
//    FALLBACK → is_mapped=false
// =============================================================================

import com.sap.gateway.ip.core.customdev.util.Message
import com.sap.it.api.ITApiFactory
import com.sap.it.api.mapping.ValueMappingApi
import java.util.Base64

// =============================================================================
//  processData — router entry point
// =============================================================================
def Message processData(Message message) {

    def props   = message.getProperties()
    def headers = message.getHeaders()

    // ── preserve original AVRO payload as Base64 ─────────────────────────────
    props.put('b64', Base64.getEncoder().encodeToString(
        message.getBody(byte[].class)
    ))

    // ── read kafka topic from header ──────────────────────────────────────────
    String topic  = (headers['kafka.TOPIC'] as String)?.trim() ?: ''
    String single = ''
    String multi  = ''
    String err    = ''

    try {
        def vm = ITApiFactory.getApi(ValueMappingApi.class, null)

        // ── lookup 1: single consumer ─────────────────────────────────────────
        def s = vm.getMappedValue(
            'sales.o2c.kafka', 'kafka.topic', topic,
            'acme.enterprise.division', 'acme.br.pd.o2c.iflow'
        )
        if (s?.trim()) single = s.trim().toString()

        // ── lookup 2: xconsumer ───────────────────────────────────────────────
        def m = vm.getMappedValue(
            'sales.o2c.kafka', 'kafka.topic', topic,
            'acme.enterprise.division', 'acme.br.pd.xconsumers.o2c.iflows'
        )
        if (m?.trim()) multi = buildTargets(m.trim().toString())

    } catch (Exception e) {
        err = e.message ?: 'unknown error'
    }

    // ── routing state ─────────────────────────────────────────────────────────
    boolean isSingle   = single != ''
    boolean isXcons    = multi  != ''
    boolean isMapped   = isSingle || isXcons

    props.put('is_single',    isSingle.toString())
    props.put('is_xconsumer', isXcons.toString())
    props.put('is_mapped',    isMapped.toString())
    props.put('vm_error',     err)
    headers.put('vm_key',     topic)

    // ── set targets per routing state ─────────────────────────────────────────
    if (isSingle)  props.put('target_channel',  single)
    if (isXcons) {
        props.put('target_channels', multi)
        props.put('target_count',    multi.split(',').length.toString())
        props.put('loop_index',      '0')
        // serialize targets to body for splitter
        message.setBody(buildXml(multi))
    }

    return message
}

// =============================================================================
//  restoreOriginal — restores AVRO bytes for BOTH branch (single leg)
// =============================================================================
def Message restoreOriginal(Message message) {

    // ── restore original AVRO bytes ───────────────────────────────────────────
    message.setBody(Base64.getDecoder().decode(message.getProperty('b64').toString()))

    return message
}

// =============================================================================
//  buildErrorPayload — structured JSON error on routing failure
// =============================================================================
def Message buildErrorPayload(Message message) {

    def props     = message.getProperties()
    String topic  = (message.getHeaders()['vm_key']  as String)?.trim() ?: 'n/a'
    String err    = (props['vm_error']               as String)?.trim() ?: 'none'
    String ts     = new Date().format("yyyy-MM-dd HH:mm:ss")

    message.setBody(
        groovy.json.JsonOutput.prettyPrint(
            groovy.json.JsonOutput.toJson([
                header : [
                    script  : 'acme.core.script.kafka.router',
                    author  : 'Ricardo Viana - SAP BTP Integration Architect',
                    severity: 'error'
                ],
                input  : [ kafka_topic: topic ],
                routing: [
                    timestamp     : ts,
                    vm_key        : topic,
                    is_mapped     : false,
                    vm_artifact   : 'sales.o2c.kafka',
                    vm_error      : err
                ],
                action_required: 'Register topic ' + topic + ' in value mapping sales.o2c.kafka'
            ])
        )
    )
    message.setHeader('Content-Type', 'application/json')
    return message
}

// =============================================================================
//  helpers — private
// =============================================================================

// builds full ProcessDirect URLs from pipe-delimited VM value
// input : /id01/created | /id03/cancelled | /id04/confirmed
// output: /id01/kafka/topic/order/created,/id03/kafka/topic/order/cancelled,...
    private String buildTargets(String raw) {
        String base = '/kafka/topic/order/'
        return raw.split('\\|').collect { seg ->
            def parts = seg.trim().toString().split('/').findAll { it }
            ('/' + parts[0].toString() + base + parts[1].toString())
        }.join(',')
    }
    
    // builds XML body for the Splitter step
    // output: <targets><target>/id01/...</target>...</targets>
    private String buildXml(String targets) {
        String xml = '<targets>'
        targets.split(',').each { t ->
            xml = xml + '<target>' + t.trim().toString() + '</target>'
        }
        return xml + '</targets>'
    }
