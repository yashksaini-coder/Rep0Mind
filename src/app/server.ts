'use server'
 
import { mastra } from '@/mastra'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface GitHubQueryParams {
  messages: Message[]
  owner: string
  repo: string
}

export async function getGithubResponse({ messages, owner, repo }: GitHubQueryParams) {
  try {
    const agent = mastra.getAgent('GithubAgent')
    if (!agent) {
      throw new Error('GithubAgent not found')
    }

    // Create the stream response
    const response = await agent.stream(messages, {
      context: [
        {
          role: "system",
          content: `The repository owner is ${owner} and the repository name is ${repo}`,
        },
      ],
      toolChoice: "auto",
      maxSteps: 10,
    })

    // Convert the stream to a response with proper headers
    return response.toDataStreamResponse()
    
  } catch (error) {
    console.error('Error in getGithubResponse:', error)
    throw error
  }
}
