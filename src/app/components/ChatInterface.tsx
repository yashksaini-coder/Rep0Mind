// @ts-nocheck
'use client'

import { useRef, useEffect, useState } from 'react'
import { MarkdownRenderer } from './MarkdownRenderer'

interface Message {
  type: 'user' | 'assistant' | 'tool'
  content: string
  toolName?: string
  toolInput?: any
  toolOutput?: any
}

export function GitHubChat() {
    const [owner, setOwner] = useState('')
    const [repo, setRepo] = useState('')
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    
    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!owner || !repo || !message) return

        setIsLoading(true)
        setError(null)

        // Add user message immediately
        const userMessage: Message = { type: 'user', content: message }
        setMessages(prev => [...prev, userMessage])
        setMessage('')

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: message }],
                    owner,
                    repo,
                }),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const reader = response.body?.getReader()
            if (!reader) {
                throw new Error('No reader available')
            }

            let currentToolCall: { toolName?: string; args?: any } | null = null
            let currentAssistantMessage = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = new TextDecoder().decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (!line) continue

                    const prefix = line[0]
                    const data = line.slice(2)

                    try {
                        const parsed = JSON.parse(data)

                        switch (prefix) {
                            case 'f': // Message ID
                                // Start of a new message
                                if (currentAssistantMessage) {
                                    setMessages(prev => [...prev, { type: 'assistant', content: currentAssistantMessage }])
                                    currentAssistantMessage = ''
                                }
                                break

                            case '9': // Tool call start
                                currentToolCall = {
                                    toolName: parsed.toolName,
                                    args: parsed.args
                                }
                                break

                            case 'a': // Tool call result
                                const toolCall = currentToolCall // Create a local copy
                                if (toolCall && toolCall.toolName) {
                                    setMessages(prev => [...prev, {
                                        type: 'tool',
                                        content: `Using tool: ${toolCall.toolName}`,
                                        toolName: toolCall.toolName,
                                        toolInput: toolCall.args,
                                        toolOutput: parsed.result
                                    }])
                                    currentToolCall = null
                                }
                                break

                            case '0': // Content chunk
                                currentAssistantMessage += parsed
                                setMessages(prev => {
                                    const newMessages = [...prev]
                                    const lastMessage = newMessages[newMessages.length - 1]
                                    if (lastMessage?.type === 'assistant') {
                                        lastMessage.content = currentAssistantMessage
                                        return [...newMessages]
                                    } else {
                                        return [...newMessages, { type: 'assistant', content: currentAssistantMessage }]
                                    }
                                })
                                break

                            case 'e': // End of message
                            case 'd': // Final end
                                // Handle any cleanup if needed
                                break
                        }
                    } catch (e) {
                        console.error('Error parsing chunk:', e)
                    }
                }
            }
        } catch (error) {
            console.error('Error:', error)
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
            setError(errorMessage)
            setMessages(prev => [...prev, { 
                type: 'assistant', 
                content: `Error: ${errorMessage}`
            }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto mt-4 bg-white rounded-lg shadow-lg flex flex-col h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold text-black text-center">
                    GitHub Repository Chat
                </h2>
                
                {/* Repository Input Form */}
                <div className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-black mb-1">
                                Repository Owner
                            </label>
                            <input
                                type="text"
                                value={owner}
                                onChange={(e) => setOwner(e.target.value)}
                                placeholder="e.g., facebook"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black text-sm"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-black mb-1">
                                Repository Name
                            </label>
                            <input
                                type="text"
                                value={repo}
                                onChange={(e) => setRepo(e.target.value)}
                                placeholder="e.g., react"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black text-sm"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="px-4 py-2 bg-red-100 border-b border-red-400 text-black text-sm">
                    {error}
                </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`rounded-lg ${
                            msg.type === 'user' 
                                ? 'bg-blue-100 ml-auto max-w-[80%] p-3' 
                                : msg.type === 'tool'
                                    ? 'bg-yellow-50 mr-auto w-full p-2'
                                    : 'bg-gray-50 mr-auto w-full p-3'
                        }`}
                    >
                        {msg.type === 'tool' ? (
                            <div className="space-y-2">
                                <p className="text-black font-medium text-sm">{msg.content}</p>
                                {msg.toolInput && (
                                    <div className="text-xs text-gray-600">
                                        <p className="font-medium">Input:</p>
                                        <pre className="bg-white p-2 rounded overflow-x-auto">
                                            <code>{JSON.stringify(msg.toolInput, null, 2)}</code>
                                        </pre>
                                    </div>
                                )}
                                {msg.toolOutput && (
                                    <div className="text-xs text-gray-600">
                                        <p className="font-medium">Output:</p>
                                        <pre className="bg-white p-2 rounded overflow-x-auto">
                                            <code>{JSON.stringify(msg.toolOutput, null, 2)}</code>
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="prose prose-sm max-w-none">
                                <MarkdownRenderer content={msg.content} />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black text-sm"
                        required
                        disabled={isLoading || !owner || !repo}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !owner || !repo || !message}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:bg-blue-300 text-sm whitespace-nowrap"
                    >
                        {isLoading ? 'Sending...' : 'Send'}
                    </button>
                </form>
            </div>
        </div>
    )
}