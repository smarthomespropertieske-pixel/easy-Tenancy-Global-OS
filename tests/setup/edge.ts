// ═══════════════════════════════════════════════════════════════════════
//  Vitest — edge project setup (Node env, Hono in-process)
// ═══════════════════════════════════════════════════════════════════════
import { vi } from 'vitest'

// Stub the global Cloudflare AI binding for routes that touch env.AI.run()
// Routes either skip cleanly when AI is unset, or receive this canned shape.
;(globalThis as any).__TEST_AI__ = {
  run: vi.fn(async (_model: string, _inputs: Record<string, unknown>) => ({
    response: 'test-ai-response',
  })),
}
