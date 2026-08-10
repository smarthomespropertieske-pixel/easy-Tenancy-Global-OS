/* ═══════════════════════════════════════════════════════════════════════
   GeoMarket — Global region detection + PPP-adjusted subscription pricing
   ──────────────────────────────────────────────────────────────────────
   Pure browser-side: timezone → country → region → currency → PPP factor.
   Used by Pricing component + GeoBanner + analytics segmentation.

   References used to calibrate:
   - World Bank PPP conversion factor (2024)
   - Stripe Atlas / Linear / Notion / Vercel regional pricing
   - PropTech vertical: London/Dubai/Singapore are premium; Lagos/Nairobi/Manila get PPP discount
═══════════════════════════════════════════════════════════════════════ */

export type Region =
  | 'NA' | 'EU' | 'UK' | 'MEA' | 'GCC' | 'AFRICA'
  | 'APAC' | 'SEA' | 'LATAM' | 'OCEANIA'

export interface RegionInfo {
  /** ISO 3166-1 alpha-2 */
  country: string
  /** Region bucket */
  region: Region
  /** Localized currency */
  currency: string
  /** Currency symbol */
  symbol: string
  /** Country flag emoji */
  flag: string
  /** Pretty country name */
  countryName: string
  /** PPP multiplier vs USD list price (1.0 = parity, 0.45 = 55% discount) */
  ppp: number
  /** FX rate vs USD (rough, for display only) */
  fx: number
  /** Tier-1 sales motion ("ROW" = self-serve, "ENTERPRISE" = sales-led) */
  motion: 'SELF_SERVE' | 'ENTERPRISE' | 'ASSISTED'
  /** Locale code for Intl.NumberFormat */
  locale: string
}

