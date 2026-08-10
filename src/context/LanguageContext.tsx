// ════════════════════════════════════════════════════════════════════════
//  LanguageContext.tsx — Global Multi-Language & Locale State Engine
//  ─────────────────────────────────────────────────────────────────────
//  • Manages application language locale state (EN, ES, FR, DE, SW, AR, PT, ZH, JA, HI)
//  • Handles text direction ('ltr' vs 'rtl' for Arabic) & html lang attributes
//  • Provides reactive translation helper t(key) & locale formatters
//  • Persists language preferences in localStorage ('et_lang')
// ════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'sw' | 'ar' | 'pt' | 'zh' | 'ja' | 'hi'

export interface LanguageMeta {
  code: LanguageCode
  locale: string
  name: string
  nativeName: string
  flag: string
  dir: 'ltr' | 'rtl'
  currency: string
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', locale: 'en-US', name: 'English', nativeName: 'English', flag: '🇺🇸', dir: 'ltr', currency: 'USD' },
  { code: 'es', locale: 'es-ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr', currency: 'EUR' },
  { code: 'fr', locale: 'fr-FR', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr', currency: 'EUR' },
  { code: 'de', locale: 'de-DE', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr', currency: 'EUR' },
  { code: 'sw', locale: 'sw-KE', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', dir: 'ltr', currency: 'KES' },
  { code: 'ar', locale: 'ar-AE', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪', dir: 'rtl', currency: 'AED' },
  { code: 'pt', locale: 'pt-BR', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', dir: 'ltr', currency: 'BRL' },
  { code: 'zh', locale: 'zh-CN', name: 'Chinese', nativeName: '中文 (简体)', flag: '🇨🇳', dir: 'ltr', currency: 'CNY' },
  { code: 'ja', locale: 'ja-JP', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', dir: 'ltr', currency: 'JPY' },
  { code: 'hi', locale: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', dir: 'ltr', currency: 'INR' },
]

// Built-in OS UI dictionary translations
const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    'nav.platform': 'Platform',
    'nav.demo': 'View Demo',
    'nav.search': 'Search',
    'nav.sign_in': 'Sign In',
    'nav.overview': 'Overview',
    'nav.properties': 'Properties',
    'nav.files': 'Files',
    'nav.market': 'Market',
    'nav.actions': 'Actions',
    'nav.ai_copilot': 'AI Copilot',
    'activity.audit_log': 'Property Audit Log',
    'activity.export_csv': 'Export Audit CSV',
    'activity.log_event': 'Log Audit Event',
    'theme.toggle': 'Toggle Theme',
  },
  es: {
    'nav.platform': 'Plataforma',
    'nav.demo': 'Ver Demo',
    'nav.search': 'Buscar',
    'nav.sign_in': 'Iniciar Sesión',
    'nav.overview': 'Resumen',
    'nav.properties': 'Propiedades',
    'nav.files': 'Archivos',
    'nav.market': 'Mercado',
    'nav.actions': 'Acciones',
    'nav.ai_copilot': 'Copiloto IA',
    'activity.audit_log': 'Registro de Auditoría',
    'activity.export_csv': 'Exportar CSV',
    'activity.log_event': 'Registrar Evento',
    'theme.toggle': 'Cambiar Tema',
  },
  fr: {
    'nav.platform': 'Plateforme',
    'nav.demo': 'Voir Démo',
    'nav.search': 'Rechercher',
    'nav.sign_in': 'Se Connecter',
    'nav.overview': 'Aperçu',
    'nav.properties': 'Propriétés',
    'nav.files': 'Fichiers',
    'nav.market': 'Marché',
    'nav.actions': 'Actions',
    'nav.ai_copilot': 'Copilote IA',
    'activity.audit_log': "Journal d'Audit",
    'activity.export_csv': 'Exporter CSV',
    'activity.log_event': 'Enregistrer Événement',
    'theme.toggle': 'Changer le Thème',
  },
  de: {
    'nav.platform': 'Plattform',
    'nav.demo': 'Demo Ansehen',
    'nav.search': 'Suchen',
    'nav.sign_in': 'Anmelden',
    'nav.overview': 'Übersicht',
    'nav.properties': 'Immobilien',
    'nav.files': 'Dateien',
    'nav.market': 'Markt',
    'nav.actions': 'Aktionen',
    'nav.ai_copilot': 'KI-Copilot',
    'activity.audit_log': 'Audit-Protokoll',
    'activity.export_csv': 'CSV Exportieren',
    'activity.log_event': 'Ereignis Protokollieren',
    'theme.toggle': 'Design Wechseln',
  },
  sw: {
    'nav.platform': 'Jukwaa',
    'nav.demo': 'Tazama Demo',
    'nav.search': 'Tafuta',
    'nav.sign_in': 'Ingia',
    'nav.overview': 'Muhtasari',
    'nav.properties': 'Mali na Nyumba',
    'nav.files': 'Mafaili',
    'nav.market': 'Soko',
    'nav.actions': 'Vitendo',
    'nav.ai_copilot': 'Msaidizi wa AI',
    'activity.audit_log': 'Kumbukumbu ya Ukaguzi',
    'activity.export_csv': 'Pakua CSV ya Ukaguzi',
    'activity.log_event': 'Andika Ukaguzi',
    'theme.toggle': 'Badilisha Mandhari',
  },
  ar: {
    'nav.platform': 'المنصة',
    'nav.demo': 'عرض العرض التوضيحي',
    'nav.search': 'بحث',
    'nav.sign_in': 'تسجيل الدخول',
    'nav.overview': 'نظرة عامة',
    'nav.properties': 'العقارات',
    'nav.files': 'الملفات',
    'nav.market': 'السوق',
    'nav.actions': 'الإجراءات',
    'nav.ai_copilot': 'المساعد الذكي',
    'activity.audit_log': 'سجل تدقيق العقارات',
    'activity.export_csv': 'تصدير CSV للتدقيق',
    'activity.log_event': 'تسجيل حدث تدقيق',
    'theme.toggle': 'تغيير المظهر',
  },
  pt: {
    'nav.platform': 'Plataforma',
    'nav.demo': 'Ver Demonstração',
    'nav.search': 'Buscar',
    'nav.sign_in': 'Entrar',
    'nav.overview': 'Visão Geral',
    'nav.properties': 'Propriedades',
    'nav.files': 'Arquivos',
    'nav.market': 'Mercado',
    'nav.actions': 'Ações',
    'nav.ai_copilot': 'Copiloto de IA',
    'activity.audit_log': 'Registro de Auditoria',
    'activity.export_csv': 'Exportar CSV',
    'activity.log_event': 'Registrar Auditoria',
    'theme.toggle': 'Alternar Tema',
  },
  zh: {
    'nav.platform': '平台',
    'nav.demo': '查看演示',
    'nav.search': '搜索',
    'nav.sign_in': '登录',
    'nav.overview': '概览',
    'nav.properties': '资产',
    'nav.files': '文件',
    'nav.market': '市场',
    'nav.actions': '操作',
    'nav.ai_copilot': 'AI 助手',
    'activity.audit_log': '资产审计日志',
    'activity.export_csv': '导出审计 CSV',
    'activity.log_event': '记录审计事件',
    'theme.toggle': '切换主题',
  },
  ja: {
    'nav.platform': 'プラットフォーム',
    'nav.demo': 'デモを見る',
    'nav.search': '検索',
    'nav.sign_in': 'ログイン',
    'nav.overview': '概要',
    'nav.properties': '物件',
    'nav.files': 'ファイル',
    'nav.market': '力',
    'nav.actions': 'アクション',
    'nav.ai_copilot': 'AIコパイロット',
    'activity.audit_log': '物件監査ログ',
    'activity.export_csv': '監査CSV出力',
    'activity.log_event': '監査記録の追加',
    'theme.toggle': 'テーマ切替',
  },
  hi: {
    'nav.platform': 'प्लेटफ़ॉर्म',
    'nav.demo': 'डेमो देखें',
    'nav.search': 'खोजें',
    'nav.sign_in': 'साइन इन करें',
    'nav.overview': 'अवलोकन',
    'nav.properties': 'संपत्तियां',
    'nav.files': 'फ़ाइलें',
    'nav.market': 'बाज़ार',
    'nav.actions': 'कार्रवाई',
    'nav.ai_copilot': 'एआई कोपायलट',
    'activity.audit_log': 'संपत्ति लेखा परीक्षा लॉग',
    'activity.export_csv': 'सीएसवी निर्यात करें',
    'activity.log_event': 'इवेंट दर्ज करें',
    'theme.toggle': 'थीम बदलें',
  },
}

export interface LanguageContextType {
  language: LanguageCode
  currentLangMeta: LanguageMeta
  setLanguage: (code: LanguageCode) => void
  t: (key: string, fallback?: string) => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
  formatCurrency: (amount: number, currencyCode?: string) => string
  isRTL: boolean
}

const STORAGE_KEY = 'et_lang'
const EVENT_NAME = 'et:lang-changed'

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function getStoredLanguage(): LanguageCode {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null
      if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
        return stored
      }
    }
  } catch {
    // SSR safe
  }
  return 'en'
}

export interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<LanguageCode>(() => getStoredLanguage())

  const currentLangMeta = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0]

