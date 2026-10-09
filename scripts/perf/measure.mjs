// usage: node measure.mjs <url> <label> [w] [h] [dpr] [mobile 0|1] [cpuThrottle] [shotDir]
import puppeteer from 'puppeteer-core'

const [url, label, w = 1440, h = 900, dpr = 1.375, mobile = '0', cpu = '1', shotDir = '.'] = process.argv.slice(2)
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader=false', '--disable-frame-rate-limit=false'],
})
const page = await browser.newPage()
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: +dpr, isMobile: mobile === '1', hasTouch: mobile === '1' })
if (mobile === '1') await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36')
const cdp = await page.createCDPSession()
if (+cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: +cpu })
const errors = []
page.on('pageerror', e => errors.push(e.stack || e.message))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise(r => setTimeout(r, 11000))
const gpu = await page.evaluate(() => {
  const g = document.createElement('canvas').getContext('webgl2')
  const e = g && g.getExtension('WEBGL_debug_renderer_info')
  return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'n/a'
})
const intro = await page.evaluate(() => window.__live?.perf)
await page.screenshot({ path: `${shotDir}/${label}-intro.jpg`, quality: 80 })
await page.evaluate(() => { window.scrollTo(0, 1e6); window.dispatchEvent(new CustomEvent('programmatic-scroll-to', { detail: 1e6 })) })
await new Promise(r => setTimeout(r, 6000))
const overview = await page.evaluate(() => window.__live?.perf)
await page.screenshot({ path: `${shotDir}/${label}-overview.jpg`, quality: 80 })
const tier = await page.evaluate(() => window.__room?.get().tier)
console.log(JSON.stringify({ label, gpu, tier, intro, overview, errors: errors.slice(0, 5) }, null, 1))
await browser.close()
