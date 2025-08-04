#!/bin/bash

# Booksphere k6 Performance Test Runner
# Executes comprehensive load tests for real-time notification system

set -e

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if k6 is installed
check_k6_installation() {
    if ! command -v k6 &> /dev/null; then
        log_error "k6 is not installed. Please install k6 from https://k6.io/docs/getting-started/installation/"
        echo "On macOS: brew install k6"
        echo "On Ubuntu: sudo apt-get install k6"
        exit 1
    fi
    
    log_info "k6 version: $(k6 version)"
}

# Check if Supabase is running locally
check_supabase_status() {
    local supabase_url="${SUPABASE_URL:-http://localhost:54321}"
    
    if curl -s "$supabase_url/health" > /dev/null 2>&1; then
        log_success "Supabase is running at $supabase_url"
        return 0
    else
        log_warning "Supabase doesn't appear to be running at $supabase_url"
        log_info "Make sure to start Supabase locally with: npx supabase start"
        return 1
    fi
}

# Load environment configuration
load_env_config() {
    local env_file="$SCRIPT_DIR/config.env"
    
    if [[ -f "$env_file" ]]; then
        log_info "Loading configuration from $env_file"
        # Export all variables from config.env
        set -a
        source "$env_file"
        set +a
    else
        log_warning "No config.env found, using default values"
    fi
    
    # Set defaults if not provided
    export LOAD_VUS=${LOAD_VUS:-50}
    export LOAD_DURATION=${LOAD_DURATION:-2m}
    export SPIKE_VUS=${SPIKE_VUS:-100}
    export EVENTS_PER_USER=${EVENTS_PER_USER:-5}
    export INTERVAL_SECONDS=${INTERVAL_SECONDS:-15}
    export DETAILED_LOGGING=${DETAILED_LOGGING:-false}
    
    log_info "Test configuration:"
    log_info "  - Load VUs: $LOAD_VUS"
    log_info "  - Load Duration: $LOAD_DURATION"
    log_info "  - Spike VUs: $SPIKE_VUS"
    log_info "  - Events per User: $EVENTS_PER_USER"
    log_info "  - Interval: ${INTERVAL_SECONDS}s"
}

# Prepare test environment
prepare_test_environment() {
    log_info "Preparing test environment..."
    
    # Create results directory
    mkdir -p "$SCRIPT_DIR/results"
    
    # Clear previous results
    rm -f "$SCRIPT_DIR/results/"*.json
    rm -f "$SCRIPT_DIR/results/"*.html
    
    # Set output file with timestamp
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    export K6_OUT="json=$SCRIPT_DIR/results/performance_test_$timestamp.json"
    
    log_success "Test environment prepared"
}

# Run baseline performance test
run_baseline_test() {
    log_info "Running baseline performance test (reduced load)..."
    
    # Run with minimal load to establish baseline
    LOAD_VUS=10 \
    LOAD_DURATION=1m \
    SPIKE_VUS=20 \
    EVENTS_PER_USER=3 \
    INTERVAL_SECONDS=20 \
    k6 run "$SCRIPT_DIR/notification-load.js" \
        --out json="$SCRIPT_DIR/results/baseline_test.json" \
        --summary-export="$SCRIPT_DIR/results/baseline_summary.json"
    
    local exit_code=$?
    if [[ $exit_code -eq 0 ]]; then
        log_success "Baseline test completed successfully"
    else
        log_error "Baseline test failed with exit code $exit_code"
        return $exit_code
    fi
}

# Run main load test
run_load_test() {
    log_info "Running main load test..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    
    k6 run "$SCRIPT_DIR/notification-load.js" \
        --out json="$SCRIPT_DIR/results/load_test_$timestamp.json" \
        --summary-export="$SCRIPT_DIR/results/load_summary_$timestamp.json"
    
    local exit_code=$?
    if [[ $exit_code -eq 0 ]]; then
        log_success "Load test completed successfully"
    else
        log_error "Load test failed with exit code $exit_code"
        return $exit_code
    fi
}

