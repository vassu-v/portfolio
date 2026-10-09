// forced-continuous rendering fps for a list of variants (overview shot)
import puppeteer from 'puppeteer-core'
const variants = process.argv.slice(2)
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--disable-gpu-vsync','--disable-frame-rate-limit'] })
for (const v of variants) {
  const page = await browser.newPage()
  const [vw, vh] = (process.env.VP || '1440x900').split('x').map(Number); await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1 })
  await page.goto('http://localhost:5191/?debug&hour=21&' + v, { waitUntil: 'domcontentloaded' })
  await new Promise(r => setTimeout(r, 9000))
  await page.evaluate(() => { window.scrollTo(0, 1e6); window.dispatchEvent(new CustomEvent('programmatic-scroll-to', { detail: 1e6 })); setInterval(() => { window.__live.activeUntil = performance.now() + 500 }, 100) })
  await new Promise(r => setTimeout(r, 5000))
  const p = await page.evaluate(() => ({ ...window.__live.perf, sf: window.__live.shadowFrames, tier: window.__room.get().tier }))
  console.log(v.padEnd(40), 'frameMs', String(p.frameMs).padStart(5), ' calls', p.calls, ' tris', p.tris, ' worst', p.worstMs + 'ms', ' shadowFrames', p.sf, p.tier)
  await page.close()
}
await browser.close()
