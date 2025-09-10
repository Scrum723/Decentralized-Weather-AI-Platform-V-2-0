import axios from 'axios'
import type { WeatherAnalysisData } from '../stores/weatherStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth headers or other global config here
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

export const weatherApi = {
  // Initialize the weather system
  initialize: async (apiKeys: { nasa?: string; weather_underground?: string }) => {
    const response = await apiClient.post('/initialize', { api_keys: apiKeys })
    return response.data
  },

  // Run weather analysis for a specific location
  runAnalysis: async (
    location: [number, number],
    apiKeys: { nasa?: string; weather_underground?: string }
  ): Promise<WeatherAnalysisData> => {
    const response = await apiClient.post('/analyze', {
      location,
      api_keys: apiKeys,
    })
    return response.data
  },

  // Get historical weather data
  getHistoricalData: async (
    location: [number, number],
    startDate: string,
    endDate: string
  ) => {
    const response = await apiClient.get('/historical', {
      params: {
        lat: location[0],
        lon: location[1],
        start_date: startDate,
        end_date: endDate,
      },
    })
    return response.data
  },

  // Get current weather conditions
  getCurrentConditions: async (location: [number, number]) => {
    const response = await apiClient.get('/current', {
      params: {
        lat: location[0],
        lon: location[1],
      },
    })
    return response.data
  },

  // Get weather alerts for a region
  getWeatherAlerts: async (location: [number, number], radius: number = 50) => {
    const response = await apiClient.get('/alerts', {
      params: {
        lat: location[0],
        lon: location[1],
        radius,
      },
    })
    return response.data
  },

  // Generate meteorological diagrams
  generateDiagrams: async (analysisData: WeatherAnalysisData) => {
    const response = await apiClient.post('/diagrams', analysisData)
    return response.data
  },

  // Export analysis data
  exportAnalysis: async (analysisData: WeatherAnalysisData, format: 'json' | 'csv' | 'pdf') => {
    const response = await apiClient.post('/export', {
      data: analysisData,
      format,
    }, {
      responseType: format === 'pdf' ? 'blob' : 'json'
    })
    return response.data
  },

  // Health check
  healthCheck: async () => {
    const response = await apiClient.get('/health')
    return response.data
  },
}

export default apiClient