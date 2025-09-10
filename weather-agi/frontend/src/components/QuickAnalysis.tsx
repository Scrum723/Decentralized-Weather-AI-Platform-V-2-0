import React from 'react'
import { motion } from 'framer-motion'
import {
  BeakerIcon,
  ChartBarIcon,
  ClockIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { useWeatherStore } from '../stores/weatherStore'

const QuickAnalysis: React.FC = () => {
  const { isSystemInitialized, selectedLocation, runAnalysis, isLoading } = useWeatherStore()

  const handleQuickAnalysis = async () => {
    if (!isSystemInitialized) return
    await runAnalysis()
  }

  const analysisSteps = [
    {
      title: 'Data Collection',
      description: 'Gather atmospheric data from multiple sources',
      icon: '📡',
      duration: '30s'
    },
    {
      title: 'Thermodynamic Analysis',
      description: 'Calculate CAPE, CIN, and stability indices',
      icon: '🌡️',
      duration: '45s'
    },
    {
      title: 'Wind Analysis',
      description: 'Analyze shear, helicity, and storm motion',
      icon: '💨',
      duration: '30s'
    },
    {
      title: 'ML Forecasting',
      description: 'Generate probability forecasts using AI models',
      icon: '🤖',
      duration: '60s'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Analysis Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="weather-card"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BeakerIcon className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Weather AGI Analysis
          </h2>
          
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Run a comprehensive severe weather analysis for your selected location. 
            Our AI system will analyze atmospheric conditions and provide detailed 
            forecasts with professional-grade accuracy.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center text-blue-700">
              <InformationCircleIcon className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">
                Selected Location: {selectedLocation[0].toFixed(4)}°N, {Math.abs(selectedLocation[1]).toFixed(4)}°W
              </span>
            </div>
          </div>

          <button
            onClick={handleQuickAnalysis}
            disabled={!isSystemInitialized || isLoading}
            className={`btn-primary text-lg px-8 py-3 ${
              !isSystemInitialized || isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner w-5 h-5" />
                Analyzing Weather Patterns...
              </>
            ) : (
              <>
                <ChartBarIcon className="w-5 h-5" />
                Start Analysis
              </>
            )}
          </button>

          {!isSystemInitialized && (
            <p className="text-sm text-red-600 mt-3">
              Please initialize the system first in Settings
            </p>
          )}
        </div>
      </motion.div>

      {/* Analysis Process */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="weather-card"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Process</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysisSteps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-start">
                <span className="text-2xl mr-3">{step.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900">{step.title}</h4>
                    <span className="text-xs text-gray-500 flex items-center">
                      <ClockIcon className="w-3 h-3 mr-1" />
                      {step.duration}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Features Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="weather-card"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What You'll Get</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🌡️</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Thermodynamic Analysis</h4>
            <p className="text-sm text-gray-600">
              CAPE, CIN, LCL, LFC, EL calculations and stability indices
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">💨</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Wind & Shear Analysis</h4>
            <p className="text-sm text-gray-600">
              Wind shear profiles, helicity, and storm motion vectors
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🤖</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">AI Forecasting</h4>
            <p className="text-sm text-gray-600">
              Machine learning enhanced probability forecasts
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default QuickAnalysis