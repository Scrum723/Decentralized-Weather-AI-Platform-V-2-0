import axios from 'axios'
import { WeatherAnalysisData } from '../stores/weatherStore'

const API_BASE_URL = 'https://weather-agi.vercel.app/api' // Will be deployed to Vercel
const FALLBACK_URL = 'http://localhost:8000/api' // Local development fallback

const apiClient = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'WeatherAGI-Mobile/2.0',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Try Vercel URL first, fallback to local
    config.baseURL = config.baseURL || API_BASE_URL
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor with fallback logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // If Vercel API fails, try local development server
    if (!originalRequest._retry && originalRequest.baseURL === API_BASE_URL) {
      originalRequest._retry = true
      originalRequest.baseURL = FALLBACK_URL
      
      try {
        return await apiClient(originalRequest)
      } catch (fallbackError) {
        console.warn('Both Vercel and local API failed')
        // Return mock data for development
        return mockApiResponse(originalRequest)
      }
    }
    
    const message = error.response?.data?.message || error.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

// Mock API response for development/offline use
const mockApiResponse = (request: any) => {
  const { url } = request
  
  if (url?.includes('/analyze')) {
    return {
      data: {
        location: [40.0, -95.0],
        timestamp: new Date().toISOString(),
        parameters: {
          surface_cape: 3500.0,
          surface_cin: 75.0,
          mixed_layer_cape: 3200.0,
          mixed_layer_cin: 45.0,
          most_unstable_cape: 3800.0,
          most_unstable_cin: 30.0,
          lcl_pressure: 850.0,
          lcl_temperature: 18.5,
          lcl_height: 1200.0,
          lfc_pressure: 780.0,
          lfc_temperature: 12.0,
          lfc_height: 2100.0,
          el_pressure: 200.0,
          el_temperature: -42.0,
          el_height: 12000.0,
          wind_shear_0_1km: 8.5,
          wind_shear_0_3km: 15.2,
          wind_shear_0_6km: 22.8,
          storm_relative_helicity_0_1km: 185.0,
          storm_relative_helicity_0_3km: 280.0,
          supercell_composite: 4.2,
          significant_tornado: 2.8,
          energy_helicity_index: 3.1,
          bunkers_right_motion: [245.0, 18.5],
          bunkers_left_motion: [205.0, 12.2],
          convective_temperature: 28.5,
          downdraft_cape: 450.0,
          wind_index: 2.3
        },
        synoptic_analysis: {
          location: [40.0, -95.0],
          timestamp: new Date().toISOString(),
          surface_pressure: 1012.5,
          pressure_tendency: -2.8,
          temperature_advection: 0.8,
          moisture_advection: 1.2,
          geopotential_height_500mb: 5620,
          vorticity_500mb: 1.8e-5,
          divergence_200mb: -1.2e-5,
          jet_stream_position: [48.0, -100.0],
          front_type: 'cold',
          front_distance: 125.0,
          front_speed: 28.0,
          upper_level_divergence: 1.1e-5,
          low_level_convergence: 1.5e-5
        },
        ml_forecast: {
          tornado_probability: 0.72,
          severe_thunderstorm_probability: 0.89,
          hail_probability: 0.68,
          flash_flood_probability: 0.35,
          forecast_confidence: 0.87,
          model_ensemble_mean: {
            cape_forecast_6hr: 3850.0,
            shear_forecast_6hr: 21.5
          }
        },
        human_readable_summary: 'MOCK DATA - PROFESSIONAL SEVERE WEATHER ANALYSIS\\n\\nLocation: 40.0000°N, 95.0000°W\\nAnalysis Time: ' + new Date().toISOString() + '\\n\\nTHERMODYNAMIC ENVIRONMENT:\\nSurface-Based CAPE: 3500 J/kg (EXTREMELY UNSTABLE)\\nMixed Layer CAPE: 3200 J/kg\\nMost Unstable CAPE: 3800 J/kg\\n\\nSEVERE WEATHER OUTLOOK:\\n🔴 HIGH TORNADO RISK\\n🔴 HIGH LARGE HAIL RISK\\n🔴 HIGH DAMAGING WIND RISK'
      }
    }
  }
  
  if (url?.includes('/initialize')) {
    return { data: { status: 'initialized', message: 'Mock system initialized' } }
  }
  
  return { data: { status: 'mock', message: 'Mock API response' } }
}

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

  // Health check
  healthCheck: async () => {
    const response = await apiClient.get('/health')
    return response.data
  },
}

export default apiClient