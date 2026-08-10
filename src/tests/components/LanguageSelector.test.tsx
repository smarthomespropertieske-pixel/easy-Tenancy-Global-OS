import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { LanguageProvider } from '../../context/LanguageContext'
import LanguageSelector from '../../components/LanguageSelector'

describe('LanguageSelector Component', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.setAttribute('lang', 'en-US')
    document.documentElement.setAttribute('dir', 'ltr')
  })

  it('renders trigger button with current language badge', () => {
    render(
      <LanguageProvider>
        <LanguageSelector />
      </LanguageProvider>
    )

    const trigger = screen.getByRole('button', { name: /current language/i })
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveTextContent(/EN/i)
  })

  it('opens dropdown menu and filters languages when typing in search', () => {
    render(
      <LanguageProvider>
        <LanguageSelector />
      </LanguageProvider>
    )

    const trigger = screen.getByRole('button', { name: /current language/i })
    fireEvent.click(trigger)

    // Search input should appear
    const searchInput = screen.getByPlaceholderText(/search language/i)
    expect(searchInput).toBeInTheDocument()

    // Search for Swahili
    fireEvent.change(searchInput, { target: { value: 'Swahili' } })
    expect(screen.getByText('Kiswahili')).toBeInTheDocument()
  })

  it('updates language and document attributes upon language selection', () => {
    render(
      <LanguageProvider>
        <LanguageSelector />
      </LanguageProvider>
    )

    const trigger = screen.getByRole('button', { name: /current language/i })
    fireEvent.click(trigger)

    // Select Spanish option
    const spanishOption = screen.getByText('Español')
    fireEvent.click(spanishOption)

    expect(localStorage.getItem('et_lang')).toBe('es')
    expect(document.documentElement.getAttribute('lang')).toBe('es-ES')
  })
})
