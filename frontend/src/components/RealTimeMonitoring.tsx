import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  PlayIcon,
  PauseIcon,
  EyeIcon,
  ArrowPathIcon as RefreshIcon,
  SignalIcon,
} from '@heroicons/react/24/outline'
import { useWeatherStore } from '../stores/weatherStore'
import WeatherMetrics from './WeatherMetrics'
import AlertsPanel from './AlertsPanel'
import toast from 'react-hot-toast'

const RealTimeMonitoring: React.FC = () => {
  const {
    monitoringActive,
    startMonitoring,
    stopMonitoring,
    isSystemInitialized,
    selectedLocation,
    analysisData,
    runAnalysis,
    isLoading,
  } = useWeatherStore()

  const [updateInterval, setUpdateInterval] = useState(5) // minutes
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')

  // Real-time monitoring logic
  useEffect(() => {
    let intervalId: number | null = null

    if (monitoringActive && isSystemInitialized) {
      setConnectionStatus('connecting')
      
      // Simulate connection
      setTimeout(() => setConnectionStatus('connected'), 1000)
      
      // Set up periodic updates
      intervalId = setInterval(async () => {
        try {
          await runAnalysis()
          setLastUpdate(new Date())
          toast.success('Weather data updated', { duration: 2000 })
        } catch (error) {
          toast.error('Failed to update weather data')
          setConnectionStatus('disconnected')
        }
      }, updateInterval * 60 * 1000)

      // Initial update
      runAnalysis().then(() => setLastUpdate(new Date()))
    } else {
      setConnectionStatus('disconnected')
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [monitoringActive, updateInterval, isSystemInitialized, runAnalysis])

  const handleToggleMonitoring = () => {
    if (!isSystemInitialized) {
      toast.error('Please initialize the system first in Settings')
      return
    }

    if (monitoringActive) {
      stopMonitoring()
      toast.success('Real-time monitoring stopped')
    } else {
      startMonitoring()
      toast.success('Real-time monitoring started')
    }
  }

  const handleManualUpdate = async () => {
    if (!isSystemInitialized) {
      toast.error('Please initialize the system first in Settings')
      return
    }

    try {
      await runAnalysis()
      setLastUpdate(new Date())
      toast.success('Weather data refreshed')
    } catch (error) {
      toast.error('Failed to refresh weather data')
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600'
      case 'connecting': return 'text-yellow-600'
      case 'disconnected': return 'text-red-600'
    }
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      case 'connecting': return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
      case 'disconnected': return <div className="w-2 h-2 bg-red-500 rounded-full" />
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
          <h1 className="text-3xl font-bold text-gray-900">Real-Time Monitoring</h1>
          <p className="text-gray-600 mt-1">
            Live weather tracking and automated analysis updates
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <button
            onClick={handleManualUpdate}
            disabled={isLoading || !isSystemInitialized}
            className={`btn-secondary ${isLoading || !isSystemInitialized ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Now
          </button>
          
          <button
            onClick={handleToggleMonitoring}
            disabled={!isSystemInitialized}
            className={`${monitoringActive ? 'btn-danger' : 'btn-primary'} ${!isSystemInitialized ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {monitoringActive ? (
              <>
                <PauseIcon className="w-4 h-4" />
                Stop Monitoring
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4" />
                Start Monitoring
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Monitoring Status Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="weather-card"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <EyeIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Monitoring Status</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              {getConnectionStatusIcon()}
              <span className={`ml-2 text-sm font-medium ${getConnectionStatusColor()}`}>
                {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
              </span>
            </div>
            
            {monitoringActive && (
              <div className="flex items-center text-blue-600">
                <SignalIcon className="w-4 h-4 mr-1 animate-bounce" />
                <span className="text-sm font-medium">Live</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Location</h3>
            <p className="text-lg font-bold text-blue-700">
              {selectedLocation[0].toFixed(4)}°N, {Math.abs(selectedLocation[1]).toFixed(4)}°W
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-900 mb-2">Update Interval</h3>
            <div className="flex items-center">
              <select
                value={updateInterval}
                onChange={(e) => setUpdateInterval(Number(e.target.value))}
                disabled={!isSystemInitialized}
                className="text-lg font-bold text-green-700 bg-transparent border-none outline-none"
              >
                <option value={1}>1 minute</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
              </select>
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-orange-900 mb-2">Last Update</h3>
            <p className="text-lg font-bold text-orange-700">
              {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
            </p>
          </div>
        </div>

        {!isSystemInitialized && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              Please initialize the system first in Settings to enable real-time monitoring.
            </p>
          </div>
        )}
      </motion.div>

      {/* Live Weather Data */}
      {monitoringActive && analysisData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Conditions */}
          <div className="lg:col-span-2">
            <WeatherMetrics data={analysisData} />
          </div>
          
          {/* Live Alerts */}
          <div>
            <AlertsPanel location={selectedLocation} />
          </div>
        </div>
      )}

      {/* Monitoring Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="weather-card"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Real-Time Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📡</span>
            </div>
            <h3 className="font-medium text-blue-900 mb-1">Live Data Feeds</h3>
            <p className="text-sm text-blue-700">
              Continuous weather data from multiple sources
            </p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="font-medium text-green-900 mb-1">Auto Analysis</h3>
            <p className="text-sm text-green-700">
              Automated severe weather parameter calculations
            </p>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🚨</span>
            </div>
            <h3 className="font-medium text-orange-900 mb-1">Smart Alerts</h3>
            <p className="text-sm text-orange-700">
              Intelligent threshold-based notifications
            </p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-medium text-purple-900 mb-1">Live Charts</h3>
            <p className="text-sm text-purple-700">
              Real-time visualization updates
            </p>
          </div>
        </div>
      </motion.div>

      {!monitoringActive && isSystemInitialized && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="weather-card text-center py-16"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <EyeIcon className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Monitoring Inactive
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start real-time monitoring to track weather conditions continuously and receive automated updates.
          </p>
          <button
            onClick={handleToggleMonitoring}
            className="btn-primary"
          >
            <PlayIcon className="w-4 h-4" />
            Start Monitoring
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default RealTimeMonitoring