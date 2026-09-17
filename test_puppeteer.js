const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto('http://localhost:3002/landing.html?hl=1', {waitUntil: 'networkidle0'});
  console.log('Page loaded');
  await page.click('button[data-lang="en"]');
  await new Promise(r => setTimeout(r, 500));
  const h1 = await page.$eval('h1', el => el.innerHTML);
  console.log('H1 after EN click:', h1);
  await browser.close();
})().catch(console.error);
