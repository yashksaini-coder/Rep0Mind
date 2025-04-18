
import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import mem0Workflow from './workflows/index';
import { GithubAgent } from './agents';

export const mastra = new Mastra({
  workflows: { mem0Workflow },  
  agents: { GithubAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
