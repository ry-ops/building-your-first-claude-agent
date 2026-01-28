import { ClaudeAgent, AgentTool } from '../agent';
import { readFileTool, writeFileTool } from '../tools';

export interface DataAnalysisConfig {
  apiKey: string;
  inputFilePath: string;
  outputFilePath: string;
}

/**
 * Data Analysis Workflow
 *
 * This workflow demonstrates a multi-step agent process:
 * 1. Read data from a file
 * 2. Analyze the data
 * 3. Generate insights and recommendations
 * 4. Write results to an output file
 */
export class DataAnalysisWorkflow {
  private agent: ClaudeAgent;
  private config: DataAnalysisConfig;

  constructor(config: DataAnalysisConfig) {
    this.config = config;
    this.agent = new ClaudeAgent({
      apiKey: config.apiKey,
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 4096,
    });

    // Register tools needed for this workflow
    this.agent.registerTools([readFileTool, writeFileTool]);
  }

  /**
   * Execute the data analysis workflow
   */
  async execute(): Promise<{
    analysis: string;
    outputPath: string;
    tokensUsed: { input: number; output: number };
  }> {
    console.log('Starting data analysis workflow...');

    // Step 1: Instruct the agent to read and analyze the data
    const analysisPrompt = `
Please perform the following data analysis workflow:

1. Read the data file from: ${this.config.inputFilePath}
2. Analyze the data and identify:
   - Key statistics and patterns
   - Trends and outliers
   - Notable insights
3. Generate a comprehensive analysis report
4. Write the report to: ${this.config.outputFilePath}

Format the report with clear sections for statistics, insights, and recommendations.
    `.trim();

    const systemPrompt = `
You are a data analysis assistant. You have access to file operations tools.
Your goal is to read data, analyze it thoroughly, and produce actionable insights.
Always structure your analysis reports with clear sections and bullet points.
    `.trim();

    console.log('Executing analysis with agent...');
    const response = await this.agent.execute(analysisPrompt, systemPrompt);

    console.log('Analysis complete!');
    console.log(`Tools used: ${response.toolsUsed.join(', ')}`);
    console.log(`Tokens used: ${response.usage?.inputTokens} input, ${response.usage?.outputTokens} output`);

    return {
      analysis: response.content,
      outputPath: this.config.outputFilePath,
      tokensUsed: {
        input: response.usage?.inputTokens || 0,
        output: response.usage?.outputTokens || 0,
      },
    };
  }

  /**
   * Execute with custom analysis instructions
   */
  async executeCustom(customInstructions: string): Promise<string> {
    const prompt = `
Read the data from ${this.config.inputFilePath} and perform the following analysis:

${customInstructions}

Write your findings to ${this.config.outputFilePath}.
    `.trim();

    const response = await this.agent.execute(prompt);
    return response.content;
  }
}

/**
 * Example usage function
 */
export async function runDataAnalysisExample(apiKey: string): Promise<void> {
  const workflow = new DataAnalysisWorkflow({
    apiKey,
    inputFilePath: './data/sample-data.json',
    outputFilePath: './data/analysis-report.md',
  });

  const result = await workflow.execute();
  console.log('\nAnalysis Result:');
  console.log(result.analysis);
  console.log(`\nReport saved to: ${result.outputPath}`);
}
