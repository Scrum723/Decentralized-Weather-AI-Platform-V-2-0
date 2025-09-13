import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

interface ClimateData {
  climate_summary?: any
  climate_normals?: any
  historical_data?: any
  extreme_events?: any
  seasonal_outlook?: any
  stations?: any[]
}

interface ClimateDataPanelProps {
  location: [number, number]
}

const ClimateDataPanel: React.FC<ClimateDataPanelProps> = ({ location }) => {
  const [climateData, setClimateData] = useState<ClimateData>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'normals' | 'extremes' | 'outlook'>('summary')

  useEffect(() => {
    const fetchClimateData = async () => {
      if (!location || location.length !== 2) return

      setLoading(true)
      setError(null)

      try {
        const [lat, lon] = location
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
        
        // Fetch multiple climate data endpoints in parallel
        const [summaryRes, normalsRes, extremesRes, outlookRes] = await Promise.allSettled([
          fetch(`${API_URL}/noaa/climate-summary?lat=${lat}&lon=${lon}`),
          fetch(`${API_URL}/noaa/climate-normals?lat=${lat}&lon=${lon}`),
          fetch(`${API_URL}/noaa/extreme-events?lat=${lat}&lon=${lon}&days_back=30`),
          fetch(`${API_URL}/noaa/seasonal-outlook?lat=${lat}&lon=${lon}`)
        ])

        const data: ClimateData = {}

        // Process climate summary
        if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
          const summaryData = await summaryRes.value.json()
          data.climate_summary = summaryData.climate_summary
        }

        // Process climate normals
        if (normalsRes.status === 'fulfilled' && normalsRes.value.ok) {
          const normalsData = await normalsRes.value.json()
          data.climate_normals = normalsData.climate_normals
        }

        // Process extreme events
        if (extremesRes.status === 'fulfilled' && extremesRes.value.ok) {
          const extremesData = await extremesRes.value.json()
          data.extreme_events = extremesData.extreme_events
        }

        // Process seasonal outlook
        if (outlookRes.status === 'fulfilled' && outlookRes.value.ok) {
          const outlookData = await outlookRes.value.json()
          data.seasonal_outlook = outlookData.seasonal_outlook
        }

        setClimateData(data)

      } catch (err) {
        console.error('Failed to fetch NOAA climate data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchClimateData()
  }, [location])

  const formatTemperature = (temp: number | null | undefined) => {
    if (temp === null || temp === undefined) return 'N/A'
    return `${Math.round(temp)}°F`
  }

  const formatPrecipitation = (prcp: number | null | undefined) => {
    if (prcp === null || prcp === undefined) return 'N/A'
    return `${prcp.toFixed(2)}"`
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="weather-card"
      >
        <div className="flex items-center mb-4">
          <ChartBarIcon className="h-5 w-5 text-green-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">NOAA Climate Data</h2>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
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
          <ChartBarIcon className="h-5 w-5 text-green-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">NOAA Climate Data</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Failed to load climate data</p>
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <ChartBarIcon className="h-5 w-5 text-green-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">NOAA Climate Data</h2>
        </div>
        <span className="text-xs text-gray-500">
          Official Climate Records
        </span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'summary', label: 'Summary', icon: InformationCircleIcon },
            { id: 'normals', label: 'Normals', icon: CalendarIcon },
            { id: 'extremes', label: 'Extremes', icon: ExclamationTriangleIcon },
            { id: 'outlook', label: 'Outlook', icon: ChartBarIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="w-4 h-4 mr-1" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="max-h-96 overflow-y-auto">
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {climateData.climate_summary ? (
              <div>
                <h3 className="font-semibold mb-3">Climate Summary</h3>
                {climateData.climate_summary.climate_stats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Temperature Stats */}
                    {climateData.climate_summary.climate_stats.temperature && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <h4 className="font-medium text-blue-900 mb-2">Temperature</h4>
                        <div className="space-y-1 text-sm">
                          {climateData.climate_summary.climate_stats.temperature.max && (
                            <div className="flex justify-between">
                              <span>Average High:</span>
                              <span className="font-mono">
                                {formatTemperature(climateData.climate_summary.climate_stats.temperature.max.mean)}
                              </span>
                            </div>
                          )}
                          {climateData.climate_summary.climate_stats.temperature.min && (
                            <div className="flex justify-between">
                              <span>Average Low:</span>
                              <span className="font-mono">
                                {formatTemperature(climateData.climate_summary.climate_stats.temperature.min.mean)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Precipitation Stats */}
                    {climateData.climate_summary.climate_stats.precipitation && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <h4 className="font-medium text-green-900 mb-2">Precipitation</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span className="font-mono">
                              {formatPrecipitation(climateData.climate_summary.climate_stats.precipitation.total)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Daily Average:</span>
                            <span className="font-mono">
                              {formatPrecipitation(climateData.climate_summary.climate_stats.precipitation.mean)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {climateData.climate_summary.historical_data?.station && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Data Source</h4>
                    <p className="text-sm text-gray-600">
                      Station: {climateData.climate_summary.historical_data.station.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Location: {climateData.climate_summary.historical_data.station.latitude?.toFixed(4)}°N, 
                      {Math.abs(climateData.climate_summary.historical_data.station.longitude || 0).toFixed(4)}°W
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No climate summary data available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'normals' && (
          <div className="space-y-4">
            {climateData.climate_normals ? (
              <div>
                <h3 className="font-semibold mb-3">30-Year Climate Normals</h3>
                {climateData.climate_normals.normals && climateData.climate_normals.normals.length > 0 ? (
                  <div className="space-y-2">
                    {climateData.climate_normals.normals.slice(0, 10).map((normal: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm font-medium">{normal.datatype}</span>
                        <span className="text-sm font-mono">{normal.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No normals data available for this location</p>
                )}
                
                {climateData.climate_normals.station && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Nearest Station</h4>
                    <p className="text-sm text-gray-600">{climateData.climate_normals.station.name}</p>
                    <p className="text-sm text-gray-600">
                      Distance: {climateData.climate_normals.distance_km?.toFixed(1)} km
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No climate normals data available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'extremes' && (
          <div className="space-y-4">
            {climateData.extreme_events && climateData.extreme_events.extreme_events?.length > 0 ? (
              <div>
                <h3 className="font-semibold mb-3">Recent Extreme Events (Last 30 Days)</h3>
                <div className="space-y-3">
                  {climateData.extreme_events.extreme_events.map((event: any, index: number) => (
                    <div key={index} className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-orange-900">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {event.events.map((evt: any, evtIdx: number) => (
                          <div key={evtIdx} className="flex justify-between text-sm">
                            <span className="capitalize text-orange-800">
                              {evt.type.replace(/_/g, ' ')}
                            </span>
                            <span className="font-mono text-orange-900">
                              {evt.value} {evt.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No extreme weather events in the last 30 days</p>
                <p className="text-sm mt-1">This indicates normal weather patterns</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'outlook' && (
          <div className="space-y-4">
            {climateData.seasonal_outlook ? (
              <div>
                <h3 className="font-semibold mb-3">Seasonal Climate Outlook</h3>
                <div className="space-y-3">
                  {climateData.seasonal_outlook.seasonal_patterns && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <h4 className="font-medium text-blue-900 mb-2">Pattern Analysis</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Temperature Trend:</span>
                          <span className="font-medium capitalize">
                            {climateData.seasonal_outlook.seasonal_patterns.temperature_trend}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Precipitation Pattern:</span>
                          <span className="font-medium capitalize">
                            {climateData.seasonal_outlook.seasonal_patterns.precipitation_pattern}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Extreme Event Frequency:</span>
                          <span className="font-medium capitalize">
                            {climateData.seasonal_outlook.seasonal_patterns.extreme_event_frequency}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Confidence:</span>
                          <span className="font-medium">
                            {Math.round((climateData.seasonal_outlook.seasonal_patterns.confidence || 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <h4 className="font-medium text-yellow-900 mb-2">Summary</h4>
                    <p className="text-sm text-yellow-800">
                      {climateData.seasonal_outlook.outlook_summary || 
                       "Based on historical climate patterns for this location"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Seasonal outlook data not available</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          Data from NOAA Climate Data Online • Historical weather records and climate analysis
        </p>
      </div>
    </motion.div>
  )
}

export default ClimateDataPanel