import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { weatherApi } from '../services/api'

export interface WeatherParameters {
  surface_cape: number
  surface_cin: number
  mixed_layer_cape: number
  mixed_layer_cin: number
  most_unstable_cape: number
  most_unstable_cin: number
  lcl_pressure: number
  lcl_temperature: number
  lcl_height: number
  lfc_pressure: number
  lfc_temperature: number
  lfc_height: number
  el_pressure: number
  el_temperature: number
  el_height: number
  wind_shear_0_1km: number
  wind_shear_0_3km: number
  wind_shear_0_6km: number
  storm_relative_helicity_0_1km: number
  storm_relative_helicity_0_3km: number
  supercell_composite: number
  significant_tornado: number
  energy_helicity_index: number
  bunkers_right_motion: [number, number]
  bunkers_left_motion: [number, number]
  convective_temperature: number
  downdraft_cape: number
  wind_index: number
}

export interface SynopticAnalysis {
  location: [number, number]
  timestamp: string
  surface_pressure: number
  pressure_tendency: number
  temperature_advection: number
  moisture_advection: number
  geopotential_height_500mb: number
  vorticity_500mb: number
  divergence_200mb: number
  jet_stream_position: [number, number]
  front_type: string
  front_distance: number
  front_speed: number
  upper_level_divergence: number
  low_level_convergence: number
}

export interface MLForecast {
  tornado_probability: number
  severe_thunderstorm_probability: number
  hail_probability: number
  flash_flood_probability: number
  forecast_confidence: number
  model_ensemble_mean: {
    cape_forecast_6hr: number
    shear_forecast_6hr: number
  }
}

export interface WeatherAnalysisData {
  location: [number, number]
  timestamp: string
  parameters: WeatherParameters
  synoptic_analysis: SynopticAnalysis
  ml_forecast: MLForecast
  human_readable_summary: string
  nws_data?: {
    alerts: any[]
    observations: any[]
    forecast: any
  }
  ai_enhanced_summary?: string
  ai_risk_assessment?: {
    tornado_risk: string
    severe_thunderstorm_risk: string
    flash_flood_risk: string
    confidence_score: number
    recommendations: string[]
  }
  ai_narrative?: string
  ai_enhancement_error?: string
}

export interface WeatherStore {
  // State
  isLoading: boolean
  error: string | null
  isSystemInitialized: boolean
  selectedLocation: [number, number]
  analysisData: WeatherAnalysisData | null
  monitoringActive: boolean
  apiKeys: {
    nasa?: string
    openai?: string
    weather_underground?: string
  }
  
  // Actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedLocation: (location: [number, number]) => void
  setApiKeys: (keys: { nasa?: string; openai?: string; weather_underground?: string }) => void
  initializeSystem: () => Promise<void>
  runAnalysis: () => Promise<void>
  chatWithDOC: (message: string, location?: [number, number]) => Promise<any>
  startMonitoring: () => void
  stopMonitoring: () => void
  clearAnalysis: () => void
}

export const useWeatherStore = create<WeatherStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      isLoading: false,
      error: null,
      isSystemInitialized: false,
      selectedLocation: [40.0, -95.0], // Central US
      analysisData: null,
      monitoringActive: false,
      apiKeys: {},

      // Actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      setError: (error: string | null) => set({ error }),
      
      setSelectedLocation: (location: [number, number]) => 
        set({ selectedLocation: location }),
      
      setApiKeys: (keys: { nasa?: string; weather_underground?: string }) =>
        set({ apiKeys: { ...get().apiKeys, ...keys } }),

      initializeSystem: async () => {
        try {
          set({ isLoading: true, error: null })
          
          // Initialize the weather AGI system
          await weatherApi.initialize(get().apiKeys)
          
          set({ isSystemInitialized: true, isLoading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to initialize system'
          set({ error: errorMessage, isLoading: false })
        }
      },

      runAnalysis: async () => {
        try {
          set({ isLoading: true, error: null })
          
          const { selectedLocation, apiKeys } = get()
          const analysisData = await weatherApi.runAnalysis(selectedLocation, apiKeys)
          
          set({ analysisData, isLoading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Analysis failed'
          set({ error: errorMessage, isLoading: false })
        }
      },

      chatWithDOC: async (message: string, location?: [number, number]) => {
        try {
          const { selectedLocation } = get()
          const chatLocation = location || selectedLocation
          const response = await weatherApi.chatWithDOC(message, chatLocation)
          return response
        } catch (error) {
          console.error('DOC Chat error:', error)
          throw error
        }
      },

      startMonitoring: () => {
        set({ monitoringActive: true })
        // In a real implementation, this would start a WebSocket connection
        // or polling mechanism for real-time updates
      },

      stopMonitoring: () => {
        set({ monitoringActive: false })
      },

      clearAnalysis: () => {
        set({ analysisData: null })
      },
    }),
    {
      name: 'weather-store',
    }
  )
)