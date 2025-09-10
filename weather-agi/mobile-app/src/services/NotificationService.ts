import PushNotification from 'react-native-push-notification'
import { Alert, Platform } from 'react-native'

export interface NotificationOptions {
  title: string
  message: string
  playSound?: boolean
  soundName?: string
  priority?: 'high' | 'low' | 'default'
  vibrate?: boolean
  data?: any
}

export const initializeNotifications = () => {
  PushNotification.configure({
    onRegister: (token) => {
      console.log('TOKEN:', token)
    },

    onNotification: (notification) => {
      console.log('NOTIFICATION:', notification)
      
      // Handle notification tap
      if (notification.userInteraction) {
        // User tapped the notification
        // Navigate to relevant screen or perform action
        console.log('User tapped notification')
      }
    },

    onAction: (notification) => {
      console.log('ACTION:', notification.action)
      console.log('NOTIFICATION:', notification)
    },

    onRegistrationError: (err) => {
      console.error(err.message, err)
    },

    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },

    popInitialNotification: true,
    requestPermissions: Platform.OS === 'ios',
  })

  // Create notification channels for Android
  if (Platform.OS === 'android') {
    PushNotification.createChannel(
      {
        channelId: 'weather-alerts',
        channelName: 'Weather Alerts',
        channelDescription: 'Severe weather alerts and warnings',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`Weather alerts channel created: ${created}`)
    )

    PushNotification.createChannel(
      {
        channelId: 'weather-updates',
        channelName: 'Weather Updates',
        channelDescription: 'Regular weather condition updates',
        playSound: false,
        importance: 3,
        vibrate: false,
      },
      (created) => console.log(`Weather updates channel created: ${created}`)
    )
  }
}

export const showNotification = (options: NotificationOptions) => {
  PushNotification.localNotification({
    title: options.title,
    message: options.message,
    playSound: options.playSound ?? true,
    soundName: options.soundName ?? 'default',
    priority: options.priority ?? 'high',
    vibrate: options.vibrate ?? true,
    channelId: options.priority === 'high' ? 'weather-alerts' : 'weather-updates',
    userInfo: options.data,
    actions: ['View Details', 'Dismiss'],
  })
}

export const showWeatherAlert = (alertType: string, severity: string, message: string) => {
  const severityEmojis: { [key: string]: string } = {
    'warning': '🚨',
    'watch': '⚠️',
    'advisory': '📢'
  }

  const typeEmojis: { [key: string]: string } = {
    'tornado': '🌪️',
    'severe_thunderstorm': '⛈️',
    'flash_flood': '🌊',
    'winter_weather': '❄️'
  }

  showNotification({
    title: `${severityEmojis[severity] || '⚠️'} ${severity.toUpperCase()} ${typeEmojis[alertType] || ''}`,
    message: message,
    priority: severity === 'warning' ? 'high' : 'default',
    playSound: severity === 'warning',
    vibrate: severity === 'warning',
    data: { type: 'weather_alert', alertType, severity }
  })
}

export const cancelAllNotifications = () => {
  PushNotification.cancelAllLocalNotifications()
}

export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    return true // Android permissions are handled in the manifest
  }

  return new Promise((resolve) => {
    PushNotification.requestPermissions((permissions) => {
      resolve(permissions.alert && permissions.badge && permissions.sound)
    })
  })
}