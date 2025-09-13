import React, { useState, useRef, useEffect } from 'react'
import { MicrophoneIcon, SpeakerWaveIcon, StopIcon } from '@heroicons/react/24/outline'

interface VoiceChatProps {
  onSpeechResult: (text: string) => void
  isListening: boolean
  onToggleListening: () => void
  lastResponse?: string
}

export const VoiceChat: React.FC<VoiceChatProps> = ({
  onSpeechResult,
  isListening,
  onToggleListening,
  lastResponse
}) => {
  const [isSupported, setIsSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const speechSynthesis = window.speechSynthesis
    
    if (SpeechRecognition && speechSynthesis) {
      setIsSupported(true)
      synthRef.current = speechSynthesis
      
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      
      recognition.onstart = () => {
        console.log('Voice recognition started')
      }
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        console.log('Speech result:', transcript)
        onSpeechResult(transcript)
      }
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        onToggleListening() // Stop listening on error
      }
      
      recognition.onend = () => {
        console.log('Voice recognition ended')
        if (isListening) {
          onToggleListening() // Update state when recognition ends
        }
      }
      
      recognitionRef.current = recognition
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  useEffect(() => {
    if (!recognitionRef.current) return
    
    if (isListening) {
      recognitionRef.current.start()
    } else {
      recognitionRef.current.stop()
    }
  }, [isListening])

  const speakResponse = (text: string) => {
    if (!synthRef.current || !text) return
    
    // Cancel any ongoing speech
    synthRef.current.cancel()
    
    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 0.8
    
    // Try to find a good voice (prefer female voices for DOC)
    const voices = synthRef.current.getVoices()
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Samantha') || 
      voice.name.includes('Karen') ||
      voice.name.includes('Moira')
    ) || voices.find(voice => voice.lang.startsWith('en'))
    
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    synthRef.current.speak(utterance)
  }

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="text-center p-4 text-gray-500">
        <p>Voice chat not supported in this browser</p>
        <p className="text-xs">Try Chrome, Edge, or Safari</p>
      </div>
    )
  }

  return (
    <div className="voice-chat-controls flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <button
        onClick={onToggleListening}
        disabled={isSpeaking}
        className={`p-3 rounded-full transition-all duration-200 ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isListening ? 'Stop listening' : 'Start voice chat'}
      >
        {isListening ? (
          <StopIcon className="h-6 w-6" />
        ) : (
          <MicrophoneIcon className="h-6 w-6" />
        )}
      </button>
      
      {lastResponse && (
        <button
          onClick={() => speakResponse(lastResponse)}
          disabled={isSpeaking || isListening}
          className={`p-3 rounded-full transition-all duration-200 ${
            isSpeaking 
              ? 'bg-green-500 text-white animate-pulse' 
              : 'bg-gray-500 hover:bg-gray-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isSpeaking ? 'Speaking...' : 'Speak response'}
        >
          <SpeakerWaveIcon className="h-6 w-6" />
        </button>
      )}
      
      {isSpeaking && (
        <button
          onClick={stopSpeaking}
          className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white"
          title="Stop speaking"
        >
          <StopIcon className="h-5 w-5" />
        </button>
      )}
      
      <div className="flex-1">
        {isListening && (
          <div className="flex items-center gap-2 text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
            <span className="text-sm font-medium">Listening... Say "What's up Doc" to start</span>
          </div>
        )}
        {isSpeaking && (
          <div className="flex items-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
            <span className="text-sm font-medium">DOC is speaking...</span>
          </div>
        )}
        {!isListening && !isSpeaking && (
          <span className="text-sm text-gray-500">Click microphone to start voice chat</span>
        )}
      </div>
    </div>
  )
}

export default VoiceChat