import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

// Load environment variables from .env.local
const projectDir = process.cwd();
loadEnvConfig(projectDir);

// Set Supabase cloud credentials for E2E tests
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oteqbwupxzjjvqbkumlt.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZXFid3VweHpqanZxYmt1bWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNjg0MTAsImV4cCI6MjA2MjY0NDQxMH0.N9oK_URSQKtHDYwcK_1G1S2oDfsshpTITvn-Gm-upkU';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Set a longer timeout for operations that might involve network calls to cloud Supabase
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // Always reuse existing server for local development
    timeout: 120_000, // Longer timeout for dev server to start with cloud Supabase
  },
}); 