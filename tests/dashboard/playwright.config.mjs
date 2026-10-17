import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'.',testMatch:'*.spec.mjs',fullyParallel:false,workers:1,
 forbidOnly:!!process.env.CI,retries:0,timeout:30000,
 reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://127.0.0.1:4173',serviceWorkers:'block',trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:[
  {name:'chromium-desktop',use:{...devices['Desktop Chrome']}},
  {name:'webkit-mobile',use:{...devices['iPhone 13']}}
 ],
 webServer:{command:'python3 -m http.server 4173 --bind 127.0.0.1 --directory site',cwd:'../..',url:'http://127.0.0.1:4173',reuseExistingServer:false,timeout:15000}
});
