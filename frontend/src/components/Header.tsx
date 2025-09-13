import React from 'react'
import { motion } from 'framer-motion'
import { Bars3Icon, BellIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useWeatherStore } from '../stores/weatherStore'
import { Link } from 'react-router-dom'

interface HeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { isSystemInitialized, monitoringActive, analysisData } = useWeatherStore()

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="px-4 lg:px-6 h-16 flex items-center justify-between">
        {/* Left side - Logo and mobile menu */}
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <Link to="/dashboard" className="flex items-center ml-4 lg:ml-0">
            <motion.div
              animate={{ rotate: monitoringActive ? 360 : 0 }}
              transition={{ duration: 2, repeat: monitoringActive ? Infinity : 0, ease: "linear" }}
              className="flex-shrink-0"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                  />
                </svg>
              </div>
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Weather AGI</h1>
              <p className="text-xs text-gray-500">Professional Severe Weather Forecasting</p>
            </div>
          </Link>
        </div>

        {/* Center - Status indicators */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isSystemInitialized ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              System {isSystemInitialized ? 'Online' : 'Offline'}
            </span>
          </div>
          
          {monitoringActive && (
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 bg-orange-500 rounded-full"
              />
              <span className="text-sm text-gray-600">Real-time Monitoring</span>
            </div>
          )}
          
          {analysisData && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-sm text-gray-600">Analysis Ready</span>
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Alerts button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <BellIcon className="h-6 w-6" />
            {monitoringActive && (
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"
              />
            )}
          </motion.button>

          {/* Settings link */}
          <Link
            to="/settings"
            className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Cog6ToothIcon className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header