import { ClaudeAgent } from '../agent';
import { readFileTool, writeFileTool, listDirectoryTool } from '../tools';

export interface CodeReviewConfig {
  apiKey: string;
  targetPath: string;
  outputPath?: string;
  reviewCriteria?: string[];
}

export interface CodeReviewResult {
  summary: string;
  issues: ReviewIssue[];
  recommendations: string[];
  tokensUsed: { input: number; output: number };
}

export interface ReviewIssue {
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  location?: string;
}

/**
 * Code Review Workflow
 *
 * This workflow demonstrates automated code review:
 * 1. Discover files in a directory or review a specific file
 * 2. Read and analyze code
 * 3. Identify issues, bugs, and improvement opportunities
 * 4. Generate a detailed review report
 */
export class CodeReviewWorkflow {
  private agent: ClaudeAgent;
  private config: CodeReviewConfig;

  constructor(config: CodeReviewConfig) {
    this.config = config;
    this.agent = new ClaudeAgent({
      apiKey: config.apiKey,
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 8192,
    });

    // Register tools needed for code review
    this.agent.registerTools([readFileTool, writeFileTool, listDirectoryTool]);
  }

  /**
   * Execute the code review workflow
   */
  async execute(): Promise<CodeReviewResult> {
    console.log('Starting code review workflow...');

    const criteria = this.config.reviewCriteria || [
      'Code quality and readability',
      'Potential bugs and errors',
      'Security vulnerabilities',
      'Performance issues',
      'Best practices adherence',
      'Documentation quality',
    ];

    const reviewPrompt = `
Please perform a comprehensive code review of: ${this.config.targetPath}

Review criteria:
${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Instructions:
1. If the path is a directory, list all files first
2. Read the relevant code files
3. Analyze the code against the review criteria
4. Identify issues with severity levels (high, medium, low)
5. Provide specific, actionable recommendations

${this.config.outputPath ? `Write a detailed review report to: ${this.config.outputPath}` : ''}

Structure your response with:
- Executive Summary
- Issues Found (categorized by severity)
- Recommendations
- Positive Observations
    `.trim();

    const systemPrompt = `
You are an expert code reviewer with deep knowledge of software engineering best practices,
security, performance optimization, and clean code principles. Provide thorough, constructive
feedback that helps developers improve their code quality.
    `.trim();

    console.log('Executing code review with agent...');
    const response = await this.agent.execute(reviewPrompt, systemPrompt);

    console.log('Code review complete!');
    console.log(`Tools used: ${response.toolsUsed.join(', ')}`);

    // Parse the response to extract structured information
    const result = this.parseReviewResponse(response.content);

    return {
      ...result,
      tokensUsed: {
        input: response.usage?.inputTokens || 0,
        output: response.usage?.outputTokens || 0,
      },
    };
  }

  /**
   * Parse the agent's response into structured data
   */
  private parseReviewResponse(content: string): Omit<CodeReviewResult, 'tokensUsed'> {
    // Simple parser - in production, you might use more sophisticated parsing
    const issues: ReviewIssue[] = [];
    const recommendations: string[] = [];

    // Extract issues (this is a simplified example)
    const issueMatches = content.matchAll(/(?:high|medium|low)\s+(?:priority|severity)[:\s]+(.+?)(?=\n|$)/gi);
    for (const match of issueMatches) {
      issues.push({
        severity: 'medium',
        category: 'general',
        description: match[1].trim(),
      });
    }

    // Extract recommendations
    const recMatches = content.matchAll(/(?:recommend|suggestion)[:\s]+(.+?)(?=\n|$)/gi);
    for (const match of recMatches) {
      recommendations.push(match[1].trim());
    }

    return {
      summary: content,
      issues,
      recommendations,
    };
  }

  /**
   * Review a specific file with custom focus areas
   */
  async reviewFile(filePath: string, focusAreas: string[]): Promise<string> {
    const prompt = `
Review the code in ${filePath} with specific focus on:
${focusAreas.map((area, i) => `${i + 1}. ${area}`).join('\n')}

Provide detailed analysis and actionable recommendations.
    `.trim();

    const response = await this.agent.execute(prompt);
    return response.content;
  }
}

/**
 * Example usage function
 */
export async function runCodeReviewExample(apiKey: string): Promise<void> {
  const workflow = new CodeReviewWorkflow({
    apiKey,
    targetPath: './src',
    outputPath: './code-review-report.md',
    reviewCriteria: [
      'TypeScript best practices',
      'Error handling',
      'Code organization',
      'Security considerations',
    ],
  });

  const result = await workflow.execute();
  console.log('\nCode Review Summary:');
  console.log(result.summary);
  console.log(`\nIssues found: ${result.issues.length}`);
  console.log(`Recommendations: ${result.recommendations.length}`);
}
