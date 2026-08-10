// ════════════════════════════════════════════════════════════════════════
//  useCurrencyConversion.ts — Real-time Multi-Currency Conversion Hook
//  ─────────────────────────────────────────────────────────────────────
//  Fetches live exchange rates against USD and provides formatting utilities
//  for real estate financial metrics (NOI, Rent/sqm, Purchase Price, etc.).
// ════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'AED' | 'SGD' | 'INR' | 'CHF'

export interface CurrencyConfig {
  code: CurrencyCode
  symbol: string
  name: string
  flag: string
  defaultRate: number // Relative to 1 USD
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', defaultRate: 1.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', defaultRate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', defaultRate: 0.78 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', defaultRate: 155.2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', defaultRate: 1.52 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', defaultRate: 1.36 },
  { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', flag: '🇦🇪', defaultRate: 3.67 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', defaultRate: 1.34 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', defaultRate: 83.5 },
  { code: 'CHF', symbol: 'CHF ', name: 'Swiss Franc', flag: '🇨🇭', defaultRate: 0.88 },
]

export const DEFAULT_RATES: Record<CurrencyCode, number> = SUPPORTED_CURRENCIES.reduce((acc, curr) => {
  acc[curr.code] = curr.defaultRate
  return acc
}, {} as Record<CurrencyCode, number>)

export interface UseCurrencyConversionReturn {
  selectedCurrency: CurrencyCode
  setSelectedCurrency: (code: CurrencyCode) => void
  rates: Record<string, number>
  isLoadingRates: boolean
  rateSource: 'LIVE' | 'FALLBACK'
  lastUpdated: string | null
  fetchRates: () => Promise<void>
  getSymbol: (code?: CurrencyCode) => string
  convertFromUSD: (amountUSD: number, code?: CurrencyCode) => number
  formatMillions: (amountUSDMillions: number, code?: CurrencyCode) => string
  formatRentSqm: (rentUSD: number, code?: CurrencyCode) => string
  formatAmount: (amountUSD: number, code?: CurrencyCode) => string
}

export function useCurrencyConversion(initialCurrency: CurrencyCode = 'USD'): UseCurrencyConversionReturn {
  const [selectedCurrency, setSelectedCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem('easyTenancy_preferred_currency')
      if (saved && SUPPORTED_CURRENCIES.some((c) => c.code === saved)) {
        return saved as CurrencyCode
      }
    } catch {
      // Ignore localStorage errors
    }
    return initialCurrency
  })

  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES)
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false)
  const [rateSource, setRateSource] = useState<'LIVE' | 'FALLBACK'>('FALLBACK')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const setSelectedCurrency = (code: CurrencyCode) => {
    setSelectedCurrencyState(code)
    try {
      localStorage.setItem('easyTenancy_preferred_currency', code)
    } catch {
      // Ignore
    }
  }

  const fetchRates = useCallback(async () => {
    setIsLoadingRates(true)
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      if (data && data.rates) {
        const mergedRates = { ...DEFAULT_RATES, ...data.rates }
        setRates(mergedRates)
        setRateSource('LIVE')
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      } else {
        throw new Error('Invalid rate response schema')
      }
    } catch {
      // Fallback to secondary endpoint or default
      try {
        const res2 = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
        if (res2.ok) {
          const d2 = await res2.json()
          if (d2 && d2.rates) {
            setRates({ ...DEFAULT_RATES, ...d2.rates })
            setRateSource('LIVE')
            setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
            return
          }
        }
      } catch {
        // Silent fallback
      }
      setRateSource('FALLBACK')
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    } finally {
      setIsLoadingRates(false)
    }
  }, [])

  useEffect(() => {
    fetchRates()
  }, [fetchRates])

  const getSymbol = useCallback((code?: CurrencyCode) => {
    const target = code || selectedCurrency
    const config = SUPPORTED_CURRENCIES.find((c) => c.code === target)
    return config ? config.symbol : '$'
  }, [selectedCurrency])

  const convertFromUSD = useCallback((amountUSD: number, code?: CurrencyCode) => {
    const target = code || selectedCurrency
    const rate = rates[target] || DEFAULT_RATES[target] || 1.0
    return amountUSD * rate
  }, [selectedCurrency, rates])

  const formatMillions = useCallback((amountUSDMillions: number, code?: CurrencyCode) => {
    const target = code || selectedCurrency
    const symbol = getSymbol(target)
    const converted = convertFromUSD(amountUSDMillions, target)

    if (converted >= 1000) {
      return `${symbol}${(converted / 1000).toFixed(1)}B`
    }
    return `${symbol}${converted.toFixed(1)}M`
  }, [selectedCurrency, getSymbol, convertFromUSD])

  const formatRentSqm = useCallback((rentUSD: number, code?: CurrencyCode) => {
    const target = code || selectedCurrency
    const symbol = getSymbol(target)
    const converted = convertFromUSD(rentUSD, target)

    if (target === 'JPY' || target === 'INR') {
      return `${symbol}${Math.round(converted)}`
    }
    return `${symbol}${converted.toFixed(1)}`
  }, [selectedCurrency, getSymbol, convertFromUSD])

  const formatAmount = useCallback((amountUSD: number, code?: CurrencyCode) => {
    const target = code || selectedCurrency
    const symbol = getSymbol(target)
    const converted = convertFromUSD(amountUSD, target)

    if (target === 'JPY') {
      return `${symbol}${Math.round(converted).toLocaleString()}`
    }
    if (Math.abs(converted) >= 1000000) {
      return `${symbol}${(converted / 1000000).toFixed(2)}M`
    }
    if (Math.abs(converted) >= 1000) {
      return `${symbol}${Math.round(converted).toLocaleString()}`
    }
    return `${symbol}${converted.toFixed(2)}`
  }, [selectedCurrency, getSymbol, convertFromUSD])

  return {
    selectedCurrency,
    setSelectedCurrency,
    rates,
    isLoadingRates,
    rateSource,
    lastUpdated,
    fetchRates,
    getSymbol,
    convertFromUSD,
    formatMillions,
    formatRentSqm,
    formatAmount,
  }
}
