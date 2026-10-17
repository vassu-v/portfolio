// Version-agnostic benchmark: uncapped rAF throughput while the camera keeps
// moving (pointer wiggle), overview shot. Works on v1 (no debug hooks).
// usage: VP=1440x900 node rafbench.mjs <url> [label] [mobile 0|1] [cpuThrottle]
import puppeteer from 'puppeteer-core'
const [url, label = url, mobile = '0', cpu = '1'] = process.argv.slice(2)
const [vw, vh, vd = '1'] = (process.env.VP || '1440x900').split('x')
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'] })
const page = await browser.newPage()
await page.setViewport({ width: +vw, height: +vh, deviceScaleFactor: +(process.env.DPR || 1), isMobile: mobile === '1', hasTouch: mobile === '1' })
const cdp = await page.createCDPSession()
if (+cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: +cpu })
const errors = []
page.on('pageerror', e => errors.push(e.message))
const t0 = Date.now()
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 })
// time until the canvas exists and has drawn
await page.waitForFunction(() => document.querySelector('canvas'), { timeout: 60000 }).catch(() => {})
const canvasAt = Date.now() - t0
await new Promise(r => setTimeout(r, 9000))
await page.evaluate(() => { window.scrollTo(0, 1e6); window.dispatchEvent(new CustomEvent('programmatic-scroll-to', { detail: 1e6 })) })
await new Promise(r => setTimeout(r, 4000))
const res = await page.evaluate(async () => {
  let i = 0
  const wig = setInterval(() => { i++; window.dispatchEvent(new PointerEvent('pointermove', { clientX: 400 + (i % 40) * 10, clientY: 300 })) }, 16)
  const frames = []
  let last = performance.now()
  await new Promise(r => {
    const f = now => { frames.push(now - last); last = now; if (frames.length < 240) requestAnimationFrame(f); else r() }
    requestAnimationFrame(f)
  })
  clearInterval(wig)
  const s = frames.slice(20).sort((a, b) => a - b)
  return {
    medianMs: +s[Math.floor(s.length / 2)].toFixed(1),
    p95Ms: +s[Math.floor(s.length * 0.95)].toFixed(1),
    heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
    tier: window.__room?.get().tier,
  }
})
console.log(`${label.padEnd(26)} median ${String(res.medianMs).padStart(5)}ms  p95 ${String(res.p95Ms).padStart(5)}ms  ≈${Math.round(1000 / res.medianMs)}fps  heap ${res.heapMB}MB  canvas@${canvasAt}ms ${res.tier ?? ''} ${errors.length ? 'ERR ' + errors[0] : ''}`)
await browser.close()
