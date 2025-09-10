import React from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { useWeatherStore } from '../stores/weatherStore'

const SystemStatus: React.FC = () => {
  const { isSystemInitialized, monitoringActive, analysisData, isLoading } = useWeatherStore()

  const statusItems = [
    {
      label: 'System Status',
      status: isSystemInitialized ? 'online' : 'offline',
      description: isSystemInitialized 
        ? 'Weather AGI system is operational' 
        : 'System needs initialization',
    },
    {
      label: 'Data Sources',
      status: isSystemInitialized ? 'connected' : 'disconnected',
      description: isSystemInitialized 
        ? 'Connected to weather data APIs' 
        : 'Waiting for API configuration',
    },
    {
      label: 'Real-time Monitoring',
      status: monitoringActive ? 'active' : 'inactive',
      description: monitoringActive 
        ? 'Continuously monitoring conditions' 
        : 'Monitoring is currently disabled',
    },
    {
      label: 'Analysis Data',
      status: analysisData ? 'available' : 'pending',
      description: analysisData 
        ? 'Latest analysis data available' 
        : 'No recent analysis data',
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'active':
      case 'available':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'offline':
      case 'disconnected':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      case 'inactive':
      case 'pending':
        return <ExclamationCircleIcon className="h-5 w-5 text-yellow-600" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'active':
      case 'available':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'offline':
      case 'disconnected':
        return 'text-red-700 bg-red-50 border-red-200'
      case 'inactive':
      case 'pending':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="weather-card"
      >
        <div className="flex items-center justify-center py-4">
          <div className="loading-spinner w-6 h-6 mr-3" />
          <span className="text-gray-600">Processing weather analysis...</span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="weather-card"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`p-3 rounded-lg border ${getStatusColor(item.status)}`}
          >
            <div className="flex items-center mb-2">
              {getStatusIcon(item.status)}
              <span className="ml-2 font-medium text-sm">{item.label}</span>
            </div>
            <p className="text-xs opacity-80">{item.description}</p>
            
            {item.status === 'active' && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mt-2 flex items-center"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <span className="text-xs font-medium">Live</span>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {analysisData && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Last Analysis:</span>
            <span>{new Date(analysisData.timestamp).toLocaleString()}</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default SystemStatus