import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline'
import VoiceChat from './VoiceChat'
import { useWeatherStore } from '../stores/weatherStore'
import toast from 'react-hot-toast'

interface Message {
  id: string
  type: 'user' | 'doc'
  content: string
  timestamp: Date
  isVoice?: boolean
}

const DOCChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'doc',
      content: `Hello! I'm DOC (Dynamic Operational Climatologist), your AI weather assistant. 

🎤 **Voice Commands**: Click the microphone and say "What's up Doc" followed by your weather question!

📍 **Try these examples**:
• "What's up Doc, what's the weather like in Oklahoma City?"
• "What's up Doc, analyze tornado potential for Moore, Oklahoma"
• "What's up Doc, explain how hurricanes form"

I can provide professional meteorological analysis using data from NWS, NASA, and NOAA!`,
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { selectedLocation, chatWithDOC } = useWeatherStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (content: string, isVoice: boolean = false) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
      isVoice
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      const response = await chatWithDOC(content.trim(), selectedLocation)
      
      const docMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'doc',
        content: typeof response === 'string' ? response : response.doc_response || 'Analysis completed',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, docMessage])
      
      if (isVoice) {
        // Auto-play voice response for voice inputs
        setTimeout(() => {
          const event = new CustomEvent('playDOCResponse', { detail: docMessage.content })
          window.dispatchEvent(event)
        }, 500)
      }

    } catch (error) {
      console.error('DOC Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'doc',
        content: 'Sorry, I encountered an error processing your request. Please try again or check your system configuration.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      toast.error('DOC chat failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputText)
  }

  const handleVoiceResult = (transcript: string) => {
    console.log('Voice input received:', transcript)
    setIsListening(false)
    sendMessage(transcript, true)
  }

  const handleToggleListening = () => {
    setIsListening(!isListening)
  }

  const clearChat = () => {
    setMessages([messages[0]]) // Keep the welcome message
  }

  const lastDOCMessage = messages.filter(m => m.type === 'doc').pop()?.content

  return (
    <div className="doc-chat h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold">DOC</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Dynamic Operational Climatologist</h2>
            <p className="text-xs opacity-90">AI Weather Assistant</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Clear chat"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">
                  {message.type === 'user' ? 'You' : 'DOC'}
                </span>
                {message.isVoice && (
                  <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                    🎤
                  </span>
                )}
                <span className="text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
            </div>
          </motion.div>
        ))}
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">DOC is analyzing...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Chat Controls */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <VoiceChat
          onSpeechResult={handleVoiceResult}
          isListening={isListening}
          onToggleListening={handleToggleListening}
          lastResponse={lastDOCMessage}
        />
      </div>

      {/* Text Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? 'Listening...' : 'Type your weather question or say "What\'s up Doc"...'}
            disabled={isLoading || isListening}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim() || isListening}
            className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  )
}

export default DOCChat