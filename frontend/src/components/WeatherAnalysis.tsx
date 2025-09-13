import React from 'react'
import { motion } from 'framer-motion'
import { useWeatherStore } from '../stores/weatherStore'
import WeatherMetrics from './WeatherMetrics'
import ThreatAssessment from './ThreatAssessment'
import WeatherCharts from './WeatherCharts'
import LocationSelector from './LocationSelector'
import { ChartBarIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const WeatherAnalysis: React.FC = () => {
  const { analysisData, isLoading, runAnalysis, isSystemInitialized } = useWeatherStore()

  const handleRefreshAnalysis = async () => {
    if (!isSystemInitialized) {
      toast.error('Please initialize the system first in Settings')
      return
    }
    
    try {
      await runAnalysis()
      toast.success('Analysis refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh analysis')
    }
  }

  const handleExportAnalysis = () => {
    if (!analysisData) return

    // Create downloadable JSON file
    const dataStr = JSON.stringify(analysisData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `weather-analysis-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success('Analysis data exported')
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
          <h1 className="text-3xl font-bold text-gray-900">Weather Analysis</h1>
          <p className="text-gray-600 mt-1">
            Detailed meteorological analysis and severe weather parameters
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <button
            onClick={handleRefreshAnalysis}
            disabled={isLoading || !isSystemInitialized}
            className={`btn-secondary ${isLoading || !isSystemInitialized ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner w-4 h-4" />
                Refreshing...
              </>
            ) : (
              <>
                <ChartBarIcon className="w-4 h-4" />
                Refresh Analysis
              </>
            )}
          </button>
          
          {analysisData && (
            <button
              onClick={handleExportAnalysis}
              className="btn-primary"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              Export Data
            </button>
          )}
        </div>
      </motion.div>

      {/* Location Selector */}
      <LocationSelector />

      {analysisData ? (
        <div className="space-y-6">
          {/* Analysis Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="weather-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Analysis Summary</h2>
              <span className="text-sm text-gray-500">
                {new Date(analysisData.timestamp).toLocaleString()}
              </span>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                {analysisData.human_readable_summary}
              </pre>
            </div>
          </motion.div>

          {/* Weather Metrics */}
          <WeatherMetrics data={analysisData} />

          {/* Threat Assessment */}
          <ThreatAssessment data={analysisData} />

          {/* Interactive Charts */}
          <WeatherCharts data={analysisData} />

          {/* Detailed Parameters Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="weather-card"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Detailed Parameters
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parameter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Units
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(analysisData.parameters).map(([key, value]) => (
                    <tr key={key} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {Array.isArray(value) ? `[${value.join(', ')}]` : value.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getParameterUnit(key)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        {getParameterDescription(key)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      ) : (
        /* No Analysis Data State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="weather-card text-center py-16"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Analysis Data Available
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Run a weather analysis to view detailed meteorological parameters and forecasts.
          </p>
          <button
            onClick={handleRefreshAnalysis}
            disabled={isLoading || !isSystemInitialized}
            className={`btn-primary ${isLoading || !isSystemInitialized ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner w-4 h-4" />
                Analyzing...
              </>
            ) : (
              <>
                <ChartBarIcon className="w-4 h-4" />
                Start Analysis
              </>
            )}
          </button>
          
          {!isSystemInitialized && (
            <p className="text-sm text-red-600 mt-3">
              Please initialize the system first in Settings
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}

// Helper functions for parameter metadata
const getParameterUnit = (key: string): string => {
  const units: { [key: string]: string } = {
    surface_cape: 'J/kg',
    surface_cin: 'J/kg',
    mixed_layer_cape: 'J/kg',
    mixed_layer_cin: 'J/kg',
    most_unstable_cape: 'J/kg',
    most_unstable_cin: 'J/kg',
    lcl_pressure: 'hPa',
    lcl_temperature: '°C',
    lcl_height: 'm AGL',
    lfc_pressure: 'hPa',
    lfc_temperature: '°C',
    lfc_height: 'm AGL',
    el_pressure: 'hPa',
    el_temperature: '°C',
    el_height: 'm AGL',
    wind_shear_0_1km: 'm/s',
    wind_shear_0_3km: 'm/s',
    wind_shear_0_6km: 'm/s',
    storm_relative_helicity_0_1km: 'm²/s²',
    storm_relative_helicity_0_3km: 'm²/s²',
    convective_temperature: '°C',
    downdraft_cape: 'J/kg',
    bunkers_right_motion: '°, m/s',
    bunkers_left_motion: '°, m/s',
  }
  return units[key] || ''
}

const getParameterDescription = (key: string): string => {
  const descriptions: { [key: string]: string } = {
    surface_cape: 'Convective available potential energy from surface parcel',
    surface_cin: 'Convective inhibition for surface parcel',
    mixed_layer_cape: 'CAPE for mixed layer parcel (lowest 100mb)',
    most_unstable_cape: 'CAPE for most unstable parcel in lowest 400mb',
    lcl_height: 'Lifting condensation level height above ground',
    lfc_height: 'Level of free convection height above ground',
    el_height: 'Equilibrium level height above ground',
    wind_shear_0_6km: 'Bulk wind shear from surface to 6km',
    storm_relative_helicity_0_3km: 'Helicity in 0-3km layer relative to storm motion',
    supercell_composite: 'Composite parameter for supercell development',
    significant_tornado: 'Parameter indicating significant tornado potential',
  }
  return descriptions[key] || 'Meteorological parameter'
}

export default WeatherAnalysis