  // Synchronize document attributes & localStorage
  useEffect(() => {
    try {
      const root = document.documentElement
      root.setAttribute('lang', currentLangMeta.locale)
      root.setAttribute('dir', currentLangMeta.dir)

      localStorage.setItem(STORAGE_KEY, language)

      // Emit custom event
      window.dispatchEvent(new CustomEvent<LanguageCode>(EVENT_NAME, { detail: language }))
    } catch (err) {
      console.warn('Language attribute sync error:', err)
    }
  }, [language, currentLangMeta])

  const setLanguage = useCallback((code: LanguageCode) => {
    if (SUPPORTED_LANGUAGES.some((l) => l.code === code)) {
      setLanguageState(code)
    }
  }, [])

  // Translation lookup helper
  const t = useCallback(
    (key: string, fallback?: string): string => {
      const langMap = TRANSLATIONS[language]
      if (langMap && langMap[key]) {
        return langMap[key]
      }
      // Fallback to English
      if (TRANSLATIONS.en && TRANSLATIONS.en[key]) {
        return TRANSLATIONS.en[key]
      }
      return fallback || key
    },
    [language]
  )

  // Locale number formatter
  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions): string => {
      try {
        return new Intl.NumberFormat(currentLangMeta.locale, options).format(value)
      } catch {
        return value.toString()
      }
    },
    [currentLangMeta.locale]
  )

  // Locale currency formatter
  const formatCurrency = useCallback(
    (amount: number, currencyCode?: string): string => {
      try {
        const cur = currencyCode || currentLangMeta.currency
        return new Intl.NumberFormat(currentLangMeta.locale, {
          style: 'currency',
          currency: cur,
          maximumFractionDigits: 0,
        }).format(amount)
      } catch {
        return `$${amount.toLocaleString()}`
      }
    },
    [currentLangMeta.locale, currentLangMeta.currency]
  )

  const value: LanguageContextType = {
    language,
    currentLangMeta,
    setLanguage,
    t,
    formatNumber,
    formatCurrency,
    isRTL: currentLangMeta.dir === 'rtl',
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

/**
 * Hook to access active language & locale context
 */
export function useLanguageContext(): LanguageContextType {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguageContext must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext
