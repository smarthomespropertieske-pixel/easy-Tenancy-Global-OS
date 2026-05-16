// ── Demo data layer + deep-linking ───────────────────────────
export interface DemoTenant {
  id: string
  name: string
  units: number
  monthlyRent: number
  occupancy: number
  noi: number
  arrears: number
  country: string
  currency: string
  properties: DemoProperty[]
}

export interface DemoProperty {
  id: string
  name: string
  units: number
  occupancy: number
  lastCompliance: string
  status: 'compliant' | 'warning' | 'critical'
  collections: number
}

export const DEMO_TENANTS: Record<string, DemoTenant> = {
  'demo-001': {
    id: 'demo-001', name: 'Actis Capital Portfolio', units: 450,
    monthlyRent: 185000, occupancy: 96.2, noi: 71.8, arrears: 2.4,
    country: 'KE', currency: 'KES',
    properties: [
      { id: 'LDN-247', name: 'LDN-247 Westlands Block', units: 48, occupancy: 97.9, lastCompliance: '2025-04-01', status: 'compliant', collections: 98.1 },
      { id: 'NBI-033', name: 'NBI-033 Kilimani Suites', units: 72, occupancy: 95.8, lastCompliance: '2025-03-28', status: 'warning', collections: 94.2 },
      { id: 'MSA-011', name: 'MSA-011 Mombasa Oceanfront', units: 36, occupancy: 91.7, lastCompliance: '2025-04-03', status: 'compliant', collections: 97.5 },
    ]
  },
  'demo-002': {
    id: 'demo-002', name: 'Knight Frank Global', units: 1200,
    monthlyRent: 620000, occupancy: 94.1, noi: 68.3, arrears: 3.1,
    country: 'UK', currency: 'GBP',
    properties: [
      { id: 'LON-A01', name: 'Mayfair Premium Residences', units: 120, occupancy: 98.3, lastCompliance: '2025-04-05', status: 'compliant', collections: 99.1 },
      { id: 'MCR-B02', name: 'Manchester City Quarter', units: 200, occupancy: 93.5, lastCompliance: '2025-03-30', status: 'warning', collections: 95.7 },
    ]
  },
  'demo-003': {
    id: 'demo-003', name: 'Gulf Properties LLC', units: 320,
    monthlyRent: 890000, occupancy: 91.5, noi: 74.2, arrears: 1.8,
    country: 'AE', currency: 'AED',
    properties: [
      { id: 'DXB-001', name: 'Dubai Marina Tower A', units: 80, occupancy: 93.8, lastCompliance: '2025-04-02', status: 'compliant', collections: 98.9 },
      { id: 'ABU-002', name: 'Abu Dhabi Corniche View', units: 60, occupancy: 89.2, lastCompliance: '2025-03-25', status: 'critical', collections: 91.3 },
    ]
  },
}

export function getDemoTenant(id: string): DemoTenant | null {
  return DEMO_TENANTS[id] ?? null
}

export function parseDemoParams(search: string): {
  demoTenantId: string | null
  units: number | null
  monthlyRent: number | null
  occupancy: number | null
} {
  const p = new URLSearchParams(search)
  return {
    demoTenantId: p.get('demoTenantId'),
    units: p.get('units') ? Number(p.get('units')) : null,
    monthlyRent: p.get('monthlyRent') ? Number(p.get('monthlyRent')) : null,
    occupancy: p.get('occupancy') ? Number(p.get('occupancy')) : null,
  }
}

export function buildDemoUrl(params: { units?: number; monthlyRent?: number; occupancy?: number; demoTenantId?: string }) {
  const p = new URLSearchParams()
  if (params.demoTenantId) p.set('demoTenantId', params.demoTenantId)
  if (params.units) p.set('units', String(params.units))
  if (params.monthlyRent) p.set('monthlyRent', String(params.monthlyRent))
  if (params.occupancy) p.set('occupancy', String(params.occupancy))
  return `/app/demo?${p.toString()}`
}
