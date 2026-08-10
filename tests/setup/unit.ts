// ═══════════════════════════════════════════════════════════════════════
//  Vitest — unit project setup (pure Node, no Cloudflare runtime)
//  Provides minimal browser-API shims that src/lib modules rely on.
// ═══════════════════════════════════════════════════════════════════════
import { vi, beforeEach } from 'vitest'

// ── Polyfill `crypto.randomUUID` for older Node (>=18 has it natively) ──
if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.randomUUID) {
  // @ts-expect-error — shim Web Crypto for legacy runtimes
  globalThis.crypto = globalThis.crypto ?? {}
  // @ts-expect-error — minimal randomUUID shim
  globalThis.crypto.randomUUID = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
}

// ── Mock browser globals analytics.ts touches ────────────────────────
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() { return this.store.size }
  clear() { this.store.clear() }
  getItem(k: string) { return this.store.get(k) ?? null }
  setItem(k: string, v: string) { this.store.set(k, String(v)) }
  removeItem(k: string) { this.store.delete(k) }
  key(i: number) { return Array.from(this.store.keys())[i] ?? null }
}

beforeEach(() => {
  // Fresh storage per test → isolates session-id state inside analytics.ts
  Object.defineProperty(globalThis, 'sessionStorage', { value: new MemoryStorage(), configurable: true })
  Object.defineProperty(globalThis, 'localStorage',   { value: new MemoryStorage(), configurable: true })

  // window.location stub (analytics reads window.location.href / pathname)
  if (typeof (globalThis as any).window === 'undefined') {
    ;(globalThis as any).window = {
      location: { href: 'http://localhost:3000/test', pathname: '/test', origin: 'http://localhost:3000' },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      navigator: { sendBeacon: vi.fn(() => true), userAgent: 'vitest' },
    }
  }
  if (typeof (globalThis as any).document === 'undefined') {
    ;(globalThis as any).document = { referrer: '', title: 'vitest', visibilityState: 'visible' }
  }
})
