import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import type { WeatherAnalysisData } from '../stores/weatherStore'

interface WeatherChartsProps {
  data: WeatherAnalysisData
}

const WeatherCharts: React.FC<WeatherChartsProps> = ({ data }) => {
  const { parameters } = data

  // CAPE and CIN comparison chart data
  const capeData = useMemo(() => [
    {
      name: 'Surface',
      CAPE: parameters.surface_cape,
      CIN: Math.abs(parameters.surface_cin)
    },
    {
      name: 'Mixed Layer', 
      CAPE: parameters.mixed_layer_cape,
      CIN: Math.abs(parameters.mixed_layer_cin)
    },
    {
      name: 'Most Unstable',
      CAPE: parameters.most_unstable_cape,
      CIN: Math.abs(parameters.most_unstable_cin)
    }
  ], [parameters])

  // Wind shear profile data
  const shearData = useMemo(() => [
    { layer: '0-1 km', shear: parameters.wind_shear_0_1km },
    { layer: '0-3 km', shear: parameters.wind_shear_0_3km },
    { layer: '0-6 km', shear: parameters.wind_shear_0_6km }
  ], [parameters])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* CAPE vs CIN Chart */}
      <div className="weather-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">CAPE and CIN Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={capeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Energy (J/kg)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [`${value} J/kg`]} />
            <Legend />
            <Bar dataKey="CAPE" fill="#EF4444" name="CAPE" />
            <Bar dataKey="CIN" fill="#3B82F6" name="CIN" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Wind Shear Profile Chart */}
      <div className="weather-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Wind Shear Profile</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={shearData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="layer" />
            <YAxis label={{ value: 'Shear (m/s)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => [`${value} m/s`]} />
            <Line 
              type="monotone" 
              dataKey="shear" 
              stroke="#10B981" 
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

export default WeatherCharts