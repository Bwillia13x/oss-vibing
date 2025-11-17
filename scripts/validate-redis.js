#!/usr/bin/env node

/**
 * Redis Deployment Validator
 * 
 * Validates Redis deployment and cache performance
 * Run after deploying Redis to staging or production
 * 
 * Usage:
 *   node scripts/validate-redis.js
 *   node scripts/validate-redis.js --url https://your-app.vercel.app
 */

const https = require('https');
const http = require('http');

const TARGET_HIT_RATE = 70; // 70%
const TARGET_P95_LATENCY = 200; // 200ms
const VALIDATION_DURATION_MS = 60000; // 1 minute
const CHECK_INTERVAL_MS = 5000; // 5 seconds

// Parse command line arguments
const args = process.argv.slice(2);
const urlIndex = args.indexOf('--url');
const baseUrl = urlIndex !== -1 && args[urlIndex + 1] 
  ? args[urlIndex + 1] 
  : 'http://localhost:3000';

console.log('🔍 Redis Deployment Validator\n');
console.log(`Base URL: ${baseUrl}`);
console.log(`Validation Duration: ${VALIDATION_DURATION_MS / 1000}s`);
console.log(`Check Interval: ${CHECK_INTERVAL_MS / 1000}s\n`);

// Track metrics
const metrics = {
  checks: 0,
  successes: 0,
  failures: 0,
  hitRates: [],
  latencies: [],
  redisConnected: null,
};

/**
 * Fetch health check data
 */
async function checkHealth() {
  return new Promise((resolve, reject) => {
    const url = `${baseUrl}/api/health/cache`;
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const latency = Date.now() - startTime;
        
        try {
          const json = JSON.parse(data);
          resolve({ json, latency });
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Run single health check
 */
async function runCheck() {
  metrics.checks++;
  
  try {
    const { json, latency } = await checkHealth();
    metrics.successes++;
    metrics.latencies.push(latency);
    
    // Extract hit rate
    const hitRateStr = json.cache?.hitRate || '0%';
    const hitRate = parseFloat(hitRateStr.replace('%', ''));
    metrics.hitRates.push(hitRate);
    
    // Track Redis connection status
    metrics.redisConnected = json.redis?.connected;
    
    console.log(`✓ Check ${metrics.checks}: Redis=${json.redis?.connected ? 'ON' : 'OFF'}, HitRate=${hitRateStr}, Latency=${latency}ms`);
    
  } catch (error) {
    metrics.failures++;
    console.log(`✗ Check ${metrics.checks}: ${error.message}`);
  }
}

/**
 * Calculate percentile
 */
function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Calculate average
 */
function average(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Generate validation report
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION REPORT');
  console.log('='.repeat(60) + '\n');
  
  // Health checks
  console.log('Health Checks:');
  console.log(`  Total: ${metrics.checks}`);
  console.log(`  Successful: ${metrics.successes}`);
  console.log(`  Failed: ${metrics.failures}`);
  console.log(`  Success Rate: ${((metrics.successes / metrics.checks) * 100).toFixed(2)}%\n`);
  
  // Redis status
  console.log('Redis Connection:');
  console.log(`  Status: ${metrics.redisConnected ? '✅ Connected' : '❌ Disconnected'}\n`);
  
  // Cache performance
  if (metrics.hitRates.length > 0) {
    const avgHitRate = average(metrics.hitRates);
    const hitRatePass = avgHitRate >= TARGET_HIT_RATE;
    
    console.log('Cache Hit Rate:');
    console.log(`  Average: ${avgHitRate.toFixed(2)}%`);
    console.log(`  Target: ${TARGET_HIT_RATE}%`);
    console.log(`  Status: ${hitRatePass ? '✅ PASS' : '⚠️  BELOW TARGET'}\n`);
  }
  
  // Latency
  if (metrics.latencies.length > 0) {
    const p50 = percentile(metrics.latencies, 50);
    const p95 = percentile(metrics.latencies, 95);
    const p99 = percentile(metrics.latencies, 99);
    const latencyPass = p95 <= TARGET_P95_LATENCY;
    
    console.log('API Latency:');
    console.log(`  p50: ${p50}ms`);
    console.log(`  p95: ${p95}ms`);
    console.log(`  p99: ${p99}ms`);
    console.log(`  Target (p95): ${TARGET_P95_LATENCY}ms`);
    console.log(`  Status: ${latencyPass ? '✅ PASS' : '⚠️  ABOVE TARGET'}\n`);
  }
  
  // Overall result
  console.log('='.repeat(60));
  const redisOk = metrics.redisConnected === true;
  const hitRateOk = metrics.hitRates.length > 0 && average(metrics.hitRates) >= TARGET_HIT_RATE;
  const latencyOk = metrics.latencies.length > 0 && percentile(metrics.latencies, 95) <= TARGET_P95_LATENCY;
  const allPassed = redisOk && hitRateOk && latencyOk;
  
  console.log(`Overall Status: ${allPassed ? '✅ ALL CHECKS PASSED' : '⚠️  SOME CHECKS FAILED'}`);
  console.log('='.repeat(60) + '\n');
  
  if (!allPassed) {
    console.log('Recommendations:');
    if (!redisOk) {
      console.log('  • Check REDIS_URL environment variable');
      console.log('  • Verify Upstash database is running');
      console.log('  • Check network connectivity');
    }
    if (!hitRateOk) {
      console.log('  • Cache may need warming period');
      console.log('  • Verify cache keys are being set correctly');
      console.log('  • Run validation for longer period');
    }
    if (!latencyOk) {
      console.log('  • Check Redis instance location (should be near app)');
      console.log('  • Consider upgrading Redis plan');
      console.log('  • Optimize cache key patterns');
    }
    console.log('');
  }
  
  process.exit(allPassed ? 0 : 1);
}

/**
 * Main validation loop
 */
async function main() {
  console.log('Starting validation...\n');
  
  const startTime = Date.now();
  
  // Run initial check
  await runCheck();
  
  // Schedule periodic checks
  const interval = setInterval(async () => {
    await runCheck();
    
    // Check if validation period is complete
    if (Date.now() - startTime >= VALIDATION_DURATION_MS) {
      clearInterval(interval);
      generateReport();
    }
  }, CHECK_INTERVAL_MS);
}

// Run validator
main().catch((error) => {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
});
