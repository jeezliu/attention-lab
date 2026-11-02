import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  reporter: [['list'], ['html', {open:'never'}]],
  use: {browserName:'chromium', trace:'retain-on-failure', screenshot:'only-on-failure'},
  projects: [
    {name:'root', use:{baseURL:'http://127.0.0.1:4173/'}},
    {name:'github-pages', use:{baseURL:'http://127.0.0.1:4173/attention-lab/'}}
  ],
  webServer: {
    command:'npm run preview',
    url:'http://127.0.0.1:4173/',
    reuseExistingServer:false,
    env:{HOST:'127.0.0.1', PORT:'4173'}
  }
});
