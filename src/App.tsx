import React, { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { trackPageView } from './lib/analytics'
import { useScrollReveal, useScrollProgress } from './hooks'
import Nav from './components/Nav'
import HomePage from './routes/HomePage'
import AppDemo from './routes/AppDemo'
import PropertyDetail from './routes/PropertyDetail'

export default function App() {
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location])

  useScrollReveal()
  useScrollProgress()

  return (
    <>
      <div id="scroll-progress" />
      <div id="toast-container" />
      <Nav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/app/demo" element={<AppDemo />} />
        <Route path="/org/:orgId/properties/:propId/:section" element={<PropertyDetail />} />
        <Route path="/org/:orgId/ai-copilot" element={<AppDemo />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  )
}