# Run stress test with higher load
run_stress_test() {
    log_info "Running stress test (high load)..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    
    # Increase load for stress testing
    LOAD_VUS=$((LOAD_VUS * 2)) \
    SPIKE_VUS=$((SPIKE_VUS * 2)) \
    EVENTS_PER_USER=$((EVENTS_PER_USER * 2)) \
    k6 run "$SCRIPT_DIR/notification-load.js" \
        --out json="$SCRIPT_DIR/results/stress_test_$timestamp.json" \
        --summary-export="$SCRIPT_DIR/results/stress_summary_$timestamp.json"
    
    local exit_code=$?
    if [[ $exit_code -eq 0 ]]; then
        log_success "Stress test completed successfully"
    else
        log_warning "Stress test completed with issues (exit code $exit_code)"
        # Don't fail the script for stress test failures as they're expected to push limits
    fi
}

# Generate performance report
generate_report() {
    log_info "Generating performance report..."
    
    local report_file="$SCRIPT_DIR/results/performance_report.html"
    
    cat > "$report_file" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Booksphere Performance Test Report</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #e5e5e5; border-radius: 8px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px; }
        .pass { color: #16a34a; font-weight: bold; }
        .fail { color: #dc2626; font-weight: bold; }
        .warn { color: #ea580c; font-weight: bold; }
        pre { background: #f1f5f9; padding: 15px; border-radius: 4px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Booksphere Real-time Notification Performance Test Report</h1>
        <p>Generated on: $(date)</p>
    </div>
    
    <div class="section">
        <h2>📊 Test Summary</h2>
        <p>This report contains the results of comprehensive performance testing for the Booksphere real-time notification system.</p>
    </div>
    
    <div class="section">
        <h2>🎯 SLO Targets</h2>
        <table>
            <tr><th>Metric</th><th>Target</th><th>Description</th></tr>
            <tr><td>p95 Delivery Latency</td><td>&lt; 1.5s</td><td>End-to-end notification delivery time</td></tr>
            <tr><td>Edge Function Duration</td><td>&lt; 500ms</td><td>Server processing time</td></tr>
            <tr><td>Database Query Time</td><td>&lt; 200ms</td><td>Outbox health metrics query performance</td></tr>
            <tr><td>WebSocket Error Rate</td><td>&lt; 0.1%</td><td>Real-time connection stability</td></tr>
            <tr><td>HTTP Error Rate</td><td>&lt; 1%</td><td>API request success rate</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>📈 Test Results</h2>
        <p>Detailed results are available in the JSON files in the results directory.</p>
        <p>Use the k6 HTML reporter or import the JSON data into your monitoring system for detailed analysis.</p>
    </div>
    
    <div class="section">
        <h2>📋 Files Generated</h2>
        <ul>
EOF

    # List all result files
    for file in "$SCRIPT_DIR/results/"*.json; do
        if [[ -f "$file" ]]; then
            echo "            <li>$(basename "$file")</li>" >> "$report_file"
        fi
    done
    
    cat >> "$report_file" << 'EOF'
        </ul>
    </div>
    
    <div class="section">
        <h2>🔍 Next Steps</h2>
        <ol>
            <li>Review the JSON results for detailed metrics</li>
            <li>Check SLO compliance against the targets above</li>
            <li>Analyze any failed thresholds and investigate bottlenecks</li>
            <li>Monitor database index usage and query performance</li>
            <li>Scale test with production-like data volumes</li>
        </ol>
    </div>
</body>
</html>
EOF

    log_success "Performance report generated: $report_file"
}

# Main execution function
main() {
    local test_type="${1:-all}"
    
    echo "🚀 Booksphere Performance Test Suite"
    echo "===================================="
    
    # Pre-flight checks
    check_k6_installation
    load_env_config
    
    # Check Supabase status (warning only)
    check_supabase_status || true
    
    prepare_test_environment
    
    # Run tests based on type
    case "$test_type" in
        "baseline")
            run_baseline_test
            ;;
        "load")
            run_load_test
            ;;
        "stress") 
            run_stress_test
            ;;
        "all")
            log_info "Running complete test suite..."
            run_baseline_test
            sleep 10 # Brief pause between tests
            run_load_test
            sleep 10
            run_stress_test
            ;;
        *)
            log_error "Invalid test type: $test_type"
            echo "Usage: $0 [baseline|load|stress|all]"
            exit 1
            ;;
    esac
    
    # Generate report
    generate_report
    
    log_success "Performance testing completed!"
    log_info "Results available in: $SCRIPT_DIR/results/"
    
    # Show quick summary
    echo ""
    echo "📊 Quick Summary:"
    echo "=================="
    find "$SCRIPT_DIR/results" -name "*.json" -type f | while read -r file; do
        echo "📄 $(basename "$file")"
    done
}

# Handle script arguments
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 