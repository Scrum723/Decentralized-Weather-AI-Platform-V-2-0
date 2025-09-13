import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useWeatherStore } from '../stores/weatherStore'
import LocationSelector from './LocationSelector'
import WeatherMetrics from './WeatherMetrics'
import ThreatAssessment from './ThreatAssessment'
import QuickAnalysis from './QuickAnalysis'
import SystemStatus from './SystemStatus'
import WeatherMap from './WeatherMap'
import AlertsPanel from './AlertsPanel'
import NWSObservations from './NWSObservations'
import ClimateDataPanel from './ClimateDataPanel'
import toast from 'react-hot-toast'

const Dashboard: React.FC = () => {
  const {
    isLoading,
    isSystemInitialized,
    selectedLocation,
    analysisData,
    runAnalysis,
    startMonitoring,
    stopMonitoring,
    monitoringActive,
  } = useWeatherStore()

  const [mapView, setMapView] = useState<'radar' | 'satellite' | 'temperature'>('radar')

  const handleRunAnalysis = async () => {
    if (!isSystemInitialized) {
      toast.error('Please initialize the system first in Settings')
      return
    }
    
    try {
      await runAnalysis()
      toast.success('Weather analysis completed successfully')
    } catch (error) {
      toast.error('Failed to run analysis')
    }
  }

  const handleToggleMonitoring = () => {
    if (monitoringActive) {
      stopMonitoring()
      toast.success('Real-time monitoring stopped')
    } else {
      startMonitoring()
      toast.success('Real-time monitoring started')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weather Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Professional severe weather analysis and forecasting
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <button
            onClick={handleRunAnalysis}
            disabled={isLoading || !isSystemInitialized}
            className={`btn-primary ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner w-4 h-4" />
                Analyzing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Run Analysis
              </>
            )}
          </button>
          
          <button
            onClick={handleToggleMonitoring}
            disabled={!isSystemInitialized}
            className={`${monitoringActive ? 'btn-danger' : 'btn-secondary'} ${!isSystemInitialized ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {monitoringActive ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Stop Monitoring
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Start Monitoring
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* System Status */}
      <SystemStatus />

      {/* Location Selector */}
      <LocationSelector />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Analysis Results */}
        <div className="lg:col-span-2 space-y-6">
          {analysisData ? (
            <>
              <WeatherMetrics data={analysisData} />
              <ThreatAssessment data={analysisData} />
            </>
          ) : (
            <QuickAnalysis />
          )}
        </div>

        {/* Right Column - Map and Alerts */}
        <div className="space-y-6">
          <WeatherMap 
            location={selectedLocation}
            view={mapView}
            onViewChange={setMapView}
          />
          <AlertsPanel location={selectedLocation} />
          <NWSObservations location={selectedLocation} />
          <ClimateDataPanel location={selectedLocation} />
        </div>
      </div>

      {/* Recent Analysis History */}
      {analysisData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="weather-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Latest Analysis Summary</h2>
            <span className="text-sm text-gray-500">
              {new Date(analysisData.timestamp).toLocaleString()}
            </span>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {analysisData.human_readable_summary}
            </pre>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Dashboard