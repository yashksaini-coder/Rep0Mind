import { getGithubResponse } from '@/app/server'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, owner, repo } = body

    // Get the streaming response from the server action
    const response = await getGithubResponse({ messages, owner, repo })

    // The response from getGithubResponse is already a proper stream response
    // Just return it directly
    return response

  } catch (error) {
    console.error('Error in chat API route:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}