// ── Country → RegionInfo (extensive list; fallback = US) ─────────────────
// PPP figures sourced from World Bank ICP 2024 program (rounded to nearest 0.05)
const REGIONS: Record<string, RegionInfo> = {
  // North America (parity baseline)
  US: { country: 'US', region: 'NA', currency: 'USD', symbol: '$',   flag: '🇺🇸', countryName: 'United States',  ppp: 1.00, fx: 1.00,  motion: 'SELF_SERVE', locale: 'en-US' },
  CA: { country: 'CA', region: 'NA', currency: 'CAD', symbol: 'C$',  flag: '🇨🇦', countryName: 'Canada',         ppp: 1.00, fx: 1.36,  motion: 'SELF_SERVE', locale: 'en-CA' },
  MX: { country: 'MX', region: 'LATAM', currency: 'MXN', symbol: 'Mx$', flag: '🇲🇽', countryName: 'Mexico',     ppp: 0.55, fx: 17.30, motion: 'SELF_SERVE', locale: 'es-MX' },

  // UK + EU (premium tier)
  UK: { country: 'UK', region: 'UK', currency: 'GBP', symbol: '£',   flag: '🇬🇧', countryName: 'United Kingdom', ppp: 1.05, fx: 0.79,  motion: 'SELF_SERVE', locale: 'en-GB' },
  GB: { country: 'GB', region: 'UK', currency: 'GBP', symbol: '£',   flag: '🇬🇧', countryName: 'United Kingdom', ppp: 1.05, fx: 0.79,  motion: 'SELF_SERVE', locale: 'en-GB' },
  IE: { country: 'IE', region: 'EU', currency: 'EUR', symbol: '€',   flag: '🇮🇪', countryName: 'Ireland',        ppp: 1.05, fx: 0.92,  motion: 'SELF_SERVE', locale: 'en-IE' },
  DE: { country: 'DE', region: 'EU', currency: 'EUR', symbol: '€',   flag: '🇩🇪', countryName: 'Germany',        ppp: 1.00, fx: 0.92,  motion: 'SELF_SERVE', locale: 'de-DE' },
  FR: { country: 'FR', region: 'EU', currency: 'EUR', symbol: '€',   flag: '🇫🇷', countryName: 'France',         ppp: 1.00, fx: 0.92,  motion: 'SELF_SERVE', locale: 'fr-FR' },
  ES: { country: 'ES', region: 'EU', currency: 'EUR', symbol: '€',   flag: '🇪🇸', countryName: 'Spain',          ppp: 0.85, fx: 0.92,  motion: 'SELF_SERVE', locale: 'es-ES' },
  IT: { country: 'IT', region: 'EU', currency: 'EUR', symbol: '€',   flag: '🇮🇹', countryName: 'Italy',          ppp: 0.85, fx: 0.92,  motion: 'SELF_SERVE', locale: 'it-IT' },
  NL: { country: 'NL', region: 'EU', currency: 'EUR', symbol: '€',   flag: '🇳🇱', countryName: 'Netherlands',    ppp: 1.00, fx: 0.92,  motion: 'SELF_SERVE', locale: 'nl-NL' },
  PT: { country: 'PT', region: 'EU', currency: 'EUR', symbol: '€',   flag: '🇵🇹', countryName: 'Portugal',       ppp: 0.75, fx: 0.92,  motion: 'SELF_SERVE', locale: 'pt-PT' },
  PL: { country: 'PL', region: 'EU', currency: 'PLN', symbol: 'zł',  flag: '🇵🇱', countryName: 'Poland',         ppp: 0.55, fx: 4.00,  motion: 'SELF_SERVE', locale: 'pl-PL' },
  CH: { country: 'CH', region: 'EU', currency: 'CHF', symbol: 'CHF', flag: '🇨🇭', countryName: 'Switzerland',    ppp: 1.20, fx: 0.88,  motion: 'ASSISTED',   locale: 'de-CH' },

  // GCC — premium, sales-assisted
  AE: { country: 'AE', region: 'GCC', currency: 'AED', symbol: 'AED', flag: '🇦🇪', countryName: 'UAE',           ppp: 0.95, fx: 3.67,  motion: 'ASSISTED',   locale: 'en-AE' },
  SA: { country: 'SA', region: 'GCC', currency: 'SAR', symbol: 'SAR', flag: '🇸🇦', countryName: 'Saudi Arabia',  ppp: 0.85, fx: 3.75,  motion: 'ASSISTED',   locale: 'en-SA' },
  QA: { country: 'QA', region: 'GCC', currency: 'QAR', symbol: 'QAR', flag: '🇶🇦', countryName: 'Qatar',         ppp: 1.00, fx: 3.64,  motion: 'ASSISTED',   locale: 'en-QA' },
  KW: { country: 'KW', region: 'GCC', currency: 'KWD', symbol: 'KWD', flag: '🇰🇼', countryName: 'Kuwait',        ppp: 1.00, fx: 0.31,  motion: 'ASSISTED',   locale: 'en-KW' },
  BH: { country: 'BH', region: 'GCC', currency: 'BHD', symbol: 'BHD', flag: '🇧🇭', countryName: 'Bahrain',       ppp: 0.95, fx: 0.38,  motion: 'ASSISTED',   locale: 'en-BH' },
  OM: { country: 'OM', region: 'GCC', currency: 'OMR', symbol: 'OMR', flag: '🇴🇲', countryName: 'Oman',          ppp: 0.95, fx: 0.39,  motion: 'ASSISTED',   locale: 'en-OM' },

  // Africa — PPP-aggressive (this is where monopoly is won)
  ZA: { country: 'ZA', region: 'AFRICA', currency: 'ZAR', symbol: 'R',   flag: '🇿🇦', countryName: 'South Africa', ppp: 0.45, fx: 18.50, motion: 'SELF_SERVE', locale: 'en-ZA' },
  NG: { country: 'NG', region: 'AFRICA', currency: 'NGN', symbol: '₦',   flag: '🇳🇬', countryName: 'Nigeria',      ppp: 0.30, fx: 1500,  motion: 'SELF_SERVE', locale: 'en-NG' },
  KE: { country: 'KE', region: 'AFRICA', currency: 'KES', symbol: 'KSh', flag: '🇰🇪', countryName: 'Kenya',        ppp: 0.35, fx: 130,   motion: 'SELF_SERVE', locale: 'en-KE' },
  GH: { country: 'GH', region: 'AFRICA', currency: 'GHS', symbol: 'GH₵', flag: '🇬🇭', countryName: 'Ghana',        ppp: 0.35, fx: 12.50, motion: 'SELF_SERVE', locale: 'en-GH' },
  EG: { country: 'EG', region: 'MEA',    currency: 'EGP', symbol: 'E£',  flag: '🇪🇬', countryName: 'Egypt',        ppp: 0.30, fx: 48.50, motion: 'SELF_SERVE', locale: 'en-EG' },
  TZ: { country: 'TZ', region: 'AFRICA', currency: 'TZS', symbol: 'TSh', flag: '🇹🇿', countryName: 'Tanzania',     ppp: 0.30, fx: 2500,  motion: 'SELF_SERVE', locale: 'en-TZ' },
  UG: { country: 'UG', region: 'AFRICA', currency: 'UGX', symbol: 'USh', flag: '🇺🇬', countryName: 'Uganda',       ppp: 0.30, fx: 3700,  motion: 'SELF_SERVE', locale: 'en-UG' },
  RW: { country: 'RW', region: 'AFRICA', currency: 'RWF', symbol: 'RF',  flag: '🇷🇼', countryName: 'Rwanda',       ppp: 0.30, fx: 1330,  motion: 'SELF_SERVE', locale: 'en-RW' },
  MA: { country: 'MA', region: 'AFRICA', currency: 'MAD', symbol: 'DH',  flag: '🇲🇦', countryName: 'Morocco',      ppp: 0.40, fx: 10.00, motion: 'SELF_SERVE', locale: 'en-MA' },

  // APAC — Japan/SG/HK at parity, India/PH/ID get PPP
  JP: { country: 'JP', region: 'APAC', currency: 'JPY', symbol: '¥',   flag: '🇯🇵', countryName: 'Japan',         ppp: 0.80, fx: 156,   motion: 'ASSISTED',   locale: 'ja-JP' },
  KR: { country: 'KR', region: 'APAC', currency: 'KRW', symbol: '₩',   flag: '🇰🇷', countryName: 'South Korea',   ppp: 0.85, fx: 1380,  motion: 'SELF_SERVE', locale: 'ko-KR' },
  SG: { country: 'SG', region: 'APAC', currency: 'SGD', symbol: 'S$',  flag: '🇸🇬', countryName: 'Singapore',     ppp: 1.00, fx: 1.35,  motion: 'SELF_SERVE', locale: 'en-SG' },
  HK: { country: 'HK', region: 'APAC', currency: 'HKD', symbol: 'HK$', flag: '🇭🇰', countryName: 'Hong Kong',     ppp: 1.00, fx: 7.80,  motion: 'SELF_SERVE', locale: 'en-HK' },
  TW: { country: 'TW', region: 'APAC', currency: 'TWD', symbol: 'NT$', flag: '🇹🇼', countryName: 'Taiwan',        ppp: 0.85, fx: 32,    motion: 'SELF_SERVE', locale: 'zh-TW' },
  IN: { country: 'IN', region: 'APAC', currency: 'INR', symbol: '₹',   flag: '🇮🇳', countryName: 'India',         ppp: 0.30, fx: 84,    motion: 'SELF_SERVE', locale: 'en-IN' },
  PH: { country: 'PH', region: 'SEA',  currency: 'PHP', symbol: '₱',   flag: '🇵🇭', countryName: 'Philippines',   ppp: 0.35, fx: 57,    motion: 'SELF_SERVE', locale: 'en-PH' },
  ID: { country: 'ID', region: 'SEA',  currency: 'IDR', symbol: 'Rp',  flag: '🇮🇩', countryName: 'Indonesia',     ppp: 0.35, fx: 15800, motion: 'SELF_SERVE', locale: 'en-ID' },
  TH: { country: 'TH', region: 'SEA',  currency: 'THB', symbol: '฿',   flag: '🇹🇭', countryName: 'Thailand',      ppp: 0.40, fx: 35,    motion: 'SELF_SERVE', locale: 'en-TH' },
  VN: { country: 'VN', region: 'SEA',  currency: 'VND', symbol: '₫',   flag: '🇻🇳', countryName: 'Vietnam',       ppp: 0.30, fx: 25400, motion: 'SELF_SERVE', locale: 'en-VN' },
  MY: { country: 'MY', region: 'SEA',  currency: 'MYR', symbol: 'RM',  flag: '🇲🇾', countryName: 'Malaysia',      ppp: 0.45, fx: 4.70,  motion: 'SELF_SERVE', locale: 'en-MY' },

  // LATAM
  BR: { country: 'BR', region: 'LATAM', currency: 'BRL', symbol: 'R$', flag: '🇧🇷', countryName: 'Brazil',        ppp: 0.50, fx: 5.80,  motion: 'SELF_SERVE', locale: 'pt-BR' },
  AR: { country: 'AR', region: 'LATAM', currency: 'USD', symbol: 'US$',flag: '🇦🇷', countryName: 'Argentina',     ppp: 0.45, fx: 1.00,  motion: 'SELF_SERVE', locale: 'es-AR' }, // USD due to FX volatility
  CL: { country: 'CL', region: 'LATAM', currency: 'CLP', symbol: 'CLP$', flag: '🇨🇱', countryName: 'Chile',       ppp: 0.55, fx: 970,   motion: 'SELF_SERVE', locale: 'es-CL' },
  CO: { country: 'CO', region: 'LATAM', currency: 'COP', symbol: 'COL$', flag: '🇨🇴', countryName: 'Colombia',    ppp: 0.45, fx: 4100,  motion: 'SELF_SERVE', locale: 'es-CO' },
  PE: { country: 'PE', region: 'LATAM', currency: 'PEN', symbol: 'S/',  flag: '🇵🇪', countryName: 'Peru',         ppp: 0.45, fx: 3.75,  motion: 'SELF_SERVE', locale: 'es-PE' },

  // Oceania
  AU: { country: 'AU', region: 'OCEANIA', currency: 'AUD', symbol: 'A$', flag: '🇦🇺', countryName: 'Australia',   ppp: 1.10, fx: 1.52,  motion: 'SELF_SERVE', locale: 'en-AU' },
  NZ: { country: 'NZ', region: 'OCEANIA', currency: 'NZD', symbol: 'NZ$', flag: '🇳🇿', countryName: 'New Zealand',ppp: 1.10, fx: 1.66,  motion: 'SELF_SERVE', locale: 'en-NZ' },
}

