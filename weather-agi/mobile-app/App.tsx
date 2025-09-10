import React, { useEffect } from 'react'
import { StatusBar, Platform, Alert } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions'
import PushNotification from 'react-native-push-notification'

// Screens
import HomeScreen from './src/screens/HomeScreen'
import AnalysisScreen from './src/screens/AnalysisScreen'
import MonitoringScreen from './src/screens/MonitoringScreen'
import MapScreen from './src/screens/MapScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import AlertDetailsScreen from './src/screens/AlertDetailsScreen'

// Services
import { initializeNotifications } from './src/services/NotificationService'
import { useWeatherStore } from './src/stores/weatherStore'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home'

          switch (route.name) {
            case 'Home':
              iconName = 'dashboard'
              break
            case 'Analysis':
              iconName = 'analytics'
              break
            case 'Monitoring':
              iconName = 'visibility'
              break
            case 'Map':
              iconName = 'map'
              break
            case 'Settings':
              iconName = 'settings'
              break
          }

          return <Icon name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        headerStyle: {
          backgroundColor: '#FFFFFF',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#111827',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Weather AGI' }} 
      />
      <Tab.Screen 
        name="Analysis" 
        component={AnalysisScreen} 
        options={{ title: 'Analysis' }} 
      />
      <Tab.Screen 
        name="Monitoring" 
        component={MonitoringScreen} 
        options={{ title: 'Live Monitor' }} 
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ title: 'Weather Map' }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }} 
      />
    </Tab.Navigator>
  )
}

const App: React.FC = () => {
  const initializeSystem = useWeatherStore((state) => state.initializeSystem)

  useEffect(() => {
    // Request permissions
    const requestPermissions = async () => {
      try {
        // Location permission
        const locationPermission = Platform.OS === 'ios' 
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION

        const locationResult = await request(locationPermission)
        
        if (locationResult !== RESULTS.GRANTED) {
          Alert.alert(
            'Location Permission',
            'Location access is needed for accurate weather analysis.',
            [{ text: 'OK' }]
          )
        }

        // Notification permission (iOS)
        if (Platform.OS === 'ios') {
          const notificationResult = await request(PERMISSIONS.IOS.NOTIFICATIONS)
          console.log('Notification permission:', notificationResult)
        }
      } catch (error) {
        console.error('Permission request error:', error)
      }
    }

    // Initialize services
    const initializeApp = async () => {
      await requestPermissions()
      initializeNotifications()
      
      // Initialize weather system
      try {
        await initializeSystem()
      } catch (error) {
        console.error('Failed to initialize weather system:', error)
      }
    }

    initializeApp()
  }, [initializeSystem])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="#FFFFFF"
            translucent={false}
          />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen 
              name="AlertDetails" 
              component={AlertDetailsScreen}
              options={{
                headerShown: true,
                title: 'Alert Details',
                headerStyle: { backgroundColor: '#FFFFFF' },
                headerTitleStyle: { color: '#111827', fontWeight: '600' },
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default App