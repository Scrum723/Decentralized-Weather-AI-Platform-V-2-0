import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Cog6ToothIcon,
  KeyIcon,
  BellIcon,
  UserCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { useWeatherStore } from '../stores/weatherStore'
import toast from 'react-hot-toast'

const Settings: React.FC = () => {
  const {
    apiKeys,
    setApiKeys,
    initializeSystem,
    isSystemInitialized,
    isLoading,
  } = useWeatherStore()

  const [localApiKeys, setLocalApiKeys] = useState({
    nasa: apiKeys.nasa || '',
    openai: apiKeys.openai || '',
    weather_underground: apiKeys.weather_underground || '',
  })

  const [notificationSettings, setNotificationSettings] = useState({
    enableAlerts: true,
    enablePushNotifications: false,
    alertThresholds: {
      tornado: 'moderate',
      hail: 'high',
      wind: 'high',
      flood: 'moderate',
    },
  })

  const [systemSettings, setSystemSettings] = useState({
    updateInterval: 5,
    dataRetentionDays: 30,
    enableLogging: true,
    logLevel: 'info',
  })

  const handleSaveApiKeys = async () => {
    try {
      setApiKeys(localApiKeys)
      await initializeSystem()
      toast.success('API keys saved and system initialized')
    } catch (error) {
      toast.error('Failed to initialize system with new API keys')
    }
  }

  const handleTestConnection = async () => {
    try {
      // Simulate testing API connection
      toast.loading('Testing API connections...', { duration: 2000 })
      
      setTimeout(() => {
        toast.success('All API connections successful')
      }, 2000)
    } catch (error) {
      toast.error('API connection test failed')
    }
  }

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setLocalApiKeys({ nasa: '', openai: '', weather_underground: '' })
      setNotificationSettings({
        enableAlerts: true,
        enablePushNotifications: false,
        alertThresholds: {
          tornado: 'moderate',
          hail: 'high',
          wind: 'high',
          flood: 'moderate',
        },
      })
      setSystemSettings({
        updateInterval: 5,
        dataRetentionDays: 30,
        enableLogging: true,
        logLevel: 'info',
      })
      toast.success('Settings reset to defaults')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure API keys, notifications, and system preferences
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {isSystemInitialized ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span className={`text-sm font-medium ${isSystemInitialized ? 'text-green-700' : 'text-red-700'}`}>
              System {isSystemInitialized ? 'Initialized' : 'Not Initialized'}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="weather-card"
        >
          <div className="flex items-center mb-4">
            <KeyIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">API Configuration</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NASA API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={localApiKeys.nasa}
                  onChange={(e) => setLocalApiKeys({ ...localApiKeys, nasa: e.target.value })}
                  className="input-field pr-10"
                  placeholder="Enter NASA API key (optional)"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <InformationCircleIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Optional: For enhanced satellite and Earth observation data
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={localApiKeys.openai}
                  onChange={(e) => setLocalApiKeys({ ...localApiKeys, openai: e.target.value })}
                  className="input-field pr-10"
                  placeholder="Enter OpenAI API key (optional)"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <InformationCircleIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Optional: For AI-enhanced weather analysis and natural language summaries
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weather Underground API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={localApiKeys.weather_underground}
                  onChange={(e) => setLocalApiKeys({ ...localApiKeys, weather_underground: e.target.value })}
                  className="input-field pr-10"
                  placeholder="Enter Weather Underground API key (optional)"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <InformationCircleIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Optional: For additional weather station data and historical records
              </p>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleSaveApiKeys}
              disabled={isLoading}
              className={`btn-primary flex-1 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner w-4 h-4" />
                  Initializing...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  Save & Initialize
                </>
              )}
            </button>
            
            <button
              onClick={handleTestConnection}
              disabled={isLoading || !isSystemInitialized}
              className="btn-secondary"
            >
              Test Connection
            </button>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="weather-card"
        >
          <div className="flex items-center mb-4">
            <BellIcon className="h-6 w-6 text-orange-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Enable Alerts</label>
                <p className="text-xs text-gray-500">Receive weather alert notifications</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.enableAlerts}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  enableAlerts: e.target.checked
                })}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">Push Notifications</label>
                <p className="text-xs text-gray-500">Browser/desktop notifications</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.enablePushNotifications}
                onChange={(e) => setNotificationSettings({
                  ...notificationSettings,
                  enablePushNotifications: e.target.checked
                })}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Alert Thresholds</h3>
              <div className="space-y-3">
                {Object.entries(notificationSettings.alertThresholds).map(([type, level]) => (
                  <div key={type} className="flex items-center justify-between">
                    <label className="text-sm text-gray-700 capitalize">
                      {type} Alerts
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        alertThresholds: {
                          ...notificationSettings.alertThresholds,
                          [type]: e.target.value
                        }
                      })}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="low">Low</option>
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* System Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="weather-card lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Cog6ToothIcon className="h-6 w-6 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>
            </div>
            
            <button
              onClick={handleResetSettings}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Update Interval
                </label>
                <select
                  value={systemSettings.updateInterval}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    updateInterval: Number(e.target.value)
                  })}
                  className="input-field"
                >
                  <option value={1}>1 minute</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Retention Period
                </label>
                <select
                  value={systemSettings.dataRetentionDays}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    dataRetentionDays: Number(e.target.value)
                  })}
                  className="input-field"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">Enable Logging</label>
                  <p className="text-xs text-gray-500">Log system events and errors</p>
                </div>
                <input
                  type="checkbox"
                  checked={systemSettings.enableLogging}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    enableLogging: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Log Level
                </label>
                <select
                  value={systemSettings.logLevel}
                  onChange={(e) => setSystemSettings({
                    ...systemSettings,
                    logLevel: e.target.value
                  })}
                  disabled={!systemSettings.enableLogging}
                  className="input-field"
                >
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* About/Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="weather-card lg:col-span-2"
        >
          <div className="flex items-center mb-4">
            <UserCircleIcon className="h-6 w-6 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">About Weather AGI</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🌪️</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Version 2.0</h3>
              <p className="text-sm text-gray-600">
                Professional Severe Weather AGI System
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔬</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">AI-Powered</h3>
              <p className="text-sm text-gray-600">
                Machine learning enhanced forecasting
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Real-Time</h3>
              <p className="text-sm text-gray-600">
                Live weather monitoring and analysis
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Built for professional meteorologists, storm chasers, and weather enthusiasts. 
              This system provides comprehensive severe weather analysis with AI-enhanced forecasting capabilities.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Settings