import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
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
}

export interface WeatherAlert {
  id: string
  type: 'tornado' | 'severe_thunderstorm' | 'flash_flood' | 'winter_weather'
  severity: 'watch' | 'warning' | 'advisory'
  title: string
  description: string
  issued: Date
  expires: Date
  area: string
}

export interface WeatherStore {
  // State
  isLoading: boolean
  error: string | null
  isSystemInitialized: boolean
  selectedLocation: [number, number]
  analysisData: WeatherAnalysisData | null
  monitoringActive: boolean
  alerts: WeatherAlert[]
  apiKeys: {
    nasa?: string
    weather_underground?: string
  }
  
  // Actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedLocation: (location: [number, number]) => void
  setApiKeys: (keys: { nasa?: string; weather_underground?: string }) => void
  initializeSystem: () => Promise<void>
  runAnalysis: () => Promise<void>
  startMonitoring: () => void
  stopMonitoring: () => void
  clearAnalysis: () => void
  addAlert: (alert: WeatherAlert) => void
  dismissAlert: (alertId: string) => void
  saveToStorage: () => Promise<void>
  loadFromStorage: () => Promise<void>
}

export const useWeatherStore = create<WeatherStore>((set, get) => ({
  // Initial state
  isLoading: false,
  error: null,
  isSystemInitialized: false,
  selectedLocation: [40.0, -95.0], // Central US
  analysisData: null,
  monitoringActive: false,
  alerts: [],
  apiKeys: {},

  // Actions
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setError: (error: string | null) => set({ error }),
  
  setSelectedLocation: (location: [number, number]) => {
    set({ selectedLocation: location })
    get().saveToStorage()
  },
  
  setApiKeys: (keys: { nasa?: string; weather_underground?: string }) => {
    const newKeys = { ...get().apiKeys, ...keys }
    set({ apiKeys: newKeys })
    get().saveToStorage()
  },

  initializeSystem: async () => {
    try {
      set({ isLoading: true, error: null })
      
      // Load saved data
      await get().loadFromStorage()
      
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
      await get().saveToStorage()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed'
      set({ error: errorMessage, isLoading: false })
    }
  },

  startMonitoring: () => {
    set({ monitoringActive: true })
    get().saveToStorage()
  },

  stopMonitoring: () => {
    set({ monitoringActive: false })
    get().saveToStorage()
  },

  clearAnalysis: () => {
    set({ analysisData: null })
    get().saveToStorage()
  },

  addAlert: (alert: WeatherAlert) => {
    set({ alerts: [...get().alerts, alert] })
    get().saveToStorage()
  },

  dismissAlert: (alertId: string) => {
    set({ alerts: get().alerts.filter(alert => alert.id !== alertId) })
    get().saveToStorage()
  },

  saveToStorage: async () => {
    try {
      const state = get()
      const dataToSave = {
        selectedLocation: state.selectedLocation,
        apiKeys: state.apiKeys,
        monitoringActive: state.monitoringActive,
        analysisData: state.analysisData,
        alerts: state.alerts,
      }
      await AsyncStorage.setItem('weatherAgiState', JSON.stringify(dataToSave))
    } catch (error) {
      console.error('Failed to save to storage:', error)
    }
  },

  loadFromStorage: async () => {
    try {
      const savedState = await AsyncStorage.getItem('weatherAgiState')
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        set({
          selectedLocation: parsedState.selectedLocation || [40.0, -95.0],
          apiKeys: parsedState.apiKeys || {},
          monitoringActive: parsedState.monitoringActive || false,
          analysisData: parsedState.analysisData || null,
          alerts: parsedState.alerts || [],
        })
      }
    } catch (error) {
      console.error('Failed to load from storage:', error)
    }
  },
}))

// Initialize store on app start
useWeatherStore.getState().loadFromStorage()