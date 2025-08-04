#!/usr/bin/env node

/**
 * Validation Script for Notification System Tests
 * 
 * This script validates that:
 * 1. Test files exist and are properly formatted
 * 2. Required dependencies are available
 * 3. Test configuration is correct
 * 4. Database schema matches test expectations
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`)
};

// Test file paths
const testFiles = {
  hookTest: 'src/hooks/__tests__/useRealtimeNotifications.test.tsx',
  dbTest: 'supabase/tests/outbox_management_functions.sql',
  testReadme: 'src/hooks/__tests__/README.md',
  hookImpl: 'src/hooks/useRealtimeNotifications.ts',
  dbMigration: 'supabase/migrations/20250117100400_create_outbox_management_functions.sql'
};

// Required dependencies
const requiredDeps = {
  devDependencies: [
    '@testing-library/react',
    '@testing-library/jest-dom', 
    'vitest',
    '@vitest/ui'
  ],
  dependencies: [
    '@tanstack/react-query',
    '@supabase/supabase-js',
    'sonner'
  ]
};

async function validateTestFiles() {
  log.info('Validating test files...');
  
  let allValid = true;
  
  for (const [name, filePath] of Object.entries(testFiles)) {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      log.success(`${name}: ${filePath} (${sizeKB} KB)`);
      
      // Validate file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (name === 'hookTest') {
        validateHookTest(content, filePath);
      } else if (name === 'dbTest') {
        validateDbTest(content, filePath);
      }
    } else {
      log.error(`${name}: ${filePath} - File not found`);
      allValid = false;
    }
  }
  
  return allValid;
}

function validateHookTest(content, filePath) {
  const requiredImports = [
    'vitest',
    '@testing-library/react',
    'useRealtimeNotifications',
    '@tanstack/react-query'
  ];
  
  const requiredTestCases = [
    'should initialize with connecting status',
    'should handle individual success events',
    'should debounce multiple events',
    'should unsubscribe from channel on unmount',
    'should handle malformed events gracefully'
  ];
  
  // Check imports
  for (const imp of requiredImports) {
    if (!content.includes(imp)) {
      log.warning(`Hook test missing import: ${imp}`);
    }
  }
  
  // Check test cases
  for (const testCase of requiredTestCases) {
    if (!content.includes(testCase)) {
      log.warning(`Hook test missing test case: ${testCase}`);
    }
  }
  
  // Check test structure
  if (!content.includes('describe(') || !content.includes('it(')) {
    log.error('Hook test file missing proper test structure');
  } else {
    log.success('Hook test structure validation passed');
  }
}

function validateDbTest(content, filePath) {
  const requiredFunctions = [
    'prune_delivered_events',
    'migrate_failed_events_to_dlq',
    'get_or_create_processor_cursor',
    'update_processor_cursor',
    'confirm_event_delivery'
  ];
  
  const requiredTestStructure = [
    'SELECT plan(',
    'has_function(',
    'lives_ok(',
    'ok(',
    'SELECT * FROM finish()'
  ];
  
  // Check function coverage
  for (const func of requiredFunctions) {
    if (!content.includes(func)) {
      log.warning(`Database test missing function: ${func}`);
    }
  }
  
  // Check pg_TAP structure
  for (const structure of requiredTestStructure) {
    if (!content.includes(structure)) {
      log.warning(`Database test missing pg_TAP structure: ${structure}`);
    }
  }
  
  if (content.includes('SELECT plan(') && content.includes('SELECT * FROM finish()')) {
    log.success('Database test structure validation passed');
  } else {
    log.error('Database test file missing proper pg_TAP structure');
  }
}

function validateDependencies() {
  log.info('Validating dependencies...');
  
  if (!fs.existsSync('package.json')) {
    log.error('package.json not found');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  let allValid = true;
  
  // Check required dependencies
  for (const dep of [...requiredDeps.dependencies, ...requiredDeps.devDependencies]) {
    if (deps[dep]) {
      log.success(`Dependency found: ${dep}@${deps[dep]}`);
    } else {
      log.error(`Missing dependency: ${dep}`);
      allValid = false;
    }
  }
  
  return allValid;
}

function validateTestConfig() {
  log.info('Validating test configuration...');
  
  const configFiles = [
    'vitest.config.ts',
    'src/test/setup.ts'
  ];
  
  let allValid = true;
  
  for (const configFile of configFiles) {
    if (fs.existsSync(configFile)) {
      log.success(`Config file found: ${configFile}`);
      
      if (configFile === 'vitest.config.ts') {
        const content = fs.readFileSync(configFile, 'utf8');
        if (content.includes('jsdom') && content.includes('setupFiles')) {
          log.success('Vitest config properly configured');
        } else {
          log.warning('Vitest config may be missing required settings');
        }
      }
    } else {
      log.error(`Config file missing: ${configFile}`);
      allValid = false;
    }
  }
  
  return allValid;
}

function validateDatabaseSchema() {
  log.info('Validating database schema...');
  
  const migrationDir = 'supabase/migrations';
  
  if (!fs.existsSync(migrationDir)) {
    log.error('Supabase migrations directory not found');
    return false;
  }
  
  const migrations = fs.readdirSync(migrationDir).filter(file => file.endsWith('.sql'));
  
  const requiredTables = [
    'cataloging_event_outbox',
    'cataloging_event_outbox_dlq',
    'cataloging_event_outbox_cursor'
  ];
  
  let schemaValid = true;
  
  // Check if required tables are created in migrations
  for (const table of requiredTables) {
    const found = migrations.some(migration => {
      const content = fs.readFileSync(path.join(migrationDir, migration), 'utf8');
      return content.includes(`CREATE TABLE`) && content.includes(table);
    });
    
    if (found) {
      log.success(`Table schema found: ${table}`);
    } else {
      log.warning(`Table schema may be missing: ${table}`);
    }
  }
  
  return schemaValid;
}

function generateTestReport() {
  log.info('Generating test execution commands...');
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST EXECUTION COMMANDS');
  console.log('='.repeat(60));
  
  console.log('\n📋 Frontend Tests:');
  console.log('npm run test src/hooks/__tests__/useRealtimeNotifications.test.tsx');
  console.log('npm run test:coverage src/hooks/__tests__/');
  
  console.log('\n🗄️  Database Tests:');
  console.log('supabase test db --file=outbox_management_functions.sql');
  console.log('# Or via psql:');
  console.log('psql "your-connection-string" < supabase/tests/outbox_management_functions.sql');
  
  console.log('\n🔧 Test Development:');
  console.log('npm run test:watch src/hooks/__tests__/useRealtimeNotifications.test.tsx');
  console.log('npm run test:ui # For Vitest UI');
  
  console.log('\n📊 Coverage Report:');
  console.log('npm run test:coverage');
  console.log('open coverage/index.html');
}

async function main() {
  console.log('🧪 Notification System Test Validator\n');
  
  const validations = [
    validateTestFiles(),
    validateDependencies(),
    validateTestConfig(),
    validateDatabaseSchema()
  ];
  
  const results = await Promise.all(validations);
  const allValid = results.every(Boolean);
  
  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(60));
  
  if (allValid) {
    log.success('All validations passed! Tests are ready to run.');
    generateTestReport();
  } else {
    log.error('Some validations failed. Please address the issues above.');
    process.exit(1);
  }
  
  console.log('\n📖 For detailed test documentation, see:');
  console.log('   src/hooks/__tests__/README.md');
  console.log('\n🚀 Ready to test the notification system!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  validateTestFiles,
  validateDependencies,
  validateTestConfig,
  validateDatabaseSchema
}; 