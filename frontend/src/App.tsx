import React, { useState, useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import { useWeatherStore } from './stores/weatherStore'
import LoadingScreen from './components/LoadingScreen'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy load heavy components to reduce initial bundle size
const Dashboard = lazy(() => import('./components/Dashboard'))
const DOCChat = lazy(() => import('./components/DOCChat'))
const WeatherAnalysis = lazy(() => import('./components/WeatherAnalysis'))
const RealTimeMonitoring = lazy(() => import('./components/RealTimeMonitoring'))
const Settings = lazy(() => import('./components/Settings'))

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isLoading, error, initializeSystem } = useWeatherStore()
  const location = useLocation()

  useEffect(() => {
    // Initialize the weather system on app start
    initializeSystem()
  }, [initializeSystem])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />
        
        <div className="flex">
          <Sidebar 
            open={sidebarOpen} 
            setOpen={setSidebarOpen} 
          />
          
          <main className="flex-1 lg:ml-64 transition-all duration-300">
            <div className="p-4 lg:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-7xl mx-auto"
                >
                  <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/doc-chat" element={<DOCChat />} />
                      <Route path="/analysis" element={<WeatherAnalysis />} />
                      <Route path="/monitoring" element={<RealTimeMonitoring />} />
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
                  </Suspense>
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
        
        {/* Global error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">Error</h3>
                <div className="mt-1 text-sm">
                  {error}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App