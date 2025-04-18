import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { githubTool } from '../tools/GithubUser';
import { getRepositoryInfo } from '../tools/GithubRepo';
import { instructions } from '../instructions/gh-user';
import { getFileContent } from '../tools/GetFile';
import { getFilePaths } from '../tools/GetFilePath';
import { mem0MemorizeTool, mem0RememberTool } from '../tools/mem0';
import { getRepositoryPullRequests } from '../tools/GithubPR';
import { getRepositoryIssues } from '../tools/GithubIssues';
import { getRepositoryCommits } from '../tools/GetCommits';


export const GithubAgent = new Agent({
  name: 'Github User Agent',
  instructions: instructions,
  model: google('gemini-1.5-pro-latest'),
  tools: { 
    githubTool, 
    getRepositoryInfo, 
    getFileContent, 
    getFilePaths, 
    getRepositoryCommits,
    getRepositoryIssues, 
    getRepositoryPullRequests 
  },
});

export const EmailAgent = new Agent({
  name: 'Writer Agent',
  instructions: 'You are a professional HR of an MNC and a writer. Write a detailed email for the given subject and recipient.',
  model: google('gemini-1.5-pro-latest'),
});

export const editorAgent = new Agent({
  name: "Editor",
  instructions: "You are an editor agent that edits email posts. Do not change the content of the email, only edit the formatting. Also you are stricted to provide any other additional inof like what you did in the edit.",
  model: google('gemini-1.5-pro-latest'),
});
  
export const mem0Agent = new Agent({
  name: 'Mem0 Agent',
  instructions: `
    You are a helpful assistant that has the ability to memorize and remember facts using Mem0. 
    You are also able to answer questions using the information you have memorized.
  `,
  model: google('gemini-1.5-pro-latest'),
  tools: { mem0RememberTool, mem0MemorizeTool },
});