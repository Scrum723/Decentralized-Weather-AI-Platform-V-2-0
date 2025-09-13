import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  EyeIcon,
  CloudIcon,
} from '@heroicons/react/24/outline'

interface NWSObservation {
  station_id: string
  timestamp: string
  temperature?: number
  humidity?: number
  wind_speed?: number
  wind_direction?: number
  pressure?: number
  visibility?: number
  conditions?: string
}

interface NWSObservationsProps {
  location: [number, number]
}

const NWSObservations: React.FC<NWSObservationsProps> = ({ location }) => {
  const [observations, setObservations] = useState<NWSObservation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchObservations = async () => {
      if (!location || location.length !== 2) return

      setLoading(true)
      setError(null)

      try {
        const [lat, lon] = location
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
        
        const response = await fetch(`${API_URL}/nws/observations?lat=${lat}&lon=${lon}`)
        if (!response.ok) {
          throw new Error('Failed to fetch observations')
        }

        const data = await response.json()
        setObservations(data.observations || [])

      } catch (err) {
        console.error('Failed to fetch NWS observations:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchObservations()
    // Refresh every 10 minutes
    const interval = setInterval(fetchObservations, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [location])

  const formatWindDirection = (degrees?: number) => {
    if (degrees === undefined || degrees === null) return 'N/A'
    
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(degrees / 22.5) % 16
    return `${directions[index]} (${degrees}°)`
  }

  const convertCelsiusToFahrenheit = (celsius?: number) => {
    if (celsius === undefined || celsius === null) return null
    return Math.round((celsius * 9/5) + 32)
  }

  const convertMetersPerSecondToMph = (mps?: number) => {
    if (mps === undefined || mps === null) return null
    return Math.round(mps * 2.237)
  }

  const convertPascalToInHg = (pascal?: number) => {
    if (pascal === undefined || pascal === null) return null
    return (pascal * 0.0002953).toFixed(2)
  }

  const convertMetersToMiles = (meters?: number) => {
    if (meters === undefined || meters === null) return null
    return (meters * 0.000621371).toFixed(1)
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="weather-card"
      >
        <div className="flex items-center mb-4">
          <CloudIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">NWS Observations</h2>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="weather-card"
      >
        <div className="flex items-center mb-4">
          <CloudIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">NWS Observations</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Failed to load observations</p>
          <p className="text-sm text-gray-500">{error}</p>
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
      <div className="flex items-center mb-4">
        <CloudIcon className="h-5 w-5 text-blue-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">NWS Observations</h2>
        <span className="ml-auto text-xs text-gray-500">
          Official U.S. Government Data
        </span>
      </div>

      {observations.length === 0 ? (
        <div className="text-center py-8">
          <EyeIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No observations available</p>
          <p className="text-sm text-gray-500 mt-1">Check back later</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {observations.slice(0, 3).map((obs, index) => (
            <motion.div
              key={`${obs.station_id}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-blue-900">Station {obs.station_id}</h3>
                <span className="text-xs text-gray-500">
                  {new Date(obs.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Temperature:</span>
                    <span className="font-mono text-sm">
                      {obs.temperature !== undefined ? (
                        <>
                          {convertCelsiusToFahrenheit(obs.temperature)}°F 
                          <span className="text-gray-400">({obs.temperature.toFixed(1)}°C)</span>
                        </>
                      ) : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Humidity:</span>
                    <span className="font-mono text-sm">
                      {obs.humidity !== undefined ? `${Math.round(obs.humidity)}%` : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pressure:</span>
                    <span className="font-mono text-sm">
                      {obs.pressure !== undefined ? (
                        <>
                          {convertPascalToInHg(obs.pressure)}" Hg
                        </>
                      ) : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Wind:</span>
                    <span className="font-mono text-sm">
                      {obs.wind_speed !== undefined ? (
                        <>
                          {convertMetersPerSecondToMph(obs.wind_speed)} mph
                        </>
                      ) : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Direction:</span>
                    <span className="font-mono text-sm">
                      {formatWindDirection(obs.wind_direction)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Visibility:</span>
                    <span className="font-mono text-sm">
                      {obs.visibility !== undefined ? (
                        <>
                          {convertMetersToMiles(obs.visibility)} mi
                        </>
                      ) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {obs.conditions && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Conditions:</span>
                    <span className="text-sm font-medium text-blue-700">{obs.conditions}</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          Data from National Weather Service observation stations
        </p>
      </div>
    </motion.div>
  )
}

export default NWSObservations