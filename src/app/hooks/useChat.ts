import { useState, useCallback, useRef } from 'react'

interface Message {
  role: 'user' | 'assistant' | 'tool'
  content: string
  error?: boolean
  toolName?: string
  toolInput?: any
  toolOutput?: any
}

interface ChatOptions {
  owner: string
  repo: string
}

export function useChat({ owner, repo }: ChatOptions) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    setIsLoading(true)
    setError(null)

    // Add user message immediately
    const userMessage: Message = { role: 'user', content }
    setMessages(prev => [...prev, userMessage])

    // Create new AbortController for this request
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [userMessage], // Only send the current message
          owner,
          repo,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      if (!reader) {
        throw new Error('No reader available')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'tool') {
                setMessages(prev => [...prev, {
                  role: 'tool',
                  content: `Using tool: ${data.toolName}`,
                  toolName: data.toolName,
                  toolInput: data.input,
                  toolOutput: data.output
                }])
              } else if (data.type === 'text') {
                assistantMessage += data.text
                setMessages(prev => {
                  const newMessages = [...prev]
                  const lastMessage = newMessages[newMessages.length - 1]
                  if (lastMessage?.role === 'assistant' && !lastMessage.error) {
                    lastMessage.content = assistantMessage
                    return [...newMessages]
                  } else {
                    return [...newMessages, { role: 'assistant', content: assistantMessage }]
                  }
                })
              }
            } catch (e) {
              console.error('Error parsing chunk:', e)
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return // Ignore abort errors
      }
      
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      setError(errorMessage)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${errorMessage}`,
        error: true
      }])
    } finally {
      setIsLoading(false)
    }
  }, [owner, repo])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages
  }
} 