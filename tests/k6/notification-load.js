import ws from 'k6/ws';
import http from 'k6/http';
import { check, sleep, Trend, Counter } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Performance metrics tracking
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
    // Main load test scenario
    notification_load: {
      executor: 'constant-vus',
      vus: parseInt(__ENV.LOAD_VUS || '100'),
      duration: __ENV.LOAD_DURATION || '5m',
      tags: { scenario: 'main_load' },
    },
    // Spike test scenario
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: parseInt(__ENV.SPIKE_VUS || '200') },
        { duration: '1m', target: parseInt(__ENV.SPIKE_VUS || '200') },
        { duration: '30s', target: 0 },
      ],
      tags: { scenario: 'spike' },
      startTime: '6m', // Start after main load test
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
    'events_received': ['count>4500'],      // Expect >4500 events in 5min (90% delivery)
  },
};

// Environment configuration
const config = {
  // Supabase configuration
  supabaseUrl: __ENV.SUPABASE_URL || 'http://localhost:54321',
  supabaseAnonKey: __ENV.SUPABASE_ANON_KEY || '',
  realtimeUrl: __ENV.REALTIME_URL || 'ws://localhost:54321/realtime/v1/websocket',
  
  // Test user credentials
  testEmail: __ENV.TEST_EMAIL || 'testuser@email.com',
  testPassword: __ENV.TEST_PASSWORD || 'testuser',
  organizationId: __ENV.TEST_ORG_ID || '',
  
  // Test parameters
  eventsPerUserPerInterval: parseInt(__ENV.EVENTS_PER_USER || '10'),
  intervalSeconds: parseInt(__ENV.INTERVAL_SECONDS || '30'),
  enableDetailedLogging: __ENV.DETAILED_LOGGING === 'true',
};

// Authentication helper
function authenticate() {
  const authResponse = http.post(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, 
    JSON.stringify({
      email: config.testEmail,
      password: config.testPassword,
    }), 
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.supabaseAnonKey,
      },
    }
  );

  if (!check(authResponse, {
    'authentication successful': (r) => r.status === 200,
  })) {
    console.error(`Authentication failed: ${authResponse.status} ${authResponse.body}`);
    return null;
  }

  const authData = JSON.parse(authResponse.body);
  return authData.access_token;
}

// WebSocket connection and message handling
function connectToRealtime(accessToken, organizationId) {
  const wsUrl = `${config.realtimeUrl}?apikey=${config.supabaseAnonKey}&vsn=1.0.0`;
  
  return new Promise((resolve, reject) => {
    const res = ws.connect(wsUrl, { 
      tags: { user: __VU },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    }, function (socket) {
      let connectionEstablished = false;
      let messageCount = 0;
      const startTime = Date.now();

      socket.on('open', () => {
        wsConnections.add(1);
        if (config.enableDetailedLogging) {
          console.log(`VU ${__VU}: WebSocket connected`);
        }

        // Send connection message
        socket.send(JSON.stringify({
          topic: 'phoenix',
          event: 'heartbeat',
          payload: {},
          ref: `${__VU}_${Date.now()}`
        }));

        // Subscribe to cataloging events channel
        socket.send(JSON.stringify({
          topic: `cataloging_events:organization_id=eq.${organizationId}`,
          event: 'phx_join',
          payload: {
            config: {
              broadcast: { self: false },
              presence: { key: '' },
              private: false
            }
          },
          ref: `${__VU}_join_${Date.now()}`
        }));

        connectionEstablished = true;
        resolve(socket);
      });

      socket.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          messageCount++;

          if (config.enableDetailedLogging && messageCount <= 5) {
            console.log(`VU ${__VU}: Received message: ${JSON.stringify(message)}`);
          }

          // Handle cataloging event notifications
          if (message.topic && message.topic.includes('cataloging_events') && message.event === 'broadcast') {
            const payload = message.payload;
            if (payload && payload.event_data && payload.event_data.timestamp) {
              const eventTimestamp = new Date(payload.event_data.timestamp).getTime();
              const receivedTimestamp = Date.now();
              const latency = receivedTimestamp - eventTimestamp;
              
              deliveryLatency.add(latency);
              eventsReceived.add(1);
              
              if (config.enableDetailedLogging && eventsReceived.count % 100 === 0) {
                console.log(`VU ${__VU}: Event ${eventsReceived.count} - Latency: ${latency}ms`);
              }
            }
          }

          // Handle subscription confirmations
          if (message.event === 'phx_reply' && message.payload && message.payload.status === 'ok') {
            if (config.enableDetailedLogging) {
              console.log(`VU ${__VU}: Subscription confirmed for ${message.topic}`);
            }
          }

        } catch (error) {
          wsErrors.add(1);
          if (config.enableDetailedLogging) {
            console.error(`VU ${__VU}: Error parsing WebSocket message: ${error.message}`);
          }
        }
      });

      socket.on('error', (error) => {
        wsErrors.add(1);
        console.error(`VU ${__VU}: WebSocket error: ${error}`);
        if (!connectionEstablished) {
          reject(new Error(`WebSocket connection failed: ${error}`));
        }
      });

      socket.on('close', () => {
        if (config.enableDetailedLogging) {
          console.log(`VU ${__VU}: WebSocket closed after ${(Date.now() - startTime) / 1000}s, received ${messageCount} messages`);
        }
      });

      // Set timeout for the connection
      socket.setTimeout(() => {
        if (config.enableDetailedLogging) {
          console.log(`VU ${__VU}: Closing WebSocket after timeout`);
        }
        socket.close();
      }, 320000); // 5m 20s to outlast the test duration
    });
  });
}