const FALLBACK: RegionInfo = REGIONS.US

// ── Timezone → country (extensive map) ────────────────────────────────────
const TZ_TO_COUNTRY: Record<string, string> = {
  // Americas
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Los_Angeles': 'US', 'America/Denver': 'US', 'America/Phoenix': 'US',
  'America/Anchorage': 'US', 'America/Honolulu': 'US', 'America/Detroit': 'US', 'America/Indiana/Indianapolis': 'US',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Montreal': 'CA', 'America/Edmonton': 'CA',
  'America/Mexico_City': 'MX', 'America/Sao_Paulo': 'BR', 'America/Buenos_Aires': 'AR', 'America/Santiago': 'CL',
  'America/Bogota': 'CO', 'America/Lima': 'PE',

  // Europe
  'Europe/London': 'UK', 'Europe/Dublin': 'IE', 'Europe/Berlin': 'DE', 'Europe/Paris': 'FR', 'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL', 'Europe/Lisbon': 'PT', 'Europe/Warsaw': 'PL', 'Europe/Zurich': 'CH',

  // MEA / GCC
  'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW', 'Asia/Bahrain': 'BH', 'Asia/Muscat': 'OM',

  // Africa
  'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE', 'Africa/Accra': 'GH',
  'Africa/Cairo': 'EG', 'Africa/Dar_es_Salaam': 'TZ', 'Africa/Kampala': 'UG', 'Africa/Kigali': 'RW', 'Africa/Casablanca': 'MA',

  // APAC
  'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Singapore': 'SG', 'Asia/Hong_Kong': 'HK', 'Asia/Taipei': 'TW',
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Manila': 'PH', 'Asia/Jakarta': 'ID',
  'Asia/Bangkok': 'TH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Kuala_Lumpur': 'MY',

  // Oceania
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU', 'Australia/Perth': 'AU',
  'Pacific/Auckland': 'NZ',
}

