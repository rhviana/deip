/**
 * ============================================================
 * GDCR Phantom v12 — Newman Parallel Runner
 * p50 / p85 / p99 per endpoint + per domain + overall
 * Author: Ricardo Luz Holanda Viana
 * ============================================================
 * Usage:
 *   npm install newman
 *   node gdcr-newman-runner.js
 * ============================================================
 */

const newman = require('newman');
const path   = require('path');

// ── Config ────────────────────────────────────────────────────
const ITERATIONS = 2800;   // ~120k requests — fecha 1.5M total
const DELAY_MS   = 10;   // 10ms between requests — safe for SAP trial

const COLLECTIONS = [
  { name: 'Sales-O2C',      file: 'gdcr-collection-sales.json' },
  { name: 'Finance-R2R',    file: 'gdcr-collection-finance.json' },
  { name: 'Logistics-LE',   file: 'gdcr-collection-logistics.json' },
  { name: 'Procurement-S2P',file: 'gdcr-collection-procurement.json' }
];

// ── Percentile calculator ─────────────────────────────────────
function percentile(arr, p) {
  if (!arr || arr.length === 0) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);
  const idx    = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

// ── Run a single collection ───────────────────────────────────
function runCollection(col) {
  return new Promise((resolve) => {
    const timings = {};   // { requestName: [ms, ms, ...] }
    const errors  = [];

    newman.run({
      collection:          path.resolve(__dirname, col.file),
      iterationCount:      ITERATIONS,
      delayRequest:        DELAY_MS,
      reporters:           ['cli'],
      reporter:            { cli: { silent: false } }
    }, (err, summary) => {
      if (err) {
        console.error(`[${col.name}] Newman error:`, err.message);
        resolve({ domain: col.name, timings: {}, errors: [err.message] });
        return;
      }

      // Extract timings from executions
      summary.run.executions.forEach((exec) => {
        const name = exec.item.name;
        const ms   = exec.response ? exec.response.responseTime : null;
        if (ms !== null && ms !== undefined) {
          if (!timings[name]) timings[name] = [];
          timings[name].push(ms);
        }
        if (exec.requestError) {
          errors.push(`${name}: ${exec.requestError.message}`);
        }
      });

      resolve({ domain: col.name, timings, errors });
    });
  });
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   GDCR Phantom v12 — Newman Parallel Runner              ║');
  console.log('║   4 domains × parallel × p50/p85/p99                     ║');
  console.log(`║   Iterations: ${ITERATIONS} per collection | Delay: ${DELAY_MS}ms           ║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  // Run all 4 collections in parallel
  const results = await Promise.all(COLLECTIONS.map(runCollection));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   GDCR PHANTOM v12 — PERFORMANCE REPORT                          ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');

  const allTimes    = [];
  let   totalReqs   = 0;
  let   totalErrors = 0;

  results.forEach((result) => {
    const domainTimes = [];
    console.log(`\n  ▶ Domain: ${result.domain}`);
    console.log(`  ${'─'.repeat(62)}`);
    console.log(`  ${'Endpoint'.padEnd(42)} ${'p50'.padStart(6)} ${'p85'.padStart(6)} ${'p99'.padStart(6)} ${'n'.padStart(5)}`);
    console.log(`  ${'─'.repeat(62)}`);

    Object.entries(result.timings).forEach(([name, times]) => {
      const p50 = percentile(times, 50);
      const p85 = percentile(times, 85);
      const p99 = percentile(times, 99);
      const n   = times.length;

      // Truncate name for display
      const displayName = name.length > 40 ? name.substring(0, 37) + '...' : name;
      console.log(`  ${displayName.padEnd(42)} ${String(p50+'ms').padStart(6)} ${String(p85+'ms').padStart(6)} ${String(p99+'ms').padStart(6)} ${String(n).padStart(5)}`);

      domainTimes.push(...times);
      allTimes.push(...times);
      totalReqs += n;
    });

    if (domainTimes.length > 0) {
      const dp50 = percentile(domainTimes, 50);
      const dp85 = percentile(domainTimes, 85);
      const dp99 = percentile(domainTimes, 99);
      console.log(`  ${'─'.repeat(62)}`);
      console.log(`  ${'DOMAIN TOTAL'.padEnd(42)} ${String(dp50+'ms').padStart(6)} ${String(dp85+'ms').padStart(6)} ${String(dp99+'ms').padStart(6)} ${String(domainTimes.length).padStart(5)}`);
    }

    if (result.errors.length > 0) {
      console.log(`\n  ⚠ Errors (${result.errors.length}):`);
      result.errors.slice(0, 5).forEach(e => console.log(`    - ${e}`));
      totalErrors += result.errors.length;
    }
  });

  // Overall summary
  if (allTimes.length > 0) {
    const op50 = percentile(allTimes, 50);
    const op85 = percentile(allTimes, 85);
    const op99 = percentile(allTimes, 99);
    const oMin = Math.min(...allTimes);
    const oMax = Math.max(...allTimes);
    const oAvg = Math.round(allTimes.reduce((a,b) => a+b, 0) / allTimes.length);

    console.log('\n╠══════════════════════════════════════════════════════════════════╣');
    console.log('║   OVERALL SUMMARY                                                ║');
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log(`║   Total requests : ${String(totalReqs).padEnd(46)}║`);
    console.log(`║   Total errors   : ${String(totalErrors).padEnd(46)}║`);
    console.log(`║   Elapsed time   : ${String(elapsed + 's').padEnd(46)}║`);
    console.log(`║   Min latency    : ${String(oMin + 'ms').padEnd(46)}║`);
    console.log(`║   Avg latency    : ${String(oAvg + 'ms').padEnd(46)}║`);
    console.log(`║   Max latency    : ${String(oMax + 'ms').padEnd(46)}║`);
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log(`║   p50 (median)   : ${String(op50 + 'ms').padEnd(46)}║`);
    console.log(`║   p85            : ${String(op85 + 'ms').padEnd(46)}║`);
    console.log(`║   p99            : ${String(op99 + 'ms').padEnd(46)}║`);
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    // Machine-readable JSON output
    const report = {
      engine:      'GDCR Phantom v12',
      timestamp:   new Date().toISOString(),
      iterations:  ITERATIONS,
      totalRequests: totalReqs,
      totalErrors:   totalErrors,
      overall: { p50: op50, p85: op85, p99: op99, min: oMin, avg: oAvg, max: oMax },
      domains: results.map(r => {
        const dt = Object.values(r.timings).flat();
        return {
          domain: r.domain,
          requests: dt.length,
          p50: percentile(dt, 50),
          p85: percentile(dt, 85),
          p99: percentile(dt, 99)
        };
      })
    };

    const fs = require('fs');
    fs.writeFileSync('gdcr-performance-report.json', JSON.stringify(report, null, 2));
    console.log('  📄 Report saved: gdcr-performance-report.json\n');
  }
}

main().catch(console.error);
