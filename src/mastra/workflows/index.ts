// @ts-nocheck
import { Workflow, Step } from "@mastra/core/workflows";
import { z } from "zod";
import { GithubAgent, EmailAgent, editorAgent, mem0Agent } from "../agents";
import fs from 'fs';
import path from 'path';

interface Author {
  name: string;
  email: string;
  username?: string;
}

interface Email {
  name: string;
  email: string;
  subject: string;
  body: string;
}

interface WorkflowVersion {
  version: string;
  changes: string[];
  timestamp: string;
}

interface RepositoryAnalysis {
  repository: {
    name: string;
    fullName: string;
    description: string | null;
    url: string;
    metrics: {
      stars: number;
      forks: number;
      watchers: number;
      openIssues: number;
    };
    technical: {
      language: string | null;
      topics: string[];
      size: number;
      defaultBranch: string;
    };
    dates: {
      createdAt: string;
      updatedAt: string;
      pushedAt: string;
    };
    status: {
      visibility: string;
      archived: boolean;
      disabled: boolean;
      license: {
        key: string;
        name: string;
        url: string | null;
      } | null;
    };
  };
  contributors: {
    username: string;
    contributions: number;
    avatarUrl: string;
    url: string;
  }[];
  commitAnalysis: {
    totalCommits: number;
    uniqueAuthors: number;
    verifiedCommits: number;
    commitsByAuthor: Record<string, number>;
    recentActivity: {
      last24Hours: number;
      lastWeek: number;
      lastMonth: number;
    };
  };
  healthScore: {
    total: number;
    metrics: {
      activity: number;
      community: number;
      maintenance: number;
      documentation: number;
    };
  };
}

const workflowVersions: WorkflowVersion[] = [
  {
    version: "1.0.0",
    changes: [
      "Initial workflow implementation",
      "Basic email generation and storage",
      "CSV export functionality"
    ],
    timestamp: new Date().toISOString()
  }
];

const mem0Workflow = new Workflow({ 
  name: "mem0-email-workflow",
  triggerSchema: z.object({
    owner: z.string().describe("The owner of the repository"),
    repo: z.string().describe("The name of the repository"),
  }),
});

const repoAnalysisWorkflow = new Workflow({ 
  name: "repository-analysis-workflow",
  triggerSchema: z.object({
    owner: z.string().describe("The owner of the repository"),
    repo: z.string().describe("The name of the repository"),
  }),
});

const getAuthorsStep = new Step({
  id: "getAuthors",
  execute: async ({ context }) => {
    // Get repository commits
    if (!GithubAgent.tools?.getRepositoryCommits?.execute) {
      throw new Error("GithubAgent tool not properly initialized");
    }

    const commitsResult = await GithubAgent.tools.getRepositoryCommits.execute({
      // @ts-nocheck
      context: {
        owner: context.triggerData.owner,
        repo: context.triggerData.repo
      }
    });

    if (!commitsResult.ok) {
      throw new Error(`Failed to get commits: ${commitsResult.message}`);
    }

    // Extract unique authors from commits
    const authors = new Set<string>();
    commitsResult.commits.forEach((commit: any) => {
      if (commit.author?.username) {
        authors.add(commit.author.username);
      }
    });

    return {
      authors: Array.from(authors),
      totalCommits: commitsResult.commits.length
    };
  },
});

const generateEmailsStep = new Step({
  id: "generateEmails",
  execute: async ({ context }) => {
    const authors = context.getStepResult<{ authors: Author[] }>("getAuthors")?.authors || [];
    const emails: Email[] = [];

    for (const author of authors) {
      // Generate email subject
      const subjectResult = await EmailAgent.generate(`
        Generate a compelling subject line for an email to ${author.name} about Mem0.ai,
        The subject should be professional and highlight the value proposition.
        Keep it under 6-12 words.
      `);

      // Generate email content
      const emailResult = await EmailAgent.generate(`
        Write a personalized email to ${author.name} about how Mem0.ai can enhance their AI applications.
        Focus on:
        1. How Mem0.ai provides a memory layer for LLM applications
        2. Benefits of personalized AI experiences
        3. Cost savings through intelligent data filtering
        4. Easy integration with existing AI solutions
        Keep it professional and concise.
      `);

      // Edit the email
      const editedResult = await editorAgent.generate(`
        Edit this email to make it more professional and personalized for ${author.name}:
        ${emailResult.text}

        Make sure to include the subject line in the email. 
        Make sure to include the name of the recipient in the email.
        Make sure to include the company name in the email.
        Make sure to include the company website in the email.
        Also do not use any other words than what is provided in the email.

      `);

      emails.push({
        name: author.name,
        email: author.email,
        subject: subjectResult.text.trim(),
        body: editedResult.text,
      });
    }

    return { emails };
  },
});

const getRepositoryInfoStep = new Step({
  id: "getRepositoryInfo",
  execute: async ({ context }) => {
    if (!GithubAgent.tools?.getRepositoryInfo?.execute) {
      throw new Error("GithubAgent tool not properly initialized");
    }

    const result = await GithubAgent.tools.getRepositoryInfo.execute({
      context: {
        owner: context.triggerData.owner,
        repo: context.triggerData.repo
      }
    });

    if (!result.ok) {
      throw new Error(`Failed to get repository info: ${result.message}`);
    }

    // Calculate commit analysis
    const now = new Date();
    const commits = result.commits;
    const commitsByAuthor: Record<string, number> = {};
    let verifiedCommits = 0;
    let last24Hours = 0;
    let lastWeek = 0;
    let lastMonth = 0;

    commits.forEach(commit => {
      // Count by author
      const author = commit.author.username || commit.author.email;
      commitsByAuthor[author] = (commitsByAuthor[author] || 0) + 1;

      // Count verified commits
      if (commit.verified) {
        verifiedCommits++;
      }

      // Count recent activity
      if (commit.date) {
        const commitDate = new Date(commit.date);
        const hoursSince = (now.getTime() - commitDate.getTime()) / (1000 * 60 * 60);
        if (hoursSince <= 24) last24Hours++;
        if (hoursSince <= 168) lastWeek++; // 7 days
        if (hoursSince <= 720) lastMonth++; // 30 days
      }
    });

    // Calculate health score
    const activityScore = Math.min(100, (
      (last24Hours * 30) +
      (lastWeek * 10) +
      (lastMonth * 2)
    ) / 10);

    const communityScore = Math.min(100, (
      (result.repository.stars * 0.5) +
      (result.repository.forks * 2) +
      (result.repository.watchers * 1) +
      (result.contributors.length * 5)
    ) / 10);

    const maintenanceScore = Math.min(100, (
      (verifiedCommits / commits.length * 40) +
      (!result.repository.archived ? 30 : 0) +
      (!result.repository.disabled ? 30 : 0)
    ));

    const documentationScore = Math.min(100, (
      (result.repository.description ? 30 : 0) +
      (result.repository.topics.length * 10) +
      (result.repository.license ? 30 : 0)
    ));

    const analysis: RepositoryAnalysis = {
      repository: {
        name: result.repository.name,
        fullName: result.repository.fullName,
        description: result.repository.description,
        url: result.repository.url,
        metrics: {
          stars: result.repository.stars,
          forks: result.repository.forks,
          watchers: result.repository.watchers,
          openIssues: result.repository.openIssues,
        },
        technical: {
          language: result.repository.language,
          topics: result.repository.topics,
          size: result.repository.size,
          defaultBranch: result.repository.defaultBranch,
        },
        dates: {
          createdAt: result.repository.createdAt,
          updatedAt: result.repository.updatedAt,
          pushedAt: result.repository.pushedAt,
        },
        status: {
          visibility: result.repository.visibility,
          archived: result.repository.archived,
          disabled: result.repository.disabled,
          license: result.repository.license,
        },
      },
      contributors: result.contributors,
      commitAnalysis: {
        totalCommits: commits.length,
        uniqueAuthors: Object.keys(commitsByAuthor).length,
        verifiedCommits,
        commitsByAuthor,
        recentActivity: {
          last24Hours,
          lastWeek,
          lastMonth,
        },
      },
      healthScore: {
        total: Math.round((activityScore + communityScore + maintenanceScore + documentationScore) / 4),
        metrics: {
          activity: Math.round(activityScore),
          community: Math.round(communityScore),
          maintenance: Math.round(maintenanceScore),
          documentation: Math.round(documentationScore),
        },
      },
    };

    return analysis;
  },
});

const storeAnalysisStep = new Step({
  id: "storeAnalysis",
  execute: async ({ context }) => {
    const mem0Tool = mem0Agent.tools?.mem0MemorizeTool;
    if (!mem0Tool?.execute) {
      throw new Error("Mem0 memorize tool is not available");
    }

    const analysis = context.getStepResult<RepositoryAnalysis>("getRepositoryInfo");
    if (!analysis) {
      throw new Error("Repository analysis not found in context");
    }

    const { owner, repo } = context.triggerData;

    const campaignData = {
      repository: {
        owner,
        name: repo,
        totalAuthors: analysis.commitAnalysis.uniqueAuthors,
        processedAt: new Date().toISOString(),
      },
      campaign: {
        totalEmails: 0,
        recipients: [],
        emails: [],
        generatedAt: new Date().toISOString(),
        allEmailBodies: [],
      },
      metadata: {
        campaignId: `${owner}-${repo}-${Date.now()}`,
        status: "completed" as const,
        lastUpdated: new Date().toISOString(),
        query: {
          owner,
          repo,
          timestamp: new Date().toISOString(),
        },
      },
      stepOutputs: {
        triggerData: context.triggerData,
        getRepositoryInfo: analysis,
      },
      stats: {
        totalAuthors: analysis.commitAnalysis.uniqueAuthors,
        totalEmails: 0,
        averageEmailLength: 0,
        generatedAt: new Date().toISOString(),
        uniqueDomains: [],
      },
    };

    const result = await mem0Tool.execute({
      // @ts-ignore
      context: {
        data: campaignData
      }
    });

    if (!result || typeof result !== 'object' || !('success' in result) || !('campaignId' in result)) {
      throw new Error('Invalid response from mem0Tool');
    }

    return { 
      success: result.success,
      campaignId: result.campaignId,
      repository: `${owner}/${repo}`,
      analysis,
    };
  },
});

const generateReportStep = new Step({
  id: "generateReport",
  execute: async ({ context }) => {
    const analysis = context.getStepResult<RepositoryAnalysis>("getRepositoryInfo");
    if (!analysis) {
      throw new Error("Repository analysis not found in context");
    }

    const { owner, repo } = context.triggerData;
    const reportPath = path.join(process.cwd(), 'output', `${owner}-${repo}-analysis.json`);
    
    // Ensure output directory exists
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    
    // Write analysis to file
    fs.writeFileSync(
      reportPath,
      JSON.stringify(analysis, null, 2)
    );

    return { 
      reportPath,
      healthScore: analysis.healthScore,
      summary: {
        name: analysis.repository.name,
        url: analysis.repository.url,
        stars: analysis.repository.metrics.stars,
        contributors: analysis.contributors.length,
        commits: analysis.commitAnalysis.totalCommits,
        recentActivity: analysis.commitAnalysis.recentActivity,
      }
    };
  },
});

// Define the workflow with proper sequencing
mem0Workflow
  .step(getAuthorsStep)
  .then(generateEmailsStep)
  .then(storeAnalysisStep)
  .then(generateReportStep)
  .commit();

export default repoAnalysisWorkflow;