// ── Detect user region from browser ──────────────────────────────────────
export function detectRegion(): RegionInfo {
  if (typeof window === 'undefined') return FALLBACK

  try {
    // 1. URL override (?country=UK for testing)
    const url = new URL(window.location.href)
    const override = url.searchParams.get('country')?.toUpperCase()
    if (override && REGIONS[override]) return REGIONS[override]

    // 2. LocalStorage manual override
    const stored = localStorage.getItem('et_region')
    if (stored && REGIONS[stored]) return REGIONS[stored]

    // 3. Timezone-based detection
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const country = TZ_TO_COUNTRY[tz]
    if (country && REGIONS[country]) return REGIONS[country]

    // 4. Navigator locale fallback (e.g. "en-GB" → UK)
    const locale = navigator.language || 'en-US'
    const langCountry = locale.split('-')[1]?.toUpperCase()
    if (langCountry && REGIONS[langCountry]) return REGIONS[langCountry]
  } catch {
    /* Ignore — fall through to default */
  }

  return FALLBACK
}

// ── Manually set region (for region picker) ──────────────────────────────
export function setRegion(country: string): RegionInfo {
  const next = REGIONS[country.toUpperCase()] || FALLBACK
  try {
    localStorage.setItem('et_region', next.country)
  } catch { /* private mode */ }
  return next
}

