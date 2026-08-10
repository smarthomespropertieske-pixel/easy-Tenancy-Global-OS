import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { ThemeProvider } from '../../context/ThemeContext'
import ThemeToggle from '../../components/ThemeToggle'

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.className = ''
  })

  it('renders dark mode pill toggle by default', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle variant="pill" />
      </ThemeProvider>
    )

    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument()
    expect(screen.getByText(/dark mode/i)).toBeInTheDocument()
  })

  it('toggles theme between dark and light mode on click', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle variant="pill" />
      </ThemeProvider>
    )

    const toggleBtn = screen.getByRole('button', { name: /switch to light mode/i })
    fireEvent.click(toggleBtn)

    // Should switch to Light Mode
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('easytenancy_theme')).toBe('light')
    expect(screen.getByText(/light mode/i)).toBeInTheDocument()

    // Click again to switch back to Dark Mode
    fireEvent.click(toggleBtn)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('easytenancy_theme')).toBe('dark')
  })

  it('renders icon variant correctly', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle variant="icon" />
      </ThemeProvider>
    )

    const iconBtn = screen.getByRole('button', { name: /switch to dark mode/i })
    expect(iconBtn).toBeInTheDocument()
  })
})
