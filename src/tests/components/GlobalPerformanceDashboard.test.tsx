import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import GlobalPerformanceDashboard from '../../components/GlobalPerformanceDashboard'

// Mock framer-motion to bypass animation delays in test environment
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
      // Omit framer-motion props
      const { initial, animate, exit, transition, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock Recharts ResponsiveContainer to render children reliably in JSDOM environment
vi.mock('recharts', async () => {
  const original = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 800, height: 400 }}>
        {children}
      </div>
    ),
  }
})

describe('GlobalPerformanceDashboard Component Unit Tests', () => {
  it('renders global portfolio header and KPI metrics by default', () => {
    render(<GlobalPerformanceDashboard />)

    expect(screen.getAllByText('Global Portfolio')[0]).toBeInTheDocument()
    expect(screen.getByText('Net Operating Income (NOI)')).toBeInTheDocument()
    expect(screen.getByText('$525.9M')).toBeInTheDocument()
    expect(screen.getAllByText('95.3%')[0]).toBeInTheDocument()
    expect(screen.getByText('$48.80')).toBeInTheDocument()
  })

  it('allows switching between regional tabs', () => {
    render(<GlobalPerformanceDashboard />)

    const emeaButton = screen.getByRole('button', { name: /Europe, Middle East & Africa/i })
    expect(emeaButton).toBeInTheDocument()

    fireEvent.click(emeaButton)

    expect(screen.getByText('$142.8M')).toBeInTheDocument()
    expect(screen.getAllByText('96.4%')[0]).toBeInTheDocument()
  })

  it('switches between visualization tabs (Financials, Occupancy, Allocation, ESG, Comparison)', () => {
    render(<GlobalPerformanceDashboard />)

    const occupancyTab = screen.getByRole('button', { name: /Occupancy & Retention/i })
    fireEvent.click(occupancyTab)

    expect(screen.getByText(/Occupancy & Tenant Retention Trajectory/i)).toBeInTheDocument()

    const comparisonTab = screen.getByRole('button', { name: /Side-by-Side Region Comparison/i })
    fireEvent.click(comparisonTab)

    expect(screen.getByText(/Side-by-Side Multi-Region Comparative Analytics/i)).toBeInTheDocument()
    expect(screen.getByText(/Select Regions to Compare/i)).toBeInTheDocument()

    const allocationTab = screen.getByRole('button', { name: /Asset Portfolio Allocation/i })
    fireEvent.click(allocationTab)

    expect(screen.getByText(/Global Portfolio Capital & Unit Distribution/i)).toBeInTheDocument()

    const esgTab = screen.getByRole('button', { name: /Regional ESG Radar/i })
    fireEvent.click(esgTab)

    expect(screen.getByText(/ESG, Operational & Digitization Radar/i)).toBeInTheDocument()
  })

  it('handles timeframe changes (12M, 3Y, 5Y)', () => {
    render(<GlobalPerformanceDashboard />)

    const button5Y = screen.getByRole('button', { name: '5Y' })
    expect(button5Y).toBeInTheDocument()

    fireEvent.click(button5Y)
  })

  it('renders Export CSV button and allows exporting metrics', () => {
    render(<GlobalPerformanceDashboard />)

    const csvButton = screen.getByRole('button', { name: /Export CSV/i })
    expect(csvButton).toBeInTheDocument()

    fireEvent.click(csvButton)
    expect(screen.getByRole('button', { name: /Exporting CSV/i })).toBeInTheDocument()
  })

  it('renders Predictive Occupancy Insights card and allows toggling AI pre-emptive outreach simulation', () => {
    render(<GlobalPerformanceDashboard />)

    expect(screen.getByText(/Predictive Occupancy Insights/i)).toBeInTheDocument()
    expect(screen.getByText(/Predictive AI Telemetry · 90-Day Forecast/i)).toBeInTheDocument()

    const simulateBtn = screen.getByRole('button', { name: /Simulate AI Action/i })
    expect(simulateBtn).toBeInTheDocument()

    fireEvent.click(simulateBtn)
    expect(screen.getByText(/✓ Pre-emptive AI Active/i)).toBeInTheDocument()
  })

  it('renders Critical Property Alerts tab and allows filtering and resolving alerts', () => {
    render(<GlobalPerformanceDashboard />)

    const alertsTab = screen.getByRole('button', { name: /Critical Property Alerts/i })
    expect(alertsTab).toBeInTheDocument()

    fireEvent.click(alertsTab)

    expect(screen.getByText(/Severe Rent Arrears > 45 Days/i)).toBeInTheDocument()
    expect(screen.getAllByText(/CRITICAL SEVERITY/i).length).toBeGreaterThan(0)

    const resolveBtns = screen.getAllByRole('button', { name: /✓ Resolve/i })
    expect(resolveBtns.length).toBeGreaterThan(0)
    fireEvent.click(resolveBtns[0])

    expect(screen.getAllByText(/✓ RESOLVED/i).length).toBeGreaterThan(0)
  })

  it('renders Annual Performance Trend tab with line chart and metric toggles', () => {
    render(<GlobalPerformanceDashboard />)

    const trendTab = screen.getByRole('button', { name: /Annual Performance Trend/i })
    expect(trendTab).toBeInTheDocument()

    fireEvent.click(trendTab)

    expect(screen.getByText(/Annual YoY Performance Trend Across Regions/i)).toBeInTheDocument()
    expect(screen.getByText(/Global Portfolio CAGR/i)).toBeInTheDocument()
    expect(screen.getByText(/Multi-Region Performance Matrix/i)).toBeInTheDocument()

    const totalNoiToggle = screen.getByRole('button', { name: /Total NOI/i })
    expect(totalNoiToggle).toBeInTheDocument()
    fireEvent.click(totalNoiToggle)

    expect(screen.getByText(/Annual Net Operating Income Expansion Across Regions/i)).toBeInTheDocument()
  })

  it('renders ROI Yield Calculator tab and computes asset projections', () => {
    render(<GlobalPerformanceDashboard />)

    const roiTab = screen.getByRole('button', { name: /ROI Yield Calculator/i })
    expect(roiTab).toBeInTheDocument()

    fireEvent.click(roiTab)

    expect(screen.getByText(/Property Asset ROI & Yield Projection Engine/i)).toBeInTheDocument()
    expect(screen.getByText(/Total Projected ROI/i)).toBeInTheDocument()
    expect(screen.getByText(/Holding Period Horizon:/i)).toBeInTheDocument()

    const primeOfficeBtn = screen.getByRole('button', { name: /🏢 Prime Office/i })
    expect(primeOfficeBtn).toBeInTheDocument()
    fireEvent.click(primeOfficeBtn)

    expect(screen.getByText(/Year-by-Year Yield & Cash Flow Schedule \(7 Years\)/i)).toBeInTheDocument()
  })

  it('renders Regional KPI Breakdown tab with category matrix and filters', () => {
    render(<GlobalPerformanceDashboard />)

    const kpiTab = screen.getByRole('button', { name: /Regional KPI Breakdown/i })
    expect(kpiTab).toBeInTheDocument()

    fireEvent.click(kpiTab)

    expect(screen.getByText(/Regional KPI Breakdown by Property Category/i)).toBeInTheDocument()
    expect(screen.getByText(/Granular Operational KPI Matrix/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Avg Vacancy Duration/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Avg Maintenance Response/i).length).toBeGreaterThan(0)

    // Test category filter buttons
    const industrialFilter = screen.getByRole('button', { name: 'Industrial Logistics' })
    expect(industrialFilter).toBeInTheDocument()
    fireEvent.click(industrialFilter)

    expect(screen.getAllByText('Industrial Logistics').length).toBeGreaterThan(0)

    // Test search filter input
    const searchInput = screen.getByPlaceholderText(/Search category or region/i)
    fireEvent.change(searchInput, { target: { value: 'Commercial' } })

    expect(screen.getAllByText('Commercial Office').length).toBeGreaterThan(0)
  })
})