// Trigger cataloging job events
function triggerCatalogingEvents(accessToken, organizationId, eventCount) {
  const startTime = Date.now();
  
  // Simulate bulk cataloging job status updates
  const updateResponse = http.post(
    `${config.supabaseUrl}/rest/v1/rpc/bulk_update_cataloging_jobs`,
    JSON.stringify({
      organization_id: organizationId,
      job_count: eventCount,
      new_status: ['processing', 'ready_for_review', 'completed'][randomIntBetween(0, 2)],
      simulate_processing_time: true
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': config.supabaseAnonKey,
      },
      tags: { endpoint: 'bulk_update_jobs' },
    }
  );

  const duration = Date.now() - startTime;
  
  if (check(updateResponse, {
    'bulk update successful': (r) => r.status === 200,
    'response has timing data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && typeof body.processing_time_ms === 'number';
      } catch {
        return false;
      }
    },
  })) {
    eventsTriggered.add(eventCount);
    
    try {
      const responseData = JSON.parse(updateResponse.body);
      if (responseData.edge_function_duration_ms) {
        edgeFnDuration.add(responseData.edge_function_duration_ms);
      }
      if (responseData.outbox_query_duration_ms) {
        outboxQueryTime.add(responseData.outbox_query_duration_ms);
      }
      
      if (config.enableDetailedLogging && eventsTriggered.count % 50 === 0) {
        console.log(`VU ${__VU}: Triggered ${eventsTriggered.count} events total - Last batch: ${eventCount} events in ${duration}ms`);
      }
    } catch (error) {
      if (config.enableDetailedLogging) {
        console.error(`VU ${__VU}: Error parsing bulk update response: ${error.message}`);
      }
    }
  } else {
    httpErrors.add(1);
    console.error(`VU ${__VU}: Bulk update failed: ${updateResponse.status} ${updateResponse.body}`);
  }

  return updateResponse;
}

// Database health check
function checkDatabaseHealth(accessToken) {
  const healthResponse = http.get(
    `${config.supabaseUrl}/rest/v1/rpc/get_outbox_health_metrics`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': config.supabaseAnonKey,
      },
      tags: { endpoint: 'health_check' },
    }
  );

  if (check(healthResponse, {
    'health check successful': (r) => r.status === 200,
  })) {
    try {
      const healthData = JSON.parse(healthResponse.body);
      if (healthData && healthData.avg_query_time_ms) {
        outboxQueryTime.add(healthData.avg_query_time_ms);
      }
    } catch (error) {
      if (config.enableDetailedLogging) {
        console.error(`VU ${__VU}: Error parsing health response: ${error.message}`);
      }
    }
  }

  return healthResponse;
}

// Main test function
export default function() {
  // Authenticate once per VU
  const accessToken = authenticate();
  if (!accessToken) {
    console.error(`VU ${__VU}: Failed to authenticate`);
    return;
  }

  // Use provided org ID or derive from token
  let orgId = config.organizationId;
  if (!orgId) {
    // For demo purposes, we'll use a test organization ID
    orgId = 'test-org-' + (__VU % 10); // Distribute across 10 test orgs
  }

  if (config.enableDetailedLogging) {
    console.log(`VU ${__VU}: Starting test with org ${orgId}`);
  }

  // Establish WebSocket connection
  connectToRealtime(accessToken, orgId).then(socket => {
    if (config.enableDetailedLogging) {
      console.log(`VU ${__VU}: WebSocket connection established`);
    }

    // Allow time for subscription to be established
    sleep(2);

    // Main event generation loop
    const iterations = Math.ceil(300 / config.intervalSeconds); // 5 minutes of iterations
    
    for (let i = 0; i < iterations; i++) {
      // Check database health every 10th iteration
      if (i % 10 === 0) {
        checkDatabaseHealth(accessToken);
      }

      // Trigger cataloging events
      triggerCatalogingEvents(accessToken, orgId, config.eventsPerUserPerInterval);
      
      // Wait for next interval (with some randomness to avoid thundering herd)
      const sleepTime = config.intervalSeconds + randomIntBetween(-2, 2);
      sleep(Math.max(1, sleepTime));
    }

    if (config.enableDetailedLogging) {
      console.log(`VU ${__VU}: Completed ${iterations} iterations`);
    }

  }).catch(error => {
    console.error(`VU ${__VU}: WebSocket connection failed: ${error.message}`);
    wsErrors.add(1);
  });
}

// Test lifecycle hooks
export function setup() {
  console.log('🚀 Starting Booksphere Real-time Notification Load Test');
  console.log(`Configuration:
    - Supabase URL: ${config.supabaseUrl}
    - Test Duration: ${options.scenarios.notification_load.duration}
    - Virtual Users: ${options.scenarios.notification_load.vus}
    - Events per User per Interval: ${config.eventsPerUserPerInterval}
    - Interval: ${config.intervalSeconds}s
    - Target Events/min: ~${(options.scenarios.notification_load.vus * config.eventsPerUserPerInterval * 60) / config.intervalSeconds}
  `);
  
  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`✅ Load test completed in ${duration}s`);
  console.log(`📊 Summary:
    - Events Triggered: ${eventsTriggered.count}
    - Events Received: ${eventsReceived.count}
    - WebSocket Connections: ${wsConnections.count}
    - WebSocket Errors: ${wsErrors.count}
    - HTTP Errors: ${httpErrors.count}
    - Delivery Rate: ${((eventsReceived.count / eventsTriggered.count) * 100).toFixed(2)}%
  `);
} 