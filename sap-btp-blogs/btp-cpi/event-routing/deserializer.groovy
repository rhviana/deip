// =============================================================================
//  SAP Community Blog
//  title   : Kafka Topic Routing Mechanism Using SDIA with ODCP for SAP CPI
//  author  : Ricardo Viana — SAP BTP Integration Architect | SDIA Creator
// -----------------------------------------------------------------------------
//  note    : this script is a template — the same deserializer applies to
//            every processing iFlow in the domain. only the output block
//            (step 5) changes per event type and target format.
// =============================================================================

import com.sap.gateway.ip.core.customdev.util.Message
import org.apache.avro.Schema
import org.apache.avro.generic.GenericDatumReader
import org.apache.avro.generic.GenericRecord
import org.apache.avro.io.BinaryDecoder
import org.apache.avro.io.DecoderFactory
import groovy.json.JsonBuilder
import groovy.xml.MarkupBuilder
import java.io.ByteArrayInputStream
import java.nio.ByteBuffer

def Message processData(Message message) {

    // ── 1. INPUT — choose according to your scenario ──────────────────────────
    //
    //  PRODUCTION (Kafka Sender Adapter — raw bytes):
    byte[] rawBytes = message.getBody(byte[].class)
    //
    //  SIMULATION — Base64 string (e.g. Content Modifier):
    //  byte[] rawBytes = Base64.getDecoder().decode(message.getBody(String.class).trim())
    //
    //  SIMULATION — Hex string (e.g. Content Modifier):
    //  def hex = message.getBody(String.class).trim().replaceAll("\\s+", "")
    //  byte[] rawBytes = hex.replaceAll("[^0-9a-fA-F]", "").toList().collate(2)
    //                       .collect { it.join() }
    //                       .collect { Integer.parseInt(it, 16) as byte }
    //                       .toArray(new byte[0])
    // ─────────────────────────────────────────────────────────────────────────

    // ── 2. Confluent wire format detection ────────────────────────────────────
    // Confluent prepends: [ 0x00 magic ][ 4 bytes schema ID ][ avro payload ]
    byte[] avroBytes
    if (rawBytes[0] == 0x00) {
        avroBytes = rawBytes[5..-1] as byte[]
    } else {
        avroBytes = rawBytes
    }

    // ── 3. Schema via Externalized Parameter (iFlow immutable) ────────────────
    def schemaStr = message.getProperty("avro").toString()

    // ── 4. Deserialize AVRO → GenericRecord ───────────────────────────────────
    Schema schema = new Schema.Parser().parse(schemaStr)
    ByteArrayInputStream bais = new ByteArrayInputStream(avroBytes)
    BinaryDecoder decoder = DecoderFactory.get().binaryDecoder(bais, null)
    GenericDatumReader reader = new GenericDatumReader(schema)
    GenericRecord decoded = (GenericRecord) reader.read(null, decoder)

    // ── 5. OUTPUT — uncomment JSON or XML according to your needs ─────────────

    // JSON output:
    // def builder = new JsonBuilder()
    // builder {
    //     orderId     decoded.get("orderId").toString()
    //     customerId  decoded.get("customerId").toString()
    //     totalAmount decoded.get("totalAmount")
    //     currency    decoded.get("currency").toString()
    //     status      decoded.get("status").toString()
    //     createdAt   decoded.get("createdAt")
    //     items       decoded.get("items").collect { item -> [
    //         sku     : item.get("sku").toString(),
    //         quantity: item.get("quantity"),
    //         price   : item.get("price")
    //     ]}
    // }
    // message.setBody(builder.toPrettyString())
    // message.setHeader("Content-Type", "application/json")

    // XML output:
    Writer writer = new StringWriter()
    def builder = new MarkupBuilder(new IndentPrinter(writer, ' '))
    builder.Order {
        orderId     decoded.get("orderId").toString()
        customerId  decoded.get("customerId").toString()
        totalAmount decoded.get("totalAmount")
        currency    decoded.get("currency").toString()
        status      decoded.get("status").toString()
        createdAt   decoded.get("createdAt")
        Items {
            decoded.get("items").each { item ->
                Item {
                    sku      item.get("sku").toString()
                    quantity item.get("quantity")
                    price    item.get("price")
                }
            }
        }
    }
    message.setBody(writer.toString())
    message.setHeader("Content-Type", "application/xml")

    return message
}
