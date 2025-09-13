import React from 'react'
import { motion } from 'framer-motion'
import {
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import type { WeatherAnalysisData } from '../stores/weatherStore'

interface ThreatAssessmentProps {
  data: WeatherAnalysisData
}

const ThreatAssessment: React.FC<ThreatAssessmentProps> = ({ data }) => {
  const { parameters, ml_forecast } = data

  // Calculate threat levels based on parameters
  const calculateThreatLevel = () => {
    let tornadoThreat = 'LOW'
    let hailThreat = 'LOW'
    let windThreat = 'LOW'
    let floodThreat = 'LOW'

    // Tornado threat assessment
    if (parameters.significant_tornado > 3 && parameters.storm_relative_helicity_0_1km > 200) {
      tornadoThreat = 'HIGH'
    } else if (parameters.significant_tornado > 1.5 && parameters.storm_relative_helicity_0_1km > 150) {
      tornadoThreat = 'MODERATE'
    }

    // Hail threat assessment
    if (parameters.surface_cape > 3000 && parameters.wind_shear_0_6km > 20) {
      hailThreat = 'HIGH'
    } else if (parameters.surface_cape > 2000 && parameters.wind_shear_0_6km > 15) {
      hailThreat = 'MODERATE'
    }

    // Wind threat assessment
    if (parameters.downdraft_cape > 500 && parameters.wind_shear_0_6km > 20) {
      windThreat = 'HIGH'
    } else if (parameters.downdraft_cape > 300 && parameters.wind_shear_0_6km > 15) {
      windThreat = 'MODERATE'
    }

    // Flash flood threat assessment
    if (ml_forecast.flash_flood_probability > 0.6) {
      floodThreat = 'HIGH'
    } else if (ml_forecast.flash_flood_probability > 0.3) {
      floodThreat = 'MODERATE'
    }

    return { tornadoThreat, hailThreat, windThreat, floodThreat }
  }

  const threats = calculateThreatLevel()

  const threatData = [
    {
      type: 'Tornado',
      level: threats.tornadoThreat,
      probability: ml_forecast.tornado_probability,
      icon: '🌪️',
      description: 'Rotating thunderstorms with potential for tornadoes',
      key_factors: [
        `STP: ${parameters.significant_tornado.toFixed(1)}`,
        `0-1km SRH: ${parameters.storm_relative_helicity_0_1km.toFixed(0)} m²/s²`,
        `Shear: ${parameters.wind_shear_0_6km.toFixed(1)} m/s`
      ]
    },
    {
      type: 'Large Hail',
      level: threats.hailThreat,
      probability: ml_forecast.hail_probability,
      icon: '🧊',
      description: 'Supercells capable of producing large hail (>1 inch)',
      key_factors: [
        `CAPE: ${parameters.surface_cape.toFixed(0)} J/kg`,
        `SCP: ${parameters.supercell_composite.toFixed(1)}`,
        `Freezing Level: ~${(parameters.el_height / 1000).toFixed(1)}km`
      ]
    },
    {
      type: 'Damaging Winds',
      level: threats.windThreat,
      probability: ml_forecast.severe_thunderstorm_probability,
      icon: '💨',
      description: 'Straight-line winds exceeding 58 mph (93 km/h)',
      key_factors: [
        `DCAPE: ${parameters.downdraft_cape.toFixed(0)} J/kg`,
        `Wind Index: ${parameters.wind_index.toFixed(1)}`,
        `Dry Air Aloft: Moderate`
      ]
    },
    {
      type: 'Flash Flooding',
      level: threats.floodThreat,
      probability: ml_forecast.flash_flood_probability,
      icon: '🌊',
      description: 'Heavy rainfall leading to flash flooding',
      key_factors: [
        `Moisture: High`,
        `Storm Motion: ${parameters.bunkers_right_motion[1].toFixed(1)} m/s`,
        `Training Potential: Moderate`
      ]
    },
  ]

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-red-100 border-red-300 text-red-800'
      case 'MODERATE': return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      default: return 'bg-green-100 border-green-300 text-green-800'
    }
  }

  const getThreatBadgeColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-red-600 text-white'
      case 'MODERATE': return 'bg-yellow-600 text-white'
      default: return 'bg-green-600 text-white'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="weather-card"
    >
      <div className="flex items-center mb-6">
        <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Severe Weather Threat Assessment</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {threatData.map((threat, index) => (
          <motion.div
            key={threat.type}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-lg border-2 p-4 ${getThreatColor(threat.level)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <span className="text-2xl mr-2">{threat.icon}</span>
                <div>
                  <h3 className="font-semibold text-sm">{threat.type}</h3>
                  <p className="text-xs opacity-80 mt-1">{threat.description}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${getThreatBadgeColor(threat.level)}`}>
                {threat.level}
              </span>
            </div>

            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium">Probability</span>
                <span className="text-sm font-bold">{(threat.probability * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-white bg-opacity-60 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${threat.probability * 100}%` }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  className={`h-2 rounded-full ${
                    threat.level === 'HIGH' ? 'bg-red-600' :
                    threat.level === 'MODERATE' ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium mb-2 opacity-90">Key Factors:</h4>
              <ul className="space-y-1">
                {threat.key_factors.map((factor, i) => (
                  <li key={i} className="text-xs opacity-80 flex items-center">
                    <div className="w-1 h-1 bg-current rounded-full mr-2" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overall Assessment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200"
      >
        <div className="flex items-center mb-2">
          <ShieldCheckIcon className="h-5 w-5 text-slate-600 mr-2" />
          <h3 className="font-semibold text-slate-900">Overall Assessment</h3>
        </div>
        <p className="text-sm text-slate-700">
          {threats.tornadoThreat === 'HIGH' || threats.hailThreat === 'HIGH' || threats.windThreat === 'HIGH' 
            ? '🔴 HIGH RISK: Multiple severe weather threats present. Immediate action recommended.'
            : (threats.tornadoThreat === 'MODERATE' || threats.hailThreat === 'MODERATE' || threats.windThreat === 'MODERATE')
            ? '🟡 MODERATE RISK: Elevated severe weather potential. Monitor conditions closely.'
            : '🟢 LOW RISK: Minimal severe weather threat. Standard precautions advised.'
          }
        </p>
        
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-600">
            <strong>Forecast Confidence:</strong> {(ml_forecast.forecast_confidence * 100).toFixed(0)}% 
            <span className="ml-4">
              <strong>Analysis Time:</strong> {new Date(data.timestamp).toLocaleTimeString()}
            </span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ThreatAssessment