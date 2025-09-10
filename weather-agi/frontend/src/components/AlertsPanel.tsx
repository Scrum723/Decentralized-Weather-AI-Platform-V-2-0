import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ExclamationTriangleIcon,
  BellIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface Alert {
  id: string
  type: 'tornado' | 'severe_thunderstorm' | 'flash_flood' | 'winter_weather' | 'other'
  severity: 'watch' | 'warning' | 'advisory' | 'statement'
  title: string
  description: string
  issued: Date
  expires: Date | null
  area: string
  urgency?: string
  certainty?: string
  event?: string
}

interface AlertsPanelProps {
  location: [number, number]
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ location }) => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  // Fetch real NWS alerts data
  useEffect(() => {
    const fetchAlerts = async () => {
      if (!location || location.length !== 2) return

      try {
        const [lat, lon] = location
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
        
        const response = await fetch(`${API_URL}/alerts?lat=${lat}&lon=${lon}&radius=50`)
        if (!response.ok) {
          throw new Error('Failed to fetch alerts')
        }

        const data = await response.json()
        
        // Transform NWS data to our Alert interface
        const transformedAlerts: Alert[] = data.alerts.map((nwsAlert: any) => ({
          id: nwsAlert.id || String(Math.random()),
          type: mapEventToType(nwsAlert.event || nwsAlert.type),
          severity: mapSeverityLevel(nwsAlert.severity || nwsAlert.urgency),
          title: nwsAlert.title || nwsAlert.event || 'Weather Alert',
          description: nwsAlert.description || 'Weather alert in effect',
          issued: new Date(nwsAlert.issued || nwsAlert.sent || Date.now()),
          expires: nwsAlert.expires ? new Date(nwsAlert.expires) : null,
          area: nwsAlert.area || nwsAlert.areaDesc || 'Local area',
          urgency: nwsAlert.urgency,
          certainty: nwsAlert.certainty,
          event: nwsAlert.event
        }))

        // Filter out dismissed alerts
        const activeAlerts = transformedAlerts.filter(alert => !dismissedAlerts.has(alert.id))
        setAlerts(activeAlerts)

      } catch (error) {
        console.error('Failed to fetch weather alerts:', error)
        // Fallback to empty array on error
        setAlerts([])
      }
    }

    fetchAlerts()
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [location, dismissedAlerts])

  // Helper function to map NWS event types to our alert types
  const mapEventToType = (event: string): Alert['type'] => {
    if (!event) return 'other'
    
    const eventLower = event.toLowerCase()
    if (eventLower.includes('tornado')) return 'tornado'
    if (eventLower.includes('thunderstorm') || eventLower.includes('severe')) return 'severe_thunderstorm'
    if (eventLower.includes('flood') || eventLower.includes('flash')) return 'flash_flood'
    if (eventLower.includes('winter') || eventLower.includes('snow') || eventLower.includes('ice')) return 'winter_weather'
    return 'other'
  }

  // Helper function to map NWS severity to our severity levels  
  const mapSeverityLevel = (severity: string): Alert['severity'] => {
    if (!severity) return 'statement'
    
    const severityLower = severity.toLowerCase()
    if (severityLower.includes('warning')) return 'warning'
    if (severityLower.includes('watch')) return 'watch'
    if (severityLower.includes('advisory')) return 'advisory'
    return 'statement'
  }

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'tornado': return '🌪️'
      case 'severe_thunderstorm': return '⛈️'
      case 'flash_flood': return '🌊'
      case 'winter_weather': return '❄️'
      case 'other': return '⚠️'
      default: return '⚠️'
    }
  }

  const getAlertColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'warning': return 'border-red-300 bg-red-50 text-red-800'
      case 'watch': return 'border-orange-300 bg-orange-50 text-orange-800'
      case 'advisory': return 'border-yellow-300 bg-yellow-50 text-yellow-800'
      case 'statement': return 'border-blue-300 bg-blue-50 text-blue-800'
      default: return 'border-gray-300 bg-gray-50 text-gray-800'
    }
  }

  const getSeverityBadgeColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'warning': return 'bg-red-600 text-white'
      case 'watch': return 'bg-orange-600 text-white'
      case 'advisory': return 'bg-yellow-600 text-white'
      case 'statement': return 'bg-blue-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set(prev).add(alertId))
  }

  const getTimeRemaining = (expiryDate: Date | null) => {
    if (!expiryDate) return 'No expiration specified'
    
    const now = new Date()
    const diff = expiryDate.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    } else {
      return `${minutes}m remaining`
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="weather-card"
    >
      <div className="flex items-center mb-4">
        <BellIcon className="h-5 w-5 text-orange-600 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Weather Alerts</h2>
        {alerts.length > 0 && (
          <span className="ml-auto bg-red-600 text-white text-xs px-2 py-1 rounded-full">
            {alerts.length}
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {alerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-gray-600">No active weather alerts</p>
              <p className="text-sm text-gray-500 mt-1">Stay weather aware</p>
            </motion.div>
          ) : (
            alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                className={`border-2 rounded-lg p-4 ${getAlertColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">{getAlertIcon(alert.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <h3 className="font-semibold text-sm">{alert.title}</h3>
                        <span className={`ml-2 px-2 py-1 text-xs font-bold rounded-full ${getSeverityBadgeColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-sm opacity-90 mb-2">{alert.description}</p>
                      
                      <div className="text-xs opacity-80 space-y-1">
                        <div className="flex items-center">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          <span>Issued: {alert.issued.toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center">
                          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                          <span>{getTimeRemaining(alert.expires)}</span>
                        </div>
                        <div>
                          <strong>Area:</strong> {alert.area}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="ml-2 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Alert progress bar */}
                {alert.severity === 'warning' && (
                  <motion.div
                    className="mt-3 w-full bg-red-200 rounded-full h-1"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <motion.div
                      className="bg-red-600 h-1 rounded-full"
                      animate={{
                        width: ['0%', '100%', '0%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            Monitor conditions closely and be prepared to take protective action
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default AlertsPanel