import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { useWeatherStore } from '../stores/weatherStore'

const LocationSelector: React.FC = () => {
  const { selectedLocation, setSelectedLocation } = useWeatherStore()
  const [lat, setLat] = useState(selectedLocation[0].toString())
  const [lon, setLon] = useState(selectedLocation[1].toString())

  const presetLocations = {
    'Tornado Alley (TX)': [35.2271, -101.8313],
    'Moore, OK': [35.3396, -97.4890],
    'Dixie Alley (AL)': [33.5186, -86.8104],
    'Central Illinois': [40.1164, -89.3985],
    'Nebraska': [41.2524, -95.9980],
    'Kansas City, MO': [39.0997, -94.5786],
    'Norman, OK': [35.2226, -97.4395],
    'Wichita, KS': [37.6922, -97.3375],
  }

  const handleLocationUpdate = () => {
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lon)
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return
    }
    
    setSelectedLocation([latitude, longitude])
  }

  const handlePresetSelect = (location: [number, number]) => {
    setSelectedLocation(location)
    setLat(location[0].toString())
    setLon(location[1].toString())
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setSelectedLocation([latitude, longitude])
          setLat(latitude.toString())
          setLon(longitude.toString())
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="weather-card"
    >
      <div className="flex items-center mb-4">
        <MapPinIcon className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Analysis Location</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coordinates Input */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Custom Coordinates</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Latitude (-90 to 90)
              </label>
              <input
                type="number"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                onBlur={handleLocationUpdate}
                step="0.0001"
                min="-90"
                max="90"
                className="input-field"
                placeholder="40.0000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Longitude (-180 to 180)
              </label>
              <input
                type="number"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                onBlur={handleLocationUpdate}
                step="0.0001"
                min="-180"
                max="180"
                className="input-field"
                placeholder="-95.0000"
              />
            </div>
            <button
              onClick={getCurrentLocation}
              className="w-full btn-secondary text-sm"
            >
              <GlobeAltIcon className="h-4 w-4" />
              Use Current Location
            </button>
          </div>
        </div>

        {/* Preset Locations */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Locations</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(presetLocations).map(([name, coords]) => (
              <button
                key={name}
                onClick={() => handlePresetSelect(coords as [number, number])}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedLocation[0] === coords[0] && selectedLocation[1] === coords[1]
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="font-medium text-sm">{name}</div>
                <div className="text-xs text-gray-500">
                  {coords[0].toFixed(4)}°N, {Math.abs(coords[1]).toFixed(4)}°W
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Selection Display */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-700">Selected Location:</span>
          <span className="text-sm text-blue-600 font-mono">
            {selectedLocation[0].toFixed(4)}°N, {Math.abs(selectedLocation[1]).toFixed(4)}°W
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default LocationSelector