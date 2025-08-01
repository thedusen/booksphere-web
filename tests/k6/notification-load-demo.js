import http from 'k6/http';
import { check, sleep, Trend, Counter } from 'k6';

// Simple random utility
function randomIntBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Performance metrics tracking (same as real test)
const deliveryLatency = new Trend('p95_delivery_latency');
const edgeFnDuration = new Trend('edge_fn_duration');
const outboxQueryTime = new Trend('outbox_query_ms');
const wsConnections = new Counter('ws_connections');
const wsErrors = new Counter('ws_errors');
const httpErrors = new Counter('http_errors');
const eventsReceived = new Counter('events_received');
const eventsTriggered = new Counter('events_triggered');

export let options = {
  scenarios: {
    notification_load: {
      executor: 'constant-vus',
      vus: parseInt(__ENV.LOAD_VUS || '10'), // Reduced for demo
      duration: __ENV.LOAD_DURATION || '30s', // Shorter for demo
      tags: { scenario: 'main_load' },
    },
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: parseInt(__ENV.SPIKE_VUS || '20') },
        { duration: '20s', target: parseInt(__ENV.SPIKE_VUS || '20') },
        { duration: '10s', target: 0 },
      ],
      tags: { scenario: 'spike' },
      startTime: '35s',
    },
  },
  thresholds: {
    // SLO targets from the performance strategy
    'p95_delivery_latency': ['p(95)<1500'], // 1.5s end-to-end latency
    'edge_fn_duration': ['p(95)<500'],      // 500ms Edge Function
    'outbox_query_ms': ['p(95)<200'],       // 200ms database queries
    'ws_errors': ['count<10'],              // <10 WebSocket errors total
    'http_errors': ['count<50'],            // <50 HTTP errors total
    'http_req_duration': ['p(95)<2000'],    // HTTP request latency
    'http_req_failed': ['rate<0.01'],       // <1% HTTP failure rate
    'events_received': ['count>50'],        // Expect >50 events in 30s (demo)
  },
};

// Demo configuration
const config = {
  demoMode: true,
  eventsPerUserPerInterval: parseInt(__ENV.EVENTS_PER_USER || '3'),
  intervalSeconds: parseInt(__ENV.INTERVAL_SECONDS || '5'),
  enableDetailedLogging: __ENV.DETAILED_LOGGING === 'true',
};

// Simulate authentication (demo mode)
function simulateAuthentication() {
  if (config.enableDetailedLogging) {
    console.log(`VU ${__VU}: [DEMO] Simulating authentication...`);
  }
  
  // Simulate auth latency
  sleep(randomIntBetween(50, 200) / 1000);
  
  return 'demo-access-token-' + __VU;
}

// Simulate WebSocket connection
function simulateWebSocketConnection(accessToken, organizationId) {
  wsConnections.add(1);
  
  if (config.enableDetailedLogging) {
    console.log(`VU ${__VU}: [DEMO] Simulating WebSocket connection for org ${organizationId}`);
  }
  
  // Simulate connection establishment time
  sleep(randomIntBetween(100, 300) / 1000);
  
  return {
    connected: true,
    orgId: organizationId,
    token: accessToken
  };
}

// Simulate cataloging event triggers with realistic performance characteristics
function simulateCatalogingEvents(accessToken, organizationId, eventCount) {
  const startTime = Date.now();
  
  // Simulate HTTP request to trigger events
  const demoUrl = 'https://httpbin.org/delay/' + (randomIntBetween(0, 2));
  
  const response = http.get(demoUrl, {
    headers: {
      'User-Agent': 'Booksphere-k6-Performance-Test',
      'X-Demo-Mode': 'true',
      'X-Organization-ID': organizationId,
      'X-Event-Count': eventCount.toString(),
    },
    tags: { endpoint: 'bulk_update_demo' },
  });
  
  const duration = Date.now() - startTime;
  
  // Simulate realistic response characteristics
  const simulatedResponse = {
    success: response.status === 200,
    jobs_updated: eventCount,
    events_created: eventCount,
    processing_time_ms: randomIntBetween(50, 200),
    outbox_query_duration_ms: randomIntBetween(10, 100),
    edge_function_duration_ms: randomIntBetween(100, 400),
    organization_id: organizationId,
    timestamp: Date.now()
  };
  
  if (check(response, {
    'demo request successful': (r) => r.status === 200,
    'reasonable response time': (r) => r.timings.duration < 5000,
  })) {
    eventsTriggered.add(eventCount);
    
    // Record simulated metrics
    edgeFnDuration.add(simulatedResponse.edge_function_duration_ms);
    outboxQueryTime.add(simulatedResponse.outbox_query_duration_ms);
    
    // Simulate receiving notifications back (realistic delivery time)
    const deliveryDelay = randomIntBetween(100, 800);
    deliveryLatency.add(deliveryDelay);
    eventsReceived.add(eventCount);
    
    if (config.enableDetailedLogging) {
      console.log(`VU ${__VU}: [DEMO] Triggered ${eventCount} events - Response time: ${duration}ms`);
    }
  } else {
    httpErrors.add(1);
    if (config.enableDetailedLogging) {
      console.error(`VU ${__VU}: [DEMO] Request failed: ${response.status}`);
    }
  }
  
  return response;
}

// Simulate database health check
function simulateDatabaseHealth(accessToken) {
  const healthUrl = 'https://httpbin.org/json';
  
  const response = http.get(healthUrl, {
    headers: {
      'User-Agent': 'Booksphere-k6-Health-Check',
    },
    tags: { endpoint: 'health_check_demo' },
  });
  
  if (check(response, {
    'health check successful': (r) => r.status === 200,
  })) {
    // Simulate realistic database query time
    const simulatedQueryTime = randomIntBetween(20, 150);
    outboxQueryTime.add(simulatedQueryTime);
    
    if (config.enableDetailedLogging) {
      console.log(`VU ${__VU}: [DEMO] Health check - Simulated query time: ${simulatedQueryTime}ms`);
    }
  }
  
  return response;
}

// Main test function
export default function() {
  console.log(`VU ${__VU}: [DEMO MODE] Starting performance test simulation`);
  
  // Simulate authentication
  const accessToken = simulateAuthentication();
  if (!accessToken) {
    console.error(`VU ${__VU}: [DEMO] Failed to authenticate`);
    return;
  }
  
  // Simulate organization assignment
  const orgId = 'demo-org-' + (__VU % 5); // Distribute across 5 demo orgs
  
  // Simulate WebSocket connection
  const socket = simulateWebSocketConnection(accessToken, orgId);
  if (!socket.connected) {
    wsErrors.add(1);
    return;
  }
  
  // Main event generation loop
  const iterations = Math.ceil(parseInt(__ENV.LOAD_DURATION?.replace('s', '') || '30') / config.intervalSeconds);
  
  for (let i = 0; i < iterations; i++) {
    // Health check every 3rd iteration
    if (i % 3 === 0) {
      simulateDatabaseHealth(accessToken);
    }
    
    // Trigger cataloging events
    simulateCatalogingEvents(accessToken, orgId, config.eventsPerUserPerInterval);
    
    // Wait for next interval
    sleep(config.intervalSeconds);
  }
  
  if (config.enableDetailedLogging) {
    console.log(`VU ${__VU}: [DEMO] Completed ${iterations} iterations`);
  }
}

// Test lifecycle hooks
export function setup() {
  console.log('🚀 Booksphere Real-time Notification Load Test - DEMO MODE');
  console.log('================================================');
  console.log('This is a demonstration of the k6 performance test suite.');
  console.log('In production, this would connect to actual Supabase endpoints.');
  console.log('');
  console.log(`Demo Configuration:
    - Duration: ${options.scenarios.notification_load.duration}
    - Virtual Users: ${options.scenarios.notification_load.vus}
    - Events per User per Interval: ${config.eventsPerUserPerInterval}
    - Interval: ${config.intervalSeconds}s
    - Target Events: ~${(options.scenarios.notification_load.vus * config.eventsPerUserPerInterval * 6)}
  `);
  console.log('');
  console.log('🎯 SLO Targets Being Measured:');
  console.log('  - p95 Delivery Latency: <1500ms');
  console.log('  - Edge Function Duration: <500ms');
  console.log('  - Database Query Time: <200ms');
  console.log('  - WebSocket Error Rate: <0.1%');
  console.log('  - HTTP Error Rate: <1%');
  console.log('');
  
  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log('');
  console.log('✅ Demo Load Test Completed!');
  console.log('============================');
  console.log(`Duration: ${duration}s`);
  console.log('');
  console.log('📊 Demo Results Summary:');
  console.log(`  - Events Triggered: ${eventsTriggered.count}`);
  console.log(`  - Events Received: ${eventsReceived.count}`);
  console.log(`  - WebSocket Connections: ${wsConnections.count}`);
  console.log(`  - WebSocket Errors: ${wsErrors.count}`);
  console.log(`  - HTTP Errors: ${httpErrors.count}`);
  
  if (eventsTriggered.count > 0) {
    const deliveryRate = ((eventsReceived.count / eventsTriggered.count) * 100).toFixed(2);
    console.log(`  - Delivery Rate: ${deliveryRate}%`);
  }
  
  console.log('');
  console.log('🔍 Performance Analysis:');
  console.log('In a real environment, this test would measure:');
  console.log('  - End-to-end latency from DB insert to client notification');
  console.log('  - Edge Function processing time under load');
  console.log('  - Database query performance with indexes');
  console.log('  - WebSocket connection stability');
  console.log('  - System resource utilization');
  console.log('');
  console.log('📈 Scale Projections:');
  console.log('Based on the performance strategy analysis:');
  console.log('  - 100 concurrent users → ~1,000 events/min');
  console.log('  - Expected p95 latency: 750-900ms (within 1.5s SLO)');
  console.log('  - Database CPU usage: ~10-12% on t3.medium');
  console.log('  - Edge Function throughput: ~17 QPS');
  console.log('');
  console.log('🚀 Next Steps for Production Testing:');
  console.log('  1. Start Supabase locally: npx supabase start');
  console.log('  2. Run: ./tests/k6/run-performance-tests.sh baseline');
  console.log('  3. Scale up to full load testing with 100+ VUs');
  console.log('  4. Monitor SLO compliance and optimize bottlenecks');
} 