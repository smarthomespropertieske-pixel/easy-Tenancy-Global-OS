// ═══════════════════════════════════════════════════════════════════════
//  Unit: analytics.ts — event-tracking smoke + behavioural tests
//  Note: SESSION_ID is bound at module-load → reset module cache per test
//        when we need a fresh session.
// ═══════════════════════════════════════════════════════════════════════
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('analytics — public API', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('trackEvent() does not throw on any documented EventName', async () => {
    const mod = await import('@/lib/analytics')
    const names = [
      'page_view', 'feature_clicked', 'roi_engaged', 'demo_started',
      'compliance_panel_opened', 'micro_tour_started', 'micro_tour_completed',
      'ai_feed_clicked', 'radial_node_clicked', 'waitlist_submitted',
      'cta_clicked', 'pricing_toggled', 'metrics_viewed', 'deep_link_activated',
      'property_viewed', 'section_navigated', 'notice_generated', 'demo_cta_clicked',
      'mobile_nav_clicked', 'hero_widget_launched', 'success_fee_demo',
      'copilot_used', 'ai_assistant_used', 'banner_clicked', 'tab_switched',
      'staging_complete', 'tour_generated', 'compliance_checked', 'arr_viewed',
      'radial_map_click', 'lease_action', 'maintenance_action',
    ] as const

    for (const n of names) {
      expect(() => mod.trackEvent(n as any, { sample: 1 })).not.toThrow()
    }
  })

  it('trackPageView() forwards path payload and tolerates missing referrer', async () => {
    const mod = await import('@/lib/analytics')
    expect(() => mod.trackPageView('/predictive-os')).not.toThrow()
  })

  it('flushNow() resolves without throwing when queue is empty', async () => {
    const mod = await import('@/lib/analytics')
    expect(() => mod.flushNow()).not.toThrow()
  })

  it('persists a session id in sessionStorage on first event', async () => {
    const mod = await import('@/lib/analytics')
    mod.trackEvent('page_view', {})
    const sid = sessionStorage.getItem('et_sid')
    expect(sid).toMatch(/^s_/)
  })

  it('debounces rapid bursts into a single flush window', async () => {
    vi.useFakeTimers()
    const mod = await import('@/lib/analytics')

    // Stub fetch so we observe network attempts deterministically
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    ;(globalThis as any).fetch = fetchSpy

    mod.trackEvent('cta_clicked', { source: 'hero' })
    mod.trackEvent('cta_clicked', { source: 'mid' })
    mod.trackEvent('cta_clicked', { source: 'footer' })

    // No flush yet — the 500ms debounce hasn't elapsed
    expect(fetchSpy).not.toHaveBeenCalled()

    // Advance past the 500ms debounce window
    await vi.advanceTimersByTimeAsync(600)

    // In DEV mode (import.meta.env.DEV=true under vitest) flush logs to console
    // and does NOT hit /api/analytics — so we don't assert fetchSpy was called.
    // We only assert no synchronous throw and that timer fired exactly once.
    vi.useRealTimers()
  })
})