// ── All available regions (for dropdown) ─────────────────────────────────
export function listRegions(): RegionInfo[] {
  const seen = new Set<string>()
  const result: RegionInfo[] = []
  for (const r of Object.values(REGIONS)) {
    if (!seen.has(r.country)) {
      seen.add(r.country)
      result.push(r)
    }
  }
  return result.sort((a, b) => a.countryName.localeCompare(b.countryName))
}

// ── Price formatter (PPP-adjusted, locale-aware, Stripe-style) ───────────
export function formatPrice(usdMonthly: number, info: RegionInfo): {
  display: string         // "£31/mo"
  raw: number             // 31
  symbol: string          // "£"
  currency: string        // "GBP"
  savings: number | null  // 18 (% off list)
} {
  if (usdMonthly <= 0) {
    return { display: 'Free', raw: 0, symbol: info.symbol, currency: info.currency, savings: null }
  }

  // 1. Apply PPP factor to USD list price
  const pppUsd = usdMonthly * info.ppp
  // 2. Convert to local currency
  const localRaw = pppUsd * info.fx

  // 3. Round to "psychologically clean" tier:
  //    - USD/EUR/GBP/CHF/AUD/SGD/CAD: round to nearest 9 ($29, $49, $99)
  //    - JPY/KRW/IDR/VND/COP/CLP: round to nearest 100 / 1000
  //    - Others: round to nearest 5
  const big = ['JPY', 'KRW', 'IDR', 'VND', 'COP', 'CLP', 'NGN', 'UGX', 'TZS']
  const med = ['INR', 'PHP', 'THB', 'KES', 'ZAR', 'BRL', 'MXN', 'EGP']

  let rounded: number
  if (big.includes(info.currency)) {
    const step = info.currency === 'JPY' ? 100 : info.currency === 'KRW' ? 1000 : 1000
    rounded = Math.round(localRaw / step) * step
  } else if (med.includes(info.currency)) {
    rounded = Math.round(localRaw / 50) * 50
  } else {
    // round to nearest "9" (e.g. 29, 39, 49, 99) — Stripe pricing psychology
    const base = Math.round(localRaw / 10) * 10
    rounded = base > 0 ? base - 1 : base
  }

  // 4. Format using Intl
  let display: string
  try {
    display = new Intl.NumberFormat(info.locale, {
      style: 'currency', currency: info.currency,
      maximumFractionDigits: rounded >= 1000 ? 0 : 0,
      minimumFractionDigits: 0,
    }).format(rounded)
  } catch {
    display = `${info.symbol}${rounded.toLocaleString()}`
  }
  display += '/mo'

  const savings = info.ppp < 1 ? Math.round((1 - info.ppp) * 100) : null
  return { display, raw: rounded, symbol: info.symbol, currency: info.currency, savings }
}

// ── Regional offer/bundle picker — different "hero" per region ───────────
export interface RegionalOffer {
  /** Headline copy override */
  headline?: string
  /** Sub-headline */
  sub?: string
  /** Featured integrations */
  integrations: string[]
  /** Compliance highlights */
  compliance: string[]
  /** Payment methods */
  payments: string[]
  /** Bundle name */
  bundleName: string
  /** USD discount applied to all tiers (regional incentive) */
  bonusDiscount: number
}

