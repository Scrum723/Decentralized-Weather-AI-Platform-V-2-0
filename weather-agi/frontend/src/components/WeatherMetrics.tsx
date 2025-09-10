import React from 'react'
import { motion } from 'framer-motion'
import { 
  FireIcon, 
  BoltIcon, 
  CloudIcon, 
  EyeIcon
} from '@heroicons/react/24/outline'
import type { WeatherAnalysisData } from '../stores/weatherStore'

interface WeatherMetricsProps {
  data: WeatherAnalysisData
}

const WeatherMetrics: React.FC<WeatherMetricsProps> = ({ data }) => {
  const { parameters, ml_forecast } = data

  const getThresholdColor = (value: number, thresholds: { low: number; moderate: number; high: number }) => {
    if (value >= thresholds.high) return 'text-red-600 bg-red-50'
    if (value >= thresholds.moderate) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getThresholdText = (value: number, thresholds: { low: number; moderate: number; high: number }) => {
    if (value >= thresholds.high) return 'HIGH'
    if (value >= thresholds.moderate) return 'MODERATE'
    return 'LOW'
  }

  const metrics = [
    {
      label: 'Surface CAPE',
      value: parameters.surface_cape,
      unit: 'J/kg',
      icon: FireIcon,
      description: 'Available convective energy',
      thresholds: { low: 1000, moderate: 2000, high: 3000 }
    },
    {
      label: '0-6km Wind Shear',
      value: parameters.wind_shear_0_6km,
      unit: 'm/s',
      icon: BoltIcon,
      description: 'Deep layer wind shear',
      thresholds: { low: 10, moderate: 20, high: 25 }
    },
    {
      label: 'Supercell Composite',
      value: parameters.supercell_composite,
      unit: '',
      icon: CloudIcon,
      description: 'Supercell development potential',
      thresholds: { low: 1, moderate: 3, high: 5 }
    },
    {
      label: 'Storm-Relative Helicity',
      value: parameters.storm_relative_helicity_0_3km,
      unit: 'm²/s²',
      icon: EyeIcon,
      description: '0-3km helicity',
      thresholds: { low: 100, moderate: 200, high: 300 }
    },
  ]

  const probabilityMetrics = [
    {
      label: 'Tornado Probability',
      value: ml_forecast.tornado_probability,
      color: 'red',
      icon: '🌪️'
    },
    {
      label: 'Severe Storm Probability',
      value: ml_forecast.severe_thunderstorm_probability,
      color: 'orange',
      icon: '⛈️'
    },
    {
      label: 'Hail Probability',
      value: ml_forecast.hail_probability,
      color: 'blue',
      icon: '🧊'
    },
    {
      label: 'Flash Flood Probability',
      value: ml_forecast.flash_flood_probability,
      color: 'green',
      icon: '🌊'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Main Weather Parameters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="weather-card"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Severe Weather Parameters
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((metric, index) => {
            const colorClass = getThresholdColor(metric.value, metric.thresholds)
            const thresholdText = getThresholdText(metric.value, metric.thresholds)
            
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <metric.icon className="h-6 w-6 text-blue-600 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {metric.label}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {metric.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-gray-900 mr-2">
                        {metric.value.toFixed(metric.unit === 'm²/s²' ? 0 : 1)}
                      </span>
                      <span className="text-sm text-gray-500">{metric.unit}</span>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
                      {thresholdText}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ML Forecast Probabilities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="weather-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Machine Learning Forecast
          </h2>
          <span className="text-sm text-gray-500">
            Confidence: {(ml_forecast.forecast_confidence * 100).toFixed(0)}%
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {probabilityMetrics.map((prob, index) => (
            <motion.div
              key={prob.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white rounded-lg p-4 border-2 border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{prob.icon}</span>
                <span className="text-2xl font-bold text-gray-900">
                  {(prob.value * 100).toFixed(0)}%
                </span>
              </div>
              
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                {prob.label}
              </h3>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${prob.value * 100}%` }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  className={`h-2 rounded-full ${
                    prob.color === 'red' ? 'bg-red-500' :
                    prob.color === 'orange' ? 'bg-orange-500' :
                    prob.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Critical Levels */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="weather-card"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Critical Atmospheric Levels
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">LCL</h3>
            <div className="text-2xl font-bold text-blue-700">
              {parameters.lcl_height.toFixed(0)}m
            </div>
            <div className="text-xs text-blue-600">
              {parameters.lcl_pressure.toFixed(0)} hPa
            </div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <h3 className="text-sm font-medium text-orange-900 mb-2">LFC</h3>
            <div className="text-2xl font-bold text-orange-700">
              {parameters.lfc_height.toFixed(0)}m
            </div>
            <div className="text-xs text-orange-600">
              {parameters.lfc_pressure.toFixed(0)} hPa
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <h3 className="text-sm font-medium text-purple-900 mb-2">EL</h3>
            <div className="text-2xl font-bold text-purple-700">
              {(parameters.el_height / 1000).toFixed(1)}km
            </div>
            <div className="text-xs text-purple-600">
              {parameters.el_pressure.toFixed(0)} hPa
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default WeatherMetrics