import React from 'react'
import { motion } from 'framer-motion'
import { MapIcon } from '@heroicons/react/24/outline'

interface WeatherMapProps {
  location: [number, number]
  view: 'radar' | 'satellite' | 'temperature'
  onViewChange: (view: 'radar' | 'satellite' | 'temperature') => void
}

const WeatherMap: React.FC<WeatherMapProps> = ({ location, view, onViewChange }) => {
  const [lat, lon] = location

  // For now, we'll create a placeholder map component
  // In a full implementation, this would integrate with Leaflet or similar mapping library
  const mapViewOptions = [
    { key: 'radar', label: 'Radar', icon: '📡', color: 'bg-blue-500' },
    { key: 'satellite', label: 'Satellite', icon: '🛰️', color: 'bg-green-500' },
    { key: 'temperature', label: 'Temperature', icon: '🌡️', color: 'bg-red-500' },
  ] as const

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="weather-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <MapIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Weather Map</h2>
        </div>
        
        <div className="flex bg-gray-100 rounded-lg p-1">
          {mapViewOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => onViewChange(option.key)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                view === option.key
                  ? `${option.color} text-white`
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-1">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg overflow-hidden" style={{ height: '300px' }}>
        {/* Placeholder map with location marker */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-white text-2xl">📍</span>
            </div>
            <p className="text-blue-700 font-medium">
              {lat.toFixed(4)}°N, {Math.abs(lon).toFixed(4)}°W
            </p>
            <p className="text-blue-600 text-sm mt-1">
              {view.charAt(0).toUpperCase() + view.slice(1)} View
            </p>
          </div>
        </div>

        {/* Simulated weather overlay */}
        <motion.div
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute inset-0 rounded-full ${
            view === 'radar' ? 'bg-green-500' :
            view === 'satellite' ? 'bg-white' :
            'bg-red-500'
          } opacity-30`}
          style={{
            width: '120px',
            height: '120px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Controls overlay */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-2">
          <div className="text-xs text-gray-600 mb-1">Current View:</div>
          <div className="font-medium text-sm text-gray-900">
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </div>
        </div>
      </div>

      {/* Map legend */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs font-medium text-gray-700 mb-2">Map Legend</div>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          {view === 'radar' && (
            <>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-300 rounded mr-2"></div>
                Light Precipitation
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-400 rounded mr-2"></div>
                Moderate Precipitation
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                Heavy Precipitation
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-600 rounded mr-2"></div>
                Severe Weather
              </div>
            </>
          )}
          {view === 'satellite' && (
            <>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-white border rounded mr-2"></div>
                Clear Skies
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-300 rounded mr-2"></div>
                Light Clouds
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-600 rounded mr-2"></div>
                Dense Clouds
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-900 rounded mr-2"></div>
                Storm Clouds
              </div>
            </>
          )}
          {view === 'temperature' && (
            <>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                Cold (&lt;0°C)
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                Cool (0-15°C)
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                Warm (15-25°C)
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                Hot (&gt;25°C)
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 text-center">
        Interactive weather map powered by multiple data sources
      </div>
    </motion.div>
  )
}

export default WeatherMap