export function getRegionalOffer(info: RegionInfo): RegionalOffer {
  switch (info.region) {
    case 'UK':
      return {
        headline: 'Britain\'s favourite property OS',
        sub: 'HMRC-ready · Section 21 compliant · Right to Rent + EPC tracking built-in.',
        integrations: ['Open Banking', 'GOV.UK Notify', 'Companies House', 'Stripe', 'Xero'],
        compliance: ['Section 21', 'Section 8', 'Right to Rent', 'EPC C-grade by 2028', 'GDPR-UK'],
        payments: ['Open Banking', 'Direct Debit (BACS)', 'Card', 'Faster Payments'],
        bundleName: 'UK Sovereign Pack',
        bonusDiscount: 0,
      }
    case 'EU':
      return {
        headline: 'Europe\'s compliance-first property OS',
        sub: 'SEPA · eIDAS · GDPR · 23 jurisdictions, one platform.',
        integrations: ['SEPA Direct Debit', 'Stripe', 'eIDAS QES', 'Mollie', 'GoCardless'],
        compliance: ['GDPR', 'eIDAS', 'Local rent caps', 'IFRS 16', 'CSRD'],
        payments: ['SEPA Direct Debit', 'iDEAL', 'Bancontact', 'Card', 'Klarna'],
        bundleName: 'EU Compliance Pack',
        bonusDiscount: 0,
      }
    case 'GCC':
      return {
        headline: 'The Gulf\'s most trusted property OS',
        sub: 'RERA Dubai · ADGM · DIFC · Sharia-compliant accounting · Arabic-RTL.',
        integrations: ['Ejari', 'RERA Dubai', 'Tabby', 'Tamara', 'Mada Pay'],
        compliance: ['RERA', 'Ejari', 'ADGM/DIFC', 'VAT 5%', 'Sharia accounting'],
        payments: ['Mada', 'Apple Pay', 'Tabby', 'Tamara', 'Bank Transfer'],
        bundleName: 'GCC Premium Pack',
        bonusDiscount: 0,
      }
    case 'AFRICA':
    case 'MEA':
      return {
        headline: 'Africa\'s #1 property OS',
        sub: 'M-Pesa · Flutterwave · Paystack · MTN MoMo · 18 country compliance packs.',
        integrations: ['M-Pesa', 'Flutterwave', 'Paystack', 'MTN MoMo', 'Airtel Money'],
        compliance: ['POPIA (ZA)', 'NDPR (NG)', 'Data Protection Act (KE)', 'Land Act compliance'],
        payments: ['M-Pesa', 'Flutterwave', 'Paystack', 'MTN MoMo', 'Bank Transfer'],
        bundleName: 'Africa Growth Pack',
        bonusDiscount: 10, // extra 10% off — emerging market incentive
      }
    case 'APAC':
    case 'SEA':
      return {
        headline: 'Asia-Pacific\'s leading property OS',
        sub: 'UPI · GrabPay · PayNow · Alipay · 11 country localizations.',
        integrations: ['UPI', 'GrabPay', 'PayNow', 'Alipay', 'PromptPay', 'Razorpay'],
        compliance: ['PDPA (SG)', 'APPI (JP)', 'PDPA (TH)', 'RERA (IN)', 'CRA'],
        payments: ['UPI', 'PayNow', 'GrabPay', 'Alipay', 'PromptPay', 'Card'],
        bundleName: 'APAC Growth Pack',
        bonusDiscount: info.region === 'SEA' ? 10 : 0,
      }
    case 'LATAM':
      return {
        headline: 'Latin America\'s property OS',
        sub: 'PIX · MercadoPago · OXXO · SEPA-style local rails · 8 country packs.',
        integrations: ['PIX', 'MercadoPago', 'OXXO', 'Stripe Brazil', 'Conekta'],
        compliance: ['LGPD (BR)', 'Habeas Data (CO)', 'Ley 25.326 (AR)'],
        payments: ['PIX', 'MercadoPago', 'OXXO', 'Boleto', 'Card'],
        bundleName: 'LATAM Growth Pack',
        bonusDiscount: 10,
      }
    case 'OCEANIA':
      return {
        headline: 'Australasia\'s property OS',
        sub: 'PEXA · BPay · Osko · IFRS 16 · Trust accounting (every state).',
        integrations: ['PEXA', 'BPay', 'Osko', 'Xero', 'MYOB'],
        compliance: ['Privacy Act 1988', 'NRAS', 'IFRS 16', 'State trust accounting'],
        payments: ['BPay', 'Osko (NPP)', 'Direct Debit', 'Card', 'PayID'],
        bundleName: 'AU/NZ Pack',
        bonusDiscount: 0,
      }
    case 'NA':
    default:
      return {
        headline: 'The #1 property operating system in North America',
        sub: 'Plaid · Stripe · ACH same-day · IFRS 16 + GAAP · 50-state compliance.',
        integrations: ['Plaid', 'Stripe', 'QuickBooks', 'DocuSign', 'Salesforce'],
        compliance: ['CCPA', 'Fair Housing Act', 'FCRA', 'SOC 2 Type II', 'GAAP/IFRS 16'],
        payments: ['ACH', 'Card', 'Apple Pay', 'Google Pay', 'Wire'],
        bundleName: 'North America Pro',
        bonusDiscount: 0,
      }
  }
}

// ── Region label for display ─────────────────────────────────────────────
export const REGION_LABELS: Record<Region, string> = {
  NA: 'North America', EU: 'Europe', UK: 'United Kingdom',
  MEA: 'Middle East & Africa', GCC: 'Gulf Cooperation Council', AFRICA: 'Africa',
  APAC: 'Asia-Pacific', SEA: 'South-East Asia',
  LATAM: 'Latin America', OCEANIA: 'Oceania',
}
