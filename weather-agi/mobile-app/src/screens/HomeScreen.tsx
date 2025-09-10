import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Geolocation from 'react-native-geolocation-service'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { useWeatherStore } from '../stores/weatherStore'
import { Colors, Typography, Spacing } from '../styles/theme'

const { width } = Dimensions.get('window')

const HomeScreen: React.FC = () => {
  const {
    isLoading,
    isSystemInitialized,
    selectedLocation,
    analysisData,
    monitoringActive,
    alerts,
    runAnalysis,
    setSelectedLocation,
    startMonitoring,
    stopMonitoring,
  } = useWeatherStore()

  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (isSystemInitialized && !analysisData) {
      handleAnalysis()
    }
  }, [isSystemInitialized])

  const handleGetCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setSelectedLocation([latitude, longitude])
        handleAnalysis()
      },
      (error) => {
        Alert.alert('Location Error', 'Unable to get current location')
        console.log(error)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    )
  }

  const handleAnalysis = async () => {
    if (!isSystemInitialized) {
      Alert.alert('System Not Ready', 'Please configure API keys in Settings')
      return
    }

    try {
      await runAnalysis()
    } catch (error) {
      Alert.alert('Analysis Error', 'Failed to run weather analysis')
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await handleAnalysis()
    setRefreshing(false)
  }

  const toggleMonitoring = () => {
    if (!isSystemInitialized) {
      Alert.alert('System Not Ready', 'Please configure API keys in Settings')
      return
    }

    if (monitoringActive) {
      stopMonitoring()
    } else {
      startMonitoring()
    }
  }

  const getThreatLevel = () => {
    if (!analysisData) return { level: 'unknown', color: Colors.gray }
    
    const { ml_forecast } = analysisData
    const maxProb = Math.max(
      ml_forecast.tornado_probability,
      ml_forecast.severe_thunderstorm_probability,
      ml_forecast.hail_probability
    )

    if (maxProb >= 0.7) return { level: 'HIGH', color: Colors.danger }
    if (maxProb >= 0.4) return { level: 'MODERATE', color: Colors.warning }
    return { level: 'LOW', color: Colors.success }
  }

  const threatLevel = getThreatLevel()

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Weather AGI</Text>
            <Text style={styles.subtitle}>Professional Severe Weather Analysis</Text>
          </View>
          
          <View style={styles.statusBadge}>
            <View style={[styles.statusIndicator, { 
              backgroundColor: isSystemInitialized ? Colors.success : Colors.danger 
            }]} />
            <Text style={styles.statusText}>
              {isSystemInitialized ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="place" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Current Location</Text>
          </View>
          
          <Text style={styles.locationText}>
            {selectedLocation[0].toFixed(4)}°N, {Math.abs(selectedLocation[1]).toFixed(4)}°W
          </Text>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleGetCurrentLocation}
          >
            <Icon name="my-location" size={16} color={Colors.primary} />
            <Text style={styles.secondaryButtonText}>Use Current Location</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={handleAnalysis}
            disabled={isLoading || !isSystemInitialized}
          >
            <Icon 
              name={isLoading ? 'hourglass-empty' : 'analytics'} 
              size={24} 
              color="white" 
            />
            <Text style={styles.actionButtonText}>
              {isLoading ? 'Analyzing...' : 'Run Analysis'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, monitoringActive ? styles.dangerAction : styles.secondaryAction]}
            onPress={toggleMonitoring}
            disabled={!isSystemInitialized}
          >
            <Icon 
              name={monitoringActive ? 'pause' : 'play-arrow'} 
              size={24} 
              color={monitoringActive ? 'white' : Colors.primary}
            />
            <Text style={[styles.actionButtonText, {
              color: monitoringActive ? 'white' : Colors.primary
            }]}>
              {monitoringActive ? 'Stop Monitor' : 'Start Monitor'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Analysis Results */}
        {analysisData && (
          <>
            {/* Threat Assessment */}
            <View style={[styles.card, { backgroundColor: threatLevel.color + '15' }]}>
              <View style={styles.cardHeader}>
                <Icon name="warning" size={20} color={threatLevel.color} />
                <Text style={[styles.cardTitle, { color: threatLevel.color }]}>
                  Threat Level: {threatLevel.level}
                </Text>
              </View>
              
              <View style={styles.threatMetrics}>
                <View style={styles.threatMetric}>
                  <Text style={styles.metricLabel}>Tornado</Text>
                  <Text style={styles.metricValue}>
                    {(analysisData.ml_forecast.tornado_probability * 100).toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.threatMetric}>
                  <Text style={styles.metricLabel}>Severe T-Storm</Text>
                  <Text style={styles.metricValue}>
                    {(analysisData.ml_forecast.severe_thunderstorm_probability * 100).toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.threatMetric}>
                  <Text style={styles.metricLabel}>Large Hail</Text>
                  <Text style={styles.metricValue}>
                    {(analysisData.ml_forecast.hail_probability * 100).toFixed(0)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Key Parameters */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Key Parameters</Text>
              
              <View style={styles.parametersGrid}>
                <View style={styles.parameter}>
                  <Text style={styles.parameterLabel}>CAPE</Text>
                  <Text style={styles.parameterValue}>
                    {analysisData.parameters.surface_cape.toFixed(0)} J/kg
                  </Text>
                </View>
                <View style={styles.parameter}>
                  <Text style={styles.parameterLabel}>0-6km Shear</Text>
                  <Text style={styles.parameterValue}>
                    {analysisData.parameters.wind_shear_0_6km.toFixed(1)} m/s
                  </Text>
                </View>
                <View style={styles.parameter}>
                  <Text style={styles.parameterLabel}>SCP</Text>
                  <Text style={styles.parameterValue}>
                    {analysisData.parameters.supercell_composite.toFixed(1)}
                  </Text>
                </View>
                <View style={styles.parameter}>
                  <Text style={styles.parameterLabel}>SRH (0-3km)</Text>
                  <Text style={styles.parameterValue}>
                    {analysisData.parameters.storm_relative_helicity_0_3km.toFixed(0)} m²/s²
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="notifications" size={20} color={Colors.warning} />
              <Text style={styles.cardTitle}>Active Alerts ({alerts.length})</Text>
            </View>
            
            {alerts.slice(0, 3).map((alert) => (
              <View key={alert.id} style={styles.alertItem}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={[styles.alertSeverity, {
                    backgroundColor: alert.severity === 'warning' ? Colors.danger :
                                   alert.severity === 'watch' ? Colors.warning : Colors.info
                  }]}>
                    {alert.severity.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.alertDescription} numberOfLines={2}>
                  {alert.description}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* No Data State */}
        {!analysisData && !isLoading && (
          <View style={styles.emptyState}>
            <Icon name="cloud-off" size={64} color={Colors.gray} />
            <Text style={styles.emptyStateTitle}>No Analysis Data</Text>
            <Text style={styles.emptyStateText}>
              Run an analysis to view weather conditions and forecasts
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: Colors.primary,
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...Typography.h1,
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    ...Typography.caption,
    color: 'white',
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.h3,
    marginLeft: Spacing.sm,
  },
  locationText: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.md,
    color: Colors.text,
  },
  actionsContainer: {
    flexDirection: 'row',
    margin: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: 8,
    gap: Spacing.sm,
  },
  primaryAction: {
    backgroundColor: Colors.primary,
  },
  secondaryAction: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  dangerAction: {
    backgroundColor: Colors.danger,
  },
  actionButtonText: {
    ...Typography.button,
    color: 'white',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  secondaryButtonText: {
    ...Typography.button,
    color: Colors.primary,
  },
  threatMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  threatMetric: {
    alignItems: 'center',
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    ...Typography.h3,
    fontWeight: 'bold',
  },
  parametersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  parameter: {
    flex: 1,
    minWidth: (width - 80) / 2,
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  parameterLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  parameterValue: {
    ...Typography.body,
    fontWeight: '600',
  },
  alertItem: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    paddingLeft: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
  },
  alertSeverity: {
    ...Typography.caption,
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyStateTitle: {
    ...Typography.h2,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 250,
  },
})

export default HomeScreen