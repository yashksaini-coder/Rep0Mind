import { octokit } from "../../utils/octokit";
import { Tool } from "@mastra/core/tools";
import { z } from "zod";

const inputSchema = z.object({
  owner: z
    .string()
    .describe("The owner of the repository. As facebook in facebook/react"),
  repo: z
    .string()
    .describe("The name of the repository. As react in facebook/react"),
});

const outputSchema = z.union([
  z.object({
    ok: z.literal(true),
    repository: z.object({
      name: z.string(),
      fullName: z.string(),
      description: z.string().nullable(),
      url: z.string(),
      stars: z.number(),
      forks: z.number(),
      watchers: z.number(),
      openIssues: z.number(),
      language: z.string().nullable(),
      topics: z.array(z.string()),
      createdAt: z.string(),
      updatedAt: z.string(),
      pushedAt: z.string(),
      size: z.number(),
      defaultBranch: z.string(),
      license: z.object({
        key: z.string(),
        name: z.string(),
        url: z.string().nullable(),
      }).nullable(),
      visibility: z.string(),
      archived: z.boolean(),
      disabled: z.boolean(),
    }),
    commits: z.array(
      z.object({
        sha: z.string().describe("The SHA hash of the commit"),
        message: z.string().describe("The commit message"),
        date: z.string().datetime().nullish().describe("The date of the commit"),
        url: z.string().url().describe("The URL to view the commit"),
        author: z.object({
          name: z.string().describe("The name of the author"),
          email: z.string().describe("The email of the author"),
          username: z.string().optional().describe("The GitHub username of the author"),
          avatarUrl: z.string().url().optional().describe("The URL of the author's avatar"),
          url: z.string().url().optional().describe("The URL of the author's profile"),
        }).describe("The commit author information"),
        verified: z.boolean().describe("Whether the commit signature is verified"),
      })
    ).describe("List of commits"),
    contributors: z.array(
      z.object({
        username: z.string(),
        contributions: z.number(),
        avatarUrl: z.string().url(),
        url: z.string().url(),
      })
    ).describe("List of top contributors"),
  }).describe("The success object"),
  z.object({
    ok: z.literal(false),
    message: z.string(),
  }).describe("The error/failed object"),
]);

export const getRepositoryInfo = new Tool({
  id: "getRepositoryInfo",
  description: "Get comprehensive repository information including commits and contributors",
  inputSchema,
  outputSchema,
  // @ts-expect-error
  execute: async ({ context }) => {
    const { repo, owner } = context;

    try {
      // Get repository information
      const repoResponse = await octokit.request("GET /repos/{owner}/{repo}", {
        owner,
        repo,
      });

      // Get commits
      const commitsResponse = await octokit.request("GET /repos/{owner}/{repo}/commits", {
        owner,
        repo,
        per_page: 100, // Get more commits for better analysis
      });

      // Get contributors
      const contributorsResponse = await octokit.request("GET /repos/{owner}/{repo}/contributors", {
        owner,
        repo,
        per_page: 20, // Get top 20 contributors
      });

      return {
        ok: true as const,
        repository: {
          name: repoResponse.data.name,
          fullName: repoResponse.data.full_name,
          description: repoResponse.data.description,
          url: repoResponse.data.html_url,
          stars: repoResponse.data.stargazers_count,
          forks: repoResponse.data.forks_count,
          watchers: repoResponse.data.watchers_count,
          openIssues: repoResponse.data.open_issues_count,
          language: repoResponse.data.language,
          topics: repoResponse.data.topics || [],
          createdAt: repoResponse.data.created_at,
          updatedAt: repoResponse.data.updated_at,
          pushedAt: repoResponse.data.pushed_at,
          size: repoResponse.data.size,
          defaultBranch: repoResponse.data.default_branch,
          license: repoResponse.data.license ? {
            key: repoResponse.data.license.key,
            name: repoResponse.data.license.name,
            url: repoResponse.data.license.url,
          } : null,
          visibility: repoResponse.data.visibility,
          archived: repoResponse.data.archived,
          disabled: repoResponse.data.disabled,
        },
        commits: commitsResponse.data.map((commit) => ({
          sha: commit.sha,
          message: commit.commit.message,
          date: commit.commit.author?.date || commit.commit.committer?.date,
          url: commit.html_url,
          author: {
            name: commit.commit.author?.name || commit.commit.committer?.name || "Unknown",
            email: commit.commit.author?.email || commit.commit.committer?.email || "unknown",
            username: commit.author?.login || commit.committer?.login,
            avatarUrl: commit.author?.avatar_url || commit.committer?.avatar_url,
            url: commit.author?.html_url || commit.committer?.html_url,
          },
          verified: commit.commit.verification?.verified || false,
        })),
        contributors: contributorsResponse.data.map((contributor) => ({
          username: contributor.login,
          contributions: contributor.contributions,
          avatarUrl: contributor.avatar_url,
          url: contributor.html_url,
        })),
      };
    } catch (error) {
      console.error("Error fetching repository information:", error);